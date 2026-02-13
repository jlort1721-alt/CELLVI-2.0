
import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { Fuel, TrendingDown, Gauge, AlertTriangle, Leaf } from 'lucide-react';

const dataConsumption = [
  { name: 'Lun', lts: 45, expected: 50 },
  { name: 'Mar', lts: 52, expected: 48 }, // Ineficiente
  { name: 'Mie', lts: 43, expected: 48 }, // Eficiente
  { name: 'Jue', lts: 46, expected: 49 },
  { name: 'Vie', lts: 58, expected: 55 },
  { name: 'Sab', lts: 30, expected: 35 },
  { name: 'Dom', lts: 20, expected: 20 },
];

const driverEfficiency = [
  { name: 'Juan P.', score: 92, color: '#22c55e' },
  { name: 'Carlos R.', score: 85, color: '#22c55e' },
  { name: 'Maria L.', score: 74, color: '#f59e0b' },
  { name: 'Pedro S.', score: 62, color: '#ef4444' }, // Malo
];

const DashboardFuel = () => {
  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Fuel className="text-orange-500" />
            Control de Combustible & Eficiencia
          </h1>
          <p className="text-slate-500 text-sm">Análisis predictivo de consumo basado en IA (Fase 3).</p>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <span className="block text-xs text-slate-400">AHORRO MENSUAL</span>
            <span className="text-xl font-bold text-green-600 flex items-center justify-end gap-1">
              <TrendingDown size={18} /> 4.2%
            </span>
          </div>
          <div className="text-right">
            <span className="block text-xs text-slate-400">EMISIONES CO2</span>
            <span className="text-xl font-bold text-slate-700 flex items-center justify-end gap-1">
              <Leaf size={18} className="text-green-500" /> -120 kg
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 1. Gráfico de Consumo Diario */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-700 mb-4">Consumo Real vs Esperado (IA)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dataConsumption}>
                <defs>
                  <linearGradient id="colorLts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <Tooltip />
                <Area type="monotone" dataKey="expected" stroke="#3b82f6" fillOpacity={1} fill="url(#colorExp)" name="IA Predicción" strokeDasharray="5 5" />
                <Area type="monotone" dataKey="lts" stroke="#f97316" fillOpacity={1} fill="url(#colorLts)" name="Consumo Real" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Ranking de Conductores (Eco-Driving) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Gauge size={20} /> Score Eco-Driving
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={driverEfficiency} margin={{ left: 20 }}>
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={20}>
                  {driverEfficiency.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded border border-red-100 flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <p><b>Alerta:</b> Pedro S. tiene 3 eventos de ralentí excesivo (&gt;15min) esta semana.</p>
          </div>
        </div>

        {/* 3. Anomalías de Combustible (Robo) */}
        <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-700 mb-4">Detección de Anomalías (Robo Potencial)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Vehículo</th>
                  <th className="px-4 py-3">Evento</th>
                  <th className="px-4 py-3">Ubicación</th>
                  <th className="px-4 py-3">Confianza IA</th>
                  <th className="px-4 py-3">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-4 py-3 font-medium">TXK-902</td>
                  <td className="px-4 py-3 text-red-600 font-bold">Descenso Brusco (-15%)</td>
                  <td className="px-4 py-3">Km 45 via al Llano (Detenido)</td>
                  <td className="px-4 py-3">
                    <div className="w-full bg-slate-200 rounded-full h-1.5 max-w-[100px]">
                      <div className="bg-red-500 h-1.5 rounded-full" style={{ width: '92%' }}></div>
                    </div>
                    <span className="text-xs text-slate-500">92% High</span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="text-blue-600 hover:underline">Ver Video</button>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium">WER-123</td>
                  <td className="px-4 py-3 text-orange-500">Consumo &gt; 20% vs Histórico</td>
                  <td className="px-4 py-3">Ruta Urbana Bogota</td>
                  <td className="px-4 py-3">
                    <div className="w-full bg-slate-200 rounded-full h-1.5 max-w-[100px]">
                      <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                    <span className="text-xs text-slate-500">75% Medium</span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="text-blue-600 hover:underline">Revisar Injectores</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardFuel;
