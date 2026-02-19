import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-navy">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-primary-foreground/60 text-sm">{t("common.loadingApp")}</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return <>{children}</>;
};

export default ProtectedRoute;
