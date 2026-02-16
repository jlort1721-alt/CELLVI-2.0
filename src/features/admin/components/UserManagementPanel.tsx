import { memo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { getPaginationRange, buildPaginationResult, DEFAULT_PAGE_SIZES, type PaginationResult } from "@/lib/pagination";

type AppRole = "super_admin" | "admin" | "manager" | "operator" | "driver" | "client" | "auditor";

interface AdminUser {
  id: string;
  user_id: string;
  display_name?: string;
  email?: string;
  company?: string;
  created_at: string;
  user_roles?: { role: string }[];
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

const useAllUsers = (page: number = 1, pageSize: number = DEFAULT_PAGE_SIZES.profiles) => {
  return useQuery({
    queryKey: ["admin-users", page, pageSize],
    queryFn: async (): Promise<PaginationResult<AdminUser>> => {
      const { from, to } = getPaginationRange(page, pageSize);

      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

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

const UserRow = memo(({ user, currentRole, onRoleChange }: {
  user: AdminUser;
  currentRole: AppRole;
  onRoleChange: (role: AppRole) => void;
}) => (
  <TableRow className="border-sidebar-border/30">
    <TableCell className="text-sidebar-foreground text-xs font-bold">
      {user.display_name || "Sin nombre"}
    </TableCell>
    <TableCell className="text-sidebar-foreground/60 text-xs">{user.email || "—"}</TableCell>
    <TableCell className="text-sidebar-foreground/60 text-xs">{user.company || "—"}</TableCell>
    <TableCell>
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ROLE_COLORS[currentRole]}`}>
        {ROLE_LABELS[currentRole]}
      </span>
    </TableCell>
    <TableCell>
      <Select value={currentRole} onValueChange={(value) => onRoleChange(value as AppRole)}>
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
      {new Date(user.created_at).toLocaleDateString("es-CO")}
    </TableCell>
  </TableRow>
));
UserRow.displayName = "UserRow";

export const UserManagementPanel = memo(() => {
  const [usersPage, setUsersPage] = useState(1);
  const { data: usersResult, isLoading } = useAllUsers(usersPage);
  const updateRole = useUpdateUserRole();

  return (
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
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sidebar-foreground/30 text-xs">
                  Cargando usuarios...
                </TableCell>
              </TableRow>
            ) : !usersResult || usersResult.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sidebar-foreground/30 text-xs">
                  Sin usuarios registrados
                </TableCell>
              </TableRow>
            ) : (
              usersResult.data.map((u) => {
                const roles = u.user_roles as unknown as { role: string }[] | undefined;
                const currentRole = (roles?.[0]?.role || "operator") as AppRole;
                return (
                  <UserRow
                    key={u.id}
                    user={u}
                    currentRole={currentRole}
                    onRoleChange={(role) => {
                      if (role !== currentRole) {
                        updateRole.mutate({ userId: u.user_id, role });
                      }
                    }}
                  />
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
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
  );
});
UserManagementPanel.displayName = "UserManagementPanel";
