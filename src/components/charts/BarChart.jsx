import React, { useState, useMemo } from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Award, 
  AlertTriangle, 
  Target,
  Zap,
  BarChart3,
  Filter,
  ArrowUpDown
} from 'lucide-react';

const BarChart = ({ 
  data = [], 
  title = 'Gráfico de Barras',
  subtitle = '',
  height = 400,
  orientation = 'vertical', // 'vertical' | 'horizontal'
  showComparison = false,
  showTarget = false,
  targetValue = 0,
  aiRanking = true,
  colorScheme = 'default',
  groupBy = null,
  sortBy = 'value',
  sortOrder = 'desc',
  showBenchmark = false,
  className = ''
}) => {
  const [sortConfig, setSortConfig] = useState({ key: sortBy, direction: sortOrder });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showOnlyTopPerformers, setShowOnlyTopPerformers] = useState(false);

  // Esquemas de colores
  const colorSchemes = {
    default: '#3B82F6',
    performance: (value, avg) => value > avg ? '#10B981' : value > avg * 0.8 ? '#F59E0B' : '#EF4444',
    gradient: ['#3B82F6', '#1E40AF', '#1D4ED8', '#2563EB', '#3B82F6'],
    category: {
      'A': '#10B981', 'B': '#3B82F6', 'C': '#F59E0B', 'D': '#EF4444',
      'high': '#10B981', 'medium': '#F59E0B', 'low': '#EF4444'
    }
  };

  // Procesar y analizar datos
  const processedData = useMemo(() => {
    let processed = [...data];

    // Filtrar por categoría si está seleccionada
    if (selectedCategory !== 'all' && groupBy) {
      processed = processed.filter(item => item[groupBy] === selectedCategory);
    }

    // Calcular estadísticas
    const values = processed.map(d => d.value || 0);
    const total = values.reduce((sum, val) => sum + val, 0);
    const average = total / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);

    // Añadir análisis a cada elemento
    processed = processed.map((item, index) => {
      const value = item.value || 0;
      const percentage = total > 0 ? (value / total * 100) : 0;
      const vsAverage = ((value - average) / average * 100);
      const performance = value > average * 1.2 ? 'high' : value > average * 0.8 ? 'medium' : 'low';
      
      return {
        ...item,
        percentage: percentage.toFixed(1),
        vsAverage: vsAverage.toFixed(1),
        performance,
        rank: 0, // Se calculará después del sorting
        color: typeof colorSchemes[colorScheme] === 'function' 
          ? colorSchemes[colorScheme](value, average)
          : colorSchemes[colorScheme] || colorSchemes.default
      };
    });

    // Ordenar datos
    processed.sort((a, b) => {
      const aVal = a[sortConfig.key] || 0;
      const bVal = b[sortConfig.key] || 0;
      
      if (sortConfig.direction === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });

    // Asignar rankings
    processed = processed.map((item, index) => ({
      ...item,
      rank: index + 1
    }));

    // Filtrar top performers si está activado
    if (showOnlyTopPerformers) {
      const topCount = Math.max(5, Math.ceil(processed.length * 0.3));
      processed = processed.slice(0, topCount);
    }

    return {
      data: processed,
      stats: { total, average, max, min, count: processed.length }
    };
  }, [data, selectedCategory, groupBy, sortConfig, showOnlyTopPerformers, colorScheme]);

  // Análisis de IA
  const aiAnalysis = useMemo(() => {
    if (!aiRanking || !processedData.data.length) return null;

    const { data: items, stats } = processedData;
    
    // Top y bottom performers
    const topPerformer = items[0];
    const bottomPerformer = items[items.length - 1];
    
    // Detectar outliers
    const outliers = items.filter(item => {
      const value = item.value || 0;
      return Math.abs(value - stats.average) > stats.average * 0.5;
    });

    // Analizar distribución
    const highPerformers = items.filter(item => item.performance === 'high').length;
    const distribution = {
      high: ((highPerformers / items.length) * 100).toFixed(1),
      concentrated: (topPerformer.value / stats.total * 100) > 30
    };

    // Recomendaciones
    let recommendations = [];
    if (distribution.concentrated) {
      recommendations.push("Alta concentración en top performer. Diversificar riesgos.");
    }
    if (outliers.length > 0) {
      recommendations.push(`${outliers.length} elementos atípicos detectados. Revisar causas.`);
    }
    if (highPerformers < items.length * 0.2) {
      recommendations.push("Pocos elementos de alto rendimiento. Mejorar estrategia general.");
    }

    return {
      topPerformer,
      bottomPerformer,
      outliers,
      distribution,
      recommendations: recommendations.length > 0 ? recommendations : ["Distribución balanceada. Mantener estrategia actual."]
    };
  }, [processedData, aiRanking]);

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;

    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1">
            <span className="font-semibold text-gray-800">{label}</span>
            {data.rank <= 3 && <Award className="w-4 h-4 text-yellow-500" />}
          </div>
        </div>
        
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Valor:</span>
            <span className="font-semibold">{data.value?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Ranking:</span>
            <span className="font-semibold">#{data.rank}</span>
          </div>
          <div className="flex justify-between">
            <span>% del total:</span>
            <span className="font-semibold">{data.percentage}%</span>
          </div>
          <div className="flex justify-between">
            <span>vs Promedio:</span>
            <span className={`font-semibold ${
              parseFloat(data.vsAverage) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {data.vsAverage > 0 ? '+' : ''}{data.vsAverage}%
            </span>
          </div>
          {data.target && (
            <div className="flex justify-between">
              <span>vs Objetivo:</span>
              <span className={`font-semibold ${
                data.value >= data.target ? 'text-green-600' : 'text-red-600'
              }`}>
                {((data.value / data.target - 1) * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </div>

        {data.performance && (
          <div className="mt-2 pt-2 border-t">
            <div className="flex items-center gap-1 text-xs">
              <div className={`w-2 h-2 rounded-full ${
                data.performance === 'high' ? 'bg-green-500' : 
                data.performance === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <span className="capitalize">{data.performance} Performance</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Obtener categorías únicas para filtro
  const categories = useMemo(() => {
    if (!groupBy) return [];
    return [...new Set(data.map(item => item[groupBy]))].filter(Boolean);
  }, [data, groupBy]);

  // Función para ordenar
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const Chart = orientation === 'horizontal' ? RechartsBarChart : RechartsBarChart;

  return (
    <div className={`bg-white rounded-xl shadow-sm border p-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start mb-6 gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Filter */}
          {categories.length > 0 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-sm border rounded-lg px-3 py-1 bg-white"
            >
              <option value="all">Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          )}

          {/* Sort Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleSort('value')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                sortConfig.key === 'value' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <ArrowUpDown size={12} />
              Valor
            </button>
            <button
              onClick={() => handleSort('name')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                sortConfig.key === 'name' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <ArrowUpDown size={12} />
              Nombre
            </button>
          </div>

          {/* Top Performers Toggle */}
          <button
            onClick={() => setShowOnlyTopPerformers(!showOnlyTopPerformers)}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-colors ${
              showOnlyTopPerformers ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}
          >
            <Filter size={14} />
            Top Only
          </button>
        </div>
      </div>

      {/* Stats Row */}
      {processedData.stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900">{processedData.stats.count}</p>
            <p className="text-xs text-gray-500">Elementos</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900">{processedData.stats.total.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900">{processedData.stats.average.toFixed(0)}</p>
            <p className="text-xs text-gray-500">Promedio</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900">{processedData.stats.max.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Máximo</p>
          </div>
        </div>
      )}

      {/* Chart */}
      <div style={{ height: height }}>
        <ResponsiveContainer width="100%" height="100%">
          <Chart
            data={processedData.data}
            layout={orientation === 'horizontal' ? 'horizontal' : 'vertical'}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            
            {orientation === 'horizontal' ? (
              <>
                <XAxis type="number" stroke="#6B7280" fontSize={12} />
                <YAxis type="category" dataKey="name" stroke="#6B7280" fontSize={12} width={100} />
              </>
            ) : (
              <>
                <XAxis dataKey="name" stroke="#6B7280" fontSize={12} angle={-45} textAnchor="end" height={60} />
                <YAxis stroke="#6B7280" fontSize={12} />
              </>
            )}
            
            <Tooltip content={<CustomTooltip />} />
            <Legend />

            <Bar 
              dataKey="value" 
              name="Valor"
              radius={orientation === 'horizontal' ? [0, 4, 4, 0] : [4, 4, 0, 0]}
            >
              {processedData.data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={Array.isArray(entry.color) ? entry.color[0] : entry.color}
                />
              ))}
            </Bar>

            {/* Comparison bars */}
            {showComparison && (
              <Bar 
                dataKey="comparison" 
                name="Comparación"
                fill="#E5E7EB"
                radius={orientation === 'horizontal' ? [0, 2, 2, 0] : [2, 2, 0, 0]}
              />
            )}

            {/* Reference line for average */}
            <ReferenceLine 
              {...(orientation === 'horizontal' ? { x: processedData.stats.average } : { y: processedData.stats.average })}
              stroke="#6B7280" 
              strokeDasharray="2 2"
              label={{ value: "Promedio", position: "insideTopRight" }}
            />

            {/* Target line */}
            {showTarget && targetValue > 0 && (
              <ReferenceLine 
                {...(orientation === 'horizontal' ? { x: targetValue } : { y: targetValue })}
                stroke="#10B981" 
                strokeDasharray="3 3"
                label={{ value: "Objetivo", position: "insideTopRight" }}
              />
            )}
          </Chart>
        </ResponsiveContainer>
      </div>

      {/* AI Analysis Panel */}
      {aiAnalysis && (
        <div className="mt-6 space-y-3">
          {/* Top Performer */}
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-900">Top Performer</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-green-900">{aiAnalysis.topPerformer.name}</p>
              <p className="text-xs text-green-700">
                {aiAnalysis.topPerformer.value.toLocaleString()} 
                ({aiAnalysis.topPerformer.percentage}%)
              </p>
            </div>
          </div>

          {/* Bottom Performer Alert */}
          {parseFloat(aiAnalysis.bottomPerformer.vsAverage) < -50 && (
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-900">Requiere Atención</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-red-900">{aiAnalysis.bottomPerformer.name}</p>
                <p className="text-xs text-red-700">
                  {aiAnalysis.bottomPerformer.vsAverage}% vs promedio
                </p>
              </div>
            </div>
          )}

          {/* Distribution Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Distribución</span>
              </div>
              <p className="text-xs text-blue-700">
                {aiAnalysis.distribution.high}% elementos alto rendimiento
              </p>
              {aiAnalysis.distribution.concentrated && (
                <p className="text-xs text-blue-700 mt-1">
                  ⚠️ Alta concentración en top performer
                </p>
              )}
            </div>

            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">Outliers</span>
              </div>
              <p className="text-xs text-purple-700">
                {aiAnalysis.outliers.length} elementos atípicos detectados
              </p>
              {aiAnalysis.outliers.length > 0 && (
                <p className="text-xs text-purple-700 mt-1">
                  Mayor: {aiAnalysis.outliers[0]?.name}
                </p>
              )}
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="space-y-2">
            {aiAnalysis.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
                <Zap className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-yellow-900">Recomendación {index + 1}</p>
                  <p className="text-xs text-yellow-700 mt-1">{rec}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Performance Breakdown */}
          {processedData.data.length > 0 && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Distribución de Performance</h4>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="w-full bg-green-200 rounded-full h-2 mb-1">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ 
                        width: `${(processedData.data.filter(d => d.performance === 'high').length / processedData.data.length) * 100}%` 
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-600">Alto</p>
                  <p className="text-sm font-semibold text-green-600">
                    {processedData.data.filter(d => d.performance === 'high').length}
                  </p>
                </div>
                <div>
                  <div className="w-full bg-yellow-200 rounded-full h-2 mb-1">
                    <div 
                      className="bg-yellow-600 h-2 rounded-full" 
                      style={{ 
                        width: `${(processedData.data.filter(d => d.performance === 'medium').length / processedData.data.length) * 100}%` 
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-600">Medio</p>
                  <p className="text-sm font-semibold text-yellow-600">
                    {processedData.data.filter(d => d.performance === 'medium').length}
                  </p>
                </div>
                <div>
                  <div className="w-full bg-red-200 rounded-full h-2 mb-1">
                    <div 
                      className="bg-red-600 h-2 rounded-full" 
                      style={{ 
                        width: `${(processedData.data.filter(d => d.performance === 'low').length / processedData.data.length) * 100}%` 
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-600">Bajo</p>
                  <p className="text-sm font-semibold text-red-600">
                    {processedData.data.filter(d => d.performance === 'low').length}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BarChart;