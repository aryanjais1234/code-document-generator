import PyPDF2
import os
from pathlib import Path
from typing import Optional


def extract_text_from_pdf(file_path: str) -> Optional[str]:
    """Extract text content from a PDF file."""
    try:
        with open(file_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            text = ""
            
            for page_num in range(len(reader.pages)):
                page = reader.pages[page_num]
                text += page.extract_text() + "\n"
            
            return text.strip()
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        return None


def is_pdf_file(filename: str) -> bool:
    """Check if the file is a PDF based on its extension."""
    return filename.lower().endswith('.pdf')


def process_uploaded_pdf(file_path: Path) -> Optional[str]:
    """Process an uploaded PDF file and extract its text content."""
    if not file_path.exists():
        return None
    
    if not is_pdf_file(str(file_path)):
        return None
    
    return extract_text_from_pdf(str(file_path))