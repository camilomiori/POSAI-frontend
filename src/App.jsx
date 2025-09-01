import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Contextos
import { ToastProvider } from './contexts/ToastContext';
import { CartProvider } from './contexts/CartContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Componentes
import { ErrorBoundary } from './components/common';
import ProtectedRoute from './components/common/ProtectedRoute';
import MainLayoutFixed from './components/layout/MainLayoutFixed';

// Páginas - Todas completamente funcionales con IA
import LoginBright from './pages/LoginBright';
import Dashboard from './pages/DashboardSimple';
import Ventas from './pages/VentasFacturacion';
import Productos from './pages/Productos';
import AICenter from './pages/AICenterEnhanced';
import Configuracion from './pages/Configuracion';
import Usuario from './pages/Usuario';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <NotificationProvider>
            <CartProvider>
              <Router>
                <Routes>
                  {/* Ruta pública */}
                  <Route path="/login" element={<LoginBright />} />

                  {/* Rutas protegidas */}
                  <Route path="/" element={<MainLayoutFixed />}>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="ventas" element={<Ventas />} />
                    <Route path="productos" element={<Productos />} />
                    <Route path="ai-center" element={<AICenter />} />
                    <Route path="configuracion" element={
                      <ProtectedRoute adminOnly={true}>
                        <Configuracion />
                      </ProtectedRoute>
                    } />
                    <Route path="usuario" element={<Usuario />} />
                  </Route>

                  {/* Ruta 404 */}
                  <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
              </Router>
            </CartProvider>
          </NotificationProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;