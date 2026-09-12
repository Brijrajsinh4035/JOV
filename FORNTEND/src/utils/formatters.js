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

export const calculateProgress = (budget, used) => {
  const rawBudget = Number(budget || 0);
  const rawUsed = Number(used || 0);
  if (rawBudget <= 0) return 0;
  const bCr = rawBudget >= 10000000 ? rawBudget / 10000000 : rawBudget;
  const uCr = rawUsed >= 10000000 ? rawUsed / 10000000 : rawUsed;
  return bCr > 0 ? Math.min(100, Math.round((uCr / bCr) * 100)) : 0;
};

export const toCrores = (val) => {
  if (val === undefined || val === null || val === '') return '';
  const num = Number(val);
  if (isNaN(num)) return '';
  if (Math.abs(num) >= 10000000) {
    return String(Number((num / 10000000).toFixed(2)));
  }
  return String(num);
};

export const toRawINR = (val) => {
  const num = Number(val || 0);
  if (isNaN(num) || num <= 0) return 0;
  if (num < 10000000) {
    return Math.round(num * 10000000);
  }
  return Math.round(num);
};

export const parseBudgetToINR = toRawINR;

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

export const formatCommentTimestamp = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const day = new Intl.DateTimeFormat('en-IN', { weekday: 'long' }).format(d);
    const date = new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
    const time = new Intl.DateTimeFormat('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(d);
    return `${day}, ${date} at ${time}`;
  } catch {
    return String(dateString);
  }
};

/**
 * Read-Only Excel Spreadsheet Exporter (.xls XML format)
 * Generates a protected, read-only Microsoft Excel spreadsheet with styled navy headers,
 * cell protection, and worksheet security flags.
 *
 * @param {Array<Object>} rows - Filtered table data
 * @param {Array<{label: string, key: string, value?: Function}>} headers - Column definitions
 * @param {string} filename - Output file name
 * @param {string} sheetName - Excel tab name
 * @returns {boolean} - Whether export was successful
 */
export const exportToExcelReadOnly = (
  rows,
  headers,
  filename = 'government_report.xls',
  sheetName = 'Official Audit'
) => {
  if (!rows || rows.length === 0) return false;

  const escapeXML = (val) => {
    if (val === null || val === undefined) return '';
    return String(val)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const cleanSheetName = escapeXML(sheetName.slice(0, 31));

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Title>${escapeXML(filename)}</Title>
  <Author>PMO National PMIS Portal</Author>
  <Created>${new Date().toISOString()}</Created>
  <Company>Government of India</Company>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#1e293b"/>
   <Interior/>
   <NumberFormat/>
   <Protection ss:Protected="1"/>
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0f172a"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#334155"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#334155"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#334155"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#ffffff" ss:Bold="1"/>
   <Interior ss:Color="#1e3a8a" ss:Pattern="Solid"/>
   <Protection ss:Protected="1"/>
  </Style>
  <Style ss:ID="DataCell">
   <Alignment ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#e2e8f0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#e2e8f0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#e2e8f0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#e2e8f0"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#334155"/>
   <Protection ss:Protected="1"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="${cleanSheetName}">
  <Table ss:DefaultRowHeight="20">
`;

  // Column definitions
  headers.forEach(() => {
    xml += `   <Column ss:AutoFitWidth="1" ss:Width="160"/>\n`;
  });

  // Header row
  xml += `   <Row ss:Height="26" ss:StyleID="Header">\n`;
  headers.forEach((h) => {
    xml += `    <Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXML(h.label)}</Data></Cell>\n`;
  });
  xml += `   </Row>\n`;

  // Data rows
  rows.forEach((row) => {
    xml += `   <Row ss:Height="22">\n`;
    headers.forEach((h) => {
      const val = typeof h.value === 'function' ? h.value(row) : row[h.key];
      const strVal = val === null || val === undefined ? '' : String(val);
      xml += `    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXML(strVal)}</Data></Cell>\n`;
    });
    xml += `   </Row>\n`;
  });

  xml += `  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <ProtectContents>True</ProtectContents>
   <ProtectObjects>True</ProtectObjects>
   <ProtectScenarios>True</ProtectScenarios>
   <EnableSelection>UnlockedCells</EnableSelection>
   <AllowFormatCells>False</AllowFormatCells>
   <AllowInsertRows>False</AllowInsertRows>
   <AllowDeleteRows>False</AllowDeleteRows>
  </WorksheetOptions>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const cleanFilename = filename.endsWith('.xls')
    ? filename
    : filename.replace(/\.(csv|xlsx)?$/, '') + '.xls';
  link.setAttribute('download', cleanFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
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
