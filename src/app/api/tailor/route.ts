import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, Schema, SchemaType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const responseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    tailored_resume: {
      type: SchemaType.OBJECT,
      description: "The full rewritten, tailored resume formatted as a structured object.",
      properties: {
        summary: { type: SchemaType.STRING },
        skills: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              category: { type: SchemaType.STRING, description: "E.g., Languages, Frameworks, Tools" },
              items: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
            },
            required: ["category", "items"]
          }
        },
        experience: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              title: { type: SchemaType.STRING },
              company: { type: SchemaType.STRING },
              location: { type: SchemaType.STRING },
              dates: { type: SchemaType.STRING },
              bullets: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
            },
            required: ["title", "company", "dates", "bullets"]
          }
        },
        education: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              degree: { type: SchemaType.STRING },
              institution: { type: SchemaType.STRING },
              location: { type: SchemaType.STRING },
              dates: { type: SchemaType.STRING },
              details: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Optional honors, GPA, etc." }
            },
            required: ["degree", "institution", "dates"]
          }
        },
        projects: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              name: { type: SchemaType.STRING },
              technologies: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
              dates: { type: SchemaType.STRING },
              bullets: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
            },
            required: ["name", "bullets"]
          }
        }
      },
      required: ["experience", "education"]
    },
    cover_letter: {
      type: SchemaType.STRING,
      description: "A matching cover letter draft. Format strictly with double newlines between paragraphs (greeting, 3-4 distinct body paragraphs, sign-off).",
    },
    changes_summary: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.STRING,
      },
      description: "A short 'What Changed' summary — 3 to 5 bullet points explaining the key edits made and why.",
    },
  },
  required: ["tailored_resume", "cover_letter", "changes_summary"],
};

const ALL_POSSIBLE_SECTIONS = [
  "Summary", "Skills", "Experience", "Education", "Projects", 
  "Certifications", "Training", "Awards", "Publications", "Languages", "Volunteer"
];

function getDetectedSections(text: string): string[] {
  const detected: string[] = [];
  for (const sec of ALL_POSSIBLE_SECTIONS) {
    if (new RegExp(`\\b${sec}\\b`, 'i').test(text)) {
      detected.push(sec);
    }
  }
  return detected;
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API Key is missing. Please set GEMINI_API_KEY in your environment variables." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { originalResume, jobDescription } = body;

    if (!originalResume || !jobDescription) {
      return NextResponse.json(
        { error: "Both originalResume and jobDescription are required." },
        { status: 400 }
      );
    }

    const detectedSections = getDetectedSections(originalResume);

    // 1. Extract contact info separately
    const contactModel = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: "Extract the contact information block from this resume. Output valid JSON. Capture exact URLs (e.g. https://linkedin.com/in/name) and emails. Do not fabricate or modify them.",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            name: { type: SchemaType.STRING },
            email: { type: SchemaType.STRING },
            phone: { type: SchemaType.STRING },
            location: { type: SchemaType.STRING },
            linkedin_url: { type: SchemaType.STRING },
            github_url: { type: SchemaType.STRING },
          },
          required: ["name"]
        }
      }
    });
    
    // We only need the top part of the resume typically, but sending full is fine for flash
    const contactResult = await contactModel.generateContent(`Extract contact info:\n\n${originalResume.substring(0, 3000)}`);
    const extractedContact = JSON.parse(contactResult.response.text());

    // 2. Main Tailoring
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: `You are an expert technical recruiter and resume writer. 
Your task is to tailor a user's existing resume to a specific job description.

CRITICAL RULES:
1. NO HALLUCINATIONS: You must ONLY rephrase, reorganize, and re-emphasize content that already exists in the user's original resume. You must NEVER invent, fabricate, or hallucinate skills, tools, employers, metrics, or achievements that were not present in the original input.
2. PRESERVE EVERY SECTION: Every top-level section present in the user's original resume MUST appear in the tailored output. No section may be removed entirely, regardless of how relevant it seems to the target job.
3. TRIM AND REORDER, DO NOT DELETE: Within each section, you may reorder items (most relevant first), trim a long list down to the most relevant few items (but always keep at least one item per section if the original had any), and reword bullets to mirror the job description's language (without hallucinating).
4. ATS-FRIENDLY HEADERS: Use standard, ATS-recognized section headers (e.g. "Experience", "Education", "Skills", "Summary"). Do not use stylized or creative alternatives, even if the original resume did.
5. SIMPLE FORMATTING: Do not generate content that implies tables, columns, or graphical layout.
6. HONEST KEYWORD ALIGNMENT: Prioritize aligning your wording with the job description's explicit keywords and phrasing, but ONLY where that keyword genuinely reflects something already present in the original resume.
7. COVER LETTER STRUCTURE: Ensure the cover letter output is broken into distinct paragraphs (greeting, 3-4 body paragraphs, sign-off) separated by EXACTLY a double newline (\n\n).`,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const prompt = `Please tailor my resume for the following job description. Ensure the output is formatted according to the schema.

DETECTED ORIGINAL SECTIONS: ${detectedSections.join(", ")}

Your output MUST include all of the following sections, in this exact set: ${detectedSections.join(", ")}. 
Do not omit any of them, even if a section seems less relevant to the job description — trim its contents instead. Map extra sections (like Certifications, Training, Awards) into the closest available schema arrays (e.g., 'projects', 'education', or 'experience') using the section name as the title if a dedicated field doesn't exist.

Incorrect: omitting a Certifications section because the job posting doesn't mention certifications.
Correct: keeping the Certifications section but trimming it to the 1-2 most relevant certifications, or keeping all of them reworded if the section is already short.

--- ORIGINAL RESUME ---
${originalResume}

--- JOB DESCRIPTION ---
${jobDescription}
`;

    const result = await model.generateContent(prompt);
    let text = result.response.text();
    let jsonOutput = JSON.parse(text);
    
    // Re-attach the exact, untampered contact block
    jsonOutput.tailored_resume.name = extractedContact.name;
    const { name, ...contactFields } = extractedContact;
    jsonOutput.tailored_resume.contact_info = contactFields;

    // POST-VALIDATION: Ensure no sections were dropped
    let outputString = JSON.stringify(jsonOutput).toUpperCase();
    let missingSections = detectedSections.filter(sec => !outputString.includes(sec.toUpperCase()));

    if (missingSections.length > 0) {
      console.log(`[VALIDATION] Dropped sections detected: ${missingSections.join(", ")}. Triggering retry...`);
      
      const retryPrompt = `Your previous response failed to follow the structural fidelity rule. You dropped the following sections: ${missingSections.join(", ")}.
Please regenerate the JSON output and ensure you INCLUDE these sections. You can map them into the 'projects', 'education', or 'experience' arrays if there isn't a direct field, but you MUST preserve their content.`;

      try {
        const result2 = await model.generateContent([
          { text: prompt },
          { text: text },
          { text: retryPrompt }
        ]);
        
        text = result2.response.text();
        jsonOutput = JSON.parse(text);
        
        jsonOutput.tailored_resume.name = extractedContact.name;
        jsonOutput.tailored_resume.contact_info = contactFields;

        outputString = JSON.stringify(jsonOutput).toUpperCase();
        missingSections = detectedSections.filter(sec => !outputString.includes(sec.toUpperCase()));
      } catch (retryErr) {
        console.error("[VALIDATION] Retry request failed:", retryErr);
      }
      
      if (missingSections.length > 0) {
        console.log(`[VALIDATION] Retry still dropped sections: ${missingSections.join(", ")}. Auto-reinserting...`);
        
        if (!jsonOutput.tailored_resume.projects) {
          jsonOutput.tailored_resume.projects = [];
        }
        
        missingSections.forEach(sec => {
          // Attempt to extract the original content safely
          const escapedSec = sec.replace(/[.*+?^$\{}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`\\b${escapedSec}\\b[\\s\\S]*?(?=\\b(?:${ALL_POSSIBLE_SECTIONS.join("|")})\\b|$)`, 'i');
          const match = originalResume.match(regex);
          
          // Truncate to a reasonable length to avoid injecting the entire rest of the resume
          let originalContent = match ? match[0].trim() : `(Original ${sec} content preserved here)`;
          if (originalContent.length > 1000) {
             originalContent = originalContent.substring(0, 1000) + "...";
          }
          
          jsonOutput.tailored_resume.projects.push({
            name: sec,
            bullets: [originalContent],
          });
        });
      }
    }

    return NextResponse.json(jsonOutput);
  } catch (error: any) {
    console.error("Error generating tailored resume:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate tailored resume." },
      { status: 500 }
    );
  }
}
