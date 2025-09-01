// components/common/TicketPreview.jsx
import React from 'react';
import { formatARS, formatDateTime } from '../../utils/formatters';

const TicketPreview = ({ 
  saleData, 
  onPrint, 
  onClose,
  showPrintButton = true 
}) => {
  const {
    id,
    items = [],
    customer = {},
    payment = {},
    total = 0,
    subtotal = 0,
    discountAmount = 0,
    discountPercent = 0,
    documentType = 'sale',
    invoiceType = 'C',
    date = new Date()
  } = saleData;

  const getDocumentTitle = () => {
    if (documentType === 'quote') return 'PRESUPUESTO';
    if (documentType === 'invoice') {
      return `FACTURA ${invoiceType}`;
    }
    return 'TICKET DE VENTA';
  };

  const handlePrint = () => {
    // Crear ventana de impresión
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    const ticketHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ticket ${id}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Courier New', monospace; 
              font-size: 12px; 
              line-height: 1.2;
              width: 280px;
              margin: 10px auto;
            }
            .center { text-align: center; }
            .right { text-align: right; }
            .bold { font-weight: bold; }
            .line { border-top: 1px dashed #000; margin: 5px 0; }
            .double-line { border-top: 2px solid #000; margin: 8px 0; }
            .item-row { 
              display: flex; 
              justify-content: space-between; 
              margin: 2px 0;
            }
            .item-details { font-size: 10px; color: #666; }
            @media print {
              body { width: auto; margin: 0; }
            }
          </style>
        </head>
        <body>
          ${document.querySelector('.ticket-content').innerHTML}
        </body>
      </html>
    `;
    
    printWindow.document.write(ticketHTML);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 100);

    if (onPrint) onPrint();
  };

  return (
    <div className="max-w-sm mx-auto bg-white border border-gray-300 rounded-lg overflow-hidden shadow-lg">
      <div className="ticket-content p-4 font-mono text-sm">
        {/* Header */}
        <div className="text-center border-b border-dashed border-gray-400 pb-3 mb-3">
          <h1 className="font-bold text-lg">POS AI SYSTEM</h1>
          <p className="text-xs text-gray-600">Autopartes & Repuestos</p>
          <p className="text-xs text-gray-600">Tel: (11) 4444-4444</p>
          <div className="mt-2 text-xs">
            <p>{formatDateTime(date)}</p>
            <p className="font-bold">{getDocumentTitle()}</p>
            <p>Nro: {id}</p>
          </div>
        </div>

        {/* Customer Info */}
        {customer.name && (
          <div className="border-b border-dashed border-gray-400 pb-2 mb-2">
            <p className="text-xs font-bold">CLIENTE:</p>
            <p className="text-xs">{customer.name}</p>
            {customer.cuit && <p className="text-xs">CUIT: {customer.cuit}</p>}
            {customer.phone && <p className="text-xs">Tel: {customer.phone}</p>}
          </div>
        )}

        {/* Items */}
        <div className="border-b border-dashed border-gray-400 pb-2 mb-2">
          <div className="flex justify-between text-xs font-bold mb-1">
            <span>DESCRIPCION</span>
            <span>TOTAL</span>
          </div>
          {items.map((item, index) => (
            <div key={index} className="mb-1">
              <div className="flex justify-between">
                <span className="text-xs flex-1">{item.name}</span>
                <span className="text-xs">{formatARS(item.subtotal || (item.price * item.quantity))}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>{item.quantity} x {formatARS(item.price)}</span>
                <span>Cód: {item.code}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>SUBTOTAL:</span>
            <span>{formatARS(subtotal)}</span>
          </div>
          
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm text-red-600">
              <span>DESCUENTO ({discountPercent}%):</span>
              <span>-{formatARS(discountAmount)}</span>
            </div>
          )}
          
          <div className="border-t border-solid border-gray-800 pt-1">
            <div className="flex justify-between text-lg font-bold">
              <span>TOTAL:</span>
              <span>{formatARS(total)}</span>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="border-t border-dashed border-gray-400 pt-2 mt-2">
          <div className="flex justify-between text-xs">
            <span>FORMA DE PAGO:</span>
            <span className="uppercase">
              {payment.method === 'cash' ? 'EFECTIVO' :
               payment.method === 'card' ? 'TARJETA DÉBITO' :
               payment.method === 'credit' ? 'TARJETA CRÉDITO' :
               payment.method === 'transfer' ? 'TRANSFERENCIA' : 
               'EFECTIVO'}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-600 mt-4 pt-2 border-t border-dashed border-gray-400">
          <p>¡Gracias por su compra!</p>
          <p>POS AI System v1.0</p>
          {documentType === 'quote' && (
            <p className="mt-1 font-bold">PRESUPUESTO VÁLIDO POR 30 DÍAS</p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-3 bg-gray-50 border-t flex gap-2">
        {showPrintButton && (
          <button
            onClick={handlePrint}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            🖨️ Imprimir
          </button>
        )}
        <button
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default TicketPreview;