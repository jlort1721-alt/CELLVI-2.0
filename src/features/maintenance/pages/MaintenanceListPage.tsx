import { useState, memo, useMemo } from "react";
import { useWorkOrders, useCreateWorkOrder, useUpdateWorkOrder } from "../hooks/useMaintenance";
import { useVehicles } from "@/hooks/useFleetData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Wrench, Plus, CheckCircle } from "lucide-react";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import { useQueryAnnouncer } from "@/components/accessibility/ProgressAnnouncer";
import { ResponsiveTable, type Column } from "@/components/responsive/ResponsiveTable";

// Memoized KPI Card
const KPICard = memo(({ title, value, className }: { title: string; value: number; className?: string }) => (
    <Card>
        <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        </CardHeader>
        <CardContent>
            <div className={`text-2xl font-bold ${className || ''}`}>{value}</div>
        </CardContent>
    </Card>
));

KPICard.displayName = 'KPICard';

const MaintenanceListPage = memo(() => {
    const { data: orders, isLoading: loadingOrders } = useWorkOrders();
    const { data: vehicles } = useVehicles();
    const createOrder = useCreateWorkOrder();
    const updateOrder = useUpdateWorkOrder();

    // Track performance
    usePerformanceMonitor({
        enabled: true,
        trackWebVitals: true,
        trackQueryMetrics: true,
    });

    // Announce loading states
    useQueryAnnouncer(
        { isLoading: loadingOrders },
        {
            loading: 'Cargando órdenes de mantenimiento',
            success: 'Órdenes cargadas correctamente'
        }
    );

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

    // Calculate KPIs with memoization
    const kpis = useMemo(() => ({
        pending: orders?.filter((o: any) => o.status === 'pending').length || 0,
        inProgress: orders?.filter((o: any) => o.status === 'in_progress').length || 0,
        completed: orders?.filter((o: any) => o.status === 'completed').length || 0,
    }), [orders]);

    // Define responsive table columns
    const columns: Column<any>[] = useMemo(() => [
        {
            key: 'id',
            label: 'ID',
            render: (value) => <span className="font-mono text-xs text-muted-foreground">#{value.slice(0, 8)}</span>,
            hiddenOnMobile: true,
        },
        {
            key: 'vehicles',
            label: 'Vehículo',
            render: (value) => <span className="font-medium">{value?.plate}</span>,
        },
        {
            key: 'type',
            label: 'Tipo',
            render: (value) => <span className="capitalize text-xs">{value}</span>,
        },
        {
            key: 'description',
            label: 'Descripción',
            render: (value) => <span className="max-w-[200px] truncate block">{value}</span>,
            hiddenOnMobile: true,
        },
        {
            key: 'priority',
            label: 'Prioridad',
            render: (value) => <span className="capitalize text-xs">{value}</span>,
            hiddenOnMobile: true,
        },
        {
            key: 'status',
            label: 'Estado',
            render: (value) => (
                <Badge variant="outline" className={getStatusColor(value)}>
                    {value.replace('_', ' ')}
                </Badge>
            ),
        },
        {
            key: 'actions',
            label: 'Acciones',
            render: (_, row) => (
                row.status !== 'completed' && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateOrder.mutate({
                            id: row.id,
                            updates: { status: 'completed', completed_at: new Date().toISOString() }
                        })}
                        aria-label={`Marcar orden ${row.vehicles?.plate} como completada`}
                    >
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    </Button>
                )
            ),
            className: 'text-right',
        },
    ], [updateOrder]);

    return (
        <main id="main-content" role="main" tabIndex={-1} className="p-6 space-y-6 animate-in fade-in">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Wrench className="h-6 w-6 text-primary" aria-hidden="true" /> Gestión de Mantenimiento
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
            </header>

            <section aria-labelledby="kpi-section-title" className="grid md:grid-cols-3 gap-6">
                <h2 id="kpi-section-title" className="sr-only">Indicadores de mantenimiento</h2>
                {loadingOrders ? (
                    <>
                        <Card><CardHeader className="pb-2"><Skeleton className="h-4 w-32" /></CardHeader><CardContent><Skeleton className="h-8 w-16" /></CardContent></Card>
                        <Card><CardHeader className="pb-2"><Skeleton className="h-4 w-32" /></CardHeader><CardContent><Skeleton className="h-8 w-16" /></CardContent></Card>
                        <Card><CardHeader className="pb-2"><Skeleton className="h-4 w-32" /></CardHeader><CardContent><Skeleton className="h-8 w-16" /></CardContent></Card>
                    </>
                ) : (
                    <>
                        <KPICard title="Total Pendientes" value={kpis.pending} />
                        <KPICard title="En Progreso" value={kpis.inProgress} className="text-blue-600" />
                        <KPICard title="Completadas (Mes)" value={kpis.completed} className="text-green-600" />
                    </>
                )}
            </section>

            <section aria-labelledby="orders-section-title">
                <Card>
                    <CardHeader>
                        <CardTitle id="orders-section-title">Órdenes Recientes</CardTitle>
                        <CardDescription>Listado completo de intervenciones</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveTable
                            columns={columns}
                            data={orders || []}
                            keyExtractor={(row) => row.id}
                            isLoading={loadingOrders}
                            emptyMessage="No hay órdenes registradas"
                            breakpoint="md"
                        />
                    </CardContent>
                </Card>
            </section>
        </main>
    );
});

MaintenanceListPage.displayName = 'MaintenanceListPage';

export default MaintenanceListPage;
