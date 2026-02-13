
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, FileText, CheckCircle, XCircle, Clock, ServerCrash, RefreshCw } from "lucide-react";
import { submitManifestToRNDC } from "../rndc/utils/rndcService";

export default function RNDCPage() {
    const [submitting, setSubmitting] = useState(false);

    // Queries
    const { data: logs, refetch: refetchLogs } = useQuery({
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

    const { data: jobs, refetch: refetchJobs } = useQuery({
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
        refetchInterval: 3000 // Real-time polling
    });

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
            console.log("Job Encolado:", response);

            // Refresh queues immediately
            refetchJobs();

        } catch (e: any) {
            alert("Error: " + e.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-6 space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Ministerio de Transporte (RNDC)</h1>
                    <p className="text-muted-foreground text-sm">Historial de transmisiones XML y estado legal</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => { refetchJobs(); refetchLogs(); }}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Refrescar
                    </Button>
                    <Button onClick={handleTestSubmissionAsync} disabled={submitting}>
                        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                        Simular Envío (Asíncrono)
                    </Button>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
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
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-xs w-[80px]">Job ID</TableHead>
                                        <TableHead className="text-xs">Estado</TableHead>
                                        <TableHead className="text-xs text-center">Int.</TableHead>
                                        <TableHead className="text-xs">Detalle</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {jobs?.map((job: any) => (
                                        <TableRow key={job.id}>
                                            <TableCell className="font-mono text-[10px] text-muted-foreground">#{job.id.slice(0, 8)}</TableCell>
                                            <TableCell>
                                                {job.status === 'processing' && <Badge variant="secondary" className="text-[10px]"><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Procesando</Badge>}
                                                {(job.status === 'queued' || job.status === 'retrying') && <Badge variant="outline" className="text-[10px]"><Clock className="mr-1 h-3 w-3" /> {job.status}</Badge>}
                                                {job.status === 'completed' && <Badge className="bg-green-600 hover:bg-green-700 text-[10px]"><CheckCircle className="mr-1 h-3 w-3" /> Exitoso</Badge>}
                                                {(job.status === 'failed' || job.status === 'dead_letter') && <Badge variant="destructive" className="text-[10px]"><ServerCrash className="mr-1 h-3 w-3" /> Fallido</Badge>}
                                            </TableCell>
                                            <TableCell className="text-xs text-center">{job.attempts}/{job.max_attempts}</TableCell>
                                            <TableCell className="text-[10px] text-red-500 max-w-[120px] truncate" title={job.last_error}>
                                                {job.last_error || '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {!jobs?.length && <TableRow><TableCell colSpan={4} className="text-center text-xs py-10 text-muted-foreground">Cola vacía</TableCell></TableRow>}
                                </TableBody>
                            </Table>
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
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-xs">Fecha</TableHead>
                                        <TableHead className="text-xs">Radicado</TableHead>
                                        <TableHead className="text-xs">Estado</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {logs?.map((log: any) => (
                                        <TableRow key={log.id}>
                                            <TableCell className="text-[10px]">{new Date(log.created_at).toLocaleString()}</TableCell>
                                            <TableCell className="font-mono text-[10px]">{log.radicado || "-"}</TableCell>
                                            <TableCell>
                                                <Badge variant={log.status === 'success' ? 'outline' : 'destructive'} className="text-[10px]">
                                                    {log.status === 'success' ? 'OK' : 'Error'}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {!logs?.length && <TableRow><TableCell colSpan={3} className="text-center text-xs py-10 text-muted-foreground">Sin registros</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>

            <div className="bg-slate-50 p-4 rounded text-xs text-slate-500 font-mono border border-slate-200">
                <p>DEBUG: Sistema operativo en modo Asíncrono. Los envíos entran a la cola y son procesados por Edge Workers.</p>
            </div>
        </div>
    );
}
