import React, { useState, useEffect } from 'react';
import { DollarSign, BarChart3, RefreshCw } from 'lucide-react';
import { Button, Badge } from '../ui';
import apiService from '../../services/api';
import aiEngine from '../../services/ai';
import DynamicPricingKPIs from './DynamicPricingKPIs';
import PricingSuggestions from './PricingSuggestions';

const DynamicPricing = ({ success, warning }) => {
  const [products, setProducts] = useState([]);
  const [priceSuggestions, setPriceSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showKPIs, setShowKPIs] = useState(true);

  useEffect(() => {
    loadProductsAndSuggestions();
  }, []);

  const loadProductsAndSuggestions = async () => {
    setLoading(true);

    try {
      // Cargar productos desde la API
      const productsData = await apiService.getProducts();
      setProducts(productsData || []);

      // Generar sugerencias usando el AI Engine modular (API v4.0.0)
      if (productsData && productsData.length > 0) {
        const suggestions = await aiEngine.pricing.getInsights();
        setPriceSuggestions(suggestions || []);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error loading products and pricing suggestions:', err);
      setPriceSuggestions([]);
      setProducts([]);
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Analizando precios dinámicos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Precios Dinámicos v4.0.0</h3>
            <p className="text-gray-600">Motor modular de optimización basado en elasticidad e IA</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-green-100 text-green-800">
            {products.length} Productos Analizados
          </Badge>
          <Button
            onClick={() => setShowKPIs(!showKPIs)}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            {showKPIs ? 'Ocultar' : 'Mostrar'} KPIs
          </Button>
          <Button
            onClick={loadProductsAndSuggestions}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* KPIs Section */}
      {showKPIs && products.length > 0 && (
        <DynamicPricingKPIs products={products} />
      )}

      {/* Pricing Suggestions Component */}
      {products.length > 0 && (
        <PricingSuggestions
          products={products}
          pricingSuggestions={priceSuggestions}
          success={success}
          warning={warning}
        />
      )}
    </div>
  );
};

export default DynamicPricing;