import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Plus, MoreHorizontal, MessageSquare, Trash2, Edit3, Sun, Moon } from "lucide-react";

export default function Sidebar({ isOpen, toggleSidebar, theme, toggleTheme, currentChatId, setCurrentChatId }) {
  const [chats, setChats] = useState([]);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const menuRef = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addNewChat = () => {
    const newChat = {
      id: Date.now().toString(),
      name: "New Chat",
      updatedAt: new Date()
    };
    setChats([newChat, ...chats]);
    setCurrentChatId(newChat.id);
    setMenuOpenId(null);
  };

  const deleteChat = (id) => {
    setChats(chats.filter(c => c.id !== id));
    if (currentChatId === id) {
      setCurrentChatId(chats.length > 1 ? chats[0].id : null);
    }
    setMenuOpenId(null);
  };

  const renameChat = (id, newName) => {
    if (newName.trim() === "") return;
    setChats(chats.map(c => (c.id === id ? { ...c, name: newName } : c)));
    setEditingId(null);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
            key={chat.id}
            className={`flex items-center justify-between p-2 rounded-lg group cursor-pointer transition-colors
              ${currentChatId === chat.id 
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" 
                : "hover:bg-gray-100 dark:hover:bg-gray-700"}`}
            onClick={() => setCurrentChatId(chat.id)}
          >
            <div className="flex items-center min-w-0 flex-1">
              <MessageSquare className="w-4 h-4 mr-2 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                {editingId === chat.id ? (
                  <input
                    autoFocus
                    defaultValue={chat.name}
                    onBlur={(e) => renameChat(chat.id, e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
                    className="w-full bg-transparent border-b border-green-500 outline-none text-sm py-0.5"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <>
                    <span className="truncate text-sm block">{isOpen ? chat.name : chat.name.charAt(0)}</span>
                    {isOpen && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate block">
                        {formatDate(chat.updatedAt)}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>

            {isOpen && editingId !== chat.id && (
              <div className="relative" ref={menuRef}>
                <button
                  className="p-1 opacity-0 group-hover:opacity-100 focus:opacity-100 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpenId(menuOpenId === chat.id ? null : chat.id);
                  }}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {menuOpenId === chat.id && (
                  <div className="absolute right-0 top-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg w-32 z-10 py-1">
                    <button
                      className="w-full text-left px-3 py-2 text-sm flex items-center hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(chat.id);
                        setMenuOpenId(null);
                      }}
                    >
                      <Edit3 className="w-3.5 h-3.5 mr-2" />Rename
                    </button>
                    <button
                      className="w-full text-left px-3 py-2 text-sm flex items-center text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteChat(chat.id);
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