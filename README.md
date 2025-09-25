# 📄 Code Document Generator

## 🚩 Problem Statement

Maintaining high-quality documentation for software projects is a constant challenge. Developers often spend excessive time updating docs, and outdated documentation can slow onboarding, reduce productivity, and cause frustration. There's a need for a tool that automatically generates accurate, readable, and up-to-date documentation directly from your code!

## 💡 Solution

**Code Document Generator** solves this by analyzing your source files and auto-generating documentation!  
- Supports multiple languages 🧑‍💻  
- **NEW**: PDF document analysis 📄
- **NEW**: GitHub repository analysis 🔗
- Easy to use and extend 🔧  
- Keeps your docs fresh with every update 🌱  
- Integrates smoothly into any workflow 🤝

## 🛠️ Implementation

- **Multi-language support:** Works with many popular programming languages out-of-the-box.
- **PDF Processing:** Extract and analyze text content from PDF documents automatically
- **GitHub Integration:** Clone and analyze entire repositories with a single URL
- **Enhanced AI Prompts:** Context-aware documentation generation for different content types
- **Modern Web Interface:** Beautiful chat-based interface with real-time processing
- **Static analysis:** Parses classes, functions, and comments to build rich docs.
- **Flexible output:** Generates documentation with proper formatting and structure.
- **Interactive UI:** Upload files, paste code, or provide GitHub URLs seamlessly.

## 🚀 How to Use

### 📦 Installation

1. 👯 Clone the repository:
   ```bash
   git clone https://github.com/aryanjais1234/code-document-generator.git
   cd code-document-generator
   ```

2. 📥 Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. 🔑 Set up API Keys:
   ```bash
   cp .env.example .env
   # Edit .env and add your Gemini API key
   ```

4. 🏃 Run the application:
   ```bash
   uvicorn app.main:app --reload
   ```

5. 🌐 Open your browser at: http://127.0.0.1:8000

### 🎯 Features

#### 1. **Code Analysis** 💻
- Paste any code snippet in the chat interface
- Get comprehensive documentation including:
  - Purpose and functionality
  - Input/output parameters
  - Logic and algorithms
  - Edge cases and error handling
  - Usage examples
  - Best practices

#### 2. **PDF Document Processing** 📄
- Upload PDF files using the 📎 attachment button
- Automatic text extraction and analysis
- Generate technical documentation from:
  - Research papers
  - Technical specifications
  - Manuals and guides
  - Academic documents

#### 3. **GitHub Repository Analysis** 🔗
- Click the 🔗 GitHub button
- Enter any public GitHub repository URL
- Get comprehensive project documentation including:
  - Project overview and architecture
  - Code structure analysis
  - Technology stack identification
  - Setup and usage instructions

#### 4. **Interactive Chat Interface** 💬
- Real-time documentation generation
- Chat history with local storage
- File upload progress indicators
- Formatted output with syntax highlighting

### 🔧 API Endpoints

- `GET /` - Main web interface
- `POST /generate` - Generate documentation from code
- `POST /upload` - Upload and process files (including PDFs)
- `POST /analyze-github` - Analyze GitHub repositories

## ⚙️ Configuration

### Required Environment Variables
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

### Supported File Types
- **Code Files**: .py, .js, .ts, .java, .cpp, .c, .cs, .php, .rb, .go, .rs, .swift, .kt, etc.
- **Documents**: .pdf, .txt, .md
- **Web**: .html, .css, .jsx, .tsx, .vue

### GitHub Repository Analysis
- Automatically filters relevant source code files
- Excludes build artifacts and dependencies
- Limits analysis to prevent API overuse
- Supports most popular programming languages

---

🤝 **Contributions welcome!**  
Open issues or pull requests to help improve this project.

✨ Happy documenting! ✨