
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useVehicles } from "@/hooks/useFleetData";
import { preoperationalSchema, type Inspection } from "../schema/inspection";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const STANDARD_ITEMS = [
    { id: "engine_oil", label: "Nivel de Aceite Motor", critical: true },
    { id: "coolant", label: "Nivel de Refrigerante", critical: true },
    { id: "brakes", label: "Frenos y Líquido", critical: true },
    { id: "tires", label: "Estado de Llantas", critical: true },
    { id: "lights", label: "Luces (Todas)", critical: true },
    { id: "seatbelt", label: "Cinturones de Seguridad", critical: true },
    { id: "mirrors", label: "Espejos Retrovisores", critical: false },
    { id: "horn", label: "Pito / Bocina", critical: false },
    { id: "wipers", label: "Limpiabrisas", critical: false },
    { id: "kit", label: "Equipo de Carretera", critical: false },
    { id: "documents", label: "Documentos al día", critical: true },
];

export default function ChecklistPage() {
    const { data: vehicles, isLoading: loadingVehicles } = useVehicles();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [driverId, setDriverId] = useState<string | null>(null);

    // Fetch current driver profile
    useEffect(() => {
        async function getDriver() {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                // Try to find driver profile linked to user
                const { data: driver } = await supabase
                    .from("drivers")
                    .select("id")
                    .eq("user_id", session.user.id)
                    .single();
                if (driver) setDriverId(driver.id);
            }
        }
        getDriver();
    }, []);

    const defaultItems = STANDARD_ITEMS.map((item) => ({
        id: item.id,
        item: item.label,
        checked: false,
        critical: item.critical,
        observation: "",
    }));

    const form = useForm<Inspection>({
        resolver: zodResolver(preoperationalSchema),
        defaultValues: {
            items: defaultItems,
            odometer: 0,
            overallStatus: "pending",
            observations: "",
        },
    });

    async function onSubmit(data: Inspection) {
        setSubmitting(true);
        try {
            // 1. Calculate Status
            // Critical fail = 1 critical item unchecked
            const failedCritical = data.items.some((i) => i.critical && !i.checked);
            // General fail = > 2 non-critical unchecked (configurable policy)
            const failedNonCritical = data.items.filter((i) => !i.checked && !i.critical).length > 2;

            const status = failedCritical ? "rejected" : failedNonCritical ? "rejected" : "approved";

            // 2. Get Tenant
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("No session");

            // Fallback: if user metadata empty, try to get from one of the fetched vehicles (as they are filtered by RLS/tenant)
            let tenantId = session.user.user_metadata?.tenant_id || session.user.app_metadata?.tenant_id;
            if (!tenantId && vehicles && vehicles.length > 0) {
                tenantId = vehicles[0].tenant_id;
            }

            if (!tenantId) throw new Error("No se pudo identificar la organización (Tenant ID)");

            // 3. Save
            const { error } = await supabase.from("pesv_inspections").insert({
                tenant_id: tenantId,
                vehicle_id: data.vehicleId,
                driver_id: driverId, // May be null if not linked
                inspection_type: "pre_operational",
                checklist: data.items as any, // Cast for JSONB
                overall_score: status === "approved" ? 100 : 0,
                status: status,
                inspection_date: new Date().toISOString().split("T")[0],
                observations: data.observations,
                metadata: {
                    device_agent: navigator.userAgent,
                    network_type: (navigator as any).connection?.effectiveType,
                }
            });

            if (error) throw error;

            toast({
                title: status === "approved" ? "¡Listo para operar!" : "Vehículo NO APTO",
                description: status === "approved"
                    ? "Inspección guardada correctamente."
                    : "Se ha generado una alerta de mantenimiento.",
                variant: status === "approved" ? "default" : "destructive",
            });

            if (status === "approved") {
                navigate("/platform");
            }  // Navigate or Reset
            form.reset();
            // Redirect to dashboard or trip start
        } catch (err: any) {
            console.error(err);
            toast({
                title: "Error al guardar",
                description: err.message || "Verifique su conexión",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="container max-w-md mx-auto p-4 pb-20">
            <div className="mb-6 space-y-2">
                <h1 className="text-2xl font-bold tracking-tight">Preoperacional</h1>
                <p className="text-muted-foreground text-sm">
                    Complete la inspección diaria antes de iniciar ruta.
                </p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                    {/* VEHICLE SELECTOR */}
                    <FormField
                        control={form.control}
                        name="vehicleId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Vehículo</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccione placa" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {loadingVehicles ? (
                                            <div className="p-2 text-center text-sm">Cargando...</div>
                                        ) : (
                                            vehicles?.map((v) => (
                                                <SelectItem key={v.id} value={v.id}>
                                                    {v.plate} {v.brand ? `- ${v.brand}` : ""}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* ODOMETER */}
                    <FormField
                        control={form.control}
                        name="odometer"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Kilometraje Actual</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        {...field}
                                        onChange={e => field.onChange(Number(e.target.value))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* CHECKLIST ITEMS */}
                    <div className="space-y-4">
                        <h3 className="font-medium text-sm flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                            Puntos de Inspección
                        </h3>

                        {defaultItems.map((item, index) => (
                            <FormField
                                key={item.id}
                                control={form.control}
                                name={`items.${index}.checked`}
                                render={({ field }) => (
                                    <Card className={`border-l-4 ${item.critical ? 'border-l-red-500' : 'border-l-blue-500'}`}>
                                        <CardContent className="p-4 flex items-center justify-between">
                                            <div className="space-y-1">
                                                <FormLabel className="text-base font-normal cursor-pointer" htmlFor={`chk-${item.id}`}>
                                                    {item.item}
                                                </FormLabel>
                                                {item.critical && (
                                                    <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                                                        <AlertTriangle className="h-3 w-3" /> Crítico
                                                    </p>
                                                )}
                                            </div>
                                            <FormControl>
                                                <Checkbox
                                                    id={`chk-${item.id}`}
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                    className="h-6 w-6"
                                                />
                                            </FormControl>
                                        </CardContent>
                                    </Card>
                                )}
                            />
                        ))}
                    </div>

                    {/* OBSERVATIONS */}
                    <FormField
                        control={form.control}
                        name="observations"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Observaciones Generales</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Reporte daños visibles o ruidos extraños..."
                                        className="resize-none"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                        {submitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            "Finalizar Inspección"
                        )}
                    </Button>

                </form>
            </Form>
        </div>
    );
}
