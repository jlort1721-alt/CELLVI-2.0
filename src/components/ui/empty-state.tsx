import { LucideIcon, Car, Bell, FileText, Search, PackageX, AlertCircle } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4 text-center",
        className
      )}
    >
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-gold/20 rounded-full blur-2xl" />
        <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center border border-border">
          <Icon className="w-10 h-10 text-muted-foreground" />
        </div>
      </div>
      <h3 className="font-heading font-bold text-xl text-foreground mb-2">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
        {description}
      </p>
      {action && (
        <Button
          onClick={action.onClick}
          className="bg-gold hover:bg-gold/90 text-white font-semibold"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Preset empty states
export function EmptyVehicles({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon={Car}
      title="No hay vehículos registrados"
      description="Agrega tu primer vehículo para comenzar a rastrear tu flota en tiempo real y recibir alertas importantes."
      action={
        onAdd
          ? {
              label: "Agregar Vehículo",
              onClick: onAdd,
            }
          : undefined
      }
    />
  );
}

export function EmptyAlerts() {
  return (
    <EmptyState
      icon={Bell}
      title="Sin alertas activas"
      description="¡Excelente! Todo está funcionando correctamente. Las alertas aparecerán aquí cuando se detecten eventos que requieran atención."
    />
  );
}

export function EmptyReports({ onGenerate }: { onGenerate?: () => void }) {
  return (
    <EmptyState
      icon={FileText}
      title="No hay reportes generados"
      description="Crea tu primer reporte para analizar el desempeño de tu flota, identificar tendencias y tomar decisiones informadas."
      action={
        onGenerate
          ? {
              label: "Generar Reporte",
              onClick: onGenerate,
            }
          : undefined
      }
    />
  );
}

export function EmptySearch({ query }: { query?: string }) {
  return (
    <EmptyState
      icon={Search}
      title="Sin resultados"
      description={
        query
          ? `No encontramos resultados para "${query}". Intenta con otros términos de búsqueda.`
          : "No encontramos lo que buscas. Intenta con otros términos."
      }
    />
  );
}

export function EmptyData({ message }: { message?: string }) {
  return (
    <EmptyState
      icon={PackageX}
      title="Sin datos disponibles"
      description={
        message ||
        "No hay información para mostrar en este momento. Los datos aparecerán aquí cuando estén disponibles."
      }
    />
  );
}

export function EmptyError({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      icon={AlertCircle}
      title="Error al cargar datos"
      description="No pudimos cargar la información. Por favor, verifica tu conexión e intenta nuevamente."
      action={
        onRetry
          ? {
              label: "Reintentar",
              onClick: onRetry,
            }
          : undefined
      }
    />
  );
}
