// services/cashRegister.js

import { STORAGE_KEYS, PAYMENT_METHODS } from '../utils/constants';
import { formatDateTime, formatARS } from '../utils/formatters';

class CashRegisterService {
  constructor() {
    this.storageKey = STORAGE_KEYS.CASH_REGISTER || 'pos_ai_cash_register';
    this.movementsKey = STORAGE_KEYS.CASH_MOVEMENTS || 'pos_ai_cash_movements';
    this.sessionKey = STORAGE_KEYS.CASH_SESSION || 'pos_ai_cash_session';
  }

  // Obtener estado actual de la caja
  getCurrentSession() {
    try {
      const session = localStorage.getItem(this.sessionKey);
      return session ? JSON.parse(session) : null;
    } catch (error) {
      console.error('Error getting cash session:', error);
      return null;
    }
  }

  // Verificar si la caja está abierta
  isOpen() {
    const session = this.getCurrentSession();
    return session && session.status === 'open' && !session.closedAt;
  }

  // Abrir caja
  openCashRegister(data) {
    try {
      const sessionId = `CAJA-${Date.now()}`;
      const now = Date.now();
      
      const session = {
        id: sessionId,
        status: 'open',
        openedAt: now,
        openedBy: data.openedBy || 'Usuario',
        initialAmount: data.initialAmount || 0,
        currentAmount: data.initialAmount || 0,
        expectedAmount: data.initialAmount || 0,
        movements: [],
        sales: [],
        payments: {
          cash: 0,
          card: 0,
          transfer: 0,
          other: 0
        },
        formattedOpenedAt: formatDateTime(new Date(now)),
        closedAt: null,
        closedBy: null
      };

      localStorage.setItem(this.sessionKey, JSON.stringify(session));

      // Registrar movimiento de apertura
      this.addMovement({
        type: 'opening',
        amount: data.initialAmount || 0,
        description: 'Apertura de caja',
        reference: sessionId
      });

      return session;
    } catch (error) {
      console.error('Error opening cash register:', error);
      throw new Error('Error al abrir la caja');
    }
  }

  // Cerrar caja
  closeCashRegister(data) {
    try {
      const session = this.getCurrentSession();
      if (!session || session.status !== 'open') {
        throw new Error('No hay una sesión de caja abierta');
      }

      const now = Date.now();
      const closedSession = {
        ...session,
        status: 'closed',
        closedAt: now,
        closedBy: data.closedBy || 'Usuario',
        finalAmount: data.finalAmount || session.currentAmount,
        difference: (data.finalAmount || session.currentAmount) - session.expectedAmount,
        formattedClosedAt: formatDateTime(new Date(now))
      };

      // Guardar sesión cerrada en histórico
      this.saveClosedSession(closedSession);

      // Registrar movimiento de cierre
      this.addMovement({
        type: 'closing',
        amount: closedSession.finalAmount,
        description: 'Cierre de caja',
        reference: session.id,
        difference: closedSession.difference
      });

      // Limpiar sesión actual
      localStorage.removeItem(this.sessionKey);

      return closedSession;
    } catch (error) {
      console.error('Error closing cash register:', error);
      throw error;
    }
  }

  // Agregar venta a la sesión actual
  addSale(saleData) {
    try {
      const session = this.getCurrentSession();
      if (!session || session.status !== 'open') {
        return; // Sesión cerrada, no procesar
      }

      const sale = {
        id: saleData.id,
        timestamp: saleData.timestamp || Date.now(),
        total: saleData.total || 0,
        paymentMethod: saleData.paymentMethod || 'cash',
        items: saleData.items || [],
        formattedDateTime: formatDateTime(new Date(saleData.timestamp || Date.now())),
        formattedTotal: formatARS(saleData.total || 0)
      };

      session.sales.push(sale);

      // Actualizar totales según método de pago
      if (sale.paymentMethod === 'cash' || sale.paymentMethod === PAYMENT_METHODS.CASH) {
        session.currentAmount += sale.total;
        session.expectedAmount += sale.total;
        session.payments.cash += sale.total;
      } else if (sale.paymentMethod === 'card' || sale.paymentMethod.includes('tarjeta')) {
        session.payments.card += sale.total;
      } else if (sale.paymentMethod === 'transfer' || sale.paymentMethod === PAYMENT_METHODS.TRANSFER) {
        session.payments.transfer += sale.total;
      } else {
        session.payments.other += sale.total;
      }

      localStorage.setItem(this.sessionKey, JSON.stringify(session));

      // Registrar movimiento de venta (solo efectivo afecta la caja)
      if (sale.paymentMethod === 'cash' || sale.paymentMethod === PAYMENT_METHODS.CASH) {
        this.addMovement({
          type: 'sale',
          amount: sale.total,
          description: `Venta ${sale.id}`,
          reference: sale.id,
          paymentMethod: sale.paymentMethod
        });
      }

      return session;
    } catch (error) {
      console.error('Error adding sale to cash register:', error);
    }
  }

