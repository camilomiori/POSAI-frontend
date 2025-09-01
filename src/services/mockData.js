export const MOCK_PRODUCTS = [
  {
    id: 1,
    name: 'Neumático Michelin 185/65R15',
    barcode: '1234567890123',
    price: 45000,
    cost: 35000,
    stock: 25,
    category: 'neumaticos',
    description: 'Neumático radial para automóviles',
    supplier: 'Michelin Argentina',
    location: 'A1-B2',
    minStock: 5,
    maxStock: 50,
    createdAt: Date.now() - (30 * 24 * 60 * 60 * 1000),
    updatedAt: Date.now() - (5 * 24 * 60 * 60 * 1000),
    active: true,
    image: null,
    weight: 8.5,
    tags: ['premium', 'verano', 'deportivo'],
    sales30Days: 15,
    demandTrend: 'up'
  },
  {
    id: 2,
    name: 'Batería BOSCH S4 12V 60Ah',
    barcode: '2345678901234',
    price: 32000,
    cost: 24000,
    stock: 8,
    category: 'electricidad',
    description: 'Batería libre de mantenimiento',
    supplier: 'BOSCH Argentina',
    location: 'B3-C1',
    minStock: 3,
    maxStock: 20,
    createdAt: Date.now() - (45 * 24 * 60 * 60 * 1000),
    updatedAt: Date.now() - (2 * 24 * 60 * 60 * 1000),
    active: true,
    image: null,
    weight: 15.2,
    tags: ['alta-gama', 'garantia'],
    sales30Days: 12,
    demandTrend: 'stable'
  }
];

export const MOCK_DASHBOARD_DATA = {
  kpis: {
    totalSales: 845230,
    totalTransactions: 127,
    avgTicket: 6655,
    topProduct: 'Neumático Michelin 185/65R15',
    lowStockAlerts: 3,
    aiRecommendations: 8
  },
  charts: {
    salesTrend: [
      { date: '2024-01-01', sales: 45000, transactions: 8 },
      { date: '2024-01-02', sales: 52000, transactions: 12 },
      { date: '2024-01-03', sales: 38000, transactions: 6 }
    ],
    topProducts: [
      { name: 'Neumático Michelin', revenue: 180000, units: 15 },
      { name: 'Aceite Castrol', revenue: 119000, units: 28 }
    ]
  },
  alerts: [
    {
      id: 1,
      type: 'warning',
      title: 'Stock Bajo',
      message: 'Filtro de Aire K&N tiene solo 2 unidades',
      timestamp: Date.now() - (30 * 60 * 1000)
    }
  ]
};

export const MOCK_SALES = [
  {
    id: 1001,
    timestamp: Date.now() - (2 * 60 * 60 * 1000),
    items: [
      { id: 1, name: 'Neumático Michelin 185/65R15', quantity: 4, price: 45000, subtotal: 180000 }
    ],
    customer: {
      name: 'Juan Pérez',
      email: 'juan@email.com',
      cuit: '20-12345678-9',
      phone: '+54 11 1234-5678'
    },
    payment: { method: 'tarjeta_credito', amount: 180000 },
    invoice: { type: 'B', number: 'B-00001001' },
    subtotal: 180000,
    discount: 0,
    tax: 0,
    total: 180000,
    userId: 1,
    status: 'completed'
  }
];

export const MOCK_USERS = [
  {
    id: 1,
    username: 'admin',
    nombre: 'Administrador',
    apellido: 'Sistema',
    email: 'admin@posai.com',
    role: 'admin',
    isActive: true,
    sucursal: 'Principal',
    telefono: '+54 11 1111-1111',
    createdAt: Date.now() - (90 * 24 * 60 * 60 * 1000),
    lastLogin: Date.now() - (2 * 60 * 60 * 1000),
    permissions: ['all']
  }
];

export const MOCK_USER_STATS = {
  monthlySales: 245000,
  monthlyTransactions: 45,
  averageTicket: 5444,
  monthlyHours: 168,
  salesChange: '+12.5%',
  transactionsChange: '+8.2%',
  ticketChange: '+4.1%',
  hoursChange: '+2h',
  achievements: []
};

// Funciones generadoras de datos para gráficos
export const generateSalesChartData = (days = 30) => {
  const data = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Generar datos realistas con variación
    const baseValue = 150000 + (Math.random() - 0.5) * 100000;
    const weekendMultiplier = date.getDay() === 0 || date.getDay() === 6 ? 0.7 : 1;
    const value = Math.max(50000, baseValue * weekendMultiplier);
    
    data.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(value),
      orders: Math.round(value / 4000) // Aproximadamente 4000 pesos por orden
    });
  }
  
  return data;
};

export const generateCategoryData = () => {
  return [
    { name: 'Neumáticos', value: 1856000, percentage: 38, color: '#3B82F6' },
    { name: 'Aceites y Lubricantes', value: 978000, percentage: 20, color: '#10B981' },
    { name: 'Frenos', value: 734000, percentage: 15, color: '#F59E0B' },
    { name: 'Suspensión', value: 587000, percentage: 12, color: '#EF4444' },
    { name: 'Batería', value: 440000, percentage: 9, color: '#8B5CF6' },
    { name: 'Accesorios', value: 295000, percentage: 6, color: '#EC4899' }
  ];
};

export const generateHourlyData = () => {
  return [
    { hour: '08:00', sales: 89000, transactions: 12 },
    { hour: '09:00', sales: 156000, transactions: 24 },
    { hour: '10:00', sales: 234000, transactions: 38 },
    { hour: '11:00', sales: 198000, transactions: 32 },
    { hour: '12:00', sales: 167000, transactions: 28 },
    { hour: '13:00', sales: 145000, transactions: 22 },
    { hour: '14:00', sales: 189000, transactions: 35 },
    { hour: '15:00', sales: 276000, transactions: 45 },
    { hour: '16:00', sales: 321000, transactions: 52 },
    { hour: '17:00', sales: 298000, transactions: 48 },
    { hour: '18:00', sales: 234000, transactions: 38 },
    { hour: '19:00', sales: 178000, transactions: 29 }
  ];
};