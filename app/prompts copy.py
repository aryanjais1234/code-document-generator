def build_prompt(code_snippet: str) -> str:
    return f"""
Analyze the following code and generate human-readable documentation explaining:
- What the code does
- Its input and output
- Any edge cases or logic
- An example use case

Code:
```python
{code_snippet}

Documentation:
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
