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
      { id: 1, name: 'Coca Cola 500ml', quantity: 4, price: 350, subtotal: 1400, category: 'Bebidas' },
      { id: 4, name: 'Pan Lactal', quantity: 2, price: 890, subtotal: 1780, category: 'Alimentos' }
    ],
    customer: {
      name: 'Juan Pérez',
      email: 'juan@email.com',
      cuit: '20-12345678-9',
      phone: '+54 11 1234-5678'
    },
    payment: { method: 'tarjeta_credito', amount: 3180 },
    invoice: { type: 'B', number: 'B-00001001' },
    subtotal: 3180,
    discount: 0,
    tax: 0,
    total: 3180,
    userId: 1,
    status: 'completed'
  },
  {
    id: 1002,
    timestamp: Date.now() - (1.5 * 60 * 60 * 1000),
    items: [
      { id: 2, name: 'Agua Mineral 1.5L', quantity: 6, price: 250, subtotal: 1500, category: 'Bebidas' },
      { id: 5, name: 'Leche Entera 1L', quantity: 2, price: 650, subtotal: 1300, category: 'Alimentos' },
      { id: 7, name: 'Detergente 750ml', quantity: 1, price: 1200, subtotal: 1200, category: 'Limpieza' }
    ],
    customer: {
      name: 'María García',
      email: 'maria@email.com',
      cuit: '27-23456789-8',
      phone: '+54 11 2345-6789'
    },
    payment: { method: 'efectivo', amount: 4000 },
    invoice: { type: 'B', number: 'B-00001002' },
    subtotal: 4000,
    discount: 0,
    tax: 0,
    total: 4000,
    userId: 1,
    status: 'completed'
  },
  {
    id: 1003,
    timestamp: Date.now() - (1 * 60 * 60 * 1000),
    items: [
      { id: 8, name: 'Lavandina 1L', quantity: 2, price: 780, subtotal: 1560, category: 'Limpieza' },
      { id: 9, name: 'Auriculares Bluetooth', quantity: 1, price: 15000, subtotal: 15000, category: 'Electrónica' }
    ],
    customer: {
      name: 'Carlos López',
      email: 'carlos@email.com',
      cuit: '23-34567890-7',
      phone: '+54 11 3456-7890'
    },
    payment: { method: 'transferencia', amount: 16560 },
    invoice: { type: 'A', number: 'A-00001003' },
    subtotal: 16560,
    discount: 0,
    tax: 0,
    total: 16560,
    userId: 1,
    status: 'completed'
  },
  {
    id: 1004,
    timestamp: Date.now() - (30 * 60 * 1000),
    items: [
      { id: 3, name: 'Sprite 500ml', quantity: 8, price: 340, subtotal: 2720, category: 'Bebidas' },
      { id: 6, name: 'Arroz 1kg', quantity: 3, price: 980, subtotal: 2940, category: 'Alimentos' }
    ],
    customer: {
      name: 'Ana Rodríguez',
      email: 'ana@email.com',
      cuit: '28-45678901-2',
      phone: '+54 11 5678-9012'
    },
    payment: { method: 'efectivo', amount: 5660 },
    invoice: { type: 'B', number: 'B-00001004' },
    subtotal: 5660,
    discount: 0,
    tax: 0,
    total: 5660,
    userId: 1,
    status: 'completed'
  },
  {
    id: 1005,
    timestamp: Date.now() - (15 * 60 * 1000),
    items: [
      { id: 10, name: 'Cable USB-C 1m', quantity: 3, price: 2500, subtotal: 7500, category: 'Electrónica' }
    ],
    customer: {
      name: 'Roberto Díaz',
      email: 'roberto@email.com',
      cuit: '29-56789012-3',
      phone: '+54 11 6789-0123'
    },
    payment: { method: 'tarjeta_credito', amount: 7500 },
    invoice: { type: 'B', number: 'B-00001005' },
    subtotal: 7500,
    discount: 0,
    tax: 0,
    total: 7500,
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