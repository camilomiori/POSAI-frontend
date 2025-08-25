import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Brush
} from 'recharts';
import { TrendingUp, TrendingDown, Activity, Zap } from 'lucide-react';

const AdvancedChart = ({ 
  data = [], 
  type = 'line', 
  title = 'Gráfico Avanzado',
  subtitle = '',
  height = 400,
  showBrush = false,
  showReferenceLine = false,
  referenceValue = 0,
  aiInsights = true,
  realTime = false,
  className = ''
}) => {
  const [chartData, setChartData] = useState(data);
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState(null);

  // Simulación de datos en tiempo real
  useEffect(() => {
    if (!realTime) return;

    const interval = setInterval(() => {
      setChartData(prev => {
        const newData = [...prev];
        const lastPoint = newData[newData.length - 1];
        const variation = (Math.random() - 0.5) * 0.1;
        
        newData.push({
          ...lastPoint,
          name: new Date().toLocaleTimeString(),
          value: Math.max(0, lastPoint.value * (1 + variation)),
          prediction: lastPoint.prediction * (1 + variation * 0.5)
        });

        // Mantener solo los últimos 20 puntos
        return newData.slice(-20);
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [realTime]);

  // Calcular insights de IA
  const aiAnalysis = useMemo(() => {
    if (!aiInsights || !chartData.length) return null;

    const values = chartData.map(d => d.value || 0);
    const predictions = chartData.map(d => d.prediction || 0);
    
    const trend = values[values.length - 1] > values[0] ? 'up' : 'down';
    const growth = ((values[values.length - 1] - values[0]) / values[0] * 100).toFixed(1);
    const accuracy = predictions.length > 0 ? 
      Math.max(0, 100 - Math.abs((predictions[predictions.length - 1] - values[values.length - 1]) / values[values.length - 1] * 100)).toFixed(1) : 0;

    return {
      trend,
      growth: Math.abs(growth),
      accuracy,
      recommendation: trend === 'up' ? 'Tendencia positiva. Considere aumentar inventario.' : 'Tendencia descendente. Optimice precios o promociones.'
    };
  }, [chartData, aiInsights]);

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;

    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="font-semibold text-gray-800">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 mt-1">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm">
              {entry.name}: <span className="font-semibold">{entry.value?.toLocaleString()}</span>
            </span>
          </div>
        ))}
        {payload[0]?.payload?.prediction && (
          <div className="mt-2 pt-2 border-t">
            <div className="flex items-center gap-1 text-xs text-blue-600">
              <Zap size={12} />
              <span>IA Predicción: {payload[0].payload.prediction.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Renderizar gráfico según tipo
  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    };

    switch (type) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorPrediction" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.6}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
            <YAxis stroke="#6B7280" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#3B82F6" 
              fillOpacity={1} 
              fill="url(#colorValue)"
              name="Valor Real"
            />
            <Area 
              type="monotone" 
              dataKey="prediction" 
              stroke="#10B981" 
              strokeDasharray="5 5"
              fillOpacity={1} 
              fill="url(#colorPrediction)"
              name="Predicción IA"
            />
            {showReferenceLine && (
              <ReferenceLine y={referenceValue} stroke="#EF4444" strokeDasharray="3 3" />
            )}
            {showBrush && <Brush height={30} stroke="#3B82F6" />}
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
            <YAxis stroke="#6B7280" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="value" fill="#3B82F6" name="Valor Real" radius={[2, 2, 0, 0]} />
            <Bar dataKey="prediction" fill="#10B981" name="Predicción IA" radius={[2, 2, 0, 0]} opacity={0.7} />
            {showReferenceLine && (
              <ReferenceLine y={referenceValue} stroke="#EF4444" strokeDasharray="3 3" />
            )}
          </BarChart>
        );

      default: // line
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
            <YAxis stroke="#6B7280" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#3B82F6" 
              strokeWidth={2}
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
              name="Valor Real"
            />
            <Line 
              type="monotone" 
              dataKey="prediction" 
              stroke="#10B981" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2 }}
              name="Predicción IA"
            />
            {showReferenceLine && (
              <ReferenceLine y={referenceValue} stroke="#EF4444" strokeDasharray="3 3" />
            )}
            {showBrush && <Brush height={30} stroke="#3B82F6" />}
          </LineChart>
        );
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border p-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            {realTime && <Activity className="w-5 h-5 text-green-500 animate-pulse" />}
            {title}
          </h3>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>

        {/* AI Insights Panel */}
        {aiAnalysis && (
          <div className="text-right">
            <div className="flex items-center gap-1 text-sm">
              {aiAnalysis.trend === 'up' ? 
                <TrendingUp className="w-4 h-4 text-green-500" /> : 
                <TrendingDown className="w-4 h-4 text-red-500" />
              }
              <span className={aiAnalysis.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                {aiAnalysis.growth}%
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Precisión IA: {aiAnalysis.accuracy}%
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      <div style={{ height: height }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>

      {/* AI Recommendation */}
      {aiAnalysis && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-2">
            <Zap className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-900">Recomendación de IA</p>
              <p className="text-xs text-blue-700 mt-1">{aiAnalysis.recommendation}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-xl">
          <div className="flex items-center gap-2 text-blue-600">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Actualizando datos...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedChart;