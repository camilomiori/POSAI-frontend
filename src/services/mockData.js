// services/mockData.js
import { PRODUCT_CATEGORIES, DEMAND_TRENDS, USER_ROLES, PAYMENT_METHODS, INVOICE_TYPES } from '../utils/constants';

/**
 * Mock data for products
 */
export const MOCK_PRODUCTS = [
  { 
    id: 1, 
    code: 'XR-250-01', 
    name: 'Cámara 21" reforzada', 
    category: PRODUCT_CATEGORIES.ACCESORIOS, 
    supplier: 'Acme Parts', 
    price: 9800, 
    cost: 6500,
    stock: 24,
    aiScore: 0.89,
    demandTrend: DEMAND_TRENDS.UP,
    suggestedPrice: 10200,
    fastMoving: true,
    reorderPoint: 10,
    description: 'Cámara de aire resistente para motocicletas de alta calidad',
    barcode: '7891234567890',
    weight: 0.5,
    dimensions: '21x5x5 cm',
    brand: 'MotoMax',
    warranty: 12,
    tags: ['moto', 'cámara', 'reforzada'],
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now() - 86400000 * 2
  },
  { 
    id: 2, 
    code: 'XR-250-02', 
    name: 'Cubierta 80/100-21', 
    category: PRODUCT_CATEGORIES.NEUMATICOS, 
    supplier: 'Neuma S.A.', 
    price: 56000, 
    cost: 42000,
    stock: 8,
    aiScore: 0.95,
    demandTrend: DEMAND_TRENDS.UP,
    suggestedPrice: 58000,
    fastMoving: true,
    reorderPoint: 15,
    description: 'Cubierta trasera para motocross de alta performance',
    barcode: '7891234567891',
    weight: 2.5,
    dimensions: '80x21 cm',
    brand: 'TireMax',
    warranty: 24,
    tags: ['cubierta', 'trasera', 'motocross'],
    createdAt: Date.now() - 86400000 * 45,
    updatedAt: Date.now() - 86400000 * 1
  },
  { 
    id: 3, 
    code: 'XR-250-03', 
    name: 'Cubierta 110/100-18', 
    category: PRODUCT_CATEGORIES.NEUMATICOS, 
    supplier: 'Neuma S.A.', 
    price: 74000, 
    cost: 55000,
    stock: 5,
    aiScore: 0.72,
    demandTrend: DEMAND_TRENDS.STABLE,
    suggestedPrice: 76000,
    fastMoving: false,
    reorderPoint: 12,
    description: 'Cubierta delantera para motocross profesional',
    barcode: '7891234567892',
    weight: 3.2,
    dimensions: '110x18 cm',
    brand: 'TireMax',
    warranty: 24,
    tags: ['cubierta', 'delantera', 'motocross'],
    createdAt: Date.now() - 86400000 * 60,
    updatedAt: Date.now() - 86400000 * 5
  },
  { 
    id: 4, 
    code: 'XR-250-04', 
    name: 'Kit de cadena y coronas', 
    category: PRODUCT_CATEGORIES.TRANSMISION, 
    supplier: 'Moto Parts', 
    price: 89000, 
    cost: 65000,
    stock: 12,
    aiScore: 0.83,
    demandTrend: DEMAND_TRENDS.UP,
    suggestedPrice: 92000,
    fastMoving: true,
    reorderPoint: 8,
    description: 'Kit completo de transmisión para XR250 incluye cadena y coronas',
    barcode: '7891234567893',
    weight: 1.8,
    dimensions: '30x25x10 cm',
    brand: 'ChainMax',
    warranty: 18,
    tags: ['cadena', 'coronas', 'transmisión'],
    createdAt: Date.now() - 86400000 * 20,
    updatedAt: Date.now() - 86400000 * 3
  },
  { 
    id: 5, 
    code: 'XR-250-05', 
    name: 'Filtro de aire K&N', 
    category: PRODUCT_CATEGORIES.FILTROS, 
    supplier: 'Filter Pro', 
    price: 25000, 
    cost: 18000,
    stock: 35,
    aiScore: 0.76,
    demandTrend: DEMAND_TRENDS.STABLE,
    suggestedPrice: 26000,
    fastMoving: false,
    reorderPoint: 20,
    description: 'Filtro de aire deportivo lavable de alta calidad',
    barcode: '7891234567894',
    weight: 0.3,
    dimensions: '15x12x5 cm',
    brand: 'K&N',
    warranty: 36,
    tags: ['filtro', 'aire', 'lavable'],
    createdAt: Date.now() - 86400000 * 15,
    updatedAt: Date.now() - 86400000 * 1
  },
  {
    id: 6,
    code: 'XR-250-06',
    name: 'Pastillas de freno delanteras',
    category: PRODUCT_CATEGORIES.FRENOS,
    supplier: 'Brake Systems',
    price: 15000,
    cost: 10500,
    stock: 45,
    aiScore: 0.68,
    demandTrend: DEMAND_TRENDS.STABLE,
    suggestedPrice: 15500,
    fastMoving: false,
    reorderPoint: 25,
    description: 'Pastillas de freno delanteras de alto rendimiento',
    barcode: '7891234567895',
    weight: 0.8,
    dimensions: '10x8x2 cm',
    brand: 'BrakeMax',
    warranty: 12,
    tags: ['frenos', 'pastillas', 'delanteras'],
    createdAt: Date.now() - 86400000 * 40,
    updatedAt: Date.now() - 86400000 * 7
  }
];

