import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    MONGODB_URI: str = os.getenv("MONGODB_URI")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY")

settings = Settings()