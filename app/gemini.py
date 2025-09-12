import os
import google.generativeai as genai
from dotenv import load_dotenv
from fastapi.responses import JSONResponse
from app.prompts import build_prompt

# Load environment variables from .env
load_dotenv()

# Configure Gemini API key
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Initialize Gemini model
llm = genai.GenerativeModel("gemini-2.5-pro")

def generate_documentation(code_snippet: str) -> str:
    prompt = build_prompt(code_snippet)

    # Put system-like instruction into the user text itself
    full_prompt = (
        "You are a helpful code documentation generator. "
        "Given the following code snippet, write clear and concise documentation.\n\n"
        f"{prompt}"
    )

    response = llm.generate_content(full_prompt)

    # Handle response safely
    if response and response.candidates:
        # Collect all candidates & their parts
        all_texts = []
        for candidate in response.candidates:
            if candidate.content and candidate.content.parts:
                for part in candidate.content.parts:
                    if part.text:
                        all_texts.append(part.text)

        # Join them with spacing
        print("Generated Documentation:", all_texts)
        return "\n\n---\n\n".join(all_texts)

    return "No documentation generated."