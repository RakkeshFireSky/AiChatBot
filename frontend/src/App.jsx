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
    // This function will be passed to Sidebar and ChatWindow to refresh the chat list
    // You can implement API call here if needed
    console.log("Refreshing chat list");
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
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
      <ChatWindow
        isSidebarOpen={isSidebarOpen}
        currentChatId={currentChatId}
        setCurrentChatId={setCurrentChatId}
        chats={chats}
        setChats={setChats}
        loadChats={loadChats}
      />
    </div>
  );
}

export default App;