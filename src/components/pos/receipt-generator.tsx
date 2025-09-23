'use client'

import { formatCurrency, formatDate } from '@/lib/utils'

interface ReceiptItem {
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface ReceiptData {
  orderNumber: string
  tableName?: string
  items: ReceiptItem[]
  subtotal: number
  total: number
  paymentMethod: string
  cashReceived?: number
  change?: number
  timestamp: Date
  waiterName?: string
}

export function generateReceiptHTML(data: ReceiptData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Receipt - ${data.orderNumber}</title>
      <style>
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.4;
          margin: 0;
          padding: 20px;
          max-width: 300px;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        .business-name {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .business-info {
          font-size: 10px;
          margin-bottom: 2px;
        }
        .order-info {
          margin-bottom: 15px;
        }
        .order-info div {
          margin-bottom: 3px;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
        }
        .items-table th,
        .items-table td {
          text-align: left;
          padding: 2px 0;
          border-bottom: 1px dashed #ccc;
        }
        .items-table th {
          font-weight: bold;
          border-bottom: 1px solid #000;
        }
        .item-name {
          width: 60%;
        }
        .item-qty {
          width: 15%;
          text-align: center;
        }
        .item-price {
          width: 25%;
          text-align: right;
        }
        .totals {
          border-top: 1px solid #000;
          padding-top: 10px;
          margin-bottom: 15px;
        }
        .total-line {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
        }
        .total-line.grand-total {
          font-weight: bold;
          font-size: 14px;
          border-top: 1px solid #000;
          padding-top: 5px;
          margin-top: 5px;
        }
        .payment-info {
          border-top: 1px dashed #000;
          padding-top: 10px;
          margin-bottom: 15px;
        }
        .footer {
          text-align: center;
          border-top: 2px solid #000;
          padding-top: 10px;
          font-size: 10px;
        }
        @media print {
          body { margin: 0; padding: 10px; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="business-name">YAYA BAR & RESTAURANT</div>
        <div class="business-info">Complete Hospitality Experience</div>
        <div class="business-info">Kampala, Uganda</div>
        <div class="business-info">Tel: +256 700 000 000</div>
      </div>

      <div class="order-info">
        <div><strong>Order #:</strong> ${data.orderNumber}</div>
        ${data.tableName ? `<div><strong>Table:</strong> ${data.tableName}</div>` : ''}
        <div><strong>Date:</strong> ${formatDate(data.timestamp)}</div>
        ${data.waiterName ? `<div><strong>Served by:</strong> ${data.waiterName}</div>` : ''}
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th class="item-name">Item</th>
            <th class="item-qty">Qty</th>
            <th class="item-price">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${data.items.map(item => `
            <tr>
              <td class="item-name">${item.name}</td>
              <td class="item-qty">${item.quantity}</td>
              <td class="item-price">${formatCurrency(item.totalPrice)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals">
        <div class="total-line">
          <span>Subtotal:</span>
          <span>${formatCurrency(data.subtotal)}</span>
        </div>
        <div class="total-line grand-total">
          <span>TOTAL:</span>
          <span>${formatCurrency(data.total)}</span>
        </div>
      </div>

      <div class="payment-info">
        <div class="total-line">
          <span>Payment Method:</span>
          <span>${data.paymentMethod.toUpperCase()}</span>
        </div>
        ${data.cashReceived ? `
          <div class="total-line">
            <span>Cash Received:</span>
            <span>${formatCurrency(data.cashReceived)}</span>
          </div>
        ` : ''}
        ${data.change && data.change > 0 ? `
          <div class="total-line">
            <span>Change:</span>
            <span>${formatCurrency(data.change)}</span>
          </div>
        ` : ''}
      </div>

      <div class="footer">
        <div>Thank you for dining with us!</div>
        <div>Visit us again soon</div>
        <div style="margin-top: 10px;">
          Follow us: @YaYaBarUG
        </div>
      </div>
    </body>
    </html>
  `
}

export function printReceipt(data: ReceiptData): void {
  const receiptHTML = generateReceiptHTML(data)
  const printWindow = window.open('', '_blank', 'width=400,height=600')
  
  if (printWindow) {
    printWindow.document.write(receiptHTML)
    printWindow.document.close()
    printWindow.focus()
    
    // Auto print after a short delay
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 500)
  }
}

export function downloadReceipt(data: ReceiptData): void {
  const receiptHTML = generateReceiptHTML(data)
  const blob = new Blob([receiptHTML], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = `receipt-${data.orderNumber}.html`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}