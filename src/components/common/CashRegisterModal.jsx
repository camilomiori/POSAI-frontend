import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Calculator,
  TrendingUp,
  TrendingDown,
  Clock,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Minus,
  Receipt
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Textarea } from '../ui';
import { formatARS, formatDateTime } from '../../utils/formatters';
import { cashRegisterService } from '../../services';
import { useToast } from '../../hooks';

const CashRegisterModal = ({ 
  isOpen, 
  onClose, 
  type = 'open', // 'open', 'close', 'movement', 'view'
  onSuccess
}) => {
  const { success, error, info } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [formData, setFormData] = useState({
    initialAmount: '',
    finalAmount: '',
    amount: '',
    description: '',
    movementType: 'deposit', // 'deposit', 'withdrawal', 'expense'
    openedBy: 'Usuario',
    closedBy: 'Usuario'
  });

  useEffect(() => {
    if (isOpen) {
      const session = cashRegisterService.getCurrentSession();
      setCurrentSession(session);
      
      if (type === 'close' && session) {
        setFormData(prev => ({
          ...prev,
          finalAmount: session.currentAmount.toString(),
          closedBy: 'Usuario'
        }));
      }
    }
  }, [isOpen, type]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      switch (type) {
        case 'open':
          const openAmount = parseFloat(formData.initialAmount) || 0;
          const openedSession = cashRegisterService.openCashRegister({
            initialAmount: openAmount,
            openedBy: formData.openedBy
          });
          success(`Caja abierta con ${formatARS(openAmount)}`);
          break;

        case 'close':
          const finalAmount = parseFloat(formData.finalAmount) || 0;
          const closedSession = cashRegisterService.closeCashRegister({
            finalAmount,
            closedBy: formData.closedBy
          });
          
          const difference = closedSession.difference;
          if (Math.abs(difference) > 0.01) {
            if (difference > 0) {
              info(`Caja cerrada. Sobrante: ${formatARS(difference)}`);
            } else {
              error(`Caja cerrada. Faltante: ${formatARS(Math.abs(difference))}`);
            }
          } else {
            success('Caja cerrada. Arqueo correcto.');
          }
          break;

        case 'movement':
          const amount = parseFloat(formData.amount) || 0;
          if (amount <= 0) {
            throw new Error('El monto debe ser mayor a 0');
          }

          const movementData = {
            amount,
            description: formData.description,
            createdBy: formData.openedBy
          };

          if (formData.movementType === 'deposit') {
            cashRegisterService.depositCash(movementData);
            success(`Depósito registrado: ${formatARS(amount)}`);
          } else if (formData.movementType === 'withdrawal') {
            cashRegisterService.withdrawCash(movementData);
            success(`Retiro registrado: ${formatARS(amount)}`);
          } else if (formData.movementType === 'expense') {
            cashRegisterService.addExpense(movementData);
            success(`Gasto registrado: ${formatARS(amount)}`);
          }
          break;
      }

      onSuccess?.();
      onClose();
      setFormData({
        initialAmount: '',
        finalAmount: '',
        amount: '',
        description: '',
        movementType: 'deposit',
        openedBy: 'Usuario',
        closedBy: 'Usuario'
      });

    } catch (err) {
      error(err.message || 'Error en la operación');
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'open': return 'Abrir Caja';
      case 'close': return 'Cerrar Caja';
      case 'movement': return 'Movimiento de Efectivo';
      case 'view': return 'Estado de Caja';
      default: return 'Gestión de Caja';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'open': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'close': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'movement': return <TrendingUp className="w-5 h-5 text-blue-600" />;
      case 'view': return <Receipt className="w-5 h-5 text-gray-600" />;
      default: return <DollarSign className="w-5 h-5" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            {getTitle()}
          </DialogTitle>
        </DialogHeader>

        {type === 'view' && currentSession && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Estado Actual</span>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    currentSession.status === 'open' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {currentSession.status === 'open' ? 'Abierta' : 'Cerrada'}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dinero inicial:</span>
                    <span className="font-medium">{formatARS(currentSession.initialAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dinero actual:</span>
                    <span className="font-bold text-green-600">{formatARS(currentSession.currentAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ventas en efectivo:</span>
                    <span className="font-medium">{formatARS(currentSession.payments?.cash || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total ventas:</span>
                    <span className="text-sm">{currentSession.sales?.length || 0} operaciones</span>
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="w-4 h-4" />
                      <span>Por: {currentSession.openedBy}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <Clock className="w-4 h-4" />
                      <span>{currentSession.formattedOpenedAt}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex gap-2">
              <Button 
                onClick={onClose} 
                variant="outline" 
                className="flex-1"
              >
                Cerrar
              </Button>
            </div>
          </div>
        )}

        {type === 'open' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Dinero inicial en caja
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.initialAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, initialAmount: e.target.value }))}
                placeholder="0.00"
                className="text-right"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Ingrese el monto inicial con el que abre la caja
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Responsable
              </label>
              <Input
                type="text"
                value={formData.openedBy}
                onChange={(e) => setFormData(prev => ({ ...prev, openedBy: e.target.value }))}
                placeholder="Nombre del cajero"
                required
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose} 
                className="flex-1"
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={loading}
              >
                {loading ? 'Abriendo...' : 'Abrir Caja'}
              </Button>
            </div>
          </form>
        )}

        {type === 'close' && currentSession && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Card className="bg-blue-50">
              <CardContent className="p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Dinero esperado:</span>
                    <span className="font-medium">{formatARS(currentSession.expectedAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ventas en efectivo:</span>
                    <span>{formatARS(currentSession.payments?.cash || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total operaciones:</span>
                    <span>{currentSession.sales?.length || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div>
              <label className="block text-sm font-medium mb-2">
                Dinero real en caja
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.finalAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, finalAmount: e.target.value }))}
                placeholder="0.00"
                className="text-right"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Cuente el dinero físico en la caja
              </p>
              
              {formData.finalAmount && (
                <div className="mt-2 p-2 rounded-md bg-gray-50">
                  <div className="text-sm">
                    <span>Diferencia: </span>
                    <span className={`font-bold ${
                      (parseFloat(formData.finalAmount) - currentSession.expectedAmount) > 0 
                        ? 'text-green-600' 
                        : (parseFloat(formData.finalAmount) - currentSession.expectedAmount) < 0
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }`}>
                      {formatARS(parseFloat(formData.finalAmount) - currentSession.expectedAmount)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Cerrado por
              </label>
              <Input
                type="text"
                value={formData.closedBy}
                onChange={(e) => setFormData(prev => ({ ...prev, closedBy: e.target.value }))}
                placeholder="Nombre del responsable"
                required
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose} 
                className="flex-1"
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-red-600 hover:bg-red-700"
                disabled={loading}
              >
                {loading ? 'Cerrando...' : 'Cerrar Caja'}
              </Button>
            </div>
          </form>
        )}

        {type === 'movement' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Tipo de movimiento
              </label>
              <select
                value={formData.movementType}
                onChange={(e) => setFormData(prev => ({ ...prev, movementType: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="deposit">💰 Depósito</option>
                <option value="withdrawal">💸 Retiro</option>
                <option value="expense">🧾 Gasto</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Monto
              </label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
                className="text-right"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Descripción
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Motivo del movimiento..."
                rows={3}
                required
              />
            </div>

            {currentSession && (
              <Card className="bg-gray-50">
                <CardContent className="p-3">
                  <div className="text-sm">
                    <span className="text-gray-600">Dinero actual en caja: </span>
                    <span className="font-bold">{formatARS(currentSession.currentAmount)}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose} 
                className="flex-1"
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={loading}
              >
                {loading ? 'Procesando...' : 'Registrar'}
              </Button>
            </div>
          </form>
        )}

        {!currentSession && type !== 'open' && type !== 'view' && (
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-amber-500" />
            <p className="text-gray-600">No hay una sesión de caja abierta</p>
            <p className="text-sm text-gray-500 mt-2">
              Debe abrir la caja antes de realizar operaciones
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CashRegisterModal;