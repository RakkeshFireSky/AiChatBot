import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [theme, setTheme] = useState("light");
  const [currentChatId, setCurrentChatId] = useState(null);
  const [chats, setChats] = useState([]);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const loadChats = async () => {
    try {
      const response = await fetch("http://localhost:8001/chats");
      const data = await response.json();
      setChats(data.sessions);
    } catch (error) {
      console.error("Error loading chats:", error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 w-screen">
      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        theme={theme}
        toggleTheme={toggleTheme}
        currentChatId={currentChatId}
        setCurrentChatId={setCurrentChatId}
        chats={chats}
        setChats={setChats}
        loadChats={loadChats}
      />
      <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? "ml-0" : "ml-10"}`}>
        <ChatWindow
          isSidebarOpen={isSidebarOpen}
          currentChatId={currentChatId}
          setCurrentChatId={setCurrentChatId}
          chats={chats}
          setChats={setChats}
          loadChats={loadChats}
        />
      </div>
    </div>
  );
}

export default App;