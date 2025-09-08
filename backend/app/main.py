from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import google.generativeai as genai
import os
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv()

app = FastAPI(title="Farmer AI Chatbot", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MOCK_MODE = False
model = None

if not GEMINI_API_KEY:
    print("Warning: GEMINI_API_KEY environment variable not set. Using mock mode.")
    MOCK_MODE = True
else:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        
        # Try different model names based on API version
        available_models = []
        try:
            # Get available models
            for m in genai.list_models():
                if 'generateContent' in m.supported_generation_methods:
                    available_models.append(m.name)
                    print(f"Available model: {m.name}")
            
            # Try different model names
            model_candidates = [
                "models/gemini-pro",
                "gemini-pro",
                "models/gemini-1.0-pro",
                "gemini-1.0-pro",
                "models/gemini-1.5-pro",
                "gemini-1.5-pro"
            ]
            
            for model_name in model_candidates:
                try:
                    model = genai.GenerativeModel(model_name=model_name)
                    print(f"Successfully loaded model: {model_name}")
                    break
                except Exception as e:
                    print(f"Failed to load model {model_name}: {e}")
                    continue
                    
            if model is None:
                print("Could not find a working model. Using mock mode.")
                MOCK_MODE = True
                
        except Exception as e:
            print(f"Error listing models: {e}")
            MOCK_MODE = True
            
    except Exception as e:
        print(f"Error configuring Gemini: {e}")
        MOCK_MODE = True

# In-memory storage for development
chat_sessions = {}
chat_messages = {}

class MessageRequest(BaseModel):
    message: str
    chat_id: Optional[str] = None

class MessageResponse(BaseModel):
    response: str
    chat_id: str

class ChatMessage(BaseModel):
    sender: str
    text: str
    timestamp: datetime

class ChatSession(BaseModel):
    chat_id: str
    title: str
    created_at: datetime
    updated_at: datetime

@app.get("/")
async def root():
    return {
        "message": "Farmer AI Chatbot API", 
        "status": "running", 
        "mock_mode": MOCK_MODE,
        "model_available": model is not None
    }

@app.post("/chat", response_model=MessageResponse)
async def chat_with_ai(request: MessageRequest):
    try:
        # Get or create chat session
        if request.chat_id and request.chat_id in chat_sessions:
            chat_id = request.chat_id
            title = chat_sessions[chat_id]["title"]
        else:
            # Create a new chat session
            chat_id = str(len(chat_sessions) + 1)
            title = request.message[:30] + "..." if len(request.message) > 30 else request.message
            chat_sessions[chat_id] = {
                "chat_id": chat_id,
                "title": title,
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }
            chat_messages[chat_id] = []
        
        # Save user message
        user_message = {
            "sender": "user",
            "text": request.message,
            "timestamp": datetime.now()
        }
        chat_messages[chat_id].append(user_message)
        
        # Generate AI response
        if MOCK_MODE or model is None:
            # Mock response for testing without API key or model
            farming_responses = [
                "For better crop yield, consider rotating your crops seasonally. This helps prevent soil nutrient depletion.",
                "Organic fertilizers like compost can improve soil health significantly. They add nutrients and improve soil structure.",
                "Proper irrigation scheduling is crucial for water conservation. Drip irrigation can save up to 50% water compared to flood irrigation.",
                "Integrated Pest Management (IPM) combines biological, cultural, and chemical methods for effective pest control.",
                "Soil testing every season helps determine nutrient requirements accurately. This prevents over-fertilization.",
                "Cover crops like legumes can fix nitrogen in the soil naturally, reducing fertilizer needs.",
                "Proper spacing between plants ensures good air circulation and reduces disease spread.",
                "Mulching helps retain soil moisture and suppress weeds naturally.",
                "Crop diversity in your fields can help break pest and disease cycles naturally.",
                "Monitoring weather patterns helps plan farming activities and protect crops from extreme conditions."
            ]
            import random
            response_text = random.choice(farming_responses)
        else:
            try:
                # Create farming-specific prompt
                farming_prompt = f"""You are an agricultural expert assistant helping farmers. Provide helpful, accurate, practical advice about:
- Crop cultivation best practices
- Soil health and fertilization
- Pest and disease management
- Irrigation and water management techniques
- Livestock care and management
- Sustainable farming methods
- Organic farming practices
- Weather impact on farming
- Government schemes for farmers (if applicable)

Question: {request.message}

Please provide a concise, practical answer focused on actionable advice:"""
                
                response = model.generate_content(farming_prompt)
                response_text = response.text
            except Exception as e:
                response_text = f"Error calling AI API: {str(e)}. Using mock response."
                # Fallback to mock response
                farming_responses = [
                    "For better yields, ensure proper soil preparation before planting.",
                    "Regular crop monitoring helps detect pests and diseases early.",
                    "Water management is key - consider rainwater harvesting for irrigation."
                ]
                import random
                response_text = random.choice(farming_responses)
        
        # Save AI response
        ai_message = {
            "sender": "assistant",
            "text": response_text,
            "timestamp": datetime.now()
        }
        chat_messages[chat_id].append(ai_message)
        
        # Update chat session timestamp
        chat_sessions[chat_id]["updated_at"] = datetime.now()
        
        return MessageResponse(response=response_text, chat_id=chat_id)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")

@app.get("/chats/{chat_id}")
async def get_chat_history(chat_id: str):
    if chat_id not in chat_messages:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    return {
        "chat_id": chat_id,
        "title": chat_sessions.get(chat_id, {}).get("title", "Unknown"),
        "messages": chat_messages[chat_id],
        "created_at": chat_sessions.get(chat_id, {}).get("created_at", datetime.now())
    }

@app.get("/chats")
async def get_all_chat_sessions():
    return {
        "sessions": [
            {
                "chat_id": session["chat_id"],
                "title": session["title"],
                "created_at": session["created_at"],
                "updated_at": session["updated_at"]
            }
            for session in chat_sessions.values()
        ]
    }

@app.get("/models")
async def get_available_models():
    """Endpoint to check available models"""
    if not GEMINI_API_KEY:
        return {"error": "GEMINI_API_KEY not set"}
    
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        models = []
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                models.append({
                    "name": m.name,
                    "display_name": m.display_name,
                    "supported_methods": m.supported_generation_methods
                })
        return {"available_models": models}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)