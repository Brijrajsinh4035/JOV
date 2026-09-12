/**
 * Official Indian Public Sector Formatters
 */

export const formatCrores = (amountInCrores) => {
  if (amountInCrores === undefined || amountInCrores === null) return '₹0 Cr';
  let num = Number(amountInCrores);
  if (isNaN(num)) return '₹0 Cr';
  // If stored in raw Rupees (e.g. 12,500,000,000), convert to Crores (1 Crore = 10,000,000)
  if (Math.abs(num) >= 10000000) {
    num = num / 10000000;
  }
  return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr`;
};

export const formatDate = (dateString, options = {}) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      ...options,
    }).format(date);
  } catch {
    return dateString;
  }
};

export const getStatusBadgeClass = (status) => {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'done':
    case 'mitigated':
    case 'closed':
      return 'badge-completed';
    case 'active':
    case 'in-progress':
    case 'in progress':
      return 'badge-inprogress';
    case 'delayed':
    case 'critical':
    case 'cancelled':
    case 'blocked':
      return 'badge-delayed';
    case 'on-hold':
    case 'review':
    case 'high':
      return 'badge-approved';
    case 'planning':
    case 'pending':
    case 'todo':
    case 'open':
    case 'low':
    case 'medium':
    default:
      return 'badge-planning';
  }
};

export const getInitials = (name = '') => {
  if (!name) return 'GOV';
  const cleaned = name.replace(/^(Shri|Dr\.|Prof\.|Smt\.|Er\.)\s+/i, '');
  return cleaned
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Universal CSV Exporter for table views
 * Converts filtered array of objects into downloadable CSV with UTF-8 BOM
 *
 * @param {Array<Object>} rows - Filtered table data
 * @param {Array<{label: string, key: string, value?: Function}>} headers - Column definitions
 * @param {string} filename - Output CSV file name
 * @returns {boolean} - Whether export was successful
 */
export const exportToCSV = (rows, headers, filename = 'government_report.csv') => {
  if (!rows || rows.length === 0) return false;

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerLine = headers.map((h) => escapeCSV(h.label)).join(',');
  const rowLines = rows.map((row) =>
    headers
      .map((h) => {
        const val = typeof h.value === 'function' ? h.value(row) : row[h.key];
        return escapeCSV(val);
      })
      .join(',')
  );

  // Prepend UTF-8 BOM (\uFEFF) so Excel/Numbers correctly renders symbols (e.g. ₹)
  const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
};
