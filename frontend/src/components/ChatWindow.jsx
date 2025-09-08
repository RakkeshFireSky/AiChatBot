import { useState, useEffect, useRef } from "react";
import { Send, Bot, User, Loader } from "lucide-react";
import axios from "axios";

const API_BASE_URL = "http://localhost:8001";

export default function ChatWindow({ isSidebarOpen }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [currentChatId, setCurrentChatId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  // Load chat history when component mounts or chatId changes
  useEffect(() => {
    if (currentChatId) {
      loadChatHistory(currentChatId);
    } else {
      setMessages([
        { 
          id: 1, 
          sender: "bot", 
          text: "Hello! I'm your farming assistant. How can I help you with your agricultural questions today?" 
        }
      ]);
    }
  }, [currentChatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadChatHistory = async (chatId) => {
    try {
      setIsLoading(true);
      setError("");
      const response = await axios.get(`${API_BASE_URL}/chats/${chatId}`);
      const chatData = response.data;
      
      // Convert backend format to frontend format
      const formattedMessages = chatData.messages.map((msg, index) => ({
        id: index + 1,
        sender: msg.sender === "user" ? "user" : "bot",
        text: msg.text,
        timestamp: msg.timestamp
      }));
      
      setMessages(formattedMessages);
    } catch (error) {
      console.error("Error loading chat history:", error);
      setError("Could not load chat history. Starting a new conversation.");
      setMessages([
        { 
          id: 1, 
          sender: "bot", 
          text: "Hello! I'm your farming assistant. How can I help you with your agricultural questions today?" 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    // Add user message to UI immediately
    const userMessage = { 
      id: Date.now(), 
      sender: "user", 
      text: input,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError("");
    
    try {
      // Send message to backend
      const response = await axios.post(`${API_BASE_URL}/chat`, {
        message: input,
        chat_id: currentChatId
      });
      
      // Add AI response to UI
      const aiMessage = { 
        id: Date.now() + 1, 
        sender: "bot", 
        text: response.data.response,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiMessage]);
      
      // Set chat ID if this is a new chat
      if (!currentChatId) {
        setCurrentChatId(response.data.chat_id);
        // Update sidebar to reflect new chat (you might want to lift this state up)
        if (window.updateChatList) {
          window.updateChatList();
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Show error message
      const errorMessage = { 
        id: Date.now() + 1, 
        sender: "bot", 
        text: "Sorry, I'm having trouble connecting to the server. Please try again later.",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
      setError("Connection error. Please check if the server is running.");
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    setCurrentChatId(null);
    setMessages([
      { 
        id: 1, 
        sender: "bot", 
        text: "Hello! I'm your farming assistant. How can I help you with your agricultural questions today?" 
      }
    ]);
    setError("");
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Farming Assistant
          </h2>
        </div>
        {currentChatId && (
          <button
            onClick={startNewChat}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            New Chat
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === "bot" ? "justify-start" : "justify-end"}`}
          >
            <div className={`flex max-w-xs lg:max-w-md xl:max-w-lg 2xl:max-w-xl ${msg.sender === "bot" ? "items-start" : "items-end"}`}>
              {msg.sender === "bot" && (
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-2">
                  <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              )}
              
              <div className={`rounded-xl p-3 ${msg.sender === "bot" 
                ? "bg-blue-100 dark:bg-blue-900/30 text-gray-800 dark:text-gray-200" 
                : "bg-blue-500 text-white"}`}
              >
                <p className="text-sm">{msg.text}</p>
                <p className="text-xs opacity-70 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </p>
              </div>
              
              {msg.sender === "user" && (
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center ml-2">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-2">
                <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-xl p-3">
                <Loader className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-center">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about farming, crops, or agriculture..."
            className="flex-1 p-3 rounded-l-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => e.key === "Enter" && !isLoading && sendMessage()}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="p-3 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {isLoading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          Ask me about crops, soil, irrigation, pests, or any farming topic!
        </p>
      </div>
    </div>
  );
}