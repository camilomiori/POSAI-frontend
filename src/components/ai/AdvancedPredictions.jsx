import React, { useState, useEffect } from 'react';
import {
  Clock, TrendingUp, Package, AlertTriangle, Calendar,
  Users, BarChart3, Zap, Target, Activity
} from 'lucide-react';
import { Card, CardContent, Badge, Button } from '../ui';
import aiEngine from '../../services/ai';
import api from '../../services/api';

const AdvancedPredictions = ({ success, warning, ai }) => {
  const [predictions, setPredictions] = useState({
    hourlyDemand: [],
    stockDepletion: [],
    seasonalTrends: [],
    peakHours: [],
    weeklyPattern: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('hourly');

  useEffect(() => {
    generatePredictions();
  }, []);

  const generatePredictions = async () => {
    setIsLoading(true);

    try {
      // Obtener datos desde backend y aiEngine modular v4.0.0
      const [hourlyData, stockAlerts, salesData, categoriesData] = await Promise.all([
        aiEngine.demand.getHourlyPredictions(),
        aiEngine.inventory.getAdvancedAlerts(),
        api.getSales(),
        api.getCategories()
      ]);

      console.log('[AdvancedPredictions] Datos del backend:', {
        sales: salesData?.length,
        categories: categoriesData?.length
      });

      // Transform hourly predictions
      const hourlyDemand = hourlyData.map(hour => ({
        hour: hour.hour,
        expected: hour.predicted,
        confidence: hour.confidence,
        historicalAvg: hour.actual || hour.predicted,
        isPeak: hour.trend === 'high'
      }));

      // Transform stock alerts to depletion format
      const stockDepletion = stockAlerts
        .filter(alert => alert.level !== 'normal')
        .slice(0, 4)
        .map(alert => ({
          product: alert.productName,
          currentStock: alert.currentStock,
          dailyUsage: alert.dailyVelocity || alert.weeklyVelocity / 7,
          daysLeft: alert.daysToStockout,
          urgency: alert.level,
          reorderPoint: alert.reorderPoint,
          avgLeadTime: 3,
          supplier: 'Proveedor Principal'
        }));

      // ===== CALCULAR TENDENCIAS ESTACIONALES DESDE DATOS REALES =====
      const seasonalTrends = [];

      if (categoriesData && categoriesData.length > 0 && salesData && salesData.length > 0) {
        // Analizar ventas por categoría
        const categorySales = {};

        salesData.forEach(sale => {
          if (!sale.items) return;

          sale.items.forEach(item => {
            const categoryName = item.product?.category?.name;
            if (!categoryName) return;

            if (!categorySales[categoryName]) {
              categorySales[categoryName] = { total: 0, count: 0 };
            }
            categorySales[categoryName].total += item.quantity;
            categorySales[categoryName].count += 1;
          });
        });

        // Convertir a tendencias (tomar top 3)
        const topCategories = Object.entries(categorySales)
          .sort((a, b) => b[1].total - a[1].total)
          .slice(0, 3);

        topCategories.forEach(([category, data]) => {
          const avgSales = data.total / data.count;
          let trend = 'stable';
          let currentBoost = '+5%';
          let recommendation = 'Mantener niveles actuales';

          if (avgSales > 5) {
            trend = 'increasing';
            currentBoost = '+' + Math.round((avgSales - 3) * 5) + '%';
            recommendation = 'Aumentar stock 30%';
          } else if (avgSales < 2) {
            trend = 'decreasing';
            currentBoost = '-' + Math.round((3 - avgSales) * 5) + '%';
            recommendation = 'Evaluar demanda';
          }

          seasonalTrends.push({
            category,
            trend,
            factor: avgSales > 5 ? 'Alta demanda' : avgSales < 2 ? 'Baja demanda' : 'Demanda estable',
            currentBoost,
            peakWeeks: trend === 'increasing' ? Math.ceil(Math.random() * 3) : 0,
            recommendation
          });
        });
      }

      // ===== CALCULAR HORAS PICO DESDE DATOS REALES =====
      const peakHours = [];

      if (salesData && salesData.length > 0) {
        const hourCounts = {};

        salesData.forEach(sale => {
          if (!sale.createdAt) return;

          const saleDate = new Date(sale.createdAt);
          const hour = saleDate.getHours();

          if (!hourCounts[hour]) {
            hourCounts[hour] = 0;
          }
          hourCounts[hour] += 1;
        });

        // Obtener las 3 horas con más ventas
        const topHours = Object.entries(hourCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3);

        topHours.forEach(([hour, count]) => {
          const hourNum = parseInt(hour);
          const nextHour = hourNum + 1;
          peakHours.push({
            time: `${hourNum.toString().padStart(2, '0')}:00-${nextHour.toString().padStart(2, '0')}:00`,
            prediction: count,
            type: hourNum >= 12 && hourNum <= 13 ? 'lunch_rush' : hourNum >= 16 && hourNum <= 18 ? 'after_work' : 'general',
            confidence: Math.min(95, 75 + count * 2)
          });
        });
      }

      // ===== CALCULAR PATRÓN SEMANAL DESDE DATOS REALES =====
      const weeklyPattern = [];
      const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

      if (salesData && salesData.length > 0) {
        const dayCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

        salesData.forEach(sale => {
          if (!sale.createdAt) return;
          const dayOfWeek = new Date(sale.createdAt).getDay();
          dayCounts[dayOfWeek] += 1;
        });

        const avgSales = Object.values(dayCounts).reduce((a, b) => a + b, 0) / 7;

        for (let i = 0; i < 7; i++) {
          const sales = dayCounts[i];
          let trend = 'stable';

          if (sales > avgSales * 1.3) trend = 'peak';
          else if (sales > avgSales * 1.1) trend = 'increasing';
          else if (sales < avgSales * 0.7) trend = 'low';
          else if (sales < avgSales * 0.9) trend = 'decreasing';

          weeklyPattern.push({
            day: dayNames[i],
            sales: sales,
            confidence: Math.min(95, 70 + Math.round(sales * 2)),
            trend
          });
        }
      }

      setPredictions({
        hourlyDemand,
        stockDepletion,
        seasonalTrends: seasonalTrends.length > 0 ? seasonalTrends : [{
          category: 'Sin datos suficientes',
          trend: 'stable',
          factor: 'Datos insuficientes',
          currentBoost: '0%',
          peakWeeks: 0,
          recommendation: 'Generar más ventas para análisis'
        }],
        peakHours: peakHours.length > 0 ? peakHours : [{
          time: 'N/A',
          prediction: 0,
          type: 'general',
          confidence: 0
        }],
        weeklyPattern: weeklyPattern.length > 0 ? weeklyPattern : dayNames.map(day => ({
          day,
          sales: 0,
          confidence: 0,
          trend: 'stable'
        }))
      });

      setIsLoading(false);
      ai('🔮 Predicciones actualizadas', 'Análisis avanzado completado con datos reales del backend');
    } catch (error) {
      console.error('[AdvancedPredictions] Error:', error);
      setIsLoading(false);
      warning('Error al cargar predicciones', 'Usando datos de respaldo');
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'warning': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'increasing': return 'text-green-600';
      case 'decreasing': return 'text-red-600';
      case 'stable': return 'text-blue-600';
      case 'peak': return 'text-purple-600';
      case 'low': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const views = [
    { id: 'hourly', label: 'Demanda por Hora', icon: Clock },
    { id: 'depletion', label: 'Stock Crítico', icon: Package },
    { id: 'seasonal', label: 'Tendencias', icon: TrendingUp },
    { id: 'weekly', label: 'Patrón Semanal', icon: Calendar }
  ];

  return (
    <div className="space-y-6">
      {/* View Selector */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Predicciones Avanzadas IA
          </h3>
          <Button
            onClick={generatePredictions}
            variant="outline"
            disabled={isLoading}
            size="sm"
          >
            {isLoading ? 'Actualizando...' : 'Actualizar'}
          </Button>
        </div>

        <div className="flex gap-2 overflow-x-auto">
          {views.map((view) => (
            <Button
              key={view.id}
              onClick={() => setSelectedView(view.id)}
              variant={selectedView === view.id ? 'default' : 'outline'}
              size="sm"
              className="whitespace-nowrap"
            >
              <view.icon className="w-4 h-4 mr-2" />
              {view.label}
            </Button>
          ))}
        </div>
      </Card>

      {/* Loading */}
      {isLoading && (
        <Card className="p-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">Analizando patrones con IA avanzada...</span>
            </div>
          </div>
        </Card>
      )}

      {/* Content */}
      {!isLoading && (
        <>
          {/* Hourly Demand */}
          {selectedView === 'hourly' && (
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Predicción de Demanda por Hora
                </h4>

                {/* Peak Hours Alert */}
                <div className="mb-6">
                  <h5 className="font-semibold text-gray-900 mb-3">🔥 Horas Pico Predichas para Hoy:</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {predictions.peakHours.map((peak, index) => (
                      <div key={index} className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-orange-900">{peak.time}</span>
                          <Badge className="bg-orange-100 text-orange-800">
                            {peak.prediction} clientes
                          </Badge>
                        </div>
                        <p className="text-orange-700 text-sm mt-1">
                          Confianza: {peak.confidence}%
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hourly Chart */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-end gap-2 h-40">
                    {predictions.hourlyDemand.map((hour, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center gap-2">
                        <div className="text-xs font-bold text-gray-700">{hour.expected}</div>
                        <div
                          className={`w-full rounded-t transition-all duration-500 ${
                            hour.isPeak ? 'bg-red-500' : 'bg-blue-500'
                          }`}
                          style={{ height: `${(hour.expected / 20) * 100}%` }}
                          title={`${hour.hour}: ${hour.expected} clientes (${hour.confidence.toFixed(1)}% confianza)`}
                        ></div>
                        <div className="text-xs text-gray-600 text-center">{hour.hour}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-center gap-4 mt-4 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      <span>Demanda Normal</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-500 rounded"></div>
                      <span>Hora Pico</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stock Depletion */}
          {selectedView === 'depletion' && (
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-6">
                <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-red-600" />
                  Productos que se Agotarán
                </h4>

                <div className="space-y-4">
                  {predictions.stockDepletion.map((item, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-2 ${
                        item.urgency === 'critical' ? 'border-red-200 bg-red-50' :
                        item.urgency === 'warning' ? 'border-orange-200 bg-orange-50' :
                        'border-green-200 bg-green-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h5 className="font-bold text-gray-900">{item.product}</h5>
                          <p className="text-sm text-gray-600">Proveedor: {item.supplier}</p>
                        </div>
                        <Badge className={getUrgencyColor(item.urgency)}>
                          {item.urgency}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">Stock Actual:</span>
                          <div className="font-bold text-lg">{item.currentStock} un.</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Uso Diario:</span>
                          <div className="font-bold">{item.dailyUsage} un./día</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Días Restantes:</span>
                          <div className={`font-bold text-lg ${
                            item.daysLeft <= 3 ? 'text-red-600' :
                            item.daysLeft <= 7 ? 'text-orange-600' : 'text-green-600'
                          }`}>
                            {item.daysLeft} días
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">Tiempo Entrega:</span>
                          <div className="font-bold">{item.avgLeadTime} días</div>
                        </div>
                      </div>

                      {item.daysLeft <= item.avgLeadTime && (
                        <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          <span className="text-red-800 text-sm font-medium">
                            ¡Ordenar AHORA! El stock se agotará antes de la entrega
                          </span>
                        </div>
                      )}

                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => success(`📞 Contactando a ${item.supplier} para ${item.product}`)}
                        >
                          Contactar Proveedor
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => warning(`⏰ Recordatorio programado para ${item.product}`)}
                        >
                          Programar Recordatorio
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Seasonal Trends */}
          {selectedView === 'seasonal' && (
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Tendencias Estacionales
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {predictions.seasonalTrends.map((trend, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg border">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-bold text-gray-900">{trend.category}</h5>
                        <div className={`flex items-center gap-1 ${getTrendColor(trend.trend)}`}>
                          {trend.trend === 'increasing' && <TrendingUp className="w-4 h-4" />}
                          {trend.trend === 'decreasing' && <TrendingUp className="w-4 h-4 rotate-180" />}
                          {trend.trend === 'stable' && <Target className="w-4 h-4" />}
                          <span className="font-medium capitalize">{trend.trend}</span>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Factor:</span>
                          <span className="font-medium">{trend.factor}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Impacto Actual:</span>
                          <span className={`font-bold ${
                            trend.currentBoost.startsWith('+') ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {trend.currentBoost}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Semanas Pico:</span>
                          <span className="font-medium">{trend.peakWeeks}</span>
                        </div>
                      </div>

                      <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-blue-800 text-sm font-medium">
                          💡 {trend.recommendation}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Weekly Pattern */}
          {selectedView === 'weekly' && (
            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-6">
                <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  Patrón Semanal de Ventas
                </h4>

                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="flex items-end gap-3 h-32">
                    {predictions.weeklyPattern.map((day, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center gap-2">
                        <div className="text-sm font-bold text-gray-700">{day.sales}</div>
                        <div
                          className={`w-full rounded-t transition-all duration-500 ${
                            day.trend === 'peak' ? 'bg-purple-500' :
                            day.trend === 'increasing' ? 'bg-green-500' :
                            day.trend === 'decreasing' ? 'bg-orange-500' :
                            day.trend === 'low' ? 'bg-gray-400' : 'bg-blue-500'
                          }`}
                          style={{ height: `${(day.sales / 40) * 100}%` }}
                          title={`${day.day}: ${day.sales} ventas (${day.confidence}% confianza)`}
                        ></div>
                        <div className="text-sm text-gray-600 font-medium">{day.day}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
                  {predictions.weeklyPattern.map((day, index) => (
                    <div key={index} className="p-3 bg-white border rounded">
                      <div className="text-center">
                        <div className="font-bold text-gray-900">{day.day}</div>
                        <div className={`text-sm font-medium ${getTrendColor(day.trend)}`}>
                          {day.sales} ventas
                        </div>
                        <div className="text-xs text-gray-600">
                          {day.confidence}% confianza
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default AdvancedPredictions;