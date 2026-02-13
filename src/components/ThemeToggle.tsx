import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

const ThemeToggle = () => {
  const { resolved, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(resolved === "dark" ? "light" : "dark")}
      className="w-9 h-9 rounded-lg flex items-center justify-center border border-gold/30 hover:bg-gold/10 transition-colors"
      aria-label={resolved === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
    >
      {resolved === "dark" ? (
        <Sun className="w-4 h-4 text-gold" />
      ) : (
        <Moon className="w-4 h-4 text-gold" />
      )}
    </button>
  );
};

export default ThemeToggle;
