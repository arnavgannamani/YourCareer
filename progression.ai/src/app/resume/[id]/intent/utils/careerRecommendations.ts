import { CAREER_GROUPS, CAREER_DESCRIPTIONS } from "../constants";

export function calculateYearsExp(exp: any[]): number {
  let months = 0;
  exp.forEach((e: any) => {
    const start = e?.start_date ? new Date(e.start_date) : null;
    const end = !e?.end_date || /present|current/i.test(e.end_date) ? new Date() : new Date(e.end_date);
    if (start && end && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
      months += Math.max(0, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()));
    }
  });
  return Math.round(months / 12);
}

export function recommendCareers(skills: string[], exp: any[]): { category: string | null; careers: string[] } {
  const careerScores: Record<string, number> = {};
  const allCareers = Object.values(CAREER_GROUPS).flat();
  
  // Extract experience titles and descriptions
  const expTitles = exp.map((e: any) => (e?.title || "").toLowerCase()).join(" ");
  const expDescriptions = exp.map((e: any) => (e?.description || "").toLowerCase()).join(" ");
  const allText = `${skills.join(" ")} ${expTitles} ${expDescriptions}`.toLowerCase();
  
  // Score each career based on skills and experience
  allCareers.forEach((career) => {
    let score = 0;
    const careerLower = career.toLowerCase();
    const desc = (CAREER_DESCRIPTIONS[career] || "").toLowerCase();
    
    // Skill matching (weighted: exact match = 2, partial = 1)
    skills.forEach((skill) => {
      if (careerLower.includes(skill) || desc.includes(skill)) {
        score += 2;
      } else if (skill.includes("engineer") && careerLower.includes("engineer")) {
        score += 1.5;
      } else if (skill.includes("data") && (careerLower.includes("data") || careerLower.includes("analyst"))) {
        score += 1.5;
      } else if (skill.includes("design") && careerLower.includes("design")) {
        score += 1.5;
      }
    });
    
    // Experience title matching
    if (expTitles.includes(careerLower.split(" ")[0]) || expTitles.includes(careerLower.split(" ")[1])) {
      score += 3;
    }
    
    // Experience description matching
    if (expDescriptions.includes(careerLower.split(" ")[0]) || expDescriptions.includes(careerLower.split(" ")[1])) {
      score += 2;
    }
    
    // Category keyword matching
    const categoryKeywords: Record<string, string[]> = {
      "Engineering": ["software", "code", "programming", "develop", "engineer", "api", "system", "tech"],
      "Data & Analytics": ["data", "analysis", "sql", "python", "analytics", "machine learning", "ml", "statistics"],
      "Product & Design": ["product", "design", "ux", "ui", "user experience", "wireframe", "prototype"],
      "Finance & Trading": ["finance", "trading", "investment", "banking", "quantitative", "trading", "portfolio"],
      "Business": ["business", "strategy", "consulting", "marketing", "sales", "operations", "management"],
      "STEM & Research": ["laboratory", "experiment", "research", "molecule", "cell", "dna", "protein", "assay", "microscopy", "spectroscopy", "chromatography", "clinical trial", "pcr", "biology", "chemistry", "physics", "biochemistry", "biomedical", "pharmaceutical", "genetics", "genomics", "biophysics"],
      "Healthcare & Medicine": ["patient", "diagnosis", "treatment", "medical", "clinical", "hospital", "physician", "doctor", "surgery", "medication", "symptoms", "diagnostic", "therapeutic", "healthcare", "medicine", "primary care", "emergency", "surgical", "medical imaging", "patient care", "medical practice"],
    };
    
    for (const [cat, keywords] of Object.entries(categoryKeywords)) {
      if (CAREER_GROUPS[cat]?.includes(career)) {
        keywords.forEach((keyword) => {
          if (allText.includes(keyword)) {
            score += 1;
          }
        });
      }
    }
    
    careerScores[career] = score;
  });
  
  // Get top 3 matches
  const sorted = Object.entries(careerScores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([career]) => career);
  
  // If we don't have 3 matches with scores > 0, fill with popular careers
  if (sorted.length < 3) {
    const popularCareers = ["Software Engineer", "Data Science", "Product Management"];
    popularCareers.forEach((career) => {
      if (!sorted.includes(career) && sorted.length < 3) {
        sorted.push(career);
      }
    });
  }
  
  // Determine category from top match
  let category: string | null = null;
  if (sorted.length > 0) {
    for (const [cat, careers] of Object.entries(CAREER_GROUPS)) {
      if (careers.includes(sorted[0])) {
        category = cat;
        break;
      }
    }
  }
  
  return { category, careers: sorted.slice(0, 3) };
}

