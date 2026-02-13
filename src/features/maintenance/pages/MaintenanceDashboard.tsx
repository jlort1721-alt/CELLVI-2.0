
import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardFuel from '../../operations/components/DashboardFuel';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wrench, Settings, FileText, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MaintenanceDashboard = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col h-full space-y-6 animate-in fade-in p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-navy">Mantenimiento y Taller</h1>
                    <p className="text-slate-500">Gestión de flota, órdenes de trabajo y control de inventario.</p>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-blue-500" onClick={() => navigate('/mantenimiento-lista')}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Órdenes de Trabajo</CardTitle>
                        <Wrench className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Gestión Activa</div>
                        <p className="text-xs text-muted-foreground">Crear y asignar reparaciones</p>
                        <Button variant="ghost" className="mt-4 w-full justify-start pl-0 text-blue-600 hover:text-blue-700">Ir a Órdenes &rarr;</Button>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-gold" onClick={() => navigate('/maestro-repuestos')}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Inventario de Repuestos</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Catálogo</div>
                        <p className="text-xs text-muted-foreground">Stock, costos y ubicación</p>
                        <Button variant="ghost" className="mt-4 w-full justify-start pl-0 text-yellow-600 hover:text-yellow-700">Gestionar Stock &rarr;</Button>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Planes Preventivos</CardTitle>
                        <Settings className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Programación</div>
                        <p className="text-xs text-muted-foreground">Alertas por kilometraje</p>
                        <Button variant="ghost" className="mt-4 w-full justify-start pl-0 text-green-600 hover:text-green-700">Ver Planes &rarr;</Button>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Consumo de Combustible</CardTitle>
                    <CardDescription>Análisis de eficiencia por vehículo (Litros/100km)</CardDescription>
                </CardHeader>
                <CardContent>
                    <DashboardFuel />
                </CardContent>
            </Card>
        </div>
    );
};

export default MaintenanceDashboard;
