import os
import requests
import tempfile
import shutil
from typing import Dict, List, Optional, Tuple
from pathlib import Path
import git


class GitHubAnalyzer:
    """Analyze GitHub repositories and extract code for documentation."""
    
    def __init__(self):
        self.supported_extensions = {
            '.py', '.js', '.ts', '.java', '.cpp', '.c', '.cs', '.php', 
            '.rb', '.go', '.rs', '.swift', '.kt', '.scala', '.r', '.m',
            '.html', '.css', '.vue', '.jsx', '.tsx'
        }

    def parse_github_url(self, url: str) -> Optional[Tuple[str, str]]:
        """Parse GitHub URL to extract owner and repo name."""
        try:
            # Handle different GitHub URL formats
            if 'github.com' not in url:
                return None
            
            # Remove .git suffix if present
            url = url.rstrip('.git')
            
            # Extract owner and repo from URL
            parts = url.split('/')
            if len(parts) >= 2:
                owner = parts[-2]
                repo = parts[-1]
                return owner, repo
            
            return None
        except Exception as e:
            print(f"Error parsing GitHub URL: {e}")
            return None

    def clone_repository(self, github_url: str) -> Optional[str]:
        """Clone a GitHub repository to a temporary directory."""
        try:
            temp_dir = tempfile.mkdtemp()
            git.Repo.clone_from(github_url, temp_dir)
            return temp_dir
        except Exception as e:
            print(f"Error cloning repository: {e}")
            return None

    def extract_code_files(self, repo_path: str, max_files: int = 20) -> List[Dict[str, str]]:
        """Extract code files from the cloned repository."""
        code_files = []
        repo_path = Path(repo_path)
        
        try:
            for file_path in repo_path.rglob('*'):
                if len(code_files) >= max_files:
                    break
                
                if (file_path.is_file() and 
                    file_path.suffix in self.supported_extensions and
                    self._should_include_file(file_path)):
                    
                    try:
                        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                            content = f.read()
                            
                        if content.strip():  # Only include non-empty files
                            relative_path = file_path.relative_to(repo_path)
                            code_files.append({
                                'path': str(relative_path),
                                'content': content[:5000],  # Limit content length
                                'extension': file_path.suffix
                            })
                    except Exception as e:
                        print(f"Error reading file {file_path}: {e}")
                        continue
        
        except Exception as e:
            print(f"Error extracting code files: {e}")
        
        return code_files

    def _should_include_file(self, file_path: Path) -> bool:
        """Determine if a file should be included in the analysis."""
        # Skip files in common directories that aren't source code
        exclude_dirs = {
            'node_modules', '.git', '__pycache__', '.pytest_cache',
            'venv', 'env', '.venv', 'build', 'dist', 'target',
            '.next', '.nuxt', 'coverage', '.nyc_output'
        }
        
        # Check if file is in an excluded directory
        for part in file_path.parts:
            if part in exclude_dirs:
                return False
        
        # Skip very large files (> 100KB)
        try:
            if file_path.stat().st_size > 100_000:
                return False
        except:
            return False
        
        return True

    def analyze_repository(self, github_url: str) -> Optional[Dict[str, any]]:
        """Analyze a GitHub repository and return structured data."""
        repo_path = self.clone_repository(github_url)
        if not repo_path:
            return None
        
        try:
            code_files = self.extract_code_files(repo_path)
            
            # Get basic repository info
            parsed_url = self.parse_github_url(github_url)
            repo_info = {
                'url': github_url,
                'owner': parsed_url[0] if parsed_url else 'unknown',
                'name': parsed_url[1] if parsed_url else 'unknown',
                'files_analyzed': len(code_files),
                'code_files': code_files
            }
            
            return repo_info
        
        finally:
            # Clean up temporary directory
            try:
                shutil.rmtree(repo_path)
            except Exception as e:
                print(f"Error cleaning up temp directory: {e}")

    def get_repository_summary(self, repo_info: Dict[str, any]) -> str:
        """Generate a summary of the repository for documentation."""
        if not repo_info or not repo_info.get('code_files'):
            return "No code files found in repository."
        
        summary = f"Repository: {repo_info['owner']}/{repo_info['name']}\n"
        summary += f"Files analyzed: {repo_info['files_analyzed']}\n\n"
        
        # Group files by extension
        file_types = {}
        for file_info in repo_info['code_files']:
            ext = file_info['extension']
            if ext not in file_types:
                file_types[ext] = []
            file_types[ext].append(file_info['path'])
        
        summary += "File structure:\n"
        for ext, files in file_types.items():
            summary += f"{ext} files: {', '.join(files[:5])}"
            if len(files) > 5:
                summary += f" ... and {len(files) - 5} more"
            summary += "\n"
        
        return summary