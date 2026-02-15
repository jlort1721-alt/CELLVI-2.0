/**
 * Datos Organizacionales de ASEGURAR LTDA
 * Estructura de las 10 áreas operativas
 */

export interface OrganizationalArea {
  id: string;
  code: number;
  name: string;
  description: string;
  leader: {
    id: string;
    name: string;
    title: string;
    email: string;
    avatar?: string;
  };
  color: string;
  icon: string;
  team: Employee[];
  kpis: KPI[];
  status: 'green' | 'yellow' | 'red';
  responsibilities: string[];
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  email: string;
  phone?: string;
  area: number;
  status: 'active' | 'inactive' | 'vacation';
  avatar?: string;
}

export interface KPI {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change: number; // % change from last period
  status: 'good' | 'warning' | 'critical';
}

export const organizationalAreas: OrganizationalArea[] = [
  {
    id: 'presidencia',
    code: 1,
    name: 'Presidencia',
    description: 'Dirección estratégica y toma de decisiones de alto nivel',
    leader: {
      id: 'romulo',
      name: 'Mayor Rómulo',
      title: 'Presidente',
      email: 'presidencia@asegurarltda.com',
    },
    color: '#8B5CF6', // Purple
    icon: 'Crown',
    team: [],
    kpis: [
      {
        id: 'revenue',
        name: 'Ingresos Totales',
        value: 2850000000,
        target: 3000000000,
        unit: 'COP',
        trend: 'up',
        change: 15.3,
        status: 'good',
      },
      {
        id: 'growth',
        name: 'Crecimiento Anual',
        value: 18.5,
        target: 20,
        unit: '%',
        trend: 'up',
        change: 3.2,
        status: 'warning',
      },
      {
        id: 'satisfaction',
        name: 'Satisfacción General',
        value: 92,
        target: 90,
        unit: '%',
        trend: 'up',
        change: 5.1,
        status: 'good',
      },
    ],
    status: 'green',
    responsibilities: [
      'Definir visión y misión empresarial',
      'Aprobar presupuestos y proyectos estratégicos',
      'Relaciones con stakeholders clave',
      'Supervisión de cumplimiento corporativo',
    ],
  },
  {
    id: 'gerencia-general',
    code: 2,
    name: 'Gerencia General',
    description: 'Gestión operativa y coordinación de todas las áreas',
    leader: {
      id: 'deyanira',
      name: 'Deyanira López',
      title: 'Gerente General',
      email: 'gerencia@asegurarltda.com',
    },
    color: '#3B82F6', // Blue
    icon: 'Briefcase',
    team: [],
    kpis: [
      {
        id: 'efficiency',
        name: 'Eficiencia Operativa',
        value: 87,
        target: 85,
        unit: '%',
        trend: 'up',
        change: 4.2,
        status: 'good',
      },
      {
        id: 'okr-completion',
        name: 'Cumplimiento OKRs',
        value: 78,
        target: 80,
        unit: '%',
        trend: 'stable',
        change: 0.5,
        status: 'warning',
      },
      {
        id: 'team-health',
        name: 'Salud de Equipos',
        value: 8.4,
        target: 8.0,
        unit: '/10',
        trend: 'up',
        change: 2.1,
        status: 'good',
      },
    ],
    status: 'green',
    responsibilities: [
      'Coordinación de las 10 áreas operativas',
      'Seguimiento de OKRs y metas',
      'Gestión de presupuestos por área',
      'Toma de decisiones operativas',
      'Reportes a Presidencia',
    ],
  },
  {
    id: 'jefe-red',
    code: 3,
    name: 'Jefe de Red',
    description: 'Infraestructura técnica y operaciones de red',
    leader: {
      id: 'jefe-red',
      name: 'Ingeniero de Red',
      title: 'Jefe de Infraestructura',
      email: 'infraestructura@asegurarltda.com',
    },
    color: '#10B981', // Green
    icon: 'Network',
    team: [],
    kpis: [
      {
        id: 'uptime',
        name: 'Uptime de Red',
        value: 99.92,
        target: 99.9,
        unit: '%',
        trend: 'stable',
        change: 0.02,
        status: 'good',
      },
      {
        id: 'devices',
        name: 'Dispositivos Activos',
        value: 247,
        target: 250,
        unit: 'unidades',
        trend: 'up',
        change: 2.5,
        status: 'good',
      },
      {
        id: 'incidents',
        name: 'Incidentes Resueltos',
        value: 28,
        target: 30,
        unit: '/mes',
        trend: 'down',
        change: -6.7,
        status: 'good',
      },
    ],
    status: 'green',
    responsibilities: [
      'Mantenimiento de infraestructura de red',
      'Gestión de dispositivos IoT (Gateways, Sensores)',
      'Instalaciones técnicas',
      'Soporte técnico nivel 2',
      'Gestión de proveedores técnicos',
    ],
  },
  {
    id: 'cco-rack',
    code: 4,
    name: 'CCO - RACK',
    description: 'Centro de Control Operativo 24/7',
    leader: {
      id: 'cco-lead',
      name: 'Coordinador CCO',
      title: 'Jefe de Operaciones',
      email: 'cco@asegurarltda.com',
    },
    color: '#EF4444', // Red
    icon: 'Shield',
    team: [],
    kpis: [
      {
        id: 'active-monitoring',
        name: 'Vehículos Monitoreados',
        value: 189,
        target: 200,
        unit: 'activos',
        trend: 'up',
        change: 3.8,
        status: 'good',
      },
      {
        id: 'response-time',
        name: 'Tiempo de Respuesta',
        value: 4.2,
        target: 5.0,
        unit: 'min',
        trend: 'down',
        change: -8.7,
        status: 'good',
      },
      {
        id: 'critical-alerts',
        name: 'Alertas Críticas',
        value: 12,
        target: 15,
        unit: '/día',
        trend: 'down',
        change: -15.3,
        status: 'good',
      },
    ],
    status: 'green',
    responsibilities: [
      'Monitoreo 24/7 de flota vehicular',
      'Gestión de alertas y eventos críticos',
      'Coordinación con clientes y autoridades',
      'Registro de eventos e incidentes',
      'Soporte en tiempo real',
    ],
  },
  {
    id: 'asistente-gerencia',
    code: 5,
    name: 'Asistente de Gerencia',
    description: 'Coordinación administrativa y soporte ejecutivo',
    leader: {
      id: 'asistente',
      name: 'Asistente Ejecutivo',
      title: 'Coordinador Administrativo',
      email: 'asistencia@asegurarltda.com',
    },
    color: '#F59E0B', // Amber
    icon: 'ClipboardList',
    team: [],
    kpis: [
      {
        id: 'tasks-completed',
        name: 'Tareas Completadas',
        value: 156,
        target: 150,
        unit: '/mes',
        trend: 'up',
        change: 4.0,
        status: 'good',
      },
      {
        id: 'meetings',
        name: 'Reuniones Coordinadas',
        value: 42,
        target: 40,
        unit: '/mes',
        trend: 'stable',
        change: 0.5,
        status: 'good',
      },
      {
        id: 'documents',
        name: 'Documentos Procesados',
        value: 234,
        target: 220,
        unit: '/mes',
        trend: 'up',
        change: 6.4,
        status: 'good',
      },
    ],
    status: 'green',
    responsibilities: [
      'Gestión de agenda ejecutiva',
      'Coordinación de reuniones',
      'Gestión documental',
      'Comunicaciones internas',
      'Seguimiento de compromisos',
    ],
  },
  {
    id: 'operador-cellvi',
    code: 6,
    name: 'Operador Central CELLVI',
    description: 'Gestión de plataforma y soporte a clientes',
    leader: {
      id: 'operador-lead',
      name: 'Operador CELLVI',
      title: 'Especialista CELLVI',
      email: 'soporte@cellvi.com.co',
    },
    color: '#06B6D4', // Cyan
    icon: 'Monitor',
    team: [],
    kpis: [
      {
        id: 'client-satisfaction',
        name: 'Satisfacción de Clientes',
        value: 4.7,
        target: 4.5,
        unit: '/5',
        trend: 'up',
        change: 4.4,
        status: 'good',
      },
      {
        id: 'tickets',
        name: 'Tickets Resueltos',
        value: 67,
        target: 60,
        unit: '/semana',
        trend: 'up',
        change: 11.7,
        status: 'good',
      },
      {
        id: 'platform-usage',
        name: 'Uso de Plataforma',
        value: 82,
        target: 80,
        unit: '%',
        trend: 'up',
        change: 2.5,
        status: 'good',
      },
    ],
    status: 'green',
    responsibilities: [
      'Soporte técnico a clientes',
      'Configuración de plataforma CELLVI',
      'Training de clientes',
      'Gestión de incidencias',
      'Reportes de uso y satisfacción',
    ],
  },
  {
    id: 'contabilidad',
    code: 7,
    name: 'Contabilidad y Pagos',
    description: 'Gestión financiera y contable',
    leader: {
      id: 'contador',
      name: 'Contador Principal',
      title: 'Jefe de Contabilidad',
      email: 'contabilidad@asegurarltda.com',
    },
    color: '#14B8A6', // Teal
    icon: 'DollarSign',
    team: [],
    kpis: [
      {
        id: 'cash-flow',
        name: 'Flujo de Caja',
        value: 450000000,
        target: 400000000,
        unit: 'COP',
        trend: 'up',
        change: 12.5,
        status: 'good',
      },
      {
        id: 'receivables',
        name: 'Cartera Vencida',
        value: 8.5,
        target: 10,
        unit: '%',
        trend: 'down',
        change: -15.0,
        status: 'good',
      },
      {
        id: 'invoices',
        name: 'Facturas Emitidas',
        value: 128,
        target: 120,
        unit: '/mes',
        trend: 'up',
        change: 6.7,
        status: 'good',
      },
    ],
    status: 'green',
    responsibilities: [
      'Contabilidad general',
      'Facturación y cobros',
      'Pagos a proveedores',
      'Conciliaciones bancarias',
      'Reportes financieros',
    ],
  },
  {
    id: 'crm',
    code: 8,
    name: 'CRM Asegurar LTDA',
    description: 'Gestión de relaciones con clientes',
    leader: {
      id: 'crm-manager',
      name: 'Gerente CRM',
      title: 'Director de Clientes',
      email: 'crm@asegurarltda.com',
    },
    color: '#EC4899', // Pink
    icon: 'Users',
    team: [],
    kpis: [
      {
        id: 'leads',
        name: 'Leads Activos',
        value: 45,
        target: 40,
        unit: 'oportunidades',
        trend: 'up',
        change: 12.5,
        status: 'good',
      },
      {
        id: 'conversion',
        name: 'Tasa de Conversión',
        value: 28.5,
        target: 25,
        unit: '%',
        trend: 'up',
        change: 14.0,
        status: 'good',
      },
      {
        id: 'retention',
        name: 'Retención de Clientes',
        value: 94.2,
        target: 90,
        unit: '%',
        trend: 'stable',
        change: 0.3,
        status: 'good',
      },
    ],
    status: 'green',
    responsibilities: [
      'Gestión de pipeline de ventas',
      'Seguimiento de leads y oportunidades',
      'Atención al cliente',
      'Encuestas de satisfacción',
      'Análisis de churn',
    ],
  },
  {
    id: 'marketing',
    code: 9,
    name: 'Comercial y Marketing',
    description: 'Estrategia comercial y posicionamiento',
    leader: {
      id: 'marketing-manager',
      name: 'Director de Marketing',
      title: 'Jefe Comercial',
      email: 'marketing@asegurarltda.com',
    },
    color: '#F97316', // Orange
    icon: 'TrendingUp',
    team: [],
    kpis: [
      {
        id: 'leads-generated',
        name: 'Leads Generados',
        value: 156,
        target: 150,
        unit: '/mes',
        trend: 'up',
        change: 4.0,
        status: 'good',
      },
      {
        id: 'roi',
        name: 'ROI Marketing',
        value: 420,
        target: 400,
        unit: '%',
        trend: 'up',
        change: 5.0,
        status: 'good',
      },
      {
        id: 'engagement',
        name: 'Engagement Rate',
        value: 6.8,
        target: 6.0,
        unit: '%',
        trend: 'up',
        change: 13.3,
        status: 'good',
      },
    ],
    status: 'green',
    responsibilities: [
      'Estrategia de marketing digital',
      'Campañas publicitarias',
      'Gestión de redes sociales',
      'Content marketing',
      'Análisis de mercado',
    ],
  },
  {
    id: 'desarrollo',
    code: 10,
    name: 'Desarrollo y Programación',
    description: 'Ingeniería de software y tecnología',
    leader: {
      id: 'dev-lead',
      name: 'Lead Developer',
      title: 'Director de Tecnología',
      email: 'desarrollo@asegurarltda.com',
    },
    color: '#6366F1', // Indigo
    icon: 'Code',
    team: [],
    kpis: [
      {
        id: 'features',
        name: 'Features Entregados',
        value: 24,
        target: 20,
        unit: '/sprint',
        trend: 'up',
        change: 20.0,
        status: 'good',
      },
      {
        id: 'bugs',
        name: 'Bugs Activos',
        value: 12,
        target: 15,
        unit: 'críticos',
        trend: 'down',
        change: -20.0,
        status: 'good',
      },
      {
        id: 'coverage',
        name: 'Cobertura de Tests',
        value: 78,
        target: 80,
        unit: '%',
        trend: 'up',
        change: 2.6,
        status: 'warning',
      },
    ],
    status: 'green',
    responsibilities: [
      'Desarrollo de software',
      'Mantenimiento de plataforma CELLVI',
      'Gestión de infraestructura cloud',
      'DevOps y CI/CD',
      'Innovación tecnológica',
    ],
  },
];

export const getAreaByCode = (code: number): OrganizationalArea | undefined => {
  return organizationalAreas.find(area => area.code === code);
};

export const getAreaById = (id: string): OrganizationalArea | undefined => {
  return organizationalAreas.find(area => area.id === id);
};

export const getAreasForUser = (userRole: string): OrganizationalArea[] => {
  // Presidente y Gerente ven todas las áreas
  if (userRole === 'presidente' || userRole === 'gerente_general') {
    return organizationalAreas;
  }

  // Otros usuarios ven solo su área
  const roleToAreaMap: Record<string, number[]> = {
    jefe_red: [3, 6],
    cco: [4, 6],
    asistente_gerencia: [1, 2, 5],
    operador_cellvi: [6],
    contabilidad: [7],
    crm_manager: [8],
    marketing_manager: [9],
    dev_lead: [10],
  };

  const areaCodes = roleToAreaMap[userRole] || [];
  return organizationalAreas.filter(area => areaCodes.includes(area.code));
};
