from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import google.generativeai as genai
import os
from dotenv import load_dotenv
from datetime import datetime
import re

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

# Fixed query responses
FIXED_QUERIES = {
    "weather": {
        "patterns": [r"weather", r"rain", r"temperature", r"forecast", r"humidity"],
        "response": "For accurate weather information, I recommend checking your local weather service. For farming, ideal temperatures are between 15-30°C with moderate humidity (40-70%). Rainfall of 1-2 inches per week is generally good for most crops."
    },
    "soil": {
        "patterns": [r"soil", r"ph", r"nutrient", r"fertili[sz]er", r"compost"],
        "response": "Soil health is crucial for farming. Most crops prefer a pH between 6.0-7.0. Regular soil testing every season helps determine nutrient requirements. Organic matter like compost improves soil structure and fertility."
    },
    "crops": {
        "patterns": [r"crop", r"plant", r"harvest", r"yield", r"season"],
        "response": "Different crops have different growing seasons and requirements. Common crops include wheat, rice, corn, and vegetables. Crop rotation helps maintain soil health and prevent pest buildup."
    },
    "pests": {
        "patterns": [r"pest", r"insect", r"disease", r"bug", r"infestation"],
        "response": "Integrated Pest Management (IPM) is recommended. This includes cultural practices, biological controls, and careful use of pesticides. Regular monitoring helps detect issues early."
    },
    "irrigation": {
        "patterns": [r"water", r"irrigation", r"drip", r"sprinkler", r"moisture"],
        "response": "Efficient irrigation saves water and improves yields. Drip irrigation can save 30-50% water compared to flood irrigation. Water requirements vary by crop and growth stage."
    }
}

class MessageRequest(BaseModel):
    message: str
    chat_id: Optional[str] = None

class MessageResponse(BaseModel):
    response: str
    chat_id: str
    chat_title: str

class ChatMessage(BaseModel):
    sender: str
    text: str
    timestamp: datetime

class ChatSession(BaseModel):
    chat_id: str
    title: str
    created_at: datetime
    updated_at: datetime

def check_fixed_queries(message: str) -> Optional[str]:
    """Check if the message matches any fixed query patterns"""
    message_lower = message.lower()
    
    for query_type, query_data in FIXED_QUERIES.items():
        for pattern in query_data["patterns"]:
            if re.search(pattern, message_lower, re.IGNORECASE):
                return query_data["response"]
    
    return None

def generate_chat_title(message: str) -> str:
    """Generate a title for the chat based on the first message"""
    # Try to extract key words for the title
    words = message.split()[:5]  # Take first 5 words
    title = " ".join(words)
    
    # If the message is too long, add ellipsis
    if len(title) > 25:
        title = title[:22] + "..."
    
    return title or "New Chat"

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
        # Check for fixed queries first
        fixed_response = check_fixed_queries(request.message)
        
        # Get or create chat session
        if request.chat_id and request.chat_id in chat_sessions:
            chat_id = request.chat_id
            chat_title = chat_sessions[chat_id]["title"]
        else:
            # Create a new chat session
            chat_id = str(datetime.now().timestamp())
            chat_title = generate_chat_title(request.message)
            chat_sessions[chat_id] = {
                "chat_id": chat_id,
                "title": chat_title,
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
        if fixed_response:
            # Use fixed response if query matches patterns
            response_text = fixed_response
        elif MOCK_MODE or model is None:
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
        
        return MessageResponse(
            response=response_text, 
            chat_id=chat_id,
            chat_title=chat_title
        )
    
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
        "created_at": chat_sessions.get(chat_id, {}).get("created_at", datetime.now()),
        "updated_at": chat_sessions.get(chat_id, {}).get("updated_at", datetime.now())
    }

@app.get("/chats")
async def get_all_chat_sessions():
    # Sort chats by updated_at in descending order
    sorted_sessions = sorted(
        chat_sessions.values(),
        key=lambda x: x["updated_at"],
        reverse=True
    )
    
    return {
        "sessions": [
            {
                "chat_id": session["chat_id"],
                "title": session["title"],
                "created_at": session["created_at"],
                "updated_at": session["updated_at"],
                "message_count": len(chat_messages.get(session["chat_id"], []))
            }
            for session in sorted_sessions
        ]
    }

@app.delete("/chats/{chat_id}")
async def delete_chat_session(chat_id: str):
    if chat_id in chat_sessions:
        del chat_sessions[chat_id]
    
    if chat_id in chat_messages:
        del chat_messages[chat_id]
    
    return {"message": "Chat session deleted successfully"}

@app.put("/chats/{chat_id}/title")
async def update_chat_title(chat_id: str, title: str):
    if chat_id not in chat_sessions:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    if not title.strip():
        raise HTTPException(status_code=400, detail="Title cannot be empty")
    
    chat_sessions[chat_id]["title"] = title.strip()
    chat_sessions[chat_id]["updated_at"] = datetime.now()
    
    return {"message": "Chat title updated successfully"}

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