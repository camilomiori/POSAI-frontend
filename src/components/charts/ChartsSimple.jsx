import React from 'react';
import {
  LineChart as RechartsLineChart,
  BarChart as RechartsBarChart,
  PieChart as RechartsPieChart,
  Line,
  Bar,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
  ReferenceLine
} from 'recharts';

const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899',
  '#06B6D4', '#84CC16', '#F97316', '#6366F1'
];

export const AdvancedChart = ({ 
  data = [], 
  type = 'line', 
  height = 300, 
  title, 
  aiInsights = false,
  showBrush = false,
  ...props 
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="w-full flex items-center justify-center" style={{ height }}>
        <div className="text-center text-gray-500">
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
            <span className="text-gray-400">📊</span>
          </div>
          <p className="text-sm">Sin datos disponibles</p>
        </div>
      </div>
    );
  }

  const formatValue = (value) => {
    if (value >= 1000000) {
      return `€${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `€${(value / 1000).toFixed(0)}K`;
    }
    return `€${value}`;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatDate}
            fontSize={12}
            stroke="#666"
          />
          <YAxis 
            tickFormatter={formatValue}
            fontSize={12}
            stroke="#666"
          />
          <Tooltip 
            formatter={(value, name) => [formatValue(value), name === 'value' ? 'Ventas' : name]}
            labelFormatter={formatDate}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#3B82F6" 
            strokeWidth={3}
            dot={{ r: 4, fill: '#3B82F6' }}
            activeDot={{ r: 6, fill: '#1D4ED8' }}
            name="Ventas"
          />
          {aiInsights && (
            <ReferenceLine 
              y={200000} 
              stroke="#10B981" 
              strokeDasharray="5 5" 
              label={{ value: "Objetivo IA", position: "topRight" }}
            />
          )}
          {showBrush && <Brush dataKey="date" height={30} stroke="#8884d8" />}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};

export const PieChart = ({ 
  data = [], 
  height = 300, 
  title, 
  aiAnalysis = false,
  showPercentages = false,
  ...props 
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="w-full flex items-center justify-center" style={{ height }}>
        <div className="text-center text-gray-500">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
            <span className="text-gray-400">🥧</span>
          </div>
          <p className="text-sm">Sin datos disponibles</p>
        </div>
      </div>
    );
  }

  const formatValue = (value) => {
    if (value >= 1000000) {
      return `€${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `€${(value / 1000).toFixed(0)}K`;
    }
    return `€${value}`;
  };

  const renderLabel = (entry) => {
    if (showPercentages) {
      return `${entry.name}: ${entry.percentage}%`;
    }
    return entry.name;
  };

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color || COLORS[index % COLORS.length]} 
              />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value, name) => [formatValue(value), name]}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Legend />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const LineChart = ({ 
  data = [], 
  height = 300, 
  title, 
  ...props 
}) => {
  return (
    <AdvancedChart 
      data={data} 
      type="line" 
      height={height} 
      title={title} 
      {...props} 
    />
  );
};

export const BarChart = ({ 
  data = [], 
  height = 300, 
  title, 
  orientation = 'vertical',
  aiRanking = false,
  colorScheme = 'default',
  ...props 
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="w-full flex items-center justify-center" style={{ height }}>
        <div className="text-center text-gray-500">
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
            <span className="text-gray-400">📊</span>
          </div>
          <p className="text-sm">Sin datos disponibles</p>
        </div>
      </div>
    );
  }

  const formatValue = (value) => {
    if (value >= 1000000) {
      return `€${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `€${(value / 1000).toFixed(0)}K`;
    }
    return `€${value}`;
  };

  const getBarColor = (index, value) => {
    if (colorScheme === 'performance') {
      const maxValue = Math.max(...data.map(d => d.sales || d.value || 0));
      const ratio = (value || 0) / maxValue;
      if (ratio > 0.8) return '#10B981'; // Verde para alto rendimiento
      if (ratio > 0.5) return '#F59E0B'; // Amarillo para medio
      return '#EF4444'; // Rojo para bajo
    }
    return COLORS[index % COLORS.length];
  };

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart 
          data={data} 
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="hour" 
            fontSize={12}
            stroke="#666"
          />
          <YAxis 
            tickFormatter={formatValue}
            fontSize={12}
            stroke="#666"
          />
          <Tooltip 
            formatter={(value, name) => [
              formatValue(value), 
              name === 'sales' ? 'Ventas' : name
            ]}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Legend />
          <Bar 
            dataKey="sales" 
            name="Ventas"
            radius={[4, 4, 0, 0]}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={getBarColor(index, entry.sales)}
              />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};
