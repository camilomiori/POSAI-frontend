import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Brush
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Zap, 
  AlertCircle, 
  Target,
  BarChart3,
  Activity
} from 'lucide-react';

const LineChart = ({ 
  data = [], 
  title = 'Gráfico de Líneas',
  subtitle = '',
  height = 400,
  showGrid = true,
  showBrush = false,
  showTrend = true,
  aiPrediction = true,
  realTimeMode = false,
  anomalyDetection = true,
  compareMode = false,
  className = ''
}) => {
  const [chartData, setChartData] = useState(data);
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [showAnomalies, setShowAnomalies] = useState(true);

  // Actualización en tiempo real
  useEffect(() => {
    if (!realTimeMode) return;

    const interval = setInterval(() => {
      setChartData(prevData => {
        const newData = [...prevData];
        const lastPoint = newData[newData.length - 1];
        const timestamp = new Date();
        
        // Simular variación realista
        const baseValue = lastPoint?.value || 100;
        const variation = (Math.random() - 0.5) * 0.15; // ±15%
        const newValue = Math.max(0, baseValue * (1 + variation));

        newData.push({
          name: timestamp.toLocaleTimeString(),
          value: newValue,
          prediction: newValue * (1 + (Math.random() - 0.5) * 0.1),
          timestamp: timestamp.getTime()
        });

        // Mantener últimos 50 puntos
        return newData.slice(-50);
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [realTimeMode]);

  // Análisis de tendencias y anomalías
  const analysis = useMemo(() => {
    if (!chartData.length) return null;

    const values = chartData.map(d => d.value).filter(v => v != null);
    if (values.length < 2) return null;

    // Calcular tendencia
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    const trendPercent = ((secondAvg - firstAvg) / firstAvg * 100);

    // Detectar anomalías
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    const anomalies = chartData
      .map((point, index) => ({
        ...point,
        index,
        isAnomaly: Math.abs(point.value - mean) > 2 * stdDev
      }))
      .filter(point => point.isAnomaly);

    // Calcular volatilidad
    const volatility = (stdDev / mean * 100);

    // Predicción simple (regresión lineal)
    let prediction = null;
    if (values.length >= 3) {
      const lastValues = values.slice(-5);
      const trend = lastValues.reduce((sum, val, idx) => sum + val * (idx + 1), 0) / 
                   lastValues.reduce((sum, _, idx) => sum + (idx + 1), 0);
      prediction = {
        nextValue: trend,
        confidence: Math.max(0, 100 - volatility).toFixed(1)
      };
    }

    return {
      trend: trendPercent > 1 ? 'up' : trendPercent < -1 ? 'down' : 'stable',
      trendPercent: Math.abs(trendPercent).toFixed(1),
      volatility: volatility.toFixed(1),
      anomalies,
      prediction,
      currentValue: values[values.length - 1],
      avgValue: mean.toFixed(0),
      maxValue: Math.max(...values),
      minValue: Math.min(...values)
    };
  }, [chartData]);

  // Filtrar datos por período
  const filteredData = useMemo(() => {
    if (selectedPeriod === 'all') return chartData;
    
    const now = new Date();
    const periods = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000
    };
    
    const cutoff = now.getTime() - periods[selectedPeriod];
    return chartData.filter(d => d.timestamp > cutoff);
  }, [chartData, selectedPeriod]);

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;

    const data = payload[0].payload;
    const isAnomaly = analysis?.anomalies.some(a => a.index === data.index);

    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg max-w-xs">
        <p className="font-semibold text-gray-800 mb-2">{label}</p>
        
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm">
              {entry.name}: <span className="font-semibold">{entry.value?.toLocaleString()}</span>
            </span>
          </div>
        ))}

        {isAnomaly && (
          <div className="mt-2 pt-2 border-t">
            <div className="flex items-center gap-1 text-xs text-orange-600">
              <AlertCircle size={12} />
              <span>Anomalía detectada</span>
            </div>
          </div>
        )}

        {data.prediction && (
          <div className="mt-2 pt-2 border-t">
            <div className="flex items-center gap-1 text-xs text-blue-600">
              <Zap size={12} />
              <span>Predicción: {data.prediction.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Calcular línea de tendencia
  const trendLineData = useMemo(() => {
    if (!showTrend || !filteredData.length) return [];
    
    const values = filteredData.map(d => d.value);
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, val, idx) => sum + val * idx, 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return filteredData.map((_, idx) => ({
      name: filteredData[idx].name,
      trendValue: intercept + slope * idx
    }));
  }, [filteredData, showTrend]);

  return (
    <div className={`bg-white rounded-xl shadow-sm border p-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            {realTimeMode && <Activity className="w-5 h-5 text-green-500 animate-pulse" />}
            {title}
          </h3>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="text-sm border rounded-lg px-3 py-1 bg-white"
          >
            <option value="all">Todo el período</option>
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
          </select>

          {/* Toggle Anomalies */}
          {anomalyDetection && analysis?.anomalies.length > 0 && (
            <button
              onClick={() => setShowAnomalies(!showAnomalies)}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                showAnomalies ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <AlertCircle size={14} />
              Anomalías
            </button>
          )}
        </div>
      </div>

      {/* Stats Row */}
      {analysis && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              {analysis.trend === 'up' ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : analysis.trend === 'down' ? (
                <TrendingDown className="w-4 h-4 text-red-500" />
              ) : (
                <Minus className="w-4 h-4 text-gray-500" />
              )}
              <span className={`text-sm font-semibold ${
                analysis.trend === 'up' ? 'text-green-600' : 
                analysis.trend === 'down' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {analysis.trendPercent}%
              </span>
            </div>
            <p className="text-xs text-gray-500">Tendencia</p>
          </div>

          <div className="text-center">
            <p className="text-sm font-semibold text-gray-900">{analysis.currentValue.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Actual</p>
          </div>

          <div className="text-center">
            <p className="text-sm font-semibold text-gray-900">{analysis.avgValue}</p>
            <p className="text-xs text-gray-500">Promedio</p>
          </div>

          <div className="text-center">
            <p className={`text-sm font-semibold ${
              parseFloat(analysis.volatility) > 20 ? 'text-orange-600' : 'text-green-600'
            }`}>
              {analysis.volatility}%
            </p>
            <p className="text-xs text-gray-500">Volatilidad</p>
          </div>
        </div>
      )}

      {/* Chart */}
      <div style={{ height: height }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLineChart
            data={filteredData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
            <XAxis 
              dataKey="name" 
              stroke="#6B7280" 
              fontSize={12}
              tick={{ fontSize: 11 }}
            />
            <YAxis 
              stroke="#6B7280" 
              fontSize={12}
              tick={{ fontSize: 11 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />

            {/* Línea principal */}
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#3B82F6" 
              strokeWidth={2}
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5, stroke: '#3B82F6', strokeWidth: 2 }}
              name="Valor"
            />

            {/* Línea de predicción IA */}
            {aiPrediction && (
              <Line 
                type="monotone" 
                dataKey="prediction" 
                stroke="#10B981" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#10B981', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, stroke: '#10B981', strokeWidth: 2 }}
                name="Predicción IA"
              />
            )}

            {/* Línea de tendencia */}
            {showTrend && trendLineData.length > 0 && (
              <Line 
                type="monotone" 
                dataKey="trendValue" 
                data={trendLineData}
                stroke="#8B5CF6" 
                strokeWidth={1}
                strokeDasharray="2 2"
                dot={false}
                activeDot={false}
                name="Tendencia"
              />
            )}

            {/* Líneas de referencia */}
            {analysis && (
              <>
                <ReferenceLine 
                  y={analysis.avgValue} 
                  stroke="#6B7280" 
                  strokeDasharray="2 2" 
                  label={{ value: "Promedio", position: "insideTopRight" }}
                />
                {analysis.anomalies.length > 0 && showAnomalies && (
                  <ReferenceArea
                    y1={analysis.avgValue - 2 * (analysis.maxValue - analysis.minValue) / 10}
                    y2={analysis.avgValue + 2 * (analysis.maxValue - analysis.minValue) / 10}
                    fill="#FEF3C7"
                    fillOpacity={0.3}
                  />
                )}
              </>
            )}

            {/* Brush para navegación */}
            {showBrush && <Brush height={30} stroke="#3B82F6" />}
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>

      {/* AI Insights */}
      {analysis && (
        <div className="mt-6 space-y-3">
          {/* Prediction */}
          {analysis.prediction && (
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Predicción próximo período</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-blue-900">
                  {analysis.prediction.nextValue.toLocaleString()}
                </p>
                <p className="text-xs text-blue-700">
                  Confianza: {analysis.prediction.confidence}%
                </p>
              </div>
            </div>
          )}

          {/* Anomalies Alert */}
          {analysis.anomalies.length > 0 && (
            <div className="flex items-start gap-2 p-3 bg-orange-50 rounded-lg">
              <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-orange-900">
                  {analysis.anomalies.length} anomalía(s) detectada(s)
                </p>
                <p className="text-xs text-orange-700 mt-1">
                  Valores fuera del rango normal. Revisar causas posibles.
                </p>
              </div>
            </div>
          )}

          {/* Recommendation */}
          <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
            <Target className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-900">Recomendación</p>
              <p className="text-xs text-green-700 mt-1">
                {analysis.trend === 'up' 
                  ? 'Tendencia positiva sostenida. Considerar escalar operaciones.'
                  : analysis.trend === 'down'
                  ? 'Tendencia descendente. Implementar estrategias correctivas.'
                  : 'Comportamiento estable. Mantener monitoreo continuo.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LineChart;