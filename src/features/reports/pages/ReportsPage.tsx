
import { useState } from "react";
import { useOperationalReport, useSecurityReport } from "../hooks/useReports";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { subDays } from "date-fns";
import { CalendarIcon, Download, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Line } from "recharts";

export default function ReportsPage() {
    const [range, setRange] = useState({
        start: subDays(new Date(), 30).toISOString(),
        end: new Date().toISOString()
    });

    const { data: opsReport } = useOperationalReport(range);
    const { data: securityReport } = useSecurityReport(range);

    const incidentData = Object.entries(securityReport?.stats || {}).map(([key, value]) => ({ name: key, value }));

    // Mock data for maintenance trend (would come from DB aggregation)
    const costTrend = [
        { month: 'Ene', cost: 1200 }, { month: 'Feb', cost: 900 }, { month: 'Mar', cost: 1500 },
        { month: 'Abr', cost: 1100 }, { month: 'May', cost: 2300 }, { month: 'Jun', cost: 1800 }
    ];

    return (
        <div className="p-6 space-y-8 animate-in fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Reportes Gerenciales</h1>
                    <p className="text-slate-500">Análisis estratégico de costos, eficiencia y seguridad.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline"><CalendarIcon className="mr-2 h-4 w-4" /> Últimos 30 días</Button>
                    <Button variant="default" className="bg-slate-900 text-white"><Download className="mr-2 h-4 w-4" /> Exportar PDF</Button>
                </div>
            </div>

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
            <div className="grid md:grid-cols-2 gap-6">
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
            </div>
        </div>
    );
}
