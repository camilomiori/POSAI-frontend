import React, { useState, useMemo } from 'react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, Target, Zap } from 'lucide-react';

const PieChart = ({ 
  data = [], 
  title = 'Distribución',
  subtitle = '',
  height = 400,
  showPercentages = true,
  showLegend = true,
  showLabels = true,
  aiAnalysis = true,
  colorScheme = 'default',
  className = ''
}) => {
  const [activeIndex, setActiveIndex] = useState(null);

  // Esquemas de colores predefinidos
  const colorSchemes = {
    default: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'],
    business: ['#1E40AF', '#059669', '#D97706', '#DC2626', '#7C3AED', '#EA580C', '#0891B2', '#65A30D'],
    pastel: ['#93C5FD', '#86EFAC', '#FDE68A', '#FCA5A5', '#C4B5FD', '#FDBA74', '#7DD3FC', '#BEF264'],
    dark: ['#1F2937', '#374151', '#4B5563', '#6B7280', '#9CA3AF', '#D1D5DB', '#E5E7EB', '#F3F4F6']
  };

  const colors = colorSchemes[colorScheme] || colorSchemes.default;

  // Calcular totales y porcentajes
  const processedData = useMemo(() => {
    const total = data.reduce((sum, item) => sum + (item.value || 0), 0);
    
    return data.map((item, index) => ({
      ...item,
      percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : 0,
      color: colors[index % colors.length]
    })).sort((a, b) => b.value - a.value);
  }, [data, colors]);

  // Análisis de IA
  const insights = useMemo(() => {
    if (!aiAnalysis || !processedData.length) return null;

    const total = processedData.reduce((sum, item) => sum + item.value, 0);
    const topItem = processedData[0];
    const bottomItem = processedData[processedData.length - 1];
    
    // Detectar concentración (Principio de Pareto)
    const top20Percent = Math.ceil(processedData.length * 0.2);
    const top20Value = processedData.slice(0, top20Percent).reduce((sum, item) => sum + item.value, 0);
    const concentration = (top20Value / total * 100).toFixed(1);

    // Detectar desequilibrios
    const avgValue = total / processedData.length;
    const imbalanced = processedData.filter(item => item.value > avgValue * 2).length;

    return {
      topItem,
      bottomItem,
      concentration,
      isConcentrated: concentration > 80,
      hasImbalance: imbalanced > 0,
      diversityScore: (processedData.length / (1 + imbalanced)).toFixed(1),
      recommendation: concentration > 80 ? 
        'Alta concentración detectada. Considere diversificar.' : 
        'Distribución balanceada. Mantener estrategia actual.'
    };
  }, [processedData, aiAnalysis]);

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;

    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: data.color }}
          />
          <span className="font-semibold text-gray-800">{data.name}</span>
        </div>
        <div className="space-y-1 text-sm">
          <p>Valor: <span className="font-semibold">{data.value.toLocaleString()}</span></p>
          <p>Porcentaje: <span className="font-semibold">{data.percentage}%</span></p>
          {data.trend && (
            <div className="flex items-center gap-1 text-xs">
              {data.trend > 0 ? 
                <TrendingUp className="w-3 h-3 text-green-500" /> : 
                <TrendingDown className="w-3 h-3 text-red-500" />
              }
              <span className={data.trend > 0 ? 'text-green-600' : 'text-red-600'}>
                {Math.abs(data.trend)}% vs mes anterior
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Label personalizado
  const renderCustomLabel = (entry) => {
    if (!showLabels || entry.percentage < 5) return '';
    return showPercentages ? `${entry.percentage}%` : entry.name;
  };

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border p-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>

        {/* Quick Stats */}
        {insights && (
          <div className="text-right">
            <div className="flex items-center gap-1 text-sm">
              <Target className="w-4 h-4 text-blue-500" />
              <span className="text-gray-600">Concentración: </span>
              <span className={insights.isConcentrated ? 'text-orange-600 font-semibold' : 'text-green-600'}>
                {insights.concentration}%
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Diversidad: {insights.diversityScore}/10
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Chart */}
        <div className="flex-1" style={{ height: height }}>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={processedData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={Math.min(height * 0.35, 120)}
                fill="#8884d8"
                dataKey="value"
                onMouseEnter={onPieEnter}
                onMouseLeave={onPieLeave}
              >
                {processedData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    stroke={activeIndex === index ? "#374151" : "none"}
                    strokeWidth={activeIndex === index ? 2 : 0}
                    style={{ 
                      filter: activeIndex === index ? 'brightness(1.1)' : 'brightness(1)',
                      transform: activeIndex === index ? 'scale(1.02)' : 'scale(1)',
                      transformOrigin: 'center',
                      transition: 'all 0.2s ease-in-out'
                    }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend/Stats Panel */}
        {showLegend && (
          <div className="lg:w-80">
            <div className="space-y-3">
              {processedData.map((item, index) => (
                <div 
                  key={item.name}
                  className={`flex items-center justify-between p-3 rounded-lg transition-all cursor-pointer ${
                    activeIndex === index ? 'bg-gray-50 shadow-sm' : 'hover:bg-gray-25'
                  }`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: item.color }}
                    />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                      {item.category && (
                        <p className="text-xs text-gray-500">{item.category}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold text-sm">{item.percentage}%</p>
                    <p className="text-xs text-gray-500">{item.value.toLocaleString()}</p>
                    {item.trend && (
                      <div className="flex items-center gap-1 justify-end mt-1">
                        {item.trend > 0 ? 
                          <TrendingUp className="w-3 h-3 text-green-500" /> : 
                          <TrendingDown className="w-3 h-3 text-red-500" />
                        }
                        <span className={`text-xs ${item.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {Math.abs(item.trend)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* AI Insights Panel */}
      {insights && (
        <div className="mt-6 space-y-3">
          {/* Top Performer */}
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-900">Top Performer</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-green-900">{insights.topItem.name}</p>
              <p className="text-xs text-green-700">{insights.topItem.percentage}% del total</p>
            </div>
          </div>

          {/* Concentration Alert */}
          {insights.isConcentrated && (
            <div className="flex items-start gap-2 p-3 bg-orange-50 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-orange-900">Alta Concentración</p>
                <p className="text-xs text-orange-700 mt-1">
                  El {insights.concentration}% está concentrado en pocos elementos. Considere diversificar.
                </p>
              </div>
            </div>
          )}

          {/* AI Recommendation */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
            <Zap className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-900">Recomendación de IA</p>
              <p className="text-xs text-blue-700 mt-1">{insights.recommendation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PieChart;