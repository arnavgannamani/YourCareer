# Resume NER Python Service

This service uses the BERT model `yashpwr/resume-ner-bert-v2` to extract structured entities from resume text.

## Setup

### Windows

1. Install Python 3.9+ from [python.org](https://www.python.org/downloads/)

2. Create virtual environment:
```powershell
cd python-service
python -m venv venv
.\venv\Scripts\activate
```

3. Install dependencies:
```powershell
pip install -r requirements.txt
```

4. Run the service:
```powershell
python resume_ner.py
```

The service will run on `http://localhost:5001`

### Alternative: Using Conda (if you have Anaconda/Miniconda)

```powershell
conda create -n resume-ner python=3.9
conda activate resume-ner
pip install -r requirements.txt
python resume_ner.py
```

## API Endpoints

### `POST /parse`

Parse resume text and extract entities.

**Request:**
```json
{
  "text": "John Smith is a senior software engineer at Google...",
  "confidence_threshold": 0.3
}
```

**Response:**
```json
{
  "entities": [
    {
      "text": "John Smith",
      "label": "NAME",
      "confidence": 0.95,
      "start": 0,
      "end": 10
    }
  ],
  "structured": {
    "education": [...],
    "experiences": [...],
    "skills": [...],
    "contact": {...}
  }
}
```

### `POST /parse-simple`

Simpler parsing using the pipeline directly.

### `GET /health`

Health check endpoint.

## Production Deployment

For production, use Gunicorn:

```bash
gunicorn -w 4 -b 0.0.0.0:5001 resume_ner:app
```

Or deploy to:
- **Heroku**: Add `Procfile` with `web: gunicorn resume_ner:app`
- **AWS Lambda**: Use Zappa or AWS SAM
- **Google Cloud Run**: Containerize with Docker
- **Railway**: Direct deployment

