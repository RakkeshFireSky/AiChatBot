from pymongo import MongoClient
from datetime import datetime
import os
from .models import ChatMessage, ChatSession
from bson import ObjectId
from typing import List

# MongoDB connection - using in-memory storage for now to avoid setup issues
# MONGODB_URI = os.getenv("MONGODB_URI")
# client = MongoClient(MONGODB_URI)
# db = client["farmer_chatbot"]
# chats_collection = db["chats"]
# sessions_collection = db["sessions"]

# In-memory storage for development
chats_storage = {}
sessions_storage = {}

def create_chat_session(title: str) -> ChatSession:
    """Create a new chat session"""
    chat_id = str(ObjectId())
    now = datetime.now()
    session_data = {
        "chat_id": chat_id,
        "title": title,
        "created_at": now,
        "updated_at": now
    }
    sessions_storage[chat_id] = session_data
    return ChatSession(**session_data)

def get_chat_session(chat_id: str) -> ChatSession:
    """Retrieve a chat session by ID"""
    session_data = sessions_storage.get(chat_id)
    if session_data:
        return ChatSession(**session_data)
    return None

def update_chat_session(chat_id: str):
    """Update the timestamp of a chat session"""
    if chat_id in sessions_storage:
        sessions_storage[chat_id]["updated_at"] = datetime.now()

def save_chat(chat_id: str, message: ChatMessage):
    """Save a chat message to the database"""
    if chat_id not in chats_storage:
        chats_storage[chat_id] = []
    
    chat_data = {
        "sender": message.sender,
        "text": message.text,
        "timestamp": message.timestamp
    }
    chats_storage[chat_id].append(chat_data)

def get_chats(chat_id: str, limit: int = 50) -> List[ChatMessage]:
    """Retrieve chat messages for a session"""
    if chat_id not in chats_storage:
        return []
    
    chats = chats_storage[chat_id][-limit:]  # Get last 'limit' messages
    return [ChatMessage(**chat) for chat in chats]