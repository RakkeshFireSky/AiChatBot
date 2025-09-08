from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(cls, _source_type, _handler):
        return {
            'type': 'str',
            'from_attributes': True,
        }

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

class ChatMessage(BaseModel):
    sender: str  # "user" or "assistant"
    text: str
    timestamp: datetime

class ChatSession(BaseModel):
    chat_id: str
    title: str
    created_at: datetime
    updated_at: datetime

class ChatSessionInDB(ChatSession):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}