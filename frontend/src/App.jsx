import { useState } from "react";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [theme, setTheme] = useState("light");
  const [currentChatId, setCurrentChatId] = useState(null);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  return (
    <div className={`${theme} flex h-screen w-screen bg-gray-100 dark:bg-gray-900`}>
      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        theme={theme}
        toggleTheme={toggleTheme}
        currentChatId={currentChatId}
        setCurrentChatId={setCurrentChatId}
      />
      
      <div className="flex-1 flex flex-col transition-all duration-300">
        <ChatWindow 
          isSidebarOpen={isSidebarOpen} 
          currentChatId={currentChatId}
          setCurrentChatId={setCurrentChatId}
          theme={theme}
        />
      </div>
    </div>
  );
}