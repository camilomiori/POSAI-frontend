// Componentes de gráficos centralizados
export { default as AdvancedChart } from './AdvancedChart';
export { default as PieChart } from './PieChart';
export { default as LineChart } from './LineChart';
export { default as BarChart } from './BarChart';

// Re-exports para compatibilidad
export { default as Chart } from './AdvancedChart';

// Configuraciones por defecto para cada tipo de gráfico
export const chartDefaults = {
  advanced: {
    height: 400,
    type: 'line',
    aiInsights: true,
    realTime: false
  },
  
  pie: {
    height: 400,
    showPercentages: true,
    showLegend: true,
    aiAnalysis: true,
    colorScheme: 'default'
  },
  
  line: {
    height: 400,
    showGrid: true,
    showTrend: true,
    aiPrediction: true,
    anomalyDetection: true
  },
  
  bar: {
    height: 400,
    orientation: 'vertical',
    aiRanking: true,
    colorScheme: 'performance',
    sortBy: 'value',
    sortOrder: 'desc'
  }
};

// Utilidades para gráficos
export const chartUtils = {
  // Generar datos de prueba
  generateMockData: (count = 10, type = 'sales') => {
    const types = {
      sales: {
        prefix: 'Producto',
        valueRange: [100, 5000],
        categories: ['Electrónicos', 'Ropa', 'Hogar', 'Deportes']
      },
      performance: {
        prefix: 'Vendedor',
        valueRange: [50, 100],
        categories: ['Ventas', 'Servicio', 'Marketing']
      },
      regions: {
        prefix: 'Región',
        valueRange: [1000, 50000],
        categories: ['Norte', 'Sur', 'Este', 'Oeste']
      }
    };

    const config = types[type] || types.sales;
    const data = [];

    for (let i = 0; i < count; i++) {
      const value = Math.random() * (config.valueRange[1] - config.valueRange[0]) + config.valueRange[0];
      const prediction = value * (0.8 + Math.random() * 0.4); // ±20% variation
      
      data.push({
        name: `${config.prefix} ${i + 1}`,
        value: Math.round(value),
        prediction: Math.round(prediction),
        category: config.categories[Math.floor(Math.random() * config.categories.length)],
        trend: (Math.random() - 0.5) * 20, // -10% to +10%
        target: Math.round(value * (0.9 + Math.random() * 0.3)) // 90% to 120% of value
      });
    }

    return data.sort((a, b) => b.value - a.value);
  },

  // Generar datos de series temporales
  generateTimeSeriesData: (days = 30, baseValue = 100) => {
    const data = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      // Simular tendencia con ruido
      const trend = i * 0.5; // Ligera tendencia ascendente
      const seasonality = Math.sin(i / 7 * Math.PI) * 10; // Patrón semanal
      const noise = (Math.random() - 0.5) * 20;
      const value = baseValue + trend + seasonality + noise;
      const prediction = value * (0.9 + Math.random() * 0.2);

      data.push({
        name: date.toLocaleDateString('es-AR', { month: 'short', day: 'numeric' }),
        value: Math.max(0, Math.round(value)),
        prediction: Math.max(0, Math.round(prediction)),
        timestamp: date.getTime()
      });
    }

    return data;
  },

  // Formatear números para gráficos
  formatNumber: (num, type = 'default') => {
    if (num == null) return '0';
    
    const formatters = {
      currency: (n) => new Intl.NumberFormat('es-AR', { 
        style: 'currency', 
        currency: 'ARS',
        minimumFractionDigits: 0
      }).format(n),
      
      percentage: (n) => `${n.toFixed(1)}%`,
      
      compact: (n) => {
        if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
        if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
        return n.toString();
      },
      
      default: (n) => new Intl.NumberFormat('es-AR').format(n)
    };

    return formatters[type] ? formatters[type](num) : formatters.default(num);
  },

  // Calcular colores basados en performance
  getPerformanceColor: (value, average, scheme = 'default') => {
    const ratio = value / average;
    
    const schemes = {
      default: {
        high: '#10B981',    // Verde
        medium: '#F59E0B',  // Amarillo
        low: '#EF4444'      // Rojo
      },
      pastel: {
        high: '#86EFAC',
        medium: '#FDE68A',
        low: '#FCA5A5'
      },
      business: {
        high: '#059669',
        medium: '#D97706',
        low: '#DC2626'
      }
    };

    const colors = schemes[scheme] || schemes.default;

    if (ratio >= 1.2) return colors.high;
    if (ratio >= 0.8) return colors.medium;
    return colors.low;
  },

  // Detectar anomalías en datos
  detectAnomalies: (data, threshold = 2) => {
    const values = data.map(d => d.value).filter(v => v != null);
    if (values.length < 3) return [];

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return data
      .map((point, index) => ({
        ...point,
        index,
        isAnomaly: Math.abs(point.value - mean) > threshold * stdDev,
        deviation: Math.abs(point.value - mean) / stdDev
      }))
      .filter(point => point.isAnomaly);
  },

  // Calcular métricas de tendencia
  calculateTrend: (data, periods = 5) => {
    const values = data.map(d => d.value).filter(v => v != null);
    if (values.length < periods) return null;

    const recent = values.slice(-periods);
    const previous = values.slice(-periods * 2, -periods);
    
    if (previous.length === 0) return null;

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const previousAvg = previous.reduce((a, b) => a + b, 0) / previous.length;
    
    const change = ((recentAvg - previousAvg) / previousAvg) * 100;
    
    return {
      direction: change > 1 ? 'up' : change < -1 ? 'down' : 'stable',
      percentage: Math.abs(change).toFixed(1),
      confidence: Math.min(100, Math.max(0, 100 - Math.abs(change * 2))).toFixed(1)
    };
  }
};

// Configuraciones de tema
export const chartThemes = {
  light: {
    background: '#FFFFFF',
    text: '#1F2937',
    grid: '#E5E7EB',
    primary: '#3B82F6',
    secondary: '#10B981'
  },
  
  dark: {
    background: '#1F2937',
    text: '#F9FAFB',
    grid: '#374151',
    primary: '#60A5FA',
    secondary: '#34D399'
  },
  
  business: {
    background: '#FFFFFF',
    text: '#111827',
    grid: '#D1D5DB',
    primary: '#1E40AF',
    secondary: '#059669'
  }
};

// Hooks para usar con los gráficos
export const useChartData = (initialData = []) => {
  const [data, setData] = React.useState(initialData);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const updateData = React.useCallback((newData) => {
    setData(newData);
  }, []);

  const addDataPoint = React.useCallback((point) => {
    setData(prev => [...prev, point]);
  }, []);

  const removeDataPoint = React.useCallback((index) => {
    setData(prev => prev.filter((_, i) => i !== index));
  }, []);

  return {
    data,
    loading,
    error,
    updateData,
    addDataPoint,
    removeDataPoint,
    setLoading,
    setError
  };
};