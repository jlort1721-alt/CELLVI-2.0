
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { History, Search, FileJson } from "lucide-react";

export default function AuditLogPage() {
    const { data: logs, isLoading } = useQuery({
        queryKey: ["audit-logs"],
        queryFn: async () => supabase
            .from("audit_logs" as any) // Assuming table exists from migration
            .select("*")
            .order("created_at", { ascending: false })
            .limit(50)
    });

    return (
        <div className="p-6 space-y-6 animate-in fade-in">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <History className="h-6 w-6 text-primary" /> Auditoría Forense
                </h1>
                <p className="text-muted-foreground">Registro inmutable de cambios críticos en el sistema.</p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-sm font-medium">Búsqueda de Eventos</CardTitle>
                        <Badge variant="secondary" className="font-mono text-xs">Integridad: SHA-256</Badge>
                    </div>
                    <CardDescription>Mostrando los últimos 50 eventos de seguridad y datos.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[180px]">Timestamp</TableHead>
                                    <TableHead>Actor (User ID)</TableHead>
                                    <TableHead>Entidad</TableHead>
                                    <TableHead>Acción</TableHead>
                                    <TableHead>Detalle del Cambio</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={5} className="text-center py-8">Cargando...</TableCell></TableRow>
                                ) : logs?.data?.length === 0 ? (
                                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Sin registros de auditoría</TableCell></TableRow>
                                ) : (
                                    logs?.data?.map((log: any) => (
                                        <TableRow key={log.id} className="hover:bg-slate-50">
                                            <TableCell className="font-mono text-xs text-muted-foreground">
                                                {format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss")}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs truncate max-w-[100px]" title={log.actor_user_id}>
                                                {log.actor_user_id || 'System'}
                                            </TableCell>
                                            <TableCell className="text-xs font-medium">
                                                {log.table_name.toUpperCase()}
                                                <br />
                                                <span className="text-[10px] text-muted-foreground font-mono">{log.record_id.slice(0, 8)}</span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={log.action === 'DELETE' ? 'destructive' : log.action === 'UPDATE' ? 'outline' : 'default'} className="text-[10px]">
                                                    {log.action}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs">
                                                {log.action === 'UPDATE' ? (
                                                    <div className="grid gap-1">
                                                        <div className="bg-red-50 text-red-700 px-2 py-1 rounded border border-red-100 font-mono text-[10px] truncate max-w-[300px]">
                                                            - {JSON.stringify(log.old_value)}
                                                        </div>
                                                        <div className="bg-green-50 text-green-700 px-2 py-1 rounded border border-green-100 font-mono text-[10px] truncate max-w-[300px]">
                                                            + {JSON.stringify(log.new_value)}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1 text-slate-500">
                                                        <FileJson className="h-3 w-3" />
                                                        <span className="font-mono truncate max-w-[300px]">
                                                            {JSON.stringify(log.new_value || log.old_value)}
                                                        </span>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
