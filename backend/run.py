# run.py
import os
import sys
from pathlib import Path

# Add the current directory to Python path
current_dir = Path(__file__).parent
sys.path.append(str(current_dir))

try:
    import uvicorn
    print("Starting Farmer AI Chatbot Server...")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8001, reload=True)
except ImportError:
    print("Installing required packages...")
    os.system(f"{sys.executable} -m pip install uvicorn fastapi google-generativeai python-dotenv pymongo")
    print("Packages installed. Please run the server again.")
except Exception as e:
    print(f"Error starting server: {e}")