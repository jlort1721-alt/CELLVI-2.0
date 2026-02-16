import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, UserPlus, Phone, Mail, TrendingUp, Star } from 'lucide-react';

export default function CRMView() {
  const clients = [
    { name: 'Empresa ABC', contact: 'Juan Pérez', status: 'active', revenue: 45000000, satisfaction: 4.5 },
    { name: 'Compañía XYZ', contact: 'María López', status: 'active', revenue: 32000000, satisfaction: 4.8 },
    { name: 'Negocio DEF', contact: 'Carlos Gómez', status: 'pending', revenue: 0, satisfaction: 0 }
  ];

  const leads = [
    { name: 'Prospecto 1', source: 'Web', probability: 75, value: 25000000, stage: 'negotiation' },
    { name: 'Prospecto 2', source: 'Referido', probability: 50, value: 18000000, stage: 'proposal' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Users className="w-8 h-8 text-purple-500" />
        <h1 className="text-3xl font-bold">Dashboard CRM</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Clientes Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Leads en Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Satisfacción Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.6/5.0</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Revenue Mensual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$77M</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="clients">
        <TabsList>
          <TabsTrigger value="clients">Clientes</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
        </TabsList>

        <TabsContent value="clients">
          <Card>
            <CardHeader>
              <CardTitle>Clientes Principales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {clients.map((client, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <Users className="w-5 h-5 text-purple-500" />
                      <div className="flex-1">
                        <p className="font-medium">{client.name}</p>
                        <p className="text-sm text-muted-foreground">Contacto: {client.contact}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {client.status === 'active' && (
                        <>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm">{client.satisfaction}</span>
                          </div>
                          <span className="text-sm font-semibold">
                            ${(client.revenue / 1000000).toFixed(0)}M
                          </span>
                        </>
                      )}
                      <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                        {client.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leads">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline de Ventas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leads.map((lead, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <UserPlus className="w-5 h-5 text-purple-500" />
                      <div className="flex-1">
                        <p className="font-medium">{lead.name}</p>
                        <p className="text-sm text-muted-foreground">Fuente: {lead.source}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm">{lead.probability}%</span>
                      <span className="text-sm font-semibold">
                        ${(lead.value / 1000000).toFixed(0)}M
                      </span>
                      <Badge>{lead.stage}</Badge>
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
