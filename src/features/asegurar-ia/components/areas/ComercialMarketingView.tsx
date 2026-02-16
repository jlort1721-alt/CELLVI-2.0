import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Megaphone, TrendingUp, Target, Eye, MousePointer, Users } from 'lucide-react';

export default function ComercialMarketingView() {
  const campaigns = [
    { name: 'Campaña Digital Q1', status: 'active', reach: 125000, conversions: 2500, roi: 3.2 },
    { name: 'Email Marketing Febrero', status: 'active', reach: 45000, conversions: 890, roi: 2.8 },
    { name: 'Social Media', status: 'active', reach: 89000, conversions: 1200, roi: 2.1 }
  ];

  const metrics = [
    { name: 'Leads Generados', value: 4590, target: 5000, change: 12 },
    { name: 'Tasa de Conversión', value: 5.8, target: 6.0, change: 8 },
    { name: 'ROI Promedio', value: 2.7, target: 3.0, change: 15 },
    { name: 'Engagement Rate', value: 4.2, target: 4.5, change: 6 }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Megaphone className="w-8 h-8 text-pink-500" />
        <h1 className="text-3xl font-bold">Dashboard Comercial & Marketing</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.name}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{metric.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metric.value}
                {metric.name.includes('Tasa') || metric.name.includes('ROI') || metric.name.includes('Rate') ? '%' : ''}
              </div>
              <p className="text-xs text-green-600 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +{metric.change}% vs mes anterior
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="campaigns">
        <TabsList>
          <TabsTrigger value="campaigns">Campañas Activas</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>Campañas en Curso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {campaigns.map((campaign, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <Target className="w-5 h-5 text-pink-500" />
                      <div className="flex-1">
                        <p className="font-medium">{campaign.name}</p>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {campaign.reach.toLocaleString()} alcance
                          </span>
                          <span className="flex items-center gap-1">
                            <MousePointer className="w-3 h-3" />
                            {campaign.conversions} conversiones
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold">ROI: {campaign.roi}x</span>
                      <Badge variant="default">{campaign.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Métricas de Marketing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-pink-500" />
                    <span className="text-sm font-medium">Audiencia Total</span>
                  </div>
                  <p className="text-2xl font-bold">259,000</p>
                  <p className="text-xs text-muted-foreground">Alcance mensual</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-pink-500" />
                    <span className="text-sm font-medium">Crecimiento</span>
                  </div>
                  <p className="text-2xl font-bold">+12.5%</p>
                  <p className="text-xs text-muted-foreground">vs mes anterior</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
