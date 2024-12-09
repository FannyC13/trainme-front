from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()
API_KEY = os.getenv("API_KEY")
if not API_KEY:
    raise RuntimeError("API_KEY is not set in the .env file")

# Initialize OpenAI client
client = OpenAI(api_key=API_KEY)

# FastAPI app initialization
app = FastAPI()

# Input model
class CourseInput(BaseModel):
    course: str  # File content as a string
    subject: str
    courseName: str

@app.post("/generate-questions")
async def generate_questions(data: CourseInput):
    try:
        # Combine subject and courseName into the prompt if needed
        full_course_text = f"Subject: {data.subject}\nCourse Name: {data.courseName}\n{data.course}"

        system_prompt = """
        <CONTEXT>You are a teacher. You will be given a course either in English or French. Your job is to create a quick test from this course and only this course. Write 2 to 5 questions about the course, in the language that the course is written in.</CONTEXT>
        <FORMAT> You are expected to return the questions in a json format, as follows (this is an example): 
        
        [
          {
            question: 'Which book did Marguerite Duras write ?',
            options: ['Hamlet', 'L'amant', 'Bonjour tristesse', 'L'espèce humaine'],
            answer: 'L'amant'
          },
          {
            question: "Who wrote 'Les Misérables' ?",
            options: ['Victor Hugo', 'Emile Zola', 'Marcel Proust', 'Albert Camus'],
            answer: 'Victor Hugo'
          }
        ]
        
        DO NOT ADD ANYTHING ELSE, NO ``json `` OR THINGS LIKE THAT. JUST THE JSON.</FORMAT>
        """
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": full_course_text}
        ]
        
        chat_completion = client.chat.completions.create(
            messages=messages,
            model="gpt-4o-mini",
            temperature=0.05
        )
        
        questions = chat_completion.choices[0].message.content.strip()
        return {"questions": questions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
