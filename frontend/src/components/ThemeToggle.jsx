// ThemeToggle.jsx (optional - if you want to keep this component)
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle({ theme, toggleTheme }) {
  return (
    <button
      className="flex items-center justify-center p-2 m-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      onClick={toggleTheme}
    >
      {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
      <span className="ml-2 text-sm">{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
    </button>
  );
}