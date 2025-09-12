# import os
# #import openai
# from langchain_openai import ChatOpenAI
# import httpx
# from dotenv import load_dotenv
# from app.prompts import build_prompt

# #load_dotenv()
# #openai.api_key = os.getenv("OPENAI_API_KEY")

# client = httpx.Client(verify=False)

# llm = ChatOpenAI(
#      base_url="https://genailab.tcs.in",
#     model="azure_ai/genailab-maas-DeepSeek-V3-0324",
#     api_key="sk-qyLngmC2390_ow39JBfTGA",
#     http_client=client
# )

# def generate_documentation(code_snippet: str) -> str:
#     prompt = build_prompt(code_snippet)
#     response = llm.invoke([
#         {"role": "system", "content": "You are a helpful code documentation generator."},
#         {"role": "user", "content": prompt}
#     ])
#     return response.content

