import { useState, memo, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, FileText, CheckCircle, Clock, ServerCrash, RefreshCw } from "lucide-react";
import { submitManifestToRNDC } from "../rndc/utils/rndcService";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import { useQueryAnnouncer } from "@/components/accessibility/ProgressAnnouncer";
import { ResponsiveTable, type Column } from "@/components/responsive/ResponsiveTable";

const RNDCPage = memo(() => {
    const [submitting, setSubmitting] = useState(false);

    // Track performance
    usePerformanceMonitor({
        enabled: true,
        trackWebVitals: true,
        trackQueryMetrics: true,
    });

    // Queries
    const { data: logs, isLoading: logsLoading, refetch: refetchLogs } = useQuery({
        queryKey: ["rndc-logs"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("rndc_logs" as any)
                .select("*")
                .order("created_at", { ascending: false })
                .limit(20);
            if (error) return []; // Fail gracefully
            return data;
        },
    });

    const { data: jobs, isLoading: jobsLoading, refetch: refetchJobs } = useQuery({
        queryKey: ["rndc-jobs"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("integration_jobs" as any)
                .select("*")
                .eq("type", "RNDC_SEND_MANIFEST")
                .order("created_at", { ascending: false })
                .limit(10);
            if (error) return [];
            return data;
        },
        // ✅ NO MORE POLLING - Use Realtime subscriptions for live job status updates
        staleTime: 30000,
    });

    // Announce loading states
    useQueryAnnouncer(
        { isLoading: logsLoading || jobsLoading },
        {
            loading: 'Cargando datos de RNDC',
            success: 'Datos de RNDC cargados correctamente'
        }
    );

    // Define columns for jobs table
    const jobsColumns: Column<any>[] = useMemo(() => [
        {
            key: 'id',
            label: 'Job ID',
            mobileLabel: 'ID',
            render: (value) => <span className="font-mono text-[10px] text-muted-foreground">#{value.slice(0, 8)}</span>,
        },
        {
            key: 'status',
            label: 'Estado',
            render: (value) => {
                if (value === 'processing') return <Badge variant="secondary" className="text-[10px]"><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Procesando</Badge>;
                if (value === 'queued' || value === 'retrying') return <Badge variant="outline" className="text-[10px]"><Clock className="mr-1 h-3 w-3" /> {value}</Badge>;
                if (value === 'completed') return <Badge className="bg-green-600 hover:bg-green-700 text-[10px]"><CheckCircle className="mr-1 h-3 w-3" /> Exitoso</Badge>;
                if (value === 'failed' || value === 'dead_letter') return <Badge variant="destructive" className="text-[10px]"><ServerCrash className="mr-1 h-3 w-3" /> Fallido</Badge>;
                return <Badge variant="outline" className="text-[10px]">{value}</Badge>;
            },
        },
        {
            key: 'attempts',
            label: 'Int.',
            render: (value, row) => <span className="text-xs text-center">{value}/{row.max_attempts}</span>,
            hiddenOnMobile: true,
        },
        {
            key: 'last_error',
            label: 'Detalle',
            render: (value) => (
                <span className="text-[10px] text-red-500 max-w-[120px] truncate block" title={value}>
                    {value || '-'}
                </span>
            ),
            hiddenOnMobile: true,
        },
    ], []);

    // Define columns for logs table
    const logsColumns: Column<any>[] = useMemo(() => [
        {
            key: 'created_at',
            label: 'Fecha',
            render: (value) => <span className="text-[10px]">{new Date(value).toLocaleString()}</span>,
        },
        {
            key: 'radicado',
            label: 'Radicado',
            render: (value) => <span className="font-mono text-[10px]">{value || "-"}</span>,
        },
        {
            key: 'status',
            label: 'Estado',
            render: (value) => (
                <Badge variant={value === 'success' ? 'outline' : 'destructive'} className="text-[10px]">
                    {value === 'success' ? 'OK' : 'Error'}
                </Badge>
            ),
        },
    ], []);

    const handleTestSubmissionAsync = async () => {
        setSubmitting(true);
        try {
            // Mock payload since we are just testing the QUEUE mechanism
            const payload = {
                numeroManifiesto: `MAN-ASYNC-${Date.now().toString().slice(-6)}`,
                placaVehiculo: "ASYNC-01",
                timestamp: new Date().toISOString()
            };

            const response = await submitManifestToRNDC(payload);

            // Refresh queues immediately
            refetchJobs();

        } catch (e: any) {
            alert("Error: " + e.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main id="main-content" role="main" tabIndex={-1} className="p-6 space-y-6 animate-in fade-in">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Ministerio de Transporte (RNDC)</h1>
                    <p className="text-muted-foreground text-sm">Historial de transmisiones XML y estado legal</p>
                </div>
                <div className="flex gap-2" role="toolbar" aria-label="Acciones de RNDC">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => { refetchJobs(); refetchLogs(); }}
                        aria-label="Refrescar datos de RNDC"
                    >
                        <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" /> Refrescar
                    </Button>
                    <Button
                        type="button"
                        onClick={handleTestSubmissionAsync}
                        disabled={submitting}
                        aria-label="Simular envío asíncrono a RNDC"
                    >
                        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <FileText className="mr-2 h-4 w-4" aria-hidden="true" />}
                        Simular Envío (Asíncrono)
                    </Button>
                </div>
            </header>

            <section aria-labelledby="rndc-data-section" className="grid lg:grid-cols-2 gap-6">
                <h2 id="rndc-data-section" className="sr-only">Datos de transmisión RNDC</h2>

                {/* --- COLA DE MENSAJES (NUEVO) --- */}
                <Card className="border-l-4 border-l-blue-500 shadow-sm">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between">
                            <CardTitle className="text-sm font-medium">Estado de Transmisión (Background Jobs)</CardTitle>
                            <Badge variant="outline" className="animate-pulse text-xs bg-blue-50 text-blue-700">Live Polling</Badge>
                        </div>
                        <CardDescription>Monitor de workers y reintentos automáticos</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[300px]">
                            <ResponsiveTable
                                columns={jobsColumns}
                                data={jobs || []}
                                keyExtractor={(row) => row.id}
                                isLoading={jobsLoading}
                                emptyMessage="Cola vacía"
                                breakpoint="lg"
                            />
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* --- LOGS HISTÓRICOS (EXISTENTE pero compacto) --- */}
                <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Historial Auditado (RNDC Logs)</CardTitle>
                        <CardDescription>Evidencia legal de manifiestos aceptados</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[300px]">
                            <ResponsiveTable
                                columns={logsColumns}
                                data={logs || []}
                                keyExtractor={(row) => row.id}
                                isLoading={logsLoading}
                                emptyMessage="Sin registros"
                                breakpoint="lg"
                            />
                        </ScrollArea>
                    </CardContent>
                </Card>
            </section>

            <aside className="bg-slate-50 p-4 rounded text-xs text-slate-500 font-mono border border-slate-200" aria-label="Información del sistema">
                <p>DEBUG: Sistema operativo en modo Asíncrono. Los envíos entran a la cola y son procesados por Edge Workers.</p>
            </aside>
        </main>
    );
});

RNDCPage.displayName = 'RNDCPage';

export default RNDCPage;
