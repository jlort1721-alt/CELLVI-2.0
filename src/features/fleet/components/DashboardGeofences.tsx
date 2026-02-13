import { useState } from "react";
import { useTranslation } from "react-i18next";
import { geofenceService } from "@/lib/demoServices";
import type { Geofence } from "@/lib/demoData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, X } from "lucide-react";

const emptyForm: { name: string; type: "circle" | "polygon"; active: boolean; lat: number; lng: number; radiusM: number } = { name: "", type: "circle", active: true, lat: 1.2, lng: -77.28, radiusM: 500 };

const DashboardGeofences = () => {
  const { t } = useTranslation();
  const [geofences, setGeofences] = useState<Geofence[]>(geofenceService.getAll());
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const refresh = () => setGeofences(geofenceService.getAll());

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editId) {
      geofenceService.update(editId, form);
    } else {
      geofenceService.create(form);
    }
    refresh();
    setShowForm(false);
    setEditId(null);
    setForm(emptyForm);
  };

  const handleEdit = (g: Geofence) => {
    setForm({ name: g.name, type: g.type, active: g.active, lat: g.lat, lng: g.lng, radiusM: g.radiusM });
    setEditId(g.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    geofenceService.delete(id);
    refresh();
  };

  const handleToggle = (g: Geofence) => {
    geofenceService.update(g.id, { active: !g.active });
    refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-sidebar-foreground text-sm font-heading">{t("dashboard.geofences")} ({geofences.length})</h3>
        <Button size="sm" onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); }} className="bg-sidebar-primary text-sidebar-primary-foreground font-heading font-bold text-xs">
          <Plus className="w-3.5 h-3.5 mr-1" /> {t("dashboard.create")}
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl p-4 border space-y-3 bg-sidebar border-sidebar-border">
          <div className="flex justify-between items-center">
            <span className="text-sidebar-foreground text-xs font-bold">{editId ? t("dashboard.editGeofence") : t("dashboard.newGeofence")}</span>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-sidebar-foreground/40" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder={t("dashboard.name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="text-xs bg-sidebar-accent border-sidebar-border text-sidebar-foreground" />
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "circle" | "polygon" })} className="rounded-lg px-3 py-2 text-xs border bg-sidebar-accent border-sidebar-border text-sidebar-foreground">
              <option value="circle">{t("dashboard.circle")}</option>
              <option value="polygon">{t("dashboard.polygon")}</option>
            </select>
            <Input type="number" placeholder={t("dashboard.latitude")} value={form.lat} onChange={(e) => setForm({ ...form, lat: +e.target.value })} className="text-xs bg-sidebar-accent border-sidebar-border text-sidebar-foreground" />
            <Input type="number" placeholder={t("dashboard.longitude")} value={form.lng} onChange={(e) => setForm({ ...form, lng: +e.target.value })} className="text-xs bg-sidebar-accent border-sidebar-border text-sidebar-foreground" />
            <Input type="number" placeholder={`${t("dashboard.radius")} (m)`} value={form.radiusM} onChange={(e) => setForm({ ...form, radiusM: +e.target.value })} className="text-xs bg-sidebar-accent border-sidebar-border text-sidebar-foreground" />
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} id="geo-active" />
              <label htmlFor="geo-active" className="text-xs text-sidebar-foreground">{t("dashboard.active")}</label>
            </div>
          </div>
          <Button size="sm" onClick={handleSave} className="bg-sidebar-primary text-sidebar-primary-foreground font-heading font-bold text-xs">
            {editId ? t("dashboard.update") : t("dashboard.create")}
          </Button>
        </div>
      )}

      <div className="rounded-xl border overflow-hidden bg-sidebar border-sidebar-border">
        <Table>
          <TableHeader>
            <TableRow className="border-sidebar-border">
              <TableHead className="text-gold text-xs">{t("dashboard.name")}</TableHead>
              <TableHead className="text-gold text-xs">{t("dashboard.type")}</TableHead>
              <TableHead className="text-gold text-xs">{t("dashboard.radius")}</TableHead>
              <TableHead className="text-gold text-xs">{t("dashboard.status")}</TableHead>
              <TableHead className="text-gold text-xs">{t("dashboard.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {geofences.map((g) => (
              <TableRow key={g.id} className="border-sidebar-border/30">
                <TableCell className="text-sidebar-foreground text-xs font-medium">{g.name}</TableCell>
                <TableCell className="text-sidebar-foreground/60 text-xs capitalize">{g.type === "circle" ? t("dashboard.circle") : t("dashboard.polygon")}</TableCell>
                <TableCell className="text-sidebar-foreground/60 text-xs">{g.radiusM} m</TableCell>
                <TableCell>
                  <button onClick={() => handleToggle(g)} className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: g.active ? "#22c55e20" : "#6b728020", color: g.active ? "#22c55e" : "#6b7280" }}>
                    {g.active ? t("dashboard.active") : t("dashboard.inactive")}
                  </button>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(g)} className="p-1 rounded hover:bg-sidebar-foreground/5"><Pencil className="w-3.5 h-3.5 text-gold" /></button>
                    <button onClick={() => handleDelete(g.id)} className="p-1 rounded hover:bg-sidebar-foreground/5"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default DashboardGeofences;
