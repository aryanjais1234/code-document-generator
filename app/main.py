from fastapi import FastAPI, Request, Form, File, UploadFile, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import os
import traceback

from app.gemini import generate_documentation
from app.pdf_processor import process_uploaded_pdf, is_pdf_file
from app.github_analyzer import GitHubAnalyzer

app = FastAPI()

# Serve static files (CSS, JS, etc.)
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Uploads folder
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Templates folder
templates = Jinja2Templates(directory="app/templates")

# Initialize GitHub analyzer
github_analyzer = GitHubAnalyzer()

# ----------------------------
# File Upload Route (Enhanced)
# ----------------------------
@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        file_location = UPLOAD_DIR / file.filename
        
        # Save the uploaded file
        with open(file_location, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        # Check if it's a PDF and process it
        result = {"filename": file.filename, "message": "File uploaded successfully."}
        
        if is_pdf_file(file.filename):
            pdf_text = process_uploaded_pdf(file_location)
            if pdf_text:
                # Generate documentation for PDF content
                documentation = generate_documentation(pdf_text, "pdf")
                result["documentation"] = documentation
                result["content_type"] = "pdf"
            else:
                result["error"] = "Could not extract text from PDF"

        return JSONResponse(status_code=200, content=result)

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ----------------------------
# GitHub Analysis Route (New)
# ----------------------------
@app.post("/analyze-github")
async def analyze_github(request: Request, github_url: str = Form(...)):
    try:
        if not github_url or not github_url.strip():
            raise ValueError("No GitHub URL provided.")
        
        print(f"Analyzing GitHub repository: {github_url}")
        
        # Analyze the repository
        repo_info = github_analyzer.analyze_repository(github_url.strip())
        
        if not repo_info:
            raise ValueError("Could not analyze the GitHub repository. Please check the URL.")
        
        # Generate summary for LLM
        repo_summary = github_analyzer.get_repository_summary(repo_info)
        
        # Add code samples to the summary
        code_samples = ""
        for file_info in repo_info['code_files'][:5]:  # Include first 5 files
            code_samples += f"\n--- {file_info['path']} ---\n"
            code_samples += file_info['content'][:1000] + "\n"  # First 1000 chars
        
        full_content = repo_summary + "\n\nCode Samples:\n" + code_samples
        
        # Generate documentation
        documentation = generate_documentation(full_content, "github_repo")
        
        return JSONResponse({
            "github_url": github_url,
            "repository_info": repo_info,
            "documentation": documentation
        })

    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(error_details)
        return JSONResponse(
            status_code=500,
            content={"error": str(e), "details": error_details}
        )

# ----------------------------
# Home Route
# ----------------------------
@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# ----------------------------
# Code Documentation Generator (Enhanced)
# ----------------------------
@app.post("/generate")
async def generate(request: Request, code_snippet: str = Form(None)):
    try:
        if code_snippet is None:
            body = await request.json()
            code_snippet = body.get("code_snippet", "")

        if not code_snippet.strip():
            raise ValueError("No code snippet provided.")
        
        print("Received code snippet for documentation generation." + code_snippet[:100] + "...")

        documentation = generate_documentation(code_snippet, "code")
        print("Documentation generated successfully")
        
        return JSONResponse({
            "code_snippet": code_snippet,
            "documentation": documentation
        })

    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(error_details)
        return JSONResponse(
            status_code=500,
            content={"error": str(e), "details": error_details}
        )