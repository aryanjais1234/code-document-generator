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

def generate_documentation(content: str, content_type: str = "code") -> str:
    """Generate documentation for different types of content."""
    prompt = build_prompt(content, content_type)

    # Enhanced system instruction based on content type
    system_instructions = {
        "code": "You are an expert software documentation generator. Provide clear, comprehensive technical documentation with proper formatting.",
        "pdf": "You are a technical documentation specialist. Analyze document content and create structured, professional documentation.",
        "github_repo": "You are a senior software architect and documentation expert. Analyze repositories and create comprehensive project documentation."
    }

    system_instruction = system_instructions.get(content_type, system_instructions["code"])
    
    full_prompt = (
        f"{system_instruction}\n\n"
        f"{prompt}"
    )

    try:
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
            documentation = "\n\n---\n\n".join(all_texts)
            print(f"Generated Documentation for {content_type}:", documentation[:200] + "...")
            return documentation

        return f"No documentation generated for {content_type} content."
    
    except Exception as e:
        print(f"Error generating documentation: {e}")
        return f"Error generating documentation: {str(e)}"