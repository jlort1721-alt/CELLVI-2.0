
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client"; // To fetch vehicles/providers
import { useWorkOrders, useCreateWorkOrder, useUpdateWorkOrder } from "../hooks/useMaintenance";
import { useVehicles } from "@/hooks/useFleetData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Wrench, Calendar, Plus, Filter, CheckCircle } from "lucide-react";

export default function MaintenanceListPage() {
    const { data: orders, isLoading: loadingOrders } = useWorkOrders();
    const { data: vehicles } = useVehicles();
    const createOrder = useCreateWorkOrder();
    const updateOrder = useUpdateWorkOrder();

    const [isNewOpen, setIsNewOpen] = useState(false);
    const [formData, setFormData] = useState({
        vehicleId: "",
        type: "preventive",
        description: "",
        priority: "medium",
        scheduledAt: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.vehicleId) return;

        await createOrder.mutateAsync({
            vehicle_id: formData.vehicleId,
            type: formData.type,
            description: formData.description,
            priority: formData.priority,
            scheduled_at: formData.scheduledAt || undefined
        });

        setIsNewOpen(false);
        setFormData({ vehicleId: "", type: "preventive", description: "", priority: "medium", scheduledAt: "" });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-500/10 text-green-600 border-green-500/20';
            case 'in_progress': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
            case 'cancelled': return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
            default: return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
        }
    };

    return (
        <div className="p-6 space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Wrench className="h-6 w-6 text-primary" /> Gestión de Mantenimiento
                    </h1>
                    <p className="text-muted-foreground text-sm">Control de órdenes de trabajo y reparaciones</p>
                </div>

                <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Nueva Orden
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Crear Orden de Trabajo</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Vehículo</label>
                                <Select
                                    value={formData.vehicleId}
                                    onValueChange={(v) => setFormData({ ...formData, vehicleId: v })}
                                >
                                    <SelectTrigger><SelectValue placeholder="Seleccione placa" /></SelectTrigger>
                                    <SelectContent>
                                        {vehicles?.map(v => (
                                            <SelectItem key={v.id} value={v.id}>{v.plate} - {v.brand}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Tipo</label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={(v) => setFormData({ ...formData, type: v })}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="preventive">Preventivo</SelectItem>
                                            <SelectItem value="corrective">Correctivo</SelectItem>
                                            <SelectItem value="inspection">Inspección</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Prioridad</label>
                                    <Select
                                        value={formData.priority}
                                        onValueChange={(v) => setFormData({ ...formData, priority: v })}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Baja</SelectItem>
                                            <SelectItem value="medium">Media</SelectItem>
                                            <SelectItem value="high">Alta</SelectItem>
                                            <SelectItem value="critical">Crítica</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Descripción del Trabajo</label>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Detalle los trabajos a realizar..."
                                    rows={3}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Fecha Programada (Opcional)</label>
                                <Input
                                    type="date"
                                    value={formData.scheduledAt}
                                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={createOrder.isPending}>
                                {createOrder.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Crear Orden
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* KPI Summary (Simple) */}
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Pendientes</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{orders?.filter((o: any) => o.status === 'pending').length || 0}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">En Progreso</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-blue-600">{orders?.filter((o: any) => o.status === 'in_progress').length || 0}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Completadas (Mes)</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-green-600">{orders?.filter((o: any) => o.status === 'completed').length || 0}</div></CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Órdenes Recientes</CardTitle>
                    <CardDescription>Listado completo de intervenciones</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Vehículo</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Descripción</TableHead>
                                    <TableHead>Prioridad</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loadingOrders ? (
                                    <TableRow><TableCell colSpan={7} className="text-center py-8">Cargando...</TableCell></TableRow>
                                ) : orders?.length === 0 ? (
                                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No hay órdenes registradas</TableCell></TableRow>
                                ) : (
                                    orders?.map((order: any) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-mono text-xs text-muted-foreground">#{order.id.slice(0, 8)}</TableCell>
                                            <TableCell className="font-medium">{order.vehicles?.plate}</TableCell>
                                            <TableCell className="capitalize text-xs">{order.type}</TableCell>
                                            <TableCell className="max-w-[200px] truncate">{order.description}</TableCell>
                                            <TableCell className="capitalize text-xs">{order.priority}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={getStatusColor(order.status)}>
                                                    {order.status.replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {order.status !== 'completed' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => updateOrder.mutate({ id: order.id, updates: { status: 'completed', completed_at: new Date().toISOString() } })}
                                                    >
                                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                                    </Button>
                                                )}
                                                {/* More actions like Edit/Delete could go here */}
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
