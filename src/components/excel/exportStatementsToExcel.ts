import * as XLSX from 'xlsx';

/**
 * Export financial statements to a professionally formatted Excel file.
 * @param params - Object containing all required statement data and meta info
 */
export function exportStatementsToExcel({
  companyName,
  modelName,
  exportDate = new Date(),
  incomeStatement,
  balanceSheet,
  cashFlow,
}: {
  companyName?: string;
  modelName?: string;
  exportDate?: Date;
  incomeStatement: any;
  balanceSheet: any;
  cashFlow: any;
}) {
  // Helper: format date
  const formatDate = (date: Date) => date.toLocaleDateString();

  // 1. Prepare Income Statement sheet
  const incomeSheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([
    [companyName || 'Company', modelName || 'Financial Model'],
    ['Income Statement', '', '', '', formatDate(exportDate)],
    [],
    // Header row
    ['Line Item', ...(incomeStatement?.years || [])],
    // Data rows
    ...(incomeStatement?.line_items || []).map((item: any) => [item.label, ...(item.values || [])]),
  ]);

  // 2. Prepare Balance Sheet sheet
  const balanceSheetSheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([
    [companyName || 'Company', modelName || 'Financial Model'],
    ['Balance Sheet', '', '', '', formatDate(exportDate)],
    [],
    ['Line Item', ...(balanceSheet?.years || [])],
    ...(balanceSheet?.line_items || []).map((item: any) => [item.label, ...(item.values || [])]),
  ]);

  // 3. Prepare Cash Flow sheet
  const cashFlowSheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([
    [companyName || 'Company', modelName || 'Financial Model'],
    ['Cash Flow Statement', '', '', '', formatDate(exportDate)],
    [],
    ['Line Item', ...(cashFlow?.years || [])],
    ...(cashFlow?.line_items || []).map((item: any) => [item.label, ...(item.values || [])]),
  ]);

  // 4. Create workbook and add all sheets
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, incomeSheet, 'Income Statement');
  XLSX.utils.book_append_sheet(wb, balanceSheetSheet, 'Balance Sheet');
  XLSX.utils.book_append_sheet(wb, cashFlowSheet, 'Cash Flow');

  // 5. Export workbook to file
  const fileName = `${companyName || 'Company'}_${modelName || 'Statements'}_${formatDate(exportDate)}.xlsx`.replace(/\s+/g, '_');
  XLSX.writeFile(wb, fileName);
}
