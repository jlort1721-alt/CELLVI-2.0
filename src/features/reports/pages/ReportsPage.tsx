import { useState, memo } from "react";
import { useOperationalReport, useSecurityReport } from "../hooks/useReports";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { subDays } from "date-fns";
import { CalendarIcon, Download, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Line } from "recharts";
import { useQueryAnnouncer } from "@/components/accessibility/ProgressAnnouncer";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";

// Memoized KPI Card to prevent unnecessary re-renders
const KPICard = memo(({ title, value, delta, icon: Icon, trend }: {
    title: string;
    value: string | number;
    delta: string;
    icon: any;
    trend?: 'up' | 'down' | 'neutral';
}) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className={`h-4 w-4 ${
                trend === 'up' ? 'text-green-500' :
                trend === 'down' ? 'text-red-500' :
                'text-muted-foreground'
            }`} />
        </CardHeader>
        <CardContent>
            <div className={`text-2xl font-bold ${
                trend === 'down' && title.includes('Incidentes') ? 'text-red-600' : ''
            }`}>
                {value}
            </div>
            <p className="text-xs text-muted-foreground">{delta}</p>
        </CardContent>
    </Card>
));

KPICard.displayName = 'KPICard';

// Skeleton loader for reports
const ReportsSkeleton = () => (
    <div className="space-y-8">
        <div className="grid md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
                <Card key={i}>
                    <CardHeader className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-32 mb-2" />
                        <Skeleton className="h-3 w-24" />
                    </CardContent>
                </Card>
            ))}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[300px] w-full" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[300px] w-full" />
                </CardContent>
            </Card>
        </div>
    </div>
);

const ReportsPage = memo(() => {
    const [range, setRange] = useState({
        start: subDays(new Date(), 30).toISOString(),
        end: new Date().toISOString()
    });

    const { data: opsReport, isLoading: opsLoading } = useOperationalReport(range);
    const { data: securityReport, isLoading: securityLoading } = useSecurityReport(range);

    // Track performance metrics
    usePerformanceMonitor({
        enabled: true,
        trackWebVitals: true,
        trackQueryMetrics: true,
        onReport: (metrics) => {
            if (metrics.LCP && metrics.LCP > 2500) {
                console.warn('[ReportsPage] LCP is high:', metrics.LCP);
            }
        },
    });

    // Announce loading state to screen readers
    useQueryAnnouncer(
        { isLoading: opsLoading || securityLoading },
        {
            loading: 'Cargando reportes gerenciales',
            success: 'Reportes cargados correctamente'
        }
    );

    const isLoading = opsLoading || securityLoading;

    if (isLoading) {
        return (
            <div className="p-6 space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Reportes Gerenciales</h1>
                    <p className="text-slate-500">Cargando análisis estratégico...</p>
                </div>
                <ReportsSkeleton />
            </div>
        );
    }

    const incidentData = Object.entries(securityReport?.stats || {}).map(([key, value]) => ({ name: key, value }));

    // Mock data for maintenance trend (would come from DB aggregation)
    const costTrend = [
        { month: 'Ene', cost: 1200 }, { month: 'Feb', cost: 900 }, { month: 'Mar', cost: 1500 },
        { month: 'Abr', cost: 1100 }, { month: 'May', cost: 2300 }, { month: 'Jun', cost: 1800 }
    ];

    return (
        <main id="main-content" role="main" tabIndex={-1} className="p-6 space-y-8 animate-in fade-in">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Reportes Gerenciales</h1>
                    <p className="text-slate-500">Análisis estratégico de costos, eficiencia y seguridad.</p>
                </div>
                <div className="flex gap-2" role="toolbar" aria-label="Acciones de reportes">
                    <Button variant="outline" aria-label="Filtrar por últimos 30 días">
                        <CalendarIcon className="mr-2 h-4 w-4" aria-hidden="true" /> Últimos 30 días
                    </Button>
                    <Button variant="default" className="bg-slate-900 text-white" aria-label="Exportar reporte como PDF">
                        <Download className="mr-2 h-4 w-4" aria-hidden="true" /> Exportar PDF
                    </Button>
                </div>
            </header>

            {/* HIGH LEVEL KPIS */}
            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Costo Mantenimiento</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${opsReport?.maintenanceCost.toLocaleString() || 0}</div>
                        <p className="text-xs text-muted-foreground">+20.1% vs mes anterior</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Inspecciones Totales</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{opsReport?.inspectionsCount}</div>
                        <p className="text-xs text-muted-foreground">98% cumplimiento</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Incidentes Seguridad</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{securityReport?.totalIncidents || 0}</div>
                        <p className="text-xs text-muted-foreground">-4% vs mes anterior</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Eficiencia Flota</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{opsReport?.fuelEfficiency} L/100km</div>
                        <p className="text-xs text-muted-foreground">Promedio industria: 14.2</p>
                    </CardContent>
                </Card>
            </div>

            {/* CHARTS ROW 1 */}
            <section aria-labelledby="charts-section-title" className="grid md:grid-cols-2 gap-6">
                <h2 id="charts-section-title" className="sr-only">Gráficos de análisis</h2>

                <Card>
                    <CardHeader>
                        <CardTitle>Tendencia de Costos Operativos</CardTitle>
                        <CardDescription>Mantenimiento + Combustible (USD)</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={costTrend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="cost" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                                <Line type="monotone" dataKey="cost" stroke="#2563eb" strokeWidth={2} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Distribución de Incidentes</CardTitle>
                        <CardDescription>Tipología de alertas de seguridad</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {incidentData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={incidentData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                                    <Tooltip cursor={{ fill: 'transparent' }} />
                                    <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                                No hay datos de incidentes en este periodo
                            </div>
                        )}
                    </CardContent>
                </Card>
            </section>
        </main>
    );
});

ReportsPage.displayName = 'ReportsPage';

export default ReportsPage;
