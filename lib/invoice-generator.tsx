export function downloadInvoice(order: any) {
  const invoiceHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #000000;
            margin: 0;
            padding: 20px;
            background: #FFFFFF;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 40px;
            border-bottom: 2px solid #CF172F;
            padding-bottom: 20px;
          }
          .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #CF172F;
          }
          .invoice-title {
            font-size: 28px;
            font-weight: bold;
            color: #000000;
          }
          .invoice-number {
            color: #666;
            font-size: 14px;
          }
          .section {
            margin-bottom: 30px;
          }
          .section-title {
            font-size: 14px;
            font-weight: bold;
            color: #000000;
            margin-bottom: 10px;
            text-transform: uppercase;
            border-bottom: 1px solid #F2F2F2;
            padding-bottom: 5px;
          }
          .section-content {
            margin-bottom: 15px;
            font-size: 13px;
            line-height: 1.6;
            color: #000000;
          }
          .row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          .label {
            color: #666;
          }
          .value {
            font-weight: 500;
            color: #000000;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th {
            background-color: #F2F2F2;
            padding: 10px;
            text-align: left;
            font-weight: bold;
            border-bottom: 2px solid #CF172F;
            font-size: 12px;
            color: #000000;
          }
          td {
            padding: 12px 10px;
            border-bottom: 1px solid #F2F2F2;
            font-size: 13px;
            color: #000000;
          }
          .total-section {
            margin-top: 20px;
            padding: 15px;
            background-color: #F2F2F2;
            border-left: 4px solid #CF172F;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 14px;
            color: #000000;
          }
          .total-amount {
            font-size: 18px;
            font-weight: bold;
            color: #CF172F;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #F2F2F2;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div>
              <div class="company-name">MotoGT</div>
              <div style="color: #666; font-size: 12px;">Automotive Accessories</div>
            </div>
            <div style="text-align: right;">
              <div class="invoice-title">INVOICE</div>
              <div class="invoice-number">#${order.id}</div>
            </div>
          </div>

          <div style="display: flex; gap: 40px; margin-bottom: 30px;">
            <div style="flex: 1;">
              <div class="section-title">Bill To</div>
              <div class="section-content">
                <div>${order.customer}</div>
                <div>${order.email}</div>
                <div>${order.phone}</div>
              </div>
            </div>
            <div style="flex: 1;">
              <div class="section-title">Ship To</div>
              <div class="section-content">
                <div>${order.shipping.address}</div>
              </div>
            </div>
          </div>

          <div style="display: flex; gap: 40px; margin-bottom: 30px;">
            <div>
              <div class="row">
                <span class="label">Invoice Date:</span>
                <span class="value">${order.date}</span>
              </div>
              <div class="row">
                <span class="label">Shipping Method:</span>
                <span class="value">${order.shipping.method}</span>
              </div>
            </div>
            <div>
              <div class="row">
                <span class="label">Est. Delivery:</span>
                <span class="value">${order.shipping.estimatedDelivery}</span>
              </div>
              <div class="row">
                <span class="label">Status:</span>
                <span class="value">${order.status}</span>
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: center;">Quantity</th>
                <th style="text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map((item: any) => `
                <tr>
                  <td>${item.name}</td>
                  <td style="text-align: center;">${item.quantity}</td>
                  <td style="text-align: right;">${item.price}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total-section">
            <div class="total-row">
              <span>Total Amount:</span>
              <span class="total-amount">${order.total}</span>
            </div>
            <div class="total-row">
              <span>Payment Status:</span>
              <span>${order.payment}</span>
            </div>
          </div>

          <div class="footer">
            <p>Thank you for your business! MotoGT - Premium Automotive Accessories</p>
            <p>For support, contact: support@motogт.com</p>
          </div>
        </div>
      </body>
    </html>
  `

  const element = document.createElement('div')
  element.innerHTML = invoiceHTML
  
  const opt = {
    margin: 10,
    filename: `invoice-${order.id}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
  }

  // Dynamically load html2pdf library
  const script = document.createElement('script')
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
  script.onload = () => {
    const { html2pdf } = (window as any)
    html2pdf().set(opt).from(element).save()
  }
  document.head.appendChild(script)
}
