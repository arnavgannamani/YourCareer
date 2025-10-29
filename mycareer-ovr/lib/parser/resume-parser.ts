/**
 * Resume Parser
 * 
 * Heuristic-based parser for PDF and DOCX files.
 * Extracts structured data without relying on LLMs by default.
 * 
 * Optional: Can use OpenAI for better extraction if API key provided.
 */

import pdf from "pdf-parse";
import mammoth from "mammoth";

export interface ParsedResume {
  rawText: string;
  education: Array<{
    school: string;
    degree: string;
    major?: string;
    gpa?: number;
    startDate?: Date;
    endDate?: Date;
  }>;
  experiences: Array<{
    title: string;
    company: string;
    employmentType: string;
    startDate: Date;
    endDate?: Date;
    bullets: string[];
    industry?: string;
    geo?: string;
  }>;
  skills: string[];
  certifications: Array<{
    name: string;
    authority?: string;
    issuedOn?: Date;
  }>;
  contact?: {
    email?: string;
    phone?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
}

/**
 * Parse resume from buffer (PDF or DOCX)
 */
export async function parseResume(
  buffer: Buffer,
  fileName: string,
  useLLM: boolean = false
): Promise<ParsedResume> {
  // Extract text based on file type
  let text: string;
  
  if (fileName.toLowerCase().endsWith(".pdf")) {
    text = await parsePDF(buffer);
  } else if (fileName.toLowerCase().endsWith(".docx")) {
    text = await parseDOCX(buffer);
  } else {
    throw new Error("Unsupported file format. Please upload PDF or DOCX.");
  }
  
  // Use heuristic parser by default
  if (!useLLM || !process.env.OPENAI_API_KEY) {
    return heuristicParse(text);
  }
  
  // TODO: Implement LLM-based parsing with OpenAI
  // For now, fall back to heuristic
  return heuristicParse(text);
}

async function parsePDF(buffer: Buffer): Promise<string> {
  const data = await pdf(buffer);
  return data.text;
}

async function parseDOCX(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

/**
 * Heuristic parser - uses regex and pattern matching
 */
function heuristicParse(text: string): ParsedResume {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  
  return {
    rawText: text,
    education: extractEducation(lines, text),
    experiences: extractExperiences(lines, text),
    skills: extractSkills(lines, text),
    certifications: extractCertifications(lines, text),
    contact: extractContact(text),
  };
}

function extractEducation(lines: string[], fullText: string): ParsedResume["education"] {
  const education: ParsedResume["education"] = [];
  
  // Find education section
  const eduSectionIdx = lines.findIndex((l) =>
    /^(education|academic|degrees?)$/i.test(l)
  );
  
  if (eduSectionIdx === -1) return education;
  
  // Look for degree patterns
  const degreePattern = /(bachelor|master|phd|doctorate|associate|b\.?s\.?|m\.?s\.?|m\.?b\.?a\.?|ph\.?d\.?)/i;
  const datePattern = /(\d{4})\s*[-–—]\s*(\d{4}|present)/i;
  const gpaPattern = /gpa:?\s*(\d\.\d{1,2})/i;
  
  let currentSchool = "";
  let currentDegree = "";
  let currentMajor = "";
  let currentGPA: number | undefined;
  let currentStart: Date | undefined;
  let currentEnd: Date | undefined;
  
  for (let i = eduSectionIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    
    // Stop at next major section
    if (/^(experience|skills|projects|certifications)$/i.test(line)) {
      break;
    }
    
    // Check for degree
    const degreeMatch = line.match(degreePattern);
    if (degreeMatch) {
      // Save previous entry if exists
      if (currentSchool && currentDegree) {
        education.push({
          school: currentSchool,
          degree: currentDegree,
          major: currentMajor || undefined,
          gpa: currentGPA,
          startDate: currentStart,
          endDate: currentEnd,
        });
      }
      
      currentDegree = line;
      currentSchool = "";
      currentMajor = "";
      currentGPA = undefined;
      currentStart = undefined;
      currentEnd = undefined;
    }
    
    // Check for school name (heuristic: title case, 2+ words)
    if (!currentSchool && /^[A-Z][a-zA-Z\s&]+$/.test(line) && line.split(" ").length >= 2) {
      currentSchool = line;
    }
    
    // Check for major
    if (line.toLowerCase().includes("major") || line.toLowerCase().includes("concentration")) {
      currentMajor = line.replace(/major:?|concentration:?/gi, "").trim();
    }
    
    // Check for GPA
    const gpaMatch = line.match(gpaPattern);
    if (gpaMatch) {
      currentGPA = parseFloat(gpaMatch[1]);
    }
    
    // Check for dates
    const dateMatch = line.match(datePattern);
    if (dateMatch) {
      currentStart = new Date(`${dateMatch[1]}-09-01`);
      currentEnd = dateMatch[2].toLowerCase() === "present" 
        ? undefined 
        : new Date(`${dateMatch[2]}-05-01`);
    }
  }
  
  // Save last entry
  if (currentSchool && currentDegree) {
    education.push({
      school: currentSchool,
      degree: currentDegree,
      major: currentMajor || undefined,
      gpa: currentGPA,
      startDate: currentStart,
      endDate: currentEnd,
    });
  }
  
  return education;
}

function extractExperiences(lines: string[], fullText: string): ParsedResume["experiences"] {
  const experiences: ParsedResume["experiences"] = [];
  
  // Find experience section
  const expSectionIdx = lines.findIndex((l) =>
    /^(experience|work|employment|positions?)$/i.test(l)
  );
  
  if (expSectionIdx === -1) return experiences;
  
  const datePattern = /(\w+\.?\s+\d{4})\s*[-–—]\s*(\w+\.?\s+\d{4}|present)/i;
  
  let currentTitle = "";
  let currentCompany = "";
  let currentType = "fulltime";
  let currentStart: Date | undefined;
  let currentEnd: Date | undefined;
  let currentBullets: string[] = [];
  
  for (let i = expSectionIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    
    // Stop at next major section
    if (/^(education|skills|projects|certifications)$/i.test(line)) {
      break;
    }
    
    // Check for dates (usually indicates new role)
    const dateMatch = line.match(datePattern);
    if (dateMatch) {
      // Save previous entry
      if (currentTitle && currentCompany) {
        experiences.push({
          title: currentTitle,
          company: currentCompany,
          employmentType: currentType,
          startDate: currentStart || new Date(),
          endDate: currentEnd,
          bullets: currentBullets,
        });
      }
      
      // Parse dates
      currentStart = parseMonthYear(dateMatch[1]);
      currentEnd = dateMatch[2].toLowerCase() === "present" 
        ? undefined 
        : parseMonthYear(dateMatch[2]);
      
      currentBullets = [];
      
      // Title and company are usually on same or previous line
      const prevLine = lines[i - 1] || "";
      const combined = prevLine + " " + line;
      
      // Try to extract title and company
      const parts = combined.split(/\||@|at/i);
      if (parts.length >= 2) {
        currentTitle = parts[0].replace(datePattern, "").trim();
        currentCompany = parts[1].replace(datePattern, "").trim();
      } else {
        currentTitle = prevLine;
        currentCompany = "";
      }
      
      // Detect employment type
      if (/intern/i.test(currentTitle)) {
        currentType = "internship";
      } else if (/co-?op/i.test(currentTitle)) {
        currentType = "internship";
      } else if (/contract|freelance|consultant/i.test(currentTitle)) {
        currentType = "contract";
      } else {
        currentType = "fulltime";
      }
      
      continue;
    }
    
    // Check for bullet points
    if (/^[•·\-\*]/.test(line) || /^\d+\./.test(line)) {
      const bullet = line.replace(/^[•·\-\*]\s*/, "").replace(/^\d+\.\s*/, "").trim();
      currentBullets.push(bullet);
    }
  }
  
  // Save last entry
  if (currentTitle && currentCompany) {
    experiences.push({
      title: currentTitle,
      company: currentCompany,
      employmentType: currentType,
      startDate: currentStart || new Date(),
      endDate: currentEnd,
      bullets: currentBullets,
    });
  }
  
  return experiences;
}

function extractSkills(lines: string[], fullText: string): string[] {
  const skills: Set<string> = new Set();
  
  // Find skills section
  const skillsSectionIdx = lines.findIndex((l) =>
    /^(skills|technical|technologies|tools)$/i.test(l)
  );
  
  if (skillsSectionIdx === -1) return Array.from(skills);
  
  // Extract skills from next few lines
  for (let i = skillsSectionIdx + 1; i < Math.min(skillsSectionIdx + 10, lines.length); i++) {
    const line = lines[i];
    
    // Stop at next major section
    if (/^(experience|education|projects|certifications)$/i.test(line)) {
      break;
    }
    
    // Split by common delimiters
    const parts = line.split(/[,;|•]/);
    for (const part of parts) {
      const skill = part.trim();
      if (skill.length >= 2 && skill.length <= 30) {
        skills.add(skill);
      }
    }
  }
  
  return Array.from(skills);
}

function extractCertifications(lines: string[], fullText: string): ParsedResume["certifications"] {
  const certifications: ParsedResume["certifications"] = [];
  
  // Find certifications section
  const certSectionIdx = lines.findIndex((l) =>
    /^(certifications?|licenses?|credentials?)$/i.test(l)
  );
  
  if (certSectionIdx === -1) return certifications;
  
  const datePattern = /(\w+\.?\s+\d{4})/i;
  
  for (let i = certSectionIdx + 1; i < Math.min(certSectionIdx + 15, lines.length); i++) {
    const line = lines[i];
    
    // Stop at next major section
    if (/^(experience|education|skills|projects)$/i.test(line)) {
      break;
    }
    
    if (line.length < 5) continue;
    
    // Extract date if present
    const dateMatch = line.match(datePattern);
    const issuedOn = dateMatch ? parseMonthYear(dateMatch[1]) : undefined;
    
    // Remove date from name
    const name = line.replace(datePattern, "").replace(/[-–—,]/g, "").trim();
    
    if (name.length > 0) {
      certifications.push({
        name,
        issuedOn,
      });
    }
  }
  
  return certifications;
}

function extractContact(text: string): ParsedResume["contact"] {
  const contact: ParsedResume["contact"] = {};
  
  // Email
  const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  if (emailMatch) {
    contact.email = emailMatch[0];
  }
  
  // Phone
  const phoneMatch = text.match(/(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  if (phoneMatch) {
    contact.phone = phoneMatch[0];
  }
  
  // LinkedIn
  const linkedinMatch = text.match(/linkedin\.com\/in\/[\w-]+/i);
  if (linkedinMatch) {
    contact.linkedin = linkedinMatch[0];
  }
  
  // GitHub
  const githubMatch = text.match(/github\.com\/[\w-]+/i);
  if (githubMatch) {
    contact.github = githubMatch[0];
  }
  
  return contact;
}

function parseMonthYear(str: string): Date {
  // Try to parse formats like "Jan 2023", "January 2023", "01/2023"
  const months: { [key: string]: number } = {
    jan: 0, january: 0,
    feb: 1, february: 1,
    mar: 2, march: 2,
    apr: 3, april: 3,
    may: 4,
    jun: 5, june: 5,
    jul: 6, july: 6,
    aug: 7, august: 7,
    sep: 8, sept: 8, september: 8,
    oct: 9, october: 9,
    nov: 10, november: 10,
    dec: 11, december: 11,
  };
  
  const parts = str.toLowerCase().trim().split(/[\s/.-]+/);
  
  if (parts.length >= 2) {
    const monthStr = parts[0];
    const year = parseInt(parts[1]);
    
    const month = months[monthStr];
    if (month !== undefined && !isNaN(year)) {
      return new Date(year, month, 1);
    }
  }
  
  // Fallback: assume current month
  const year = parseInt(str.match(/\d{4}/)?.[0] || new Date().getFullYear().toString());
  return new Date(year, 0, 1);
}

/**
 * Calculate impact score from bullets (0-1)
 */
export function calculateImpactFromBullets(bullets: string[]): number {
  if (bullets.length === 0) return 0.3;
  
  let score = 0;
  
  for (const bullet of bullets) {
    let bulletScore = 0.4; // Base
    
    // Check for quantification
    if (/\d+[%$KMB]|\d+\+|\d+x/i.test(bullet)) {
      bulletScore += 0.2;
    }
    
    // Check for action verbs
    const actionVerbs = ["led", "built", "designed", "implemented", "created", "launched", "improved", "optimized", "reduced", "increased"];
    if (actionVerbs.some((verb) => bullet.toLowerCase().startsWith(verb))) {
      bulletScore += 0.1;
    }
    
    // Check for business impact keywords
    if (/revenue|profit|cost|efficiency|performance|user|customer/i.test(bullet)) {
      bulletScore += 0.1;
    }
    
    score += Math.min(bulletScore, 1.0);
  }
  
  return Math.min(score / bullets.length, 1.0);
}