  // Agregar movimiento de efectivo
  addMovement(movement) {
    try {
      const movements = this.getAllMovements();
      const newMovement = {
        id: `MOV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        type: movement.type, // 'opening', 'closing', 'sale', 'withdrawal', 'deposit', 'expense'
        amount: movement.amount || 0,
        description: movement.description || '',
        reference: movement.reference || '',
        paymentMethod: movement.paymentMethod || 'cash',
        sessionId: this.getCurrentSession()?.id || null,
        createdBy: movement.createdBy || 'Sistema',
        formattedDateTime: formatDateTime(new Date()),
        formattedAmount: formatARS(movement.amount || 0),
        difference: movement.difference || null
      };

      movements.unshift(newMovement); // Agregar al inicio
      
      // Mantener solo los últimos 1000 movimientos
      if (movements.length > 1000) {
        movements.splice(1000);
      }

      localStorage.setItem(this.movementsKey, JSON.stringify(movements));
      return newMovement;
    } catch (error) {
      console.error('Error adding cash movement:', error);
    }
  }

  // Retirar efectivo de la caja
  withdrawCash(data) {
    try {
      const session = this.getCurrentSession();
      if (!session || session.status !== 'open') {
        throw new Error('No hay una sesión de caja abierta');
      }

      if (data.amount <= 0) {
        throw new Error('El monto debe ser mayor a 0');
      }

      if (data.amount > session.currentAmount) {
        throw new Error('Fondos insuficientes en caja');
      }

      session.currentAmount -= data.amount;
      localStorage.setItem(this.sessionKey, JSON.stringify(session));

      this.addMovement({
        type: 'withdrawal',
        amount: -data.amount, // Negativo para retiros
        description: data.description || 'Retiro de efectivo',
        reference: data.reference || '',
        createdBy: data.createdBy || 'Usuario'
      });

      return session;
    } catch (error) {
      console.error('Error withdrawing cash:', error);
      throw error;
    }
  }

  // Depositar efectivo en la caja
  depositCash(data) {
    try {
      const session = this.getCurrentSession();
      if (!session || session.status !== 'open') {
        throw new Error('No hay una sesión de caja abierta');
      }

      if (data.amount <= 0) {
        throw new Error('El monto debe ser mayor a 0');
      }

      session.currentAmount += data.amount;
      session.expectedAmount += data.amount;
      localStorage.setItem(this.sessionKey, JSON.stringify(session));

      this.addMovement({
        type: 'deposit',
        amount: data.amount,
        description: data.description || 'Depósito de efectivo',
        reference: data.reference || '',
        createdBy: data.createdBy || 'Usuario'
      });

      return session;
    } catch (error) {
      console.error('Error depositing cash:', error);
      throw error;
    }
  }

  // Registrar gasto
  addExpense(data) {
    try {
      const session = this.getCurrentSession();
      if (!session || session.status !== 'open') {
        throw new Error('No hay una sesión de caja abierta');
      }

      if (data.amount <= 0) {
        throw new Error('El monto debe ser mayor a 0');
      }

      if (data.amount > session.currentAmount) {
        throw new Error('Fondos insuficientes en caja');
      }

      session.currentAmount -= data.amount;
      localStorage.setItem(this.sessionKey, JSON.stringify(session));

      this.addMovement({
        type: 'expense',
        amount: -data.amount, // Negativo para gastos
        description: data.description || 'Gasto',
        reference: data.reference || '',
        createdBy: data.createdBy || 'Usuario'
      });

      return session;
    } catch (error) {
      console.error('Error adding expense:', error);
      throw error;
    }
  }

  // Obtener todos los movimientos
  getAllMovements() {
    try {
      const movements = localStorage.getItem(this.movementsKey);
      return movements ? JSON.parse(movements) : [];
    } catch (error) {
      console.error('Error getting movements:', error);
      return [];
    }
  }

  // Obtener movimientos del día
  getTodayMovements() {
    const movements = this.getAllMovements();
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    return movements.filter(movement => {
      const movementDate = new Date(movement.timestamp);
      return movementDate >= startOfDay;
    });
  }

  // Obtener sesiones cerradas (histórico)
  getClosedSessions() {
    try {
      const sessions = localStorage.getItem(`${this.storageKey}_history`);
      return sessions ? JSON.parse(sessions) : [];
    } catch (error) {
      console.error('Error getting closed sessions:', error);
      return [];
    }
  }

  // Guardar sesión cerrada en histórico
  saveClosedSession(session) {
    try {
      const sessions = this.getClosedSessions();
      sessions.unshift(session);
      
      // Mantener solo las últimas 100 sesiones
      if (sessions.length > 100) {
        sessions.splice(100);
      }

      localStorage.setItem(`${this.storageKey}_history`, JSON.stringify(sessions));
    } catch (error) {
      console.error('Error saving closed session:', error);
    }
  }

  // Obtener métricas de caja del día
  getTodayMetrics() {
    const session = this.getCurrentSession();
    const movements = this.getTodayMovements();
    
    const salesMovements = movements.filter(m => m.type === 'sale');
    const withdrawals = movements.filter(m => m.type === 'withdrawal' || m.type === 'expense');
    const deposits = movements.filter(m => m.type === 'deposit');

    const totalSales = salesMovements.reduce((sum, m) => sum + (m.amount || 0), 0);
    const totalWithdrawals = Math.abs(withdrawals.reduce((sum, m) => sum + (m.amount || 0), 0));
    const totalDeposits = deposits.reduce((sum, m) => sum + (m.amount || 0), 0);

    return {
      isOpen: this.isOpen(),
      currentAmount: session?.currentAmount || 0,
      initialAmount: session?.initialAmount || 0,
      expectedAmount: session?.expectedAmount || 0,
      totalSales,
      totalWithdrawals,
      totalDeposits,
      salesCount: salesMovements.length,
      movementsCount: movements.length,
      formattedCurrentAmount: formatARS(session?.currentAmount || 0),
      formattedExpectedAmount: formatARS(session?.expectedAmount || 0),
      formattedTotalSales: formatARS(totalSales),
      payments: session?.payments || { cash: 0, card: 0, transfer: 0, other: 0 }
    };
  }

  // Limpiar datos (para testing)
  clearAllData() {
    localStorage.removeItem(this.sessionKey);
    localStorage.removeItem(this.movementsKey);
    localStorage.removeItem(`${this.storageKey}_history`);
  }
}

// Crear instancia singleton
const cashRegisterService = new CashRegisterService();

export default cashRegisterService;
export { cashRegisterService };