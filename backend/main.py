from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
import os
import json
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()
app = FastAPI(title="AI Career Application Studio API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

class GenerateRequest(BaseModel):
    fullName: Optional[str] = ""
    email: Optional[str] = ""
    phone: Optional[str] = ""
    location: Optional[str] = ""
    links: Optional[str] = ""
    headline: Optional[str] = ""
    summary: Optional[str] = ""
    experience: Optional[str] = ""
    education: Optional[str] = ""
    skills: Optional[str] = ""
    
    # Target Job Details
    jobTitle: Optional[str] = ""
    companyName: Optional[str] = ""
    jobDescription: str
    tone: Optional[str] = "Professional and confident"
    
    # Backwards compatibility field
    userProfile: Optional[str] = None

class ApplicationPackage(BaseModel):
    coverLetter: str = Field(
        description="A polished, persuasive, human-sounding cover letter tailored specifically for the target company and role. Formatted in clean Markdown with date, clear paragraphs highlighting relevant achievements that match the job description, and an enthusiastic closing."
    )
    cv: str = Field(
        description="A high-impact, ATS-optimized Markdown CV/Resume tailored specifically to the target job description. Includes Header (Name, Contact, Links), Tailored Professional Summary, Core Competencies, Professional Experience (with quantifiable achievements and strong action verbs), and Education/Certifications."
    )
    matchHighlights: List[str] = Field(
        description="3 to 5 crisp bullet points highlighting the strongest matches between the candidate's experience and the target job requirements."
    )

from fastapi import FastAPI, HTTPException, Header

@app.post("/api/generate-letter")
@app.post("/api/generate-application")
async def generate_application(
    req: GenerateRequest,
    x_gemini_api_key: Optional[str] = Header(None, alias="x-gemini-api-key")
):
    try:
        active_api_key = x_gemini_api_key.strip() if x_gemini_api_key and x_gemini_api_key.strip() else os.getenv("GEMINI_API_KEY")
        if not active_api_key:
            raise HTTPException(
                status_code=400,
                detail="No Gemini API Key provided. Please click 'API Key' in the header to enter your free Google Gemini key."
            )
        
        req_client = genai.Client(api_key=active_api_key)
        # Fallback for old single userProfile field
        candidate_summary = req.summary or req.userProfile or ""
        
        prompt = f"""
You are an elite career strategist, executive resume writer, and senior hiring manager.
Your task is to generate both an outstanding, ATS-optimized tailored CV/Resume AND a compelling, tailored Application/Cover Letter for the candidate applying to a target position.

### Candidate Information:
- Full Name: {req.fullName or 'Candidate'}
- Email: {req.email or 'candidate@example.com'}
- Phone: {req.phone or ''}
- Location: {req.location or ''}
- Links/Portfolio: {req.links or ''}
- Professional Headline: {req.headline or ''}
- Professional Summary: {candidate_summary}
- Work Experience: {req.experience or 'See summary'}
- Education & Certifications: {req.education or 'Relevant background'}
- Core Skills: {req.skills or 'Relevant technical & soft skills'}

### Target Job:
- Position: {req.jobTitle or 'Target Role'}
- Target Company: {req.companyName or 'Target Organization'}
- Job Description & Requirements:
{req.jobDescription}

### Tone & Style:
- Desired Tone: {req.tone or 'Professional and confident'}

### Instructions:
1. **Application / Cover Letter**:
   - Write a compelling, human-sounding cover letter that immediately hooks the reader.
   - Do NOT use generic clichés like "I am writing to express my enthusiasm for...".
   - Explicitly connect 2-3 major achievements from the candidate's background to specific pain points or goals stated in the job description.
   - Keep it concise, punchy, and formatted in clean markdown.

2. **Tailored CV / Resume**:
   - Structure a complete, professional, modern CV in clean Markdown.
   - Tailor the Professional Summary to directly position the candidate for this exact job.
   - Highlight the skills most relevant to the job description in the Skills section.
   - Rewrite/enhance the experience bullet points with strong action verbs, quantifiable metrics, and impact that echoes the target job requirements.
   - Format with clean Markdown headers (`#`, `##`, `###`), bolding, and bullet lists.

3. **Match Highlights**:
   - Provide 3-5 concise bullet points summarizing why the candidate is a strong fit for this specific posting.
"""

        models_to_try = [
            'gemini-3.1-flash-lite',
            'gemini-3.5-flash-lite',
            'gemini-3.7-flash',
            'gemini-3.5-flash'
        ]
        last_error = None
        data = None

        for model_name in models_to_try:
            try:
                print(f"Attempting generation with {model_name}...")
                response = req_client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type='application/json',
                        response_schema=ApplicationPackage,
                        automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
                    ),
                )
                data = json.loads(response.text)
                print(f"Successfully generated application with {model_name}!")
                break
            except Exception as model_err:
                print(f"Model {model_name} failed: {model_err}")
                last_error = model_err
                continue

        if not data:
            print(f"All models failed. Last error: {last_error}")
            raise HTTPException(status_code=500, detail=f"Failed to generate application: {last_error}")
        return {
            "success": True,
            "data": data,
            # Backwards compatibility:
            "letter": data.get("coverLetter"),
            "cv": data.get("cv"),
            "matchHighlights": data.get("matchHighlights", [])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 5000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("main:app", host=host, port=port, reload=True)