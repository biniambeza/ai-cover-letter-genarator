from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from google import genai

load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

class GenerateRequest(BaseModel):
    userProfile: str
    jobDescription: str
    tone: str = "Professional and confident"

@app.post("/api/generate-letter")
async def generate_letter(req: GenerateRequest):
    try:
        prompt = f"""
        You are an expert career coach and professional copywriter. 
        Write a compelling, tailored job application letter based on:
        - Job Description: {req.jobDescription}
        - Candidate Background: {req.userProfile}
        - Desired Tone: {req.tone}
        Guidelines: Highlight matching skills explicitly, keep it under 400 words, and make it human-sounding.
        """
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        return {"success": True, "letter": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=5000, reload=True)