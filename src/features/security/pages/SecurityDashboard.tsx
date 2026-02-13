
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MapPin, ShieldAlert, Cpu, PowerOff, Radio, Lock, Signal, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

export default function SecurityDashboard() {
    const { data: jammingAlerts } = useQuery({
        queryKey: ["security-jamming"],
        queryFn: async () => supabase.from("alerts").select("*, vehicles(plate)").eq("type", "JAMMING").eq("status", "open"),
        refetchInterval: 5000
    });

    const { data: batteryAlerts } = useQuery({
        queryKey: ["security-battery"],
        queryFn: async () => supabase.from("alerts").select("*, vehicles(plate)").eq("type", "BATTERY_CUT").eq("status", "open"),
        refetchInterval: 10000
    });

    return (
        <div className="p-6 space-y-6 animate-in fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-red-600 flex items-center gap-2">
                        <ShieldAlert className="h-6 w-6" /> Torre de Control de Seguridad
                    </h1>
                    <p className="text-muted-foreground text-sm">Monitoreo activo de amenazas GNSS y sabotaje</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="default" className="bg-slate-900 text-white hover:bg-slate-800">
                        <Globe className="mr-2 h-4 w-4" /> Global View
                    </Button>
                    <Button variant="destructive" className="animate-pulse shadow-lg shadow-red-500/20">
                        <Lock className="mr-2 h-4 w-4" /> Activar Bloqueo Global
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* JAMMING */}
                <Card className="bg-red-50 border-red-200">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-red-800 flex items-center gap-2"><Radio className="h-4 w-4" /> Jamming Detectado</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-red-600">{jammingAlerts?.data?.length || 0}</div>
                        <p className="text-xs text-red-600/80 mt-1">Bloqueo de señal activo</p>
                    </CardContent>
                </Card>

                {/* BATTERY CUT */}
                <Card className="bg-orange-50 border-orange-200">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-orange-800 flex items-center gap-2"><PowerOff className="h-4 w-4" /> Corte de Batería</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-orange-600">{batteryAlerts?.data?.length || 0}</div>
                        <p className="text-xs text-orange-600/80 mt-1">Sabotaje potencial</p>
                    </CardContent>
                </Card>

                {/* GEOFENCE */}
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><MapPin className="h-4 w-4" /> Geocercas Violadas</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground mt-1">Salidas no autorizadas</p>
                    </CardContent>
                </Card>

                {/* SIGNAL */}
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Signal className="h-4 w-4" /> Estado de Enlace</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-600">98%</div>
                        <p className="text-xs text-muted-foreground mt-1">Dispositivos reportando</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <Card className="md:col-span-2 shadow-sm">
                    <CardHeader>
                        <CardTitle>Mapa de Calor de Incidentes</CardTitle>
                        <CardDescription>Zonas de alta frecuencia de eventos de seguridad (Últimas 24h)</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[400px] bg-slate-50/50 rounded-md flex flex-col items-center justify-center relative overflow-hidden border border-dashed">
                        {/* Mock Map Background visual hint */}
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-400 to-slate-100" />

                        <div className="z-10 text-center max-w-sm px-4">
                            <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 shadow-sm border">
                                <MapPin className="h-8 w-8 text-slate-400" />
                            </div>
                            <h3 className="font-semibold text-slate-900">Visualización Geográfica</h3>
                            <p className="text-sm text-slate-500 mt-2">
                                El módulo de mapas interactivos requiere una API Key de Google Maps o Mapbox activa.
                                En producción, aquí se mostraría el cluster de puntos calientes de robos e inhibidores.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-l-4 border-l-red-500">
                    <CardHeader>
                        <CardTitle className="text-red-600">Feed de Alertas Críticas</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[400px] px-6">
                            <div className="space-y-4 py-4">
                                {jammingAlerts?.data?.map((alert: any) => (
                                    <Alert key={alert.id} variant="destructive" className="bg-white border-red-200 shadow-sm">
                                        <Radio className="h-4 w-4" />
                                        <AlertTitle>JAMMING - {alert.vehicles?.plate}</AlertTitle>
                                        <AlertDescription className="text-xs">
                                            {new Date(alert.created_at).toLocaleTimeString()} - Inhibición de señal detectada.
                                        </AlertDescription>
                                    </Alert>
                                ))}
                                {batteryAlerts?.data?.map((alert: any) => (
                                    <Alert key={alert.id} className="border-orange-200 bg-white shadow-sm">
                                        <PowerOff className="h-4 w-4 text-orange-600" />
                                        <AlertTitle className="text-orange-900">Batería Desconectada - {alert.vehicles?.plate}</AlertTitle>
                                        <AlertDescription className="text-xs text-orange-800/80">
                                            {new Date(alert.created_at).toLocaleTimeString()} - Posible robo en progreso.
                                        </AlertDescription>
                                    </Alert>
                                ))}
                                {(!jammingAlerts?.data?.length && !batteryAlerts?.data?.length) && (
                                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                                        <ShieldAlert className="h-10 w-10 mb-2 opacity-20" />
                                        <p className="text-sm font-medium">Sin amenazas activas</p>
                                        <p className="text-xs">El sistema está seguro</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
