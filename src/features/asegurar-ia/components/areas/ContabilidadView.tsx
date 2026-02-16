import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, TrendingUp, FileText, CreditCard, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function ContabilidadView() {
  const financialData = [
    { name: 'Ingresos', value: 2850000000, color: '#10B981' },
    { name: 'Costos Operativos', value: 1950000000, color: '#EF4444' },
    { name: 'Gastos Administrativos', value: 420000000, color: '#F59E0B' },
    { name: 'Utilidad Neta', value: 480000000, color: '#3B82F6' }
  ];

  const pendingInvoices = [
    { id: 'INV-001', client: 'Cliente ABC', amount: 15000000, due: '2026-02-20', status: 'pending' },
    { id: 'INV-002', client: 'Cliente XYZ', amount: 8500000, due: '2026-02-18', status: 'overdue' },
    { id: 'INV-003', client: 'Cliente DEF', amount: 12000000, due: '2026-02-25', status: 'pending' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <DollarSign className="w-8 h-8 text-green-500" />
        <h1 className="text-3xl font-bold">Dashboard de Contabilidad</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Ingresos del Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$2.850M</div>
            <p className="text-xs text-green-600 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +18.5% vs mes anterior
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Cuentas por Cobrar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$35.5M</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Cuentas por Pagar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$22.8M</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Utilidad Neta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$480M</div>
            <p className="text-xs text-muted-foreground">Margen: 16.8%</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Resumen Financiero</TabsTrigger>
          <TabsTrigger value="invoices">Facturas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribución Financiera</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={financialData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {financialData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumen Mensual</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {financialData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm">{item.name}</span>
                    </div>
                    <span className="font-semibold">
                      ${(item.value / 1000000).toFixed(0)}M
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Facturas Pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingInvoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <FileText className="w-5 h-5 text-green-500" />
                      <div className="flex-1">
                        <p className="font-medium">{invoice.id} - {invoice.client}</p>
                        <p className="text-sm text-muted-foreground">
                          Vence: {new Date(invoice.due).toLocaleDateString('es-CO')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">
                        ${(invoice.amount / 1000000).toFixed(1)}M
                      </span>
                      <Badge variant={invoice.status === 'overdue' ? 'destructive' : 'default'}>
                        {invoice.status === 'overdue' ? 'Vencida' : 'Pendiente'}
                      </Badge>
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
