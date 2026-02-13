import { Menu, X, Clock, Signal, LogOut } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import logoAsegurar from "@/assets/logo-asegurar.jpeg";

const PlatformHeader = () => {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { profile, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="h-14 flex items-center justify-between px-4 border-b flex-shrink-0 z-20 bg-navy border-gold/20">
      <div className="flex items-center gap-3">
        <button className="lg:hidden text-primary-foreground" onClick={toggleSidebar}>
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <img src="/logo.png" alt="ASEGURAR" className="h-10 w-auto object-contain" />
        <div className="hidden sm:block">
          <div className="text-primary-foreground font-bold text-sm font-heading">CELLVI 2.0</div>
          <div className="text-gold text-[10px] tracking-[0.15em]">Plataforma de Monitoreo</div>
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs text-primary-foreground/60">
        <div className="hidden md:flex items-center gap-1.5">
          <Signal className="w-3.5 h-3.5 text-green-500" />
          <span>Sistema Online</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          <span>{now.toLocaleTimeString("es-CO")}</span>
        </div>
        <div className="hidden md:flex items-center gap-2 pl-3 border-l border-gold/20">
          <div className="w-7 h-7 rounded-full bg-gold/20 flex items-center justify-center text-gold text-[10px] font-bold">
            {profile?.display_name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div>
            <div className="text-primary-foreground text-[10px] font-medium">{profile?.display_name || "Usuario"}</div>
            <div className="text-gold text-[9px]">{role || "operator"}</div>
          </div>
        </div>
        <button onClick={handleSignOut} className="text-xs font-medium flex items-center gap-1 text-red-400 hover:text-red-300">
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};

export default PlatformHeader;