export function getCareerExplanation(career: string, parsedData: any): string[] {
  const reasons: string[] = [];
  const skills = parsedData?.skills || [];
  const skillsLower = skills.map((s: string) => s.toLowerCase());
  const exp = parsedData?.experience || [];
  const edu = parsedData?.education || [];
  const expTitles = exp.map((e: any) => e?.title || "").filter(Boolean);
  const expDescriptions = exp.map((e: any) => (e?.description || "").toLowerCase()).filter(Boolean);
  const allExpText = expDescriptions.join(" ").toLowerCase();
  const careerLower = career.toLowerCase();
  
  // 1. Specific skill matches
  const directSkillMatches = skills.filter((skill: string) => {
    const skillLower = skill.toLowerCase();
    return careerLower.includes(skillLower) || 
           (CAREER_DESCRIPTIONS[career] || "").toLowerCase().includes(skillLower) ||
           (skillLower.includes("engineer") && careerLower.includes("engineer")) ||
           (skillLower.includes("data") && (careerLower.includes("data") || careerLower.includes("analyst")));
  });
  
  if (directSkillMatches.length > 0) {
    const skillList = directSkillMatches.length === 1 
      ? directSkillMatches[0]
      : directSkillMatches.length === 2
      ? `${directSkillMatches[0]} and ${directSkillMatches[1]}`
      : `${directSkillMatches.slice(0, 2).join(", ")}, and ${directSkillMatches.length - 2} more`;
    reasons.push(`You have ${directSkillMatches.length === 1 ? "the skill" : "proven skills"} in ${skillList}, which ${directSkillMatches.length === 1 ? "is" : "are"} essential for ${career} roles.`);
  }
  
  // 2. Direct experience match
  const matchingJobs = expTitles.filter((title: string) => {
    const titleLower = title.toLowerCase();
    return careerLower.includes(titleLower.split(" ")[0]) ||
           careerLower.includes(titleLower.split(" ")[1] || "") ||
           (titleLower.includes("engineer") && careerLower.includes("engineer")) ||
           (titleLower.includes("analyst") && (careerLower.includes("analyst") || careerLower.includes("data")));
  });
  
  if (matchingJobs.length > 0) {
    const jobTitle = matchingJobs[0];
    const jobCount = matchingJobs.length;
    reasons.push(`Your experience as ${jobTitle}${jobCount > 1 ? ` and ${jobCount - 1} similar role${jobCount > 2 ? "s" : ""}` : ""} directly aligns with ${career} requirements.`);
  }
  
  // 3. Years of experience
  const yearsExp = calculateYearsExp(exp);
  if (yearsExp > 0 && reasons.length < 3) {
    if (yearsExp >= 3) {
      reasons.push(`With ${yearsExp} years of professional experience, you have the depth of expertise that ${career} roles typically require.`);
    } else if (yearsExp >= 1) {
      reasons.push(`Your ${yearsExp} year${yearsExp > 1 ? "s" : ""} of professional experience shows practical application of skills relevant to ${career}.`);
    }
  }
  
  // Ensure we have at least 3 reasons
  while (reasons.length < 3) {
    if (skills.length >= 5) {
      reasons.push(`Your diverse skill set of ${skills.length}+ technologies demonstrates the versatility needed for ${career} roles.`);
      break;
    }
    if (exp.length >= 2) {
      reasons.push(`Your ${exp.length} professional role${exp.length > 1 ? "s" : ""} show consistent growth and experience relevant to ${career}.`);
      break;
    }
    reasons.push(`Based on your overall profile, ${career} aligns with your demonstrated technical background and career trajectory.`);
    break;
  }
  
  return reasons.slice(0, 4);
}