/**
 * Mock data for users/cajeros
 */
export const MOCK_USERS = [
  { 
    id: 1, 
    nombre: 'Camilo Rodriguez', 
    usuario: 'camilo', 
    email: 'camilo@posai.com', 
    role: USER_ROLES.ADMIN,
    activo: true,
    phone: '+54 9 351 123-4567',
    address: 'Av. Córdoba 1234, Córdoba',
    hireDate: Date.now() - 86400000 * 365,
    lastLogin: Date.now() - 86400000 * 1,
    avatar: null,
    permissions: ['all']
  },
  { 
    id: 2, 
    nombre: 'Liliana Martinez', 
    usuario: 'lili', 
    email: 'lili@posai.com', 
    role: USER_ROLES.CAJERO,
    activo: true,
    phone: '+54 9 351 234-5678',
    address: 'Av. Colón 567, Córdoba',
    hireDate: Date.now() - 86400000 * 180,
    lastLogin: Date.now() - 86400000 * 2,
    avatar: null,
    permissions: ['sales', 'products_view']
  },
  { 
    id: 3, 
    nombre: 'Juan Carlos Perez', 
    usuario: 'juan', 
    email: 'juan@posai.com', 
    role: USER_ROLES.CAJERO,
    activo: true,
    phone: '+54 9 351 345-6789',
    address: 'Av. Fader 890, Córdoba',
    hireDate: Date.now() - 86400000 * 90,
    lastLogin: Date.now() - 86400000 * 0.5,
    avatar: null,
    permissions: ['sales', 'products_view']
  },
  { 
    id: 4, 
    nombre: 'Maria Elena Garcia', 
    usuario: 'maria', 
    email: 'maria@posai.com', 
    role: USER_ROLES.SUPERVISOR,
    activo: false,
    phone: '+54 9 351 456-7890',
    address: 'Av. Rafael Núñez 234, Córdoba',
    hireDate: Date.now() - 86400000 * 270,
    lastLogin: Date.now() - 86400000 * 30,
    avatar: null,
    permissions: ['sales', 'products_manage', 'reports']
  }
];

/**
 * Mock data for sales/ventas
 */
export const MOCK_SALES = [
  {
    id: 1001,
    cajeroId: 1,
    cajeroNombre: 'Camilo Rodriguez',
    items: [
      { id: 1, code: 'XR-250-01', name: 'Cámara 21" reforzada', quantity: 2, price: 9800, subtotal: 19600 },
      { id: 4, code: 'XR-250-04', name: 'Kit de cadena y coronas', quantity: 1, price: 89000, subtotal: 89000 }
    ],
    subtotal: 108600,
    discountPercent: 5,
    discountAmount: 5430,
    total: 103170,
    paymentMethod: PAYMENT_METHODS.CREDIT_CARD,
    invoiceType: INVOICE_TYPES.B,
    customer: {
      name: 'Roberto Silva',
      cuit: '20-12345678-9',
      email: 'roberto@email.com',
      phone: '+54 9 351 987-6543'
    },
    timestamp: Date.now() - 86400000 * 1,
    status: 'completed'
  },
  {
    id: 1002,
    cajeroId: 2,
    cajeroNombre: 'Liliana Martinez',
    items: [
      { id: 2, code: 'XR-250-02', name: 'Cubierta 80/100-21', quantity: 1, price: 56000, subtotal: 56000 },
      { id: 5, code: 'XR-250-05', name: 'Filtro de aire K&N', quantity: 1, price: 25000, subtotal: 25000 }
    ],
    subtotal: 81000,
    discountPercent: 0,
    discountAmount: 0,
    total: 81000,
    paymentMethod: PAYMENT_METHODS.CASH,
    invoiceType: INVOICE_TYPES.C,
    customer: {
      name: 'Ana Martinez',
      email: 'ana@email.com'
    },
    timestamp: Date.now() - 86400000 * 2,
    status: 'completed'
  },
  {
    id: 1003,
    cajeroId: 3,
    cajeroNombre: 'Juan Carlos Perez',
    items: [
      { id: 3, code: 'XR-250-03', name: 'Cubierta 110/100-18', quantity: 1, price: 74000, subtotal: 74000 }
    ],
    subtotal: 74000,
    discountPercent: 2,
    discountAmount: 1480,
    total: 72520,
    paymentMethod: PAYMENT_METHODS.DEBIT_CARD,
    invoiceType: INVOICE_TYPES.B,
    customer: {
      name: 'Carlos Lopez',
      cuit: '23-87654321-7',
      phone: '+54 9 351 555-1234'
    },
    timestamp: Date.now() - 86400000 * 3,
    status: 'completed'
  }
];

