"""
Resume NER Service using BERT
Extracts entities from resumes using yashpwr/resume-ner-bert-v2 model
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import AutoTokenizer, AutoModelForTokenClassification, pipeline
import torch
import logging

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load model and tokenizer globally
MODEL_NAME = "yashpwr/resume-ner-bert-v2"
logger.info(f"Loading model: {MODEL_NAME}")

try:
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    model = AutoModelForTokenClassification.from_pretrained(MODEL_NAME)
    
    # Create NER pipeline
    ner_pipeline = pipeline(
        "token-classification",
        model=MODEL_NAME,
        aggregation_strategy="simple"
    )
    logger.info("Model loaded successfully")
except Exception as e:
    logger.error(f"Failed to load model: {e}")
    ner_pipeline = None


def extract_entities_with_confidence(text: str, confidence_threshold: float = 0.3):
    """
    Extract entities from text with confidence scores.
    
    Args:
        text: Resume text to parse
        confidence_threshold: Minimum confidence score (0-1)
    
    Returns:
        List of entities with labels, text, and confidence scores
    """
    if not ner_pipeline:
        raise RuntimeError("Model not loaded")
    
    # Tokenize with offset mapping to get character positions
    inputs = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        max_length=512,
        padding=True,
        return_offsets_mapping=True
    )
    
    # Get predictions
    with torch.no_grad():
        outputs = model(**{k: v for k, v in inputs.items() if k != 'offset_mapping'})
        predictions = torch.argmax(outputs.logits, dim=2)
        probabilities = torch.softmax(outputs.logits, dim=2)
    
    entities = []
    current_entity = None
    offset_mapping = inputs.offset_mapping[0]
    
    for i, (pred, offset) in enumerate(zip(predictions[0], offset_mapping)):
        label = model.config.id2label[pred.item()]
        confidence = probabilities[0][i][pred].item()
        
        # Skip special tokens (padding, CLS, SEP)
        if offset[0] == 0 and offset[1] == 0:
            continue
        
        if label.startswith('B-'):
            # Save previous entity if it meets confidence threshold
            if current_entity and current_entity['confidence'] >= confidence_threshold:
                entities.append(current_entity)
            
            # Start new entity
            entity_type = label[2:]  # Remove 'B-' prefix
            current_entity = {
                'text': text[offset[0]:offset[1]],
                'label': entity_type,
                'start': int(offset[0]),
                'end': int(offset[1]),
                'confidence': confidence
            }
        
        elif label.startswith('I-') and current_entity:
            # Continue current entity
            entity_type = label[2:]  # Remove 'I-' prefix
            if entity_type == current_entity['label']:
                # Extend entity text
                current_entity['text'] = text[current_entity['start']:offset[1]]
                current_entity['end'] = int(offset[1])
                # Update confidence (minimum of all tokens)
                current_entity['confidence'] = min(current_entity['confidence'], confidence)
        
        elif label == 'O':
            # Outside any entity - save current if exists
            if current_entity and current_entity['confidence'] >= confidence_threshold:
                entities.append(current_entity)
                current_entity = None
    
    # Save last entity
    if current_entity and current_entity['confidence'] >= confidence_threshold:
        entities.append(current_entity)
    
    return entities


def parse_entities_to_resume_structure(entities: list) -> dict:
    """
    Convert flat entity list to structured resume format.
    
    Args:
        entities: List of extracted entities
    
    Returns:
        Structured resume data with education, experience, skills, etc.
    """
    resume = {
        'education': [],
        'experiences': [],
        'skills': [],
        'certifications': [],
        'contact': {}
    }
    
    # Group entities by type
    entity_groups = {}
    for entity in entities:
        label = entity['label']
        if label not in entity_groups:
            entity_groups[label] = []
        entity_groups[label].append(entity)
    
    # Extract contact information
    if 'EMAIL' in entity_groups:
        resume['contact']['email'] = entity_groups['EMAIL'][0]['text']
    if 'PHONE' in entity_groups:
        resume['contact']['phone'] = entity_groups['PHONE'][0]['text']
    if 'LINKEDIN' in entity_groups or 'LINKEDIN_URL' in entity_groups:
        linkedin_entities = entity_groups.get('LINKEDIN', []) + entity_groups.get('LINKEDIN_URL', [])
        if linkedin_entities:
            resume['contact']['linkedin'] = linkedin_entities[0]['text']
    
    # Extract education (handle various label formats)
    schools = [e['text'] for e in entity_groups.get('SCHOOL', []) + entity_groups.get('UNIVERSITY', []) + entity_groups.get('COLLEGE', []) + entity_groups.get('College Name', [])]
    degrees = [e['text'] for e in entity_groups.get('DEGREE', []) + entity_groups.get('EDUCATION', []) + entity_groups.get('Degree', []) + entity_groups.get('Graduation Year', [])]
    majors = [e['text'] for e in entity_groups.get('MAJOR', []) + entity_groups.get('FIELD_OF_STUDY', [])]
    gpas = [e['text'] for e in entity_groups.get('GPA', [])]
    
    # Combine education entries (simple heuristic)
    for i in range(max(len(schools), len(degrees))):
        edu_entry = {}
        if i < len(schools):
            edu_entry['school'] = schools[i]
        if i < len(degrees):
            edu_entry['degree'] = degrees[i]
        if i < len(majors):
            edu_entry['major'] = majors[i]
        if i < len(gpas):
            try:
                edu_entry['gpa'] = float(gpas[i])
            except:
                pass
        
        if edu_entry:
            resume['education'].append(edu_entry)
    
    # Extract work experience (handle various label formats)
    companies = [e['text'] for e in entity_groups.get('COMPANY', []) + entity_groups.get('ORGANIZATION', []) + entity_groups.get('Companies worked at', [])]
    job_titles = [e['text'] for e in entity_groups.get('JOB_TITLE', []) + entity_groups.get('POSITION', []) + entity_groups.get('TITLE', []) + entity_groups.get('Designation', [])]
    
    for i in range(max(len(companies), len(job_titles))):
        exp_entry = {}
        if i < len(job_titles):
            exp_entry['title'] = job_titles[i]
        if i < len(companies):
            exp_entry['company'] = companies[i]
        
        if exp_entry:
            exp_entry['employmentType'] = 'fulltime'  # Default
            resume['experiences'].append(exp_entry)
    
    # Extract skills (handle various label formats)
    skill_entities = (
        entity_groups.get('SKILL', []) + 
        entity_groups.get('SKILLS', []) + 
        entity_groups.get('Skills', []) +
        entity_groups.get('TECHNOLOGY', []) +
        entity_groups.get('PROGRAMMING_LANGUAGE', []) +
        entity_groups.get('LANGUAGE', [])
    )
    resume['skills'] = [e['text'] for e in skill_entities]
    
    # Extract certifications
    cert_entities = entity_groups.get('CERTIFICATION', []) + entity_groups.get('CERTIFICATE', [])
    resume['certifications'] = [{'name': e['text']} for e in cert_entities]
    
    return resume


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': ner_pipeline is not None
    })


@app.route('/parse', methods=['POST'])
def parse_resume():
    """
    Parse resume text and extract entities.
    
    Expected JSON:
    {
        "text": "resume text here",
        "confidence_threshold": 0.3  # optional
    }
    
    Returns:
    {
        "entities": [...],
        "structured": {...}
    }
    """
    try:
        data = request.json
        
        if not data or 'text' not in data:
            return jsonify({'error': 'Missing "text" field'}), 400
        
        text = data['text']
        confidence_threshold = data.get('confidence_threshold', 0.3)
        
        if not text or not text.strip():
            return jsonify({'error': 'Text cannot be empty'}), 400
        
        # Extract entities
        logger.info(f"Parsing resume text ({len(text)} chars)")
        entities = extract_entities_with_confidence(text, confidence_threshold)
        
        # Convert to structured format
        structured = parse_entities_to_resume_structure(entities)
        
        logger.info(f"Found {len(entities)} entities")
        logger.info(f"Education entries: {len(structured['education'])}")
        logger.info(f"Experience entries: {len(structured['experiences'])}")
        logger.info(f"Skills: {len(structured['skills'])}")
        
        # If nothing found with BERT, try lowering confidence threshold
        if len(entities) == 0:
            logger.warning("No entities found with default confidence, trying lower threshold (0.1)")
            entities = extract_entities_with_confidence(text, 0.1)
            structured = parse_entities_to_resume_structure(entities)
            logger.info(f"Retry: Found {len(entities)} entities with lower threshold")
        
        return jsonify({
            'entities': entities,
            'structured': structured,
            'entity_count': len(entities)
        })
    
    except Exception as e:
        logger.error(f"Parse error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/parse-simple', methods=['POST'])
def parse_resume_simple():
    """
    Simple parsing endpoint using the pipeline directly.
    
    Expected JSON:
    {
        "text": "resume text here"
    }
    """
    try:
        data = request.json
        
        if not data or 'text' not in data:
            return jsonify({'error': 'Missing "text" field'}), 400
        
        text = data['text']
        
        if not text or not text.strip():
            return jsonify({'error': 'Text cannot be empty'}), 400
        
        # Use pipeline for simpler extraction
        results = ner_pipeline(text)
        
        entities = [{
            'text': entity['word'],
            'label': entity['entity_group'],
            'confidence': entity['score'],
            'start': entity.get('start', 0),
            'end': entity.get('end', 0)
        } for entity in results]
        
        structured = parse_entities_to_resume_structure(entities)
        
        return jsonify({
            'entities': entities,
            'structured': structured
        })
    
    except Exception as e:
        logger.error(f"Parse error: {e}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    # Run on port 5001 to avoid conflicts
    app.run(host='0.0.0.0', port=5001, debug=True)

