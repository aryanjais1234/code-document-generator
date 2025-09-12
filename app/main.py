from fastapi import FastAPI, Request, Form, File, UploadFile, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import os
import traceback


from app.gemini import generate_documentation

app = FastAPI()

# Serve static files (CSS, JS, etc.)
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Uploads folder
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Templates folder
templates = Jinja2Templates(directory="app/templates")

# ----------------------------
# File Upload Route
# ----------------------------
@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        file_location = UPLOAD_DIR / file.filename
        with open(file_location, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        return JSONResponse(
            status_code=200,
            content={"filename": file.filename, "message": "File uploaded successfully."}
        )

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ----------------------------
# Home Route
# ----------------------------
@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# ----------------------------
# Code Documentation Generator
# ----------------------------
@app.post("/generate")
async def generate(request: Request, code_snippet: str = Form(None)):
    try:
        if code_snippet is None:
            body = await request.json()
            code_snippet = body.get("code_snippet", "")

        if not code_snippet.strip():
            raise ValueError("No code snippet provided.")
        
        print("Received code snippet for documentation generation."+code_snippet)

        documentation = generate_documentation(code_snippet)
        print("Inside generate method")
        return JSONResponse({
            "code_snippet": code_snippet,
            "documentation": documentation
        })

    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(error_details)  # still logs on server
        return JSONResponse(
            status_code=500,
            content={"error": str(e), "details": error_details}
        )