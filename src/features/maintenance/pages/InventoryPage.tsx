
import { useState } from "react";
import { useInventory, SparePart } from "../hooks/useInventory";
import { Plus, Search, Archive, AlertTriangle, FileText, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function InventoryPage() {
    const { parts, isLoading, createPart } = useInventory();
    const [searchTerm, setSearchTerm] = useState("");
    const [isAddOpen, setIsAddOpen] = useState(false);

    // Form state
    const [newPart, setNewPart] = useState<Partial<SparePart>>({
        name: "",
        part_number: "",
        category: "general",
        current_stock: 0,
        min_stock_level: 5,
        unit_cost: 0,
        location_in_warehouse: ""
    });

    const filteredParts = parts?.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.part_number && p.part_number.toLowerCase().includes(searchTerm.toLowerCase()))
    ) || [];

    const handleCreate = async () => {
        try {
            if (!newPart.name) return;
            await createPart.mutateAsync(newPart as any);
            toast.success("Repuesto creado exitosamente");
            setIsAddOpen(false);
            setNewPart({ name: "", current_stock: 0, min_stock_level: 5, unit_cost: 0 });
        } catch (e) {
            toast.error("Error al crear repuesto");
        }
    };

    const lowStockCount = parts?.filter(p => p.current_stock <= p.min_stock_level).length || 0;
    const totalValue = parts?.reduce((sum, p) => sum + (p.current_stock * (p.unit_cost || 0)), 0) || 0;

    return (
        <div className="p-6 space-y-6 animate-in fade-in bg-slate-50/50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-navy">Inventario de Repuestos</h1>
                    <p className="text-slate-500">Gestión de stock, costos y ubicación de autopartes.</p>
                </div>
                <div className="flex gap-2">
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-navy hover:bg-navy-light text-white shadow-lg shadow-navy/20">
                                <Plus className="mr-2 h-4 w-4" /> Nuevo Repuesto
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Agregar Nuevo Repuesto</DialogTitle>
                                <DialogDescription>
                                    Ingrese los detalles del ítem para añadirlo al inventario.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="name" className="text-right">Nombre</Label>
                                    <Input id="name" value={newPart.name} onChange={e => setNewPart({ ...newPart, name: e.target.value })} className="col-span-3" placeholder="Filtro de Aceite X5" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="sku" className="text-right">Cod. Ref</Label>
                                    <Input id="sku" value={newPart.part_number || ""} onChange={e => setNewPart({ ...newPart, part_number: e.target.value })} className="col-span-3" placeholder="FA-123456" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="stock" className="text-right">Stock Inicial</Label>
                                    <Input id="stock" type="number" value={newPart.current_stock} onChange={e => setNewPart({ ...newPart, current_stock: Number(e.target.value) })} className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="min" className="text-right">Min. Alerta</Label>
                                    <Input id="min" type="number" value={newPart.min_stock_level} onChange={e => setNewPart({ ...newPart, min_stock_level: Number(e.target.value) })} className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="cost" className="text-right">Costo Unit.</Label>
                                    <Input id="cost" type="number" value={newPart.unit_cost} onChange={e => setNewPart({ ...newPart, unit_cost: Number(e.target.value) })} className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="loc" className="text-right">Ubicación</Label>
                                    <Input id="loc" value={newPart.location_in_warehouse || ""} onChange={e => setNewPart({ ...newPart, location_in_warehouse: e.target.value })} className="col-span-3" placeholder="Estante A-2" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreate}>Guardar Item</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid md:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-gold shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Total Items (SKU)</CardTitle>
                        <Archive className="h-4 w-4 text-gold" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-navy">{parts?.length || 0}</div>
                        <p className="text-xs text-slate-500">Diferentes referencias registradas</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-red-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Stock Crítico</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{lowStockCount}</div>
                        <p className="text-xs text-slate-500">Items por debajo del mínimo</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Valor Inventario</CardTitle>
                        <Settings2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-navy">${totalValue.toLocaleString()}</div>
                        <p className="text-xs text-slate-500">Costo total almacenado</p>
                    </CardContent>
                </Card>
            </div>

            {/* List */}
            <Card className="shadow-lg border-none">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Listado Maestro de Partes</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nombre o ref..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="h-64 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></div>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Referencia</TableHead>
                                    <TableHead>Categoría</TableHead>
                                    <TableHead>Ubicación</TableHead>
                                    <TableHead className="text-right">Costo</TableHead>
                                    <TableHead className="text-right">Stock</TableHead>
                                    <TableHead className="text-center">Estado</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredParts.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell className="text-sm text-slate-500">{item.part_number || "-"}</TableCell>
                                        <TableCell><Badge variant="outline" className="text-xs">{item.category || "General"}</Badge></TableCell>
                                        <TableCell className="text-sm text-slate-500">{item.location_in_warehouse || "-"}</TableCell>
                                        <TableCell className="text-right">${item.unit_cost?.toLocaleString()}</TableCell>
                                        <TableCell className="text-right font-bold">{item.current_stock}</TableCell>
                                        <TableCell className="text-center">
                                            {item.current_stock <= item.min_stock_level ? (
                                                <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-200 border-none">Bajo Stock</Badge>
                                            ) : (
                                                <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200 border-none">OK</Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredParts.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                            No se encontraron repuestos.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
