// Export service for SplitStellar
// Generate CSV and PDF reports

import { getCategoryById } from './categories';

function shortenAddress(address) {
  if (!address) return 'Unknown';
  return `${address.substring(0, 8)}...${address.substring(address.length - 4)}`;
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function csvCell(value) {
  const str = String(value ?? '');
  const sanitized = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  return `"${sanitized.replace(/"/g, '""')}"`;
}

function safeFileName(poolName) {
  return (poolName || 'pool').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'pool';
}

export function generateCSV(expenses, poolName) {
  const headers = [
    'ID',
    'Description',
    'Amount (XLM)',
    'Payer',
    'Category',
    'Split Type',
    'Notes',
    'Transaction Hash',
    'Date',
  ];

  const rows = expenses.map(exp => [
    exp.id || '',
    csvCell(exp.description),
    (exp.amount / 1e7).toFixed(2),
    shortenAddress(exp.payer),
    exp.category ? getCategoryById(exp.category)?.name || 'Other' : 'Other',
    exp.splitType || 'equal',
    csvCell(exp.notes),
    exp.txHash || '',
    exp.createdAt ? formatDate(exp.createdAt) : '',
  ]);

  const csvContent = [
    `Pool: ${csvCell(poolName)}`,
    `Generated: ${new Date().toLocaleString()}`,
    `Total Expenses: ${expenses.length}`,
    '',
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  return csvContent;
}

export function downloadCSV(expenses, poolName) {
  const csv = generateCSV(expenses, poolName);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `splitstellar-${safeFileName(poolName)}-${Date.now()}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

export function generatePDF(expenses, poolName) {
  // Simple HTML-based PDF generation
  const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0) / 1e7;
  const categoryTotals = {};
  
  expenses.forEach(exp => {
    const catId = exp.category || 'other';
    const cat = getCategoryById(catId);
    const name = cat?.name || 'Other';
    categoryTotals[name] = (categoryTotals[name] || 0) + exp.amount / 1e7;
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>SplitStellar Report - ${escapeHtml(poolName)}</title>
  <style>
    body { font-family: 'SF Mono', monospace; padding: 40px; color: #333; }
    h1 { font-size: 24px; font-style: italic; margin-bottom: 8px; }
    .subtitle { color: #666; font-size: 12px; margin-bottom: 32px; }
    .stats { display: flex; gap: 32px; margin-bottom: 32px; }
    .stat { text-align: center; }
    .stat-value { font-size: 24px; font-weight: bold; }
    .stat-label { font-size: 10px; color: #666; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; font-size: 12px; }
    th { font-size: 10px; text-transform: uppercase; color: #666; }
    .category { display: inline-block; padding: 2px 8px; background: #f5f5f5; border-radius: 4px; font-size: 10px; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; font-size: 10px; color: #666; text-align: center; }
  </style>
</head>
<body>
  <h1>${escapeHtml(poolName)}</h1>
  <div class="subtitle">SplitStellar Expense Report • Generated ${new Date().toLocaleDateString()}</div>
  
  <div class="stats">
    <div class="stat">
      <div class="stat-value">${expenses.length}</div>
      <div class="stat-label">Expenses</div>
    </div>
    <div class="stat">
      <div class="stat-value">${totalAmount.toFixed(2)} XLM</div>
      <div class="stat-label">Total</div>
    </div>
    <div class="stat">
      <div class="stat-value">${Object.keys(categoryTotals).length}</div>
      <div class="stat-label">Categories</div>
    </div>
  </div>

  <h3 style="font-size: 14px; margin-bottom: 12px;">Category Breakdown</h3>
  <div style="display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 32px;">
    ${Object.entries(categoryTotals).map(([cat, amount]) => `
      <div class="category">${escapeHtml(cat)}: ${amount.toFixed(2)} XLM</div>
    `).join('')}
  </div>

  <h3 style="font-size: 14px; margin-bottom: 12px;">Expense Details</h3>
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Amount</th>
        <th>Payer</th>
        <th>Category</th>
        <th>Date</th>
      </tr>
    </thead>
    <tbody>
      ${expenses.map(exp => `
        <tr>
          <td>${escapeHtml(exp.description || 'Untitled')}</td>
          <td>${(exp.amount / 1e7).toFixed(2)} XLM</td>
          <td>${escapeHtml(shortenAddress(exp.payer))}</td>
          <td>${escapeHtml(exp.category ? getCategoryById(exp.category)?.name || 'Other' : 'Other')}</td>
          <td>${exp.createdAt ? formatDate(exp.createdAt) : '-'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">
    SplitStellar • Cryptographic Expense Settlement on Stellar
  </div>
</body>
</html>
  `.trim();

  return html;
}

export function downloadPDF(expenses, poolName) {
  const html = generatePDF(expenses, poolName);
  const blob = new Blob([html], { type: 'text/html' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `splitstellar-${safeFileName(poolName)}-${Date.now()}.html`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}
