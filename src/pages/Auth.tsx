import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import logoAsegurar from "@/assets/logo-asegurar.jpeg";
import { Eye, EyeOff, Shield } from "lucide-react";

const Auth = () => {
  const { t } = useTranslation();
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Bienvenido a CELLVI 2.0");
          navigate("/platform");
        }
      } else {
        const { error } = await signUp(email, password, displayName);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Cuenta creada. Puedes iniciar sesión.");
          setIsLogin(true);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-navy flex-col justify-center items-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--gold)/0.1),transparent_60%)]" />
        <div className="relative z-10 text-center">
          <img src={logoAsegurar} alt="ASEGURAR LTDA" className="h-20 w-auto object-contain brightness-0 invert mx-auto mb-8" />
          <h1 className="font-heading text-4xl font-bold text-primary-foreground mb-4">CELLVI 2.0</h1>
          <p className="text-primary-foreground/60 text-lg max-w-md">
            Plataforma integral de telemática con Evidence-Grade Tracking, Connectivity Autopilot y Policy Engine
          </p>
          <div className="mt-12 grid grid-cols-3 gap-6 text-center">
            {[
              { label: "Vehículos", value: "10K+" },
              { label: "Uptime", value: "99.9%" },
              { label: "Países", value: "5+" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-gold font-heading font-bold text-2xl">{s.value}</div>
                <div className="text-primary-foreground/40 text-xs mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <img src={logoAsegurar} alt="ASEGURAR" className="h-14 w-auto object-contain mx-auto mb-4" />
          </div>

          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-gold" />
            <h2 className="font-heading font-bold text-xl text-foreground">
              {isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
            </h2>
          </div>
          <p className="text-muted-foreground text-sm mb-8">
            {isLogin ? "Accede a la plataforma CELLVI 2.0" : "Regístrate para acceder a la plataforma"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <Label htmlFor="displayName">Nombre completo</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Juan Pérez"
                  required={!isLogin}
                  className="mt-1"
                />
              </div>
            )}
            <div>
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@empresa.com"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-gold-gradient text-navy font-heading font-bold hover:opacity-90">
              {loading ? "Procesando..." : isLogin ? "Ingresar" : "Registrarse"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-gold hover:underline"
            >
              {isLogin ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
            </button>
          </div>

          <div className="mt-8 text-center">
            <a href="/" className="text-xs text-muted-foreground hover:text-foreground">
              ← Volver al sitio principal
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