/**
 * Mock data for suppliers
 */
export const MOCK_SUPPLIERS = [
  {
    id: 1,
    name: 'Acme Parts',
    contactName: 'Jorge Fernandez',
    email: 'ventas@acmeparts.com',
    phone: '+54 11 4567-8901',
    address: 'Av. Libertador 1234, Buenos Aires',
    cuit: '30-12345678-9',
    paymentTerms: 30,
    discount: 5,
    active: true,
    categories: [PRODUCT_CATEGORIES.ACCESORIOS]
  },
  {
    id: 2,
    name: 'Neuma S.A.',
    contactName: 'Patricia Gonzalez',
    email: 'info@neuma.com.ar',
    phone: '+54 11 2345-6789',
    address: 'Parque Industrial Sur, Lote 45',
    cuit: '30-87654321-5',
    paymentTerms: 45,
    discount: 8,
    active: true,
    categories: [PRODUCT_CATEGORIES.NEUMATICOS]
  },
  {
    id: 3,
    name: 'Moto Parts',
    contactName: 'Ricardo Diaz',
    email: 'ricardo@motoparts.com',
    phone: '+54 351 123-4567',
    address: 'Av. Colón 567, Córdoba',
    cuit: '30-11223344-7',
    paymentTerms: 30,
    discount: 6,
    active: true,
    categories: [PRODUCT_CATEGORIES.TRANSMISION, PRODUCT_CATEGORIES.FRENOS]
  },
  {
    id: 4,
    name: 'Filter Pro',
    contactName: 'Sandra Torres',
    email: 'ventas@filterpro.com',
    phone: '+54 11 9876-5432',
    address: 'Zona Franca, Galpón 12',
    cuit: '30-99887766-3',
    paymentTerms: 60,
    discount: 10,
    active: true,
    categories: [PRODUCT_CATEGORIES.FILTROS]
  }
];

/**
 * Mock data for customers
 */
export const MOCK_CUSTOMERS = [
  {
    id: 1,
    name: 'Roberto Silva',
    email: 'roberto@email.com',
    phone: '+54 9 351 987-6543',
    cuit: '20-12345678-9',
    address: 'Av. Córdoba 890, Córdoba',
    customerType: 'retail',
    totalPurchases: 450000,
    lastPurchase: Date.now() - 86400000 * 1,
    loyaltyPoints: 450,
    preferredPayment: PAYMENT_METHODS.CREDIT_CARD
  },
  {
    id: 2,
    name: 'Ana Martinez',
    email: 'ana@email.com',
    phone: '+54 9 351 234-5678',
    address: 'Av. Colón 456, Córdoba',
    customerType: 'retail',
    totalPurchases: 180000,
    lastPurchase: Date.now() - 86400000 * 2,
    loyaltyPoints: 180,
    preferredPayment: PAYMENT_METHODS.CASH
  },
  {
    id: 3,
    name: 'Taller Mecánico Central',
    email: 'info@tallercentral.com',
    phone: '+54 351 555-1000',
    cuit: '30-55667788-2',
    address: 'Av. Circunvalación 1234, Córdoba',
    customerType: 'wholesale',
    totalPurchases: 2500000,
    lastPurchase: Date.now() - 86400000 * 7,
    loyaltyPoints: 2500,
    preferredPayment: PAYMENT_METHODS.TRANSFER,
    discountRate: 15
  }
];

/**
 * Generate mock chart data
 */
export const generateSalesChartData = (days = 30) => {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    
    return {
      date: date.toISOString().split('T')[0],
      label: i === 0 ? 'Hoy' : i === 7 ? '7d' : i === 14 ? '14d' : i === 21 ? '21d' : '',
      value: Math.floor(Math.random() * 150000) + 50000,
      orders: Math.floor(Math.random() * 25) + 5
    };
  });
};

export const generateCategoryData = () => [
  { label: PRODUCT_CATEGORIES.NEUMATICOS, value: 45, color: '#3B82F6' },
  { label: PRODUCT_CATEGORIES.TRANSMISION, value: 25, color: '#8B5CF6' },
  { label: PRODUCT_CATEGORIES.ACCESORIOS, value: 20, color: '#10B981' },
  { label: PRODUCT_CATEGORIES.FILTROS, value: 10, color: '#F59E0B' }
];

export const generateHourlyData = () => {
  return Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    label: `${i}:00`,
    value: Math.floor(Math.random() * 50) + 10
  }));
};