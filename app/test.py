import os
from langchain_openai import ChatOpenAI
import httpx

#load_dotenv()
#openai.api_key = os.getenv("OPENAI_API_KEY")

client = httpx.Client(verify=False)

llm = ChatOpenAI(
    base_url="https://genailab.tcs.in",
    model="azure_ai/genailab-maas-DeepSeek-V3-0324",
    api_key="sk-qyLngmC2390_ow39JBfTGA",
    http_client=client
)

llm.invoke("Hi")