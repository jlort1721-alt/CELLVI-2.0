import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar, FileText, Users, Clock, CheckCircle2,
  AlertCircle, Briefcase, Mail, Phone, Star
} from 'lucide-react';

// Dashboard de Asistente de Gerencia
export default function AsistenteGerenciaView() {
  // Tareas Pendientes
  const pendingTasks = [
    { id: '1', task: 'Coordinar reunión con proveedores', priority: 'high', due: '2026-02-16', assigned: 'Deyanira López' },
    { id: '2', task: 'Preparar reporte semanal', priority: 'high', due: '2026-02-17', assigned: 'Mayor Rómulo' },
    { id: '3', task: 'Actualizar calendario de eventos', priority: 'medium', due: '2026-02-18', assigned: 'Gerencia' },
    { id: '4', task: 'Revisar documentos legales', priority: 'low', due: '2026-02-20', assigned: 'Deyanira López' }
  ];

  // Reuniones del Día
  const todayMeetings = [
    { time: '09:00 AM', title: 'Reunión de Gerencia', participants: 5, location: 'Sala Principal', duration: '1h' },
    { time: '11:30 AM', title: 'Call con Proveedor XYZ', participants: 3, location: 'Virtual', duration: '45min' },
    { time: '02:00 PM', title: 'Revisión de Presupuesto', participants: 4, location: 'Sala 2', duration: '2h' },
    { time: '04:30 PM', title: 'Follow-up Proyecto IA', participants: 6, location: 'Virtual', duration: '30min' }
  ];

  // Documentos Recientes
  const recentDocuments = [
    { name: 'Contrato Proveedor ABC', date: '2026-02-14', status: 'pending_signature', size: '2.3 MB' },
    { name: 'Reporte Financiero Q1', date: '2026-02-13', status: 'reviewed', size: '1.8 MB' },
    { name: 'Propuesta Expansión Regional', date: '2026-02-12', status: 'draft', size: '4.5 MB' },
    { name: 'Acta Reunión Directiva', date: '2026-02-10', status: 'approved', size: '0.9 MB' }
  ];

  // Contactos Importantes
  const importantContacts = [
    { name: 'Mayor Rómulo', role: 'Presidente', phone: '+57 300 123 4567', email: 'romulo@cellvi.com' },
    { name: 'Deyanira López', role: 'Gerente General', phone: '+57 300 234 5678', email: 'deyanira@cellvi.com' },
    { name: 'Proveedor Principal', role: 'ABC Logistics', phone: '+57 300 345 6789', email: 'ventas@abc.com' }
  ];

  // KPIs del Asistente
  const assistantKPIs = [
    { name: 'Tareas Completadas', value: 42, target: 50, unit: '', period: 'Esta semana' },
    { name: 'Reuniones Coordinadas', value: 18, target: 20, unit: '', period: 'Este mes' },
    { name: 'Documentos Procesados', value: 67, target: 70, unit: '', period: 'Este mes' },
    { name: 'Eficiencia', value: 94, target: 90, unit: '%', period: 'Promedio' }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getDocumentStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'reviewed': return 'default';
      case 'pending_signature': return 'warning';
      case 'draft': return 'secondary';
      default: return 'outline';
    }
  };

  const getDocumentStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Aprobado';
      case 'reviewed': return 'Revisado';
      case 'pending_signature': return 'Pendiente Firma';
      case 'draft': return 'Borrador';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="w-8 h-8 text-blue-500" />
            <h1 className="text-3xl font-bold">Dashboard de Asistencia de Gerencia</h1>
          </div>
          <p className="text-muted-foreground">
            Gestión ejecutiva y coordinación administrativa
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Clock className="w-3 h-3 mr-1" />
            {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Badge>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        {assistantKPIs.map((kpi) => {
          const percentage = (kpi.value / kpi.target) * 100;
          const isGood = percentage >= 85;

          return (
            <Card key={kpi.name} className={isGood ? 'border-green-500' : ''}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.name}</CardTitle>
                {isGood ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {kpi.value}{kpi.unit}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Target: {kpi.target}{kpi.unit} • {kpi.period}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tasks">Tareas</TabsTrigger>
          <TabsTrigger value="meetings">Reuniones</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="contacts">Contactos</TabsTrigger>
        </TabsList>

        {/* Tab: Tareas */}
        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tareas Pendientes</CardTitle>
              <CardDescription>
                {pendingTasks.length} tareas requieren atención
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-3 flex-1">
                      <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium">{task.task}</p>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {task.assigned}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(task.due).toLocaleDateString('es-CO')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge variant={getPriorityColor(task.priority)}>
                      {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Reuniones */}
        <TabsContent value="meetings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agenda del Día</CardTitle>
              <CardDescription>
                {todayMeetings.length} reuniones programadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todayMeetings.map((meeting, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-4 border rounded-lg">
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-semibold">{meeting.time.split(' ')[0]}</span>
                      <span className="text-xs text-muted-foreground">{meeting.time.split(' ')[1]}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{meeting.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {meeting.participants} participantes
                        </span>
                        <span className="flex items-center gap-1">
                          {meeting.location === 'Virtual' ? (
                            <Phone className="w-3 h-3" />
                          ) : (
                            <MapPin className="w-3 h-3" />
                          )}
                          {meeting.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {meeting.duration}
                        </span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      Unirse
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Documentos */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Documentos Recientes</CardTitle>
              <CardDescription>
                Archivos procesados recientemente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentDocuments.map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 border rounded-lg hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-3 flex-1">
                      <FileText className="w-5 h-5 text-blue-500" />
                      <div className="flex-1">
                        <p className="font-medium">{doc.name}</p>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span>{new Date(doc.date).toLocaleDateString('es-CO')}</span>
                          <span>{doc.size}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getDocumentStatusColor(doc.status)}>
                        {getDocumentStatusText(doc.status)}
                      </Badge>
                      <Button size="sm" variant="ghost">
                        Ver
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Contactos */}
        <TabsContent value="contacts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contactos Importantes</CardTitle>
              <CardDescription>
                Directorio ejecutivo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {importantContacts.map((contact, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Star className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{contact.name}</p>
                        <p className="text-sm text-muted-foreground">{contact.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="gap-1">
                        <Phone className="w-3 h-3" />
                        {contact.phone}
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1">
                        <Mail className="w-3 h-3" />
                        Email
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
