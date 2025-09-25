def build_prompt(code_snippet: str, content_type: str = "code") -> str:
    """Build enhanced prompts based on content type."""
    
    if content_type == "pdf":
        return f"""
Analyze the following document content and generate comprehensive technical documentation explaining:
- Main concepts and topics covered
- Key technical details and specifications
- Important procedures or methodologies
- Practical applications and use cases
- Summary of key findings or conclusions

Document Content:
{code_snippet}

Please provide a well-structured technical documentation:
"""
    
    elif content_type == "github_repo":
        return f"""
Analyze the following GitHub repository and generate comprehensive project documentation explaining:
- Project overview and purpose
- Architecture and code structure
- Key components and their responsibilities
- Technologies and frameworks used
- Setup and installation instructions (if apparent)
- Usage examples and API documentation
- Code quality and best practices observed

Repository Analysis:
{code_snippet}

Please provide a detailed project documentation:
"""
    
    else:  # Default code analysis
        return f"""
Analyze the following code and generate comprehensive technical documentation explaining:
- **Purpose**: What the code does and its main functionality
- **Input/Output**: Parameters, return values, and data flow
- **Logic & Algorithm**: Key algorithms, business logic, and implementation details
- **Edge Cases**: Potential issues, error handling, and boundary conditions
- **Dependencies**: External libraries, modules, or services used
- **Usage Examples**: How to use this code with practical examples
- **Best Practices**: Code quality, design patterns, and recommendations for improvement

Code:
```
{code_snippet}
```

Please provide detailed, well-structured technical documentation with clear sections:
"""

# #include <iostream>
# using namespace std;

# int main() {
#     int a, b, sum;
#     cout << "Enter two numbers: ";
#     cin >> a >> b;

#     // Wrong logic: multiplying instead of adding
#     sum = a * b;  

#     cout << "The sum is: " << sum << endl;
#     return 0;
# }
