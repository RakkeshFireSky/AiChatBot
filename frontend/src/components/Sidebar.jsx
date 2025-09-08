import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Plus, MoreHorizontal, MessageSquare, Trash2, Edit3, Sun, Moon } from "lucide-react";
import axios from "axios";

const API_BASE_URL = "http://localhost:8001";

export default function Sidebar({ isOpen, toggleSidebar, theme, toggleTheme, currentChatId, setCurrentChatId }) {
  const [chats, setChats] = useState([]);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const menuRef = useRef();

  useEffect(() => {
    loadChats();
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadChats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/chats`);
      setChats(response.data.sessions);
    } catch (error) {
      console.error("Error loading chats:", error);
    }
  };

  const addNewChat = () => {
    setCurrentChatId(null);
    setMenuOpenId(null);
  };

  const deleteChat = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/chats/${id}`);
      setChats(chats.filter(c => c.chat_id !== id));
      if (currentChatId === id) {
        setCurrentChatId(null);
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
    setMenuOpenId(null);
  };

  const renameChat = async (id, newName) => {
    if (newName.trim() === "") return;
    
    try {
      await axios.put(`${API_BASE_URL}/chats/${id}/title`, null, {
        params: { title: newName }
      });
      setChats(chats.map(c => (c.chat_id === id ? { ...c, title: newName } : c)));
    } catch (error) {
      console.error("Error renaming chat:", error);
    }
    setEditingId(null);
    setEditingTitle("");
  };

  const startEditing = (chat) => {
    setEditingId(chat.chat_id);
    setEditingTitle(chat.title);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 h-full flex flex-col border-r border-gray-200 dark:border-gray-700 transition-all duration-300
      ${isOpen ? "w-64" : "w-16"}`}>

      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        {isOpen ? (
          <h1 className="text-xl font-bold text-green-600 dark:text-green-400">FarmAI Assistant</h1>
        ) : (
          <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
            <MessageSquare className="text-white w-5 h-5" />
          </div>
        )}
        <button
          className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          onClick={toggleSidebar}
        >
          <ArrowLeft className={`w-4 h-4 transition-transform ${isOpen ? "" : "rotate-180"}`} />
        </button>
      </div>

      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <button
          className="flex items-center justify-center w-full p-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          onClick={addNewChat}
        >
          {isOpen ? <><Plus className="w-4 h-4 mr-2" />New Chat</> : <Plus className="w-5 h-5" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {isOpen ? "Chat History" : ""}
        </div>
        {chats.map(chat => (
          <div
            key={chat.chat_id}
            className={`flex items-center justify-between p-2 rounded-lg group cursor-pointer transition-colors
              ${currentChatId === chat.chat_id 
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" 
                : "hover:bg-gray-100 dark:hover:bg-gray-700"}`}
            onClick={() => setCurrentChatId(chat.chat_id)}
          >
            <div className="flex items-center min-w-0 flex-1">
              <MessageSquare className="w-4 h-4 mr-2 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                {editingId === chat.chat_id ? (
                  <input
                    autoFocus
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={() => renameChat(chat.chat_id, editingTitle)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        renameChat(chat.chat_id, editingTitle);
                      } else if (e.key === "Escape") {
                        setEditingId(null);
                        setEditingTitle("");
                      }
                    }}
                    className="w-full bg-transparent border-b border-green-500 outline-none text-sm py-0.5"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <>
                    <span className="truncate text-sm block">{isOpen ? chat.title : chat.title.charAt(0)}</span>
                    {isOpen && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate block">
                        {formatDate(chat.updated_at)}
                        {chat.message_count > 0 && ` • ${chat.message_count} messages`}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>

            {isOpen && editingId !== chat.chat_id && (
              <div className="relative" ref={menuRef}>
                <button
                  className="p-1 opacity-0 group-hover:opacity-100 focus:opacity-100 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpenId(menuOpenId === chat.chat_id ? null : chat.chat_id);
                  }}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {menuOpenId === chat.chat_id && (
                  <div className="absolute right-0 top-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg w-32 z-10 py-1">
                    <button
                      className="w-full text-left px-3 py-2 text-sm flex items-center hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(chat);
                        setMenuOpenId(null);
                      }}
                    >
                      <Edit3 className="w-3.5 h-3.5 mr-2" />Rename
                    </button>
                    <button
                      className="w-full text-left px-3 py-2 text-sm flex items-center text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteChat(chat.chat_id);
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-2" />Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <button
          className="flex items-center justify-center w-full p-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          onClick={toggleTheme}
        >
          {theme === "light" ? (
            <><Moon className="w-4 h-4" />{isOpen && <span className="ml-2 text-sm">Dark Mode</span>}</>
          ) : (
            <><Sun className="w-4 h-4" />{isOpen && <span className="ml-2 text-sm">Light Mode</span>}</>
          )}
        </button>
      </div>
    </div>
  );
}