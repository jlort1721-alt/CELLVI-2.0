import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useVehicles, useCreateVehicle, useDevices, useCreateDevice, useDrivers, useCreateDriver, useTenant } from "@/hooks/useFleetData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, Car, Cpu, Users, Building2, ShieldCheck, UserCog, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { getPaginationRange, buildPaginationResult, DEFAULT_PAGE_SIZES, type PaginationResult } from "@/lib/pagination";

type Tab = "users" | "vehicles" | "devices" | "drivers" | "tenant";
type AppRole = "super_admin" | "admin" | "manager" | "operator" | "driver" | "client" | "auditor";

interface TenantLimits {
  events_per_day?: number;
  retention_days?: number;
  max_vehicles?: number;
  max_users?: number;
}

interface TenantFeatures {
  [key: string]: boolean;
}

interface AdminUser {
  id: string;
  user_id: string;
  display_name?: string;
  email?: string;
  company?: string;
  created_at: string;
  user_roles?: { role: string }[];
}

interface AdminVehicle {
  id: string;
  plate: string;
  type: string;
  brand?: string;
  model?: string;
  active: boolean;
}

interface AdminDevice {
  id: string;
  imei: string;
  protocol: string;
  connectivity: string;
  active: boolean;
  vehicles?: { plate: string };
}

interface AdminDriver {
  id: string;
  name: string;
  license_number?: string;
  phone?: string;
  score: number;
  status: string;
  vehicles?: { plate: string };
}

const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  manager: "Gerente",
  operator: "Operador",
  driver: "Conductor",
  client: "Cliente",
  auditor: "Auditor",
};

const ROLE_COLORS: Record<AppRole, string> = {
  super_admin: "bg-red-500/10 text-red-400",
  admin: "bg-orange-500/10 text-orange-400",
  manager: "bg-blue-500/10 text-blue-400",
  operator: "bg-green-500/10 text-green-400",
  driver: "bg-yellow-500/10 text-yellow-400",
  client: "bg-purple-500/10 text-purple-400",
  auditor: "bg-cyan-500/10 text-cyan-400",
};

// Hook: all users with roles (admin only) - NOW WITH PAGINATION
const useAllUsers = (page: number = 1, pageSize: number = DEFAULT_PAGE_SIZES.profiles) => {
  return useQuery({
    queryKey: ["admin-users", page, pageSize],
    queryFn: async (): Promise<PaginationResult<AdminUser>> => {
      const { from, to } = getPaginationRange(page, pageSize);

      // Get total count
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Get paginated data
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*, user_roles(role)")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      return buildPaginationResult(
        profiles as AdminUser[],
        count || 0,
        page,
        pageSize
      );
    },
  });
};

const useUpdateUserRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      // Update existing role
      const { data: existing } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .limit(1)
        .single();

      if (existing) {
        const { error } = await supabase
          .from("user_roles")
          .update({ role })
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Rol actualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

const DashboardAdmin = () => {
  const { isAdmin, profile } = useAuth();
  const [tab, setTab] = useState<Tab>("users");
  const [showForm, setShowForm] = useState(false);
  const [usersPage, setUsersPage] = useState(1);

  const { data: tenant } = useTenant();
  const { data: vehicles = [], isLoading: loadingV } = useVehicles();
  const { data: devices = [], isLoading: loadingD } = useDevices();
  const { data: drivers = [], isLoading: loadingDr } = useDrivers();
  const { data: usersResult, isLoading: loadingU } = useAllUsers(usersPage);

  const createVehicle = useCreateVehicle();
  const createDevice = useCreateDevice();
  const createDriver = useCreateDriver();
  const updateRole = useUpdateUserRole();

  const [vForm, setVForm] = useState({ plate: "", type: "truck", brand: "", model: "" });
  const [dForm, setDForm] = useState({ imei: "", protocol: "teltonika", connectivity: "4g", vehicle_id: "" });
  const [drForm, setDrForm] = useState({ name: "", license_number: "", phone: "", email: "", assigned_vehicle_id: "" });

  const tenantId = profile?.tenant_id || tenant?.id;

  const handleCreateVehicle = async () => {
    if (!vForm.plate || !tenantId) return;
    try {
      await createVehicle.mutateAsync({ ...vForm, tenant_id: tenantId });
      toast.success("Vehículo creado");
      setVForm({ plate: "", type: "truck", brand: "", model: "" });
      setShowForm(false);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Error"); }
  };

  const handleCreateDevice = async () => {
    if (!dForm.imei || !tenantId) return;
    try {
      await createDevice.mutateAsync({ ...dForm, tenant_id: tenantId, vehicle_id: dForm.vehicle_id || undefined });
      toast.success("Dispositivo creado");
      setDForm({ imei: "", protocol: "teltonika", connectivity: "4g", vehicle_id: "" });
      setShowForm(false);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Error"); }
  };

  const handleCreateDriver = async () => {
    if (!drForm.name || !tenantId) return;
    try {
      await createDriver.mutateAsync({ ...drForm, tenant_id: tenantId, assigned_vehicle_id: drForm.assigned_vehicle_id || undefined });
      toast.success("Conductor creado");
      setDrForm({ name: "", license_number: "", phone: "", email: "", assigned_vehicle_id: "" });
      setShowForm(false);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Error"); }
  };

  const tabs = [
    { id: "users" as Tab, label: "Usuarios & Roles", icon: UserCog, count: usersResult?.totalCount || 0 },
    { id: "vehicles" as Tab, label: "Vehículos", icon: Car, count: vehicles.length },
    { id: "devices" as Tab, label: "Dispositivos", icon: Cpu, count: devices.length },
    { id: "drivers" as Tab, label: "Conductores", icon: Users, count: drivers.length },
    { id: "tenant" as Tab, label: "Organización", icon: Building2 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-sidebar-foreground text-lg">Administración</h2>
        {isAdmin && tab !== "tenant" && tab !== "users" && (
          <Button size="sm" onClick={() => setShowForm(true)} className="bg-gold-gradient text-navy font-heading font-bold text-xs">
            <Plus className="w-3.5 h-3.5 mr-1" /> Crear
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-sidebar-border pb-1 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setShowForm(false); }}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-t transition-colors whitespace-nowrap ${tab === t.id ? "bg-sidebar-accent text-gold border-b-2 border-gold" : "text-sidebar-foreground/50 hover:text-sidebar-foreground/70"
              }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
            {t.count !== undefined && <span className="text-[10px] px-1.5 py-0.5 rounded bg-sidebar-foreground/10">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* ─── Users & Roles Tab ─── */}
      {tab === "users" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-sidebar-accent/50 border border-sidebar-border">
            <ShieldCheck className="w-4 h-4 text-gold" />
            <span className="text-xs text-sidebar-foreground/70">
              Gestiona los roles y permisos de todos los usuarios de tu organización. Los cambios se aplican inmediatamente.
            </span>
          </div>
          <div className="rounded-xl border overflow-hidden bg-sidebar border-sidebar-border">
            <Table>
              <TableHeader>
                <TableRow className="border-sidebar-border">
                  <TableHead className="text-gold text-xs">Usuario</TableHead>
                  <TableHead className="text-gold text-xs">Email</TableHead>
                  <TableHead className="text-gold text-xs">Empresa</TableHead>
                  <TableHead className="text-gold text-xs">Rol Actual</TableHead>
                  <TableHead className="text-gold text-xs">Cambiar Rol</TableHead>
                  <TableHead className="text-gold text-xs">Registrado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingU ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-sidebar-foreground/30 text-xs">Cargando...</TableCell></TableRow>
                ) : !usersResult || usersResult.data.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-sidebar-foreground/30 text-xs">Sin usuarios registrados</TableCell></TableRow>
                ) : usersResult.data.map((u) => {
                  const roles = u.user_roles as unknown as { role: string }[] | undefined;
                  const currentRole = (roles?.[0]?.role || "operator") as AppRole;
                  return (
                    <TableRow key={u.id} className="border-sidebar-border/30">
                      <TableCell className="text-sidebar-foreground text-xs font-bold">
                        {u.display_name || "Sin nombre"}
                      </TableCell>
                      <TableCell className="text-sidebar-foreground/60 text-xs">{u.email || "—"}</TableCell>
                      <TableCell className="text-sidebar-foreground/60 text-xs">{u.company || "—"}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ROLE_COLORS[currentRole]}`}>
                          {ROLE_LABELS[currentRole]}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={currentRole}
                          onValueChange={(value) => {
                            if (value !== currentRole) {
                              updateRole.mutate({ userId: u.user_id, role: value as AppRole });
                            }
                          }}
                        >
                          <SelectTrigger className="w-[130px] h-7 text-xs bg-sidebar-accent border-sidebar-border text-sidebar-foreground">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.keys(ROLE_LABELS) as AppRole[]).map((r) => (
                              <SelectItem key={r} value={r} className="text-xs">
                                {ROLE_LABELS[r]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-sidebar-foreground/40 text-[10px]">
                        {new Date(u.created_at).toLocaleDateString("es-CO")}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {/* Pagination Controls */}
          {usersResult && usersResult.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-sidebar-border">
              <div className="text-xs text-sidebar-foreground/60">
                Mostrando {((usersResult.page - 1) * usersResult.pageSize) + 1} - {Math.min(usersResult.page * usersResult.pageSize, usersResult.totalCount)} de {usersResult.totalCount} usuarios
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
                  disabled={!usersResult.hasPrev}
                  className="h-7 text-xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Anterior
                </Button>
                <span className="text-xs text-sidebar-foreground/60">
                  Página {usersResult.page} de {usersResult.totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setUsersPage((p) => Math.min(usersResult.totalPages, p + 1))}
                  disabled={!usersResult.hasNext}
                  className="h-7 text-xs"
                >
                  Siguiente
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tenant Info */}
      {tab === "tenant" && tenant && (
        <div className="rounded-xl border bg-sidebar border-sidebar-border p-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-[10px] text-sidebar-foreground/40 uppercase">Nombre</div>
              <div className="text-sm text-sidebar-foreground font-bold">{tenant.name}</div>
            </div>
            <div>
              <div className="text-[10px] text-sidebar-foreground/40 uppercase">Plan</div>
              <div className="text-sm text-sidebar-foreground font-bold capitalize">{tenant.plan}</div>
            </div>
            <div>
              <div className="text-[10px] text-sidebar-foreground/40 uppercase">Slug</div>
              <div className="text-sm text-sidebar-foreground font-bold">{tenant.slug}</div>
            </div>
            <div>
              <div className="text-[10px] text-sidebar-foreground/40 uppercase">Estado</div>
              <div className={`text-sm font-bold ${tenant.active ? "text-green-500" : "text-red-500"}`}>
                {tenant.active ? "Activo" : "Inactivo"}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] text-sidebar-foreground/40 uppercase mb-2">Límites</div>
              <div className="space-y-1 text-xs text-sidebar-foreground/60">
                <div>Eventos/día: {(tenant.limits as TenantLimits)?.events_per_day?.toLocaleString()}</div>
                <div>Retención: {(tenant.limits as TenantLimits)?.retention_days} días</div>
                <div>Max vehículos: {(tenant.limits as TenantLimits)?.max_vehicles}</div>
                <div>Max usuarios: {(tenant.limits as TenantLimits)?.max_users}</div>
              </div>
            </div>
            <div>
              <div className="text-[10px] text-sidebar-foreground/40 uppercase mb-2">Features</div>
              <div className="space-y-1 text-xs">
                {Object.entries((tenant.features as TenantFeatures) || {}).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${v ? "bg-green-500" : "bg-red-500"}`} />
                    <span className="text-sidebar-foreground/60">{k.replace(/_/g, " ")}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {tab === "tenant" && !tenant && (
        <div className="text-center py-12 text-sidebar-foreground/30 text-sm">
          No tienes una organización asignada. Contacta a un administrador.
        </div>
      )}

      {/* Vehicles */}
      {tab === "vehicles" && (
        <>
          {showForm && (
            <div className="rounded-xl p-4 border bg-sidebar border-sidebar-border space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sidebar-foreground text-xs font-bold">Nuevo Vehículo</span>
                <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-sidebar-foreground/40" /></button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Input placeholder="Placa *" value={vForm.plate} onChange={(e) => setVForm({ ...vForm, plate: e.target.value })} className="text-xs bg-sidebar-accent border-sidebar-border text-sidebar-foreground" />
                <select value={vForm.type} onChange={(e) => setVForm({ ...vForm, type: e.target.value })} className="rounded-lg px-3 py-2 text-xs border bg-sidebar-accent border-sidebar-border text-sidebar-foreground">
                  <option value="truck">Camión</option><option value="tanker">Carro Tanque</option><option value="van">Furgón</option><option value="bus">Bus</option><option value="dump_truck">Volqueta</option>
                </select>
                <Input placeholder="Marca" value={vForm.brand} onChange={(e) => setVForm({ ...vForm, brand: e.target.value })} className="text-xs bg-sidebar-accent border-sidebar-border text-sidebar-foreground" />
                <Input placeholder="Modelo" value={vForm.model} onChange={(e) => setVForm({ ...vForm, model: e.target.value })} className="text-xs bg-sidebar-accent border-sidebar-border text-sidebar-foreground" />
              </div>
              <Button size="sm" onClick={handleCreateVehicle} disabled={createVehicle.isPending} className="bg-sidebar-primary text-sidebar-primary-foreground font-heading font-bold text-xs">
                {createVehicle.isPending ? "Creando..." : "Crear Vehículo"}
              </Button>
            </div>
          )}
          <div className="rounded-xl border overflow-hidden bg-sidebar border-sidebar-border">
            <Table>
              <TableHeader>
                <TableRow className="border-sidebar-border">
                  <TableHead className="text-gold text-xs">Placa</TableHead>
                  <TableHead className="text-gold text-xs">Tipo</TableHead>
                  <TableHead className="text-gold text-xs">Marca</TableHead>
                  <TableHead className="text-gold text-xs">Modelo</TableHead>
                  <TableHead className="text-gold text-xs">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingV ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-sidebar-foreground/30 text-xs">Cargando...</TableCell></TableRow>
                ) : vehicles.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-sidebar-foreground/30 text-xs">Sin vehículos registrados</TableCell></TableRow>
                ) : vehicles.map((v: AdminVehicle) => (
                  <TableRow key={v.id} className="border-sidebar-border/30">
                    <TableCell className="text-sidebar-foreground text-xs font-bold">{v.plate}</TableCell>
                    <TableCell className="text-sidebar-foreground/60 text-xs capitalize">{v.type}</TableCell>
                    <TableCell className="text-sidebar-foreground/60 text-xs">{v.brand || "—"}</TableCell>
                    <TableCell className="text-sidebar-foreground/60 text-xs">{v.model || "—"}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${v.active ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                        {v.active ? "Activo" : "Inactivo"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Devices */}
      {tab === "devices" && (
        <>
          {showForm && (
            <div className="rounded-xl p-4 border bg-sidebar border-sidebar-border space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sidebar-foreground text-xs font-bold">Nuevo Dispositivo</span>
                <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-sidebar-foreground/40" /></button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Input placeholder="IMEI *" value={dForm.imei} onChange={(e) => setDForm({ ...dForm, imei: e.target.value })} className="text-xs bg-sidebar-accent border-sidebar-border text-sidebar-foreground" />
                <select value={dForm.protocol} onChange={(e) => setDForm({ ...dForm, protocol: e.target.value })} className="rounded-lg px-3 py-2 text-xs border bg-sidebar-accent border-sidebar-border text-sidebar-foreground">
                  <option value="teltonika">Teltonika</option><option value="queclink">Queclink</option><option value="calamp">CalAmp</option><option value="gt06">GT06</option>
                </select>
                <select value={dForm.connectivity} onChange={(e) => setDForm({ ...dForm, connectivity: e.target.value })} className="rounded-lg px-3 py-2 text-xs border bg-sidebar-accent border-sidebar-border text-sidebar-foreground">
                  <option value="4g">4G/LTE</option><option value="3g">3G</option><option value="satellite">Satelital</option>
                </select>
                <select value={dForm.vehicle_id} onChange={(e) => setDForm({ ...dForm, vehicle_id: e.target.value })} className="rounded-lg px-3 py-2 text-xs border bg-sidebar-accent border-sidebar-border text-sidebar-foreground">
                  <option value="">Sin vehículo</option>
                  {vehicles.map((v: AdminVehicle) => <option key={v.id} value={v.id}>{v.plate}</option>)}
                </select>
              </div>
              <Button size="sm" onClick={handleCreateDevice} disabled={createDevice.isPending} className="bg-sidebar-primary text-sidebar-primary-foreground font-heading font-bold text-xs">
                {createDevice.isPending ? "Creando..." : "Crear Dispositivo"}
              </Button>
            </div>
          )}
          <div className="rounded-xl border overflow-hidden bg-sidebar border-sidebar-border">
            <Table>
              <TableHeader>
                <TableRow className="border-sidebar-border">
                  <TableHead className="text-gold text-xs">IMEI</TableHead>
                  <TableHead className="text-gold text-xs">Protocolo</TableHead>
                  <TableHead className="text-gold text-xs">Conectividad</TableHead>
                  <TableHead className="text-gold text-xs">Vehículo</TableHead>
                  <TableHead className="text-gold text-xs">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingD ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-sidebar-foreground/30 text-xs">Cargando...</TableCell></TableRow>
                ) : devices.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-sidebar-foreground/30 text-xs">Sin dispositivos</TableCell></TableRow>
                ) : devices.map((d: AdminDevice) => (
                  <TableRow key={d.id} className="border-sidebar-border/30">
                    <TableCell className="text-sidebar-foreground text-xs font-mono font-bold">{d.imei}</TableCell>
                    <TableCell className="text-sidebar-foreground/60 text-xs capitalize">{d.protocol}</TableCell>
                    <TableCell className="text-sidebar-foreground/60 text-xs uppercase">{d.connectivity}</TableCell>
                    <TableCell className="text-sidebar-foreground/60 text-xs">{d.vehicles?.plate || "—"}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${d.active ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                        {d.active ? "Activo" : "Inactivo"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Drivers */}
      {tab === "drivers" && (
        <>
          {showForm && (
            <div className="rounded-xl p-4 border bg-sidebar border-sidebar-border space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sidebar-foreground text-xs font-bold">Nuevo Conductor</span>
                <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-sidebar-foreground/40" /></button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Input placeholder="Nombre *" value={drForm.name} onChange={(e) => setDrForm({ ...drForm, name: e.target.value })} className="text-xs bg-sidebar-accent border-sidebar-border text-sidebar-foreground" />
                <Input placeholder="N° Licencia" value={drForm.license_number} onChange={(e) => setDrForm({ ...drForm, license_number: e.target.value })} className="text-xs bg-sidebar-accent border-sidebar-border text-sidebar-foreground" />
                <Input placeholder="Teléfono" value={drForm.phone} onChange={(e) => setDrForm({ ...drForm, phone: e.target.value })} className="text-xs bg-sidebar-accent border-sidebar-border text-sidebar-foreground" />
                <Input placeholder="Email" value={drForm.email} onChange={(e) => setDrForm({ ...drForm, email: e.target.value })} className="text-xs bg-sidebar-accent border-sidebar-border text-sidebar-foreground" />
                <select value={drForm.assigned_vehicle_id} onChange={(e) => setDrForm({ ...drForm, assigned_vehicle_id: e.target.value })} className="rounded-lg px-3 py-2 text-xs border bg-sidebar-accent border-sidebar-border text-sidebar-foreground">
                  <option value="">Sin vehículo</option>
                  {vehicles.map((v: AdminVehicle) => <option key={v.id} value={v.id}>{v.plate}</option>)}
                </select>
              </div>
              <Button size="sm" onClick={handleCreateDriver} disabled={createDriver.isPending} className="bg-sidebar-primary text-sidebar-primary-foreground font-heading font-bold text-xs">
                {createDriver.isPending ? "Creando..." : "Crear Conductor"}
              </Button>
            </div>
          )}
          <div className="rounded-xl border overflow-hidden bg-sidebar border-sidebar-border">
            <Table>
              <TableHeader>
                <TableRow className="border-sidebar-border">
                  <TableHead className="text-gold text-xs">Nombre</TableHead>
                  <TableHead className="text-gold text-xs">Licencia</TableHead>
                  <TableHead className="text-gold text-xs">Teléfono</TableHead>
                  <TableHead className="text-gold text-xs">Vehículo</TableHead>
                  <TableHead className="text-gold text-xs">Score</TableHead>
                  <TableHead className="text-gold text-xs">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingDr ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-sidebar-foreground/30 text-xs">Cargando...</TableCell></TableRow>
                ) : drivers.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-sidebar-foreground/30 text-xs">Sin conductores</TableCell></TableRow>
                ) : drivers.map((d: AdminDriver) => (
                  <TableRow key={d.id} className="border-sidebar-border/30">
                    <TableCell className="text-sidebar-foreground text-xs font-bold">{d.name}</TableCell>
                    <TableCell className="text-sidebar-foreground/60 text-xs">{d.license_number || "—"}</TableCell>
                    <TableCell className="text-sidebar-foreground/60 text-xs">{d.phone || "—"}</TableCell>
                    <TableCell className="text-sidebar-foreground/60 text-xs">{d.vehicles?.plate || "—"}</TableCell>
                    <TableCell className="text-sidebar-foreground text-xs font-bold">{d.score}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${d.status === "active" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                        {d.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardAdmin;
