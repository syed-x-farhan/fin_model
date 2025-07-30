import { CalculationResult } from './api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// PDF Export Configuration
export interface PDFExportConfig {
  title: string;
  subtitle?: string;
  companyName?: string;
  date: Date;
  includeCharts: boolean;
  includeTables: boolean;
  includeKPIs: boolean;
  pageSize: 'A4' | 'Letter';
  orientation: 'portrait' | 'landscape';
}

// Chart Data Interface
export interface ChartData {
  type: 'line' | 'bar' | 'pie';
  title: string;
  data: any[];
  xAxis: string;
  yAxis: string;
  colors?: string[];
}

// Table Data Interface
export interface TableData {
  title: string;
  headers: string[];
  rows: (string | number)[][];
  summary?: {
    label: string;
    value: string | number;
    type: 'total' | 'average' | 'percentage';
  };
}

// KPI Data Interface
export interface KPIData {
  title: string;
  value: string | number;
  change?: string;
  trend: 'up' | 'down' | 'neutral';
  format: 'currency' | 'percentage' | 'number';
}

export class PDFExportService {
  private config: PDFExportConfig;

  constructor(config: PDFExportConfig) {
    this.config = config;
  }

  /**
   * Generate a professional financial report PDF
   */
  async generateFinancialReport(calculationResult: CalculationResult): Promise<Blob> {
    const pdf = new jsPDF({
      orientation: this.config.orientation,
      unit: 'mm',
      format: this.config.pageSize
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let currentY = margin;

    // Add header
    currentY = this.addHeader(pdf, currentY, pageWidth, margin);
    
    // Add KPIs
    currentY = this.addKPIs(pdf, calculationResult, currentY, pageWidth, margin);
    
    // Add Income Statement
    currentY = this.addIncomeStatement(pdf, calculationResult, currentY, pageWidth, margin);
    
    // Check if we need a new page
    if (currentY > pageHeight - 100) {
      pdf.addPage();
      currentY = margin;
    }
    
    // Add Balance Sheet
    currentY = this.addBalanceSheet(pdf, calculationResult, currentY, pageWidth, margin);
    
    // Check if we need a new page
    if (currentY > pageHeight - 100) {
      pdf.addPage();
      currentY = margin;
    }
    
    // Add Cash Flow
    currentY = this.addCashFlow(pdf, calculationResult, currentY, pageWidth, margin);
    
    // Check if we need a new page
    if (currentY > pageHeight - 100) {
      pdf.addPage();
      currentY = margin;
    }
    
    // Add Financial Ratios
    currentY = this.addFinancialRatios(pdf, calculationResult, currentY, pageWidth, margin);
    
    // Check if we need a new page
    if (currentY > pageHeight - 100) {
      pdf.addPage();
      currentY = margin;
    }
    
    // Add Revenue Projections Chart
    currentY = this.addRevenueProjectionsChart(pdf, calculationResult, currentY, pageWidth, margin);
    
    // Check if we need a new page
    if (currentY > pageHeight - 100) {
      pdf.addPage();
      currentY = margin;
    }
    
    // Add KPIs Chart
    currentY = this.addKPIsChart(pdf, calculationResult, currentY, pageWidth, margin);
    
    // Add footer
    this.addFooter(pdf, pageWidth, pageHeight, margin);

    return pdf.output('blob');
  }

  /**
   * Add header to PDF
   */
  private addHeader(pdf: jsPDF, currentY: number, pageWidth: number, margin: number): number {
    pdf.setFillColor(102, 126, 234);
    pdf.rect(0, 0, pageWidth, 40, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text(this.config.title, pageWidth / 2, 20, { align: 'center' });
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(this.config.subtitle || 'Financial Analysis Report', pageWidth / 2, 30, { align: 'center' });
    
    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(10);
    pdf.text(`Generated on ${this.config.date.toLocaleDateString()}`, pageWidth / 2, 35, { align: 'center' });
    
    return 50;
  }

  /**
   * Add KPIs to PDF
   */
  private addKPIs(pdf: jsPDF, calculationResult: CalculationResult, currentY: number, pageWidth: number, margin: number): number {
    const { income_statement, balance_sheet, kpis } = calculationResult;
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Key Performance Indicators', margin, currentY);
    currentY += 15;

    const kpiWidth = (pageWidth - (margin * 2) - 30) / 2;
    const kpiHeight = 25;
    
    // Revenue KPI
    pdf.setFillColor(52, 152, 219);
    pdf.rect(margin, currentY, kpiWidth, kpiHeight, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Total Revenue', margin + 5, currentY + 8);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`$${(income_statement.revenue / 1000000).toFixed(2)}M`, margin + 5, currentY + 18);
    
    // Net Income KPI
    pdf.setFillColor(46, 204, 113);
    pdf.rect(margin + kpiWidth + 10, currentY, kpiWidth, kpiHeight, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Net Income', margin + kpiWidth + 15, currentY + 8);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`$${(income_statement.net_income / 1000).toFixed(0)}K`, margin + kpiWidth + 15, currentY + 18);
    
    currentY += kpiHeight + 10;
    
    // EBITDA KPI
    pdf.setFillColor(155, 89, 182);
    pdf.rect(margin, currentY, kpiWidth, kpiHeight, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('EBITDA', margin + 5, currentY + 8);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`$${((income_statement.ebit + 500000) / 1000).toFixed(0)}K`, margin + 5, currentY + 18);
    
    // Cash Balance KPI
    pdf.setFillColor(230, 126, 34);
    pdf.rect(margin + kpiWidth + 10, currentY, kpiWidth, kpiHeight, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Cash Balance', margin + kpiWidth + 15, currentY + 8);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`$${(balance_sheet.assets.cash / 1000).toFixed(0)}K`, margin + kpiWidth + 15, currentY + 18);
    
    return currentY + kpiHeight + 20;
  }

  /**
   * Add Income Statement to PDF
   */
  private addIncomeStatement(pdf: jsPDF, calculationResult: CalculationResult, currentY: number, pageWidth: number, margin: number): number {
    const { income_statement } = calculationResult;
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Income Statement', margin, currentY);
    currentY += 15;

    // Table headers
    pdf.setFillColor(52, 73, 94);
    pdf.rect(margin, currentY, pageWidth - (margin * 2), 10, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Item', margin + 5, currentY + 7);
    pdf.text('Amount ($)', margin + 80, currentY + 7);
    pdf.text('% of Revenue', margin + 140, currentY + 7);
    
    currentY += 10;
    
    // Table rows
    const rows = [
      ['Revenue', income_statement.revenue, 100.0],
      ['Cost of Goods Sold', income_statement.cogs, (income_statement.cogs / income_statement.revenue) * 100],
      ['Gross Profit', income_statement.gross_profit, (income_statement.gross_profit / income_statement.revenue) * 100],
      ['Operating Expenses', income_statement.operating_expenses, (income_statement.operating_expenses / income_statement.revenue) * 100],
      ['EBIT', income_statement.ebit, (income_statement.ebit / income_statement.revenue) * 100],
      ['Interest Expense', income_statement.interest_expense, (income_statement.interest_expense / income_statement.revenue) * 100],
      ['EBT', income_statement.ebt, (income_statement.ebt / income_statement.revenue) * 100],
      ['Taxes', income_statement.taxes, (income_statement.taxes / income_statement.revenue) * 100],
      ['Net Income', income_statement.net_income, (income_statement.net_income / income_statement.revenue) * 100]
    ];

    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    rows.forEach((row, index) => {
      const isTotal = index === rows.length - 1;
      if (isTotal) {
        pdf.setFillColor(236, 240, 241);
        pdf.rect(margin, currentY, pageWidth - (margin * 2), 8, 'F');
        pdf.setFont('helvetica', 'bold');
      }
      
      pdf.text(row[0], margin + 5, currentY + 6);
      pdf.text(this.formatCurrency(row[1] as number), margin + 80, currentY + 6);
      pdf.text(`${(row[2] as number).toFixed(1)}%`, margin + 140, currentY + 6);
      
      currentY += 8;
      if (isTotal) pdf.setFont('helvetica', 'normal');
    });
    
    return currentY + 15;
  }

  /**
   * Add Balance Sheet to PDF
   */
  private addBalanceSheet(pdf: jsPDF, calculationResult: CalculationResult, currentY: number, pageWidth: number, margin: number): number {
    const { balance_sheet } = calculationResult;
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Balance Sheet', margin, currentY);
    currentY += 15;

    // Assets section
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Assets', margin, currentY);
    currentY += 10;

    const assetRows = [
      ['Cash', balance_sheet.assets.cash],
      ['Accounts Receivable', balance_sheet.assets.accounts_receivable],
      ['Inventory', balance_sheet.assets.inventory],
      ['Other Current Assets', balance_sheet.assets.other_current_assets],
      ['Total Current Assets', balance_sheet.assets.total_current_assets],
      ['PPE', balance_sheet.assets.ppe],
      ['Total Assets', balance_sheet.assets.total_assets]
    ];

    this.addTableRows(pdf, assetRows, currentY, pageWidth, margin);
    currentY += (assetRows.length * 8) + 15;

    // Liabilities section
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Liabilities', margin, currentY);
    currentY += 10;

    const liabilityRows = [
      ['Accounts Payable', balance_sheet.liabilities.accounts_payable],
      ['Accrued Expenses', balance_sheet.liabilities.accrued_expenses],
      ['Short Term Debt', balance_sheet.liabilities.short_term_debt],
      ['Total Current Liabilities', balance_sheet.liabilities.total_current_liabilities],
      ['Long Term Debt', balance_sheet.liabilities.long_term_debt],
      ['Total Liabilities', balance_sheet.liabilities.total_liabilities]
    ];

    this.addTableRows(pdf, liabilityRows, currentY, pageWidth, margin);
    currentY += (liabilityRows.length * 8) + 15;

    // Equity section
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Equity', margin, currentY);
    currentY += 10;

    const equityRows = [
      ['Share Capital', balance_sheet.equity.share_capital],
      ['Retained Earnings', balance_sheet.equity.retained_earnings],
      ['Total Equity', balance_sheet.equity.total_equity]
    ];

    this.addTableRows(pdf, equityRows, currentY, pageWidth, margin);
    
    return currentY + (equityRows.length * 8) + 15;
  }

  /**
   * Add Cash Flow to PDF
   */
  private addCashFlow(pdf: jsPDF, calculationResult: CalculationResult, currentY: number, pageWidth: number, margin: number): number {
    const { cash_flow } = calculationResult;
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Cash Flow Statement', margin, currentY);
    currentY += 15;

    const cashFlowRows = [
      ['Operating Cash Flow', cash_flow.operating_cash_flow],
      ['Investing Cash Flow', cash_flow.investing_cash_flow],
      ['Financing Cash Flow', cash_flow.financing_cash_flow],
      ['Net Cash Flow', cash_flow.net_cash_flow],
      ['Ending Cash Balance', cash_flow.ending_cash]
    ];

    this.addTableRows(pdf, cashFlowRows, currentY, pageWidth, margin);
    
    return currentY + (cashFlowRows.length * 8) + 15;
  }

  /**
   * Add Financial Ratios to PDF
   */
  private addFinancialRatios(pdf: jsPDF, calculationResult: CalculationResult, currentY: number, pageWidth: number, margin: number): number {
    const { kpis } = calculationResult;
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Financial Ratios', margin, currentY);
    currentY += 15;

    // Table headers
    pdf.setFillColor(52, 73, 94);
    pdf.rect(margin, currentY, pageWidth - (margin * 2), 10, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Ratio', margin + 5, currentY + 7);
    pdf.text('Value', margin + 80, currentY + 7);
    pdf.text('Industry Avg', margin + 120, currentY + 7);
    pdf.text('Status', margin + 160, currentY + 7);
    
    currentY += 10;
    
    const ratioRows = [
      ['Gross Margin', kpis.gross_margin, 45.0, kpis.gross_margin > 45 ? 'Good' : 'Needs Improvement'],
      ['Operating Margin', kpis.operating_margin, 15.0, kpis.operating_margin > 15 ? 'Good' : 'Needs Improvement'],
      ['Net Margin', kpis.net_margin, 10.0, kpis.net_margin > 10 ? 'Good' : 'Needs Improvement'],
      ['ROE', kpis.roe, 12.0, kpis.roe > 12 ? 'Good' : 'Needs Improvement'],
      ['ROA', kpis.roa, 8.0, kpis.roa > 8 ? 'Good' : 'Needs Improvement'],
      ['Current Ratio', kpis.current_ratio, 1.5, kpis.current_ratio > 1.5 ? 'Good' : 'Needs Improvement'],
      ['Debt to Equity', kpis.debt_to_equity, 0.5, kpis.debt_to_equity < 0.5 ? 'Good' : 'Needs Improvement']
    ];

    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    ratioRows.forEach(row => {
      pdf.text(row[0], margin + 5, currentY + 6);
      pdf.text(`${(row[1] as number).toFixed(1)}%`, margin + 80, currentY + 6);
      pdf.text(`${(row[2] as number).toFixed(1)}%`, margin + 120, currentY + 6);
      pdf.text(row[3] as string, margin + 160, currentY + 6);
      currentY += 8;
    });
    
    return currentY + 15;
  }

  /**
   * Add Revenue Projections Chart to PDF
   */
  private addRevenueProjectionsChart(pdf: jsPDF, calculationResult: CalculationResult, currentY: number, pageWidth: number, margin: number): number {
    const { projections } = calculationResult;
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Revenue Projections', margin, currentY);
    currentY += 15;

    // Create a simple bar chart representation
    const chartWidth = pageWidth - (margin * 2);
    const chartHeight = 60;
    const barWidth = chartWidth / projections.years.length;
    
    // Find max value for scaling
    const maxRevenue = Math.max(...projections.revenue);
    
    // Draw chart background
    pdf.setFillColor(248, 249, 250);
    pdf.rect(margin, currentY, chartWidth, chartHeight, 'F');
    pdf.setDrawColor(200, 200, 200);
    pdf.rect(margin, currentY, chartWidth, chartHeight, 'S');
    
    // Draw bars
    projections.years.forEach((year, index) => {
      const barHeight = (projections.revenue[index] / maxRevenue) * (chartHeight - 20);
      const x = margin + (index * barWidth) + 5;
      const y = currentY + chartHeight - barHeight - 10;
      
      pdf.setFillColor(52, 152, 219);
      pdf.rect(x, y, barWidth - 10, barHeight, 'F');
      
      // Add year labels
      pdf.setTextColor(100, 100, 100);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(year.toString(), x + (barWidth - 10) / 2, currentY + chartHeight - 2, { align: 'center' });
      
      // Add value labels
      pdf.setTextColor(0, 0, 0);
      pdf.text(`$${(projections.revenue[index] / 1000000).toFixed(1)}M`, x + (barWidth - 10) / 2, y - 5, { align: 'center' });
    });
    
    return currentY + chartHeight + 20;
  }

  /**
   * Add KPIs Chart to PDF
   */
  private addKPIsChart(pdf: jsPDF, calculationResult: CalculationResult, currentY: number, pageWidth: number, margin: number): number {
    const { kpis } = calculationResult;
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Key Performance Indicators', margin, currentY);
    currentY += 15;

    // Create a horizontal bar chart for KPIs
    const chartWidth = pageWidth - (margin * 2);
    const chartHeight = 80;
    const barHeight = 8;
    const spacing = 12;
    
    const kpiData = [
      { name: 'Gross Margin', value: kpis.gross_margin, color: [52, 152, 219] },
      { name: 'Operating Margin', value: kpis.operating_margin, color: [46, 204, 113] },
      { name: 'Net Margin', value: kpis.net_margin, color: [155, 89, 182] },
      { name: 'ROE', value: kpis.roe, color: [230, 126, 34] },
      { name: 'ROA', value: kpis.roa, color: [231, 76, 60] }
    ];
    
    const maxValue = Math.max(...kpiData.map(k => k.value));
    
    // Draw chart background
    pdf.setFillColor(248, 249, 250);
    pdf.rect(margin, currentY, chartWidth, chartHeight, 'F');
    pdf.setDrawColor(200, 200, 200);
    pdf.rect(margin, currentY, chartWidth, chartHeight, 'S');
    
    kpiData.forEach((kpi, index) => {
      const y = currentY + 10 + (index * spacing);
      const barWidth = (kpi.value / maxValue) * (chartWidth - 100);
      
      // Draw bar
      pdf.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
      pdf.rect(margin + 80, y, barWidth, barHeight, 'F');
      
      // Add labels
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(kpi.name, margin + 5, y + 6);
      pdf.text(`${kpi.value.toFixed(1)}%`, margin + 85 + barWidth, y + 6);
    });
    
    return currentY + chartHeight + 20;
  }

  /**
   * Add footer to PDF
   */
  private addFooter(pdf: jsPDF, pageWidth: number, pageHeight: number, margin: number): void {
    const footerY = pageHeight - 15;
    
    pdf.setFillColor(52, 73, 94);
    pdf.rect(0, footerY, pageWidth, 15, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generated by Financial Modeling Suite | ${this.config.companyName || 'Professional Financial Analysis'}`, pageWidth / 2, footerY + 10, { align: 'center' });
  }

  /**
   * Add table rows helper function
   */
  private addTableRows(pdf: jsPDF, rows: (string | number)[][], currentY: number, pageWidth: number, margin: number): void {
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    rows.forEach((row, index) => {
      const isTotal = index === rows.length - 1;
      if (isTotal) {
        pdf.setFillColor(236, 240, 241);
        pdf.rect(margin, currentY, pageWidth - (margin * 2), 8, 'F');
        pdf.setFont('helvetica', 'bold');
      }
      
      pdf.text(row[0] as string, margin + 5, currentY + 6);
      pdf.text(this.formatCurrency(row[1] as number), margin + 80, currentY + 6);
      
      currentY += 8;
      if (isTotal) pdf.setFont('helvetica', 'normal');
    });
  }

  /**
   * Format currency values
   */
  private formatCurrency(value: number): string {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    } else {
      return `$${value.toFixed(0)}`;
    }
  }

  /**
   * Format percentage values
   */
  private formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }
}

/**
 * Factory function to create PDF export service
 */
export function createPDFExportService(config: Partial<PDFExportConfig> = {}): PDFExportService {
  const defaultConfig: PDFExportConfig = {
    title: 'Financial Analysis Report',
    date: new Date(),
    includeCharts: true,
    includeTables: true,
    includeKPIs: true,
    pageSize: 'A4',
    orientation: 'portrait',
    ...config
  };

  return new PDFExportService(defaultConfig);
}

/**
 * Export dashboard to PDF
 */
export async function exportDashboardToPDF(
  calculationResult: CalculationResult,
  modelName: string
): Promise<Blob> {
  const pdfService = createPDFExportService({
    title: `${modelName} Financial Report`,
    subtitle: 'Comprehensive Financial Analysis and Projections',
    companyName: 'Financial Modeling Suite',
    date: new Date(),
    includeCharts: true,
    includeTables: true,
    includeKPIs: true,
    pageSize: 'A4',
    orientation: 'portrait'
  });

  return await pdfService.generateFinancialReport(calculationResult);
} 