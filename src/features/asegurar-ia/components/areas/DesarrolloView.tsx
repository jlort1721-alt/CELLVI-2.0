import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, GitBranch, Bug, CheckCircle2, Clock, Zap } from 'lucide-react';

export default function DesarrolloView() {
  const projects = [
    { name: 'CELLVI 2.0 - Suite IA', status: 'in_progress', progress: 75, sprints: 8, tasks: { completed: 42, total: 56 } },
    { name: 'Mobile App v3.0', status: 'in_progress', progress: 45, sprints: 4, tasks: { completed: 18, total: 40 } },
    { name: 'API Gateway Refactor', status: 'planning', progress: 10, sprints: 2, tasks: { completed: 2, total: 20 } }
  ];

  const bugs = [
    { id: 'BUG-001', severity: 'high', title: 'Error en sincronización de datos', assignee: 'Dev 1', status: 'in_progress' },
    { id: 'BUG-002', severity: 'medium', title: 'Lag en carga de mapas', assignee: 'Dev 2', status: 'pending' },
    { id: 'BUG-003', severity: 'low', title: 'Typo en dashboard', assignee: 'Dev 3', status: 'resolved' }
  ];

  const deployments = [
    { version: 'v2.5.3', environment: 'production', status: 'success', date: '2026-02-14' },
    { version: 'v2.5.4-beta', environment: 'staging', status: 'success', date: '2026-02-15' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Code className="w-8 h-8 text-cyan-500" />
        <h1 className="text-3xl font-bold">Dashboard de Desarrollo</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Proyectos Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.filter(p => p.status === 'in_progress').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Tareas Completadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.reduce((sum, p) => sum + p.tasks.completed, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Bugs Abiertos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {bugs.filter(b => b.status !== 'resolved').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Deploys Este Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="projects">
        <TabsList>
          <TabsTrigger value="projects">Proyectos</TabsTrigger>
          <TabsTrigger value="bugs">Bugs</TabsTrigger>
          <TabsTrigger value="deploys">Deployments</TabsTrigger>
        </TabsList>

        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle>Proyectos en Desarrollo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projects.map((project, idx) => (
                  <div key={idx} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <GitBranch className="w-5 h-5 text-cyan-500" />
                        <div>
                          <p className="font-medium">{project.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Sprint {project.sprints} • {project.tasks.completed}/{project.tasks.total} tareas
                          </p>
                        </div>
                      </div>
                      <Badge variant={project.status === 'in_progress' ? 'default' : 'secondary'}>
                        {project.status}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progreso</span>
                        <span className="font-medium">{project.progress}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-cyan-500 h-2 rounded-full transition-all"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bugs">
          <Card>
            <CardHeader>
              <CardTitle>Registro de Bugs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bugs.map((bug) => (
                  <div key={bug.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <Bug className="w-5 h-5 text-red-500" />
                      <div className="flex-1">
                        <p className="font-medium">{bug.id}: {bug.title}</p>
                        <p className="text-sm text-muted-foreground">Asignado a: {bug.assignee}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={bug.severity === 'high' ? 'destructive' : bug.severity === 'medium' ? 'default' : 'secondary'}>
                        {bug.severity}
                      </Badge>
                      {bug.status === 'resolved' && (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deploys">
          <Card>
            <CardHeader>
              <CardTitle>Deployments Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {deployments.map((deploy, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <Zap className="w-5 h-5 text-cyan-500" />
                      <div className="flex-1">
                        <p className="font-medium">{deploy.version}</p>
                        <p className="text-sm text-muted-foreground">
                          {deploy.environment} • {new Date(deploy.date).toLocaleDateString('es-CO')}
                        </p>
                      </div>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
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
