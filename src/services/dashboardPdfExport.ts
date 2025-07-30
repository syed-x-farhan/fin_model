import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface DashboardTab {
  value: string;
  label: string;
  icon: React.ElementType;
}

export interface PDFExportOptions {
  title: string;
  subtitle?: string;
  companyName?: string;
  date: Date;
  pageSize: 'A4' | 'Letter';
  orientation: 'portrait' | 'landscape';
  quality: 'low' | 'medium' | 'high';
  includeHeader: boolean;
  includeFooter: boolean;
}

export class DashboardPDFExportService {
  private options: PDFExportOptions;

  constructor(options: Partial<PDFExportOptions> = {}) {
    this.options = {
      title: 'Financial Dashboard Report',
      subtitle: 'Comprehensive Financial Analysis',
      companyName: 'Financial Modeling Suite',
      date: new Date(),
      pageSize: 'A4',
      orientation: 'portrait',
      quality: 'high',
      includeHeader: true,
      includeFooter: true,
      ...options
    };
  }

  /**
   * Export dashboard tabs to PDF with full HD image captures
   */
  async exportDashboardToPDF(
    tabs: DashboardTab[],
    activeTab: string,
    setActiveTab: (tab: string) => void,
    dashboardContentRef: React.RefObject<HTMLDivElement>
  ): Promise<Blob> {
    const pdf = new jsPDF({
      orientation: this.options.orientation,
      unit: 'mm',
      format: this.options.pageSize
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    const contentHeight = pageHeight - (margin * 2);

    // Add cover page
    await this.addCoverPage(pdf, pageWidth, pageHeight, margin);

    // Process each tab
    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i];
      
      // Switch to the tab
      setActiveTab(tab.value);
      
      // Wait for the content to render
      await this.waitForContentRender();
      
      // Capture the tab content
      const canvas = await this.captureTabContent(dashboardContentRef);
      
      if (canvas) {
        // Add new page for each tab (except first tab which goes on cover page)
        if (i > 0) {
          pdf.addPage();
        }
        
        // Add tab header
        await this.addTabHeader(pdf, tab, pageWidth, margin);
        
        // Add the captured image
        await this.addTabImage(pdf, canvas, pageWidth, pageHeight, margin, contentWidth, contentHeight);
        
        // Add footer if enabled
        if (this.options.includeFooter) {
          this.addFooter(pdf, pageWidth, pageHeight, margin, i + 1, tabs.length);
        }
      }
    }

    return pdf.output('blob');
  }

  /**
   * Add cover page to PDF
   */
  private async addCoverPage(pdf: jsPDF, pageWidth: number, pageHeight: number, margin: number): Promise<void> {
    // Background
    pdf.setFillColor(52, 73, 94);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // Title
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(32);
    pdf.setFont('helvetica', 'bold');
    pdf.text(this.options.title, pageWidth / 2, pageHeight / 2 - 40, { align: 'center' });
    
    // Subtitle
    if (this.options.subtitle) {
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'normal');
      pdf.text(this.options.subtitle, pageWidth / 2, pageHeight / 2, { align: 'center' });
    }
    
    // Company name
    pdf.setFontSize(14);
    pdf.text(this.options.companyName, pageWidth / 2, pageHeight / 2 + 20, { align: 'center' });
    
    // Date
    pdf.setFontSize(12);
    pdf.text(`Generated on ${this.options.date.toLocaleDateString()}`, pageWidth / 2, pageHeight / 2 + 40, { align: 'center' });
    
    // Table of contents
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Table of Contents', pageWidth / 2, pageHeight - 80, { align: 'center' });
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('1. Business Overview', margin, pageHeight - 60);
    pdf.text('2. Performance Analysis', margin, pageHeight - 50);
    pdf.text('3. Capital & Ownership', margin, pageHeight - 40);
    pdf.text('4. Financial Analysis', margin, pageHeight - 30);
    pdf.text('5. Financial Ratios', margin, pageHeight - 20);
    pdf.text('6. Sensitivity Analysis', margin, pageHeight - 10);
  }

  /**
   * Add tab header to PDF
   */
  private async addTabHeader(pdf: jsPDF, tab: DashboardTab, pageWidth: number, margin: number): Promise<void> {
    const headerHeight = 25;
    
    // Header background
    pdf.setFillColor(52, 73, 94);
    pdf.rect(0, 0, pageWidth, headerHeight, 'F');
    
    // Tab title
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text(tab.label, margin, headerHeight - 8);
    
    // Page indicator
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Page ${pdf.getCurrentPageInfo().pageNumber}`, pageWidth - margin - 30, headerHeight - 8);
  }

  /**
   * Capture tab content as canvas
   */
  private async captureTabContent(dashboardContentRef: React.RefObject<HTMLDivElement>): Promise<HTMLCanvasElement | null> {
    if (!dashboardContentRef.current) {
      console.error('Dashboard content ref not found');
      return null;
    }

    try {
      // Configure html2canvas options for high quality
      const canvasOptions = {
        scale: this.getScaleFactor(),
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 1920, // Full HD width
        height: 1080, // Full HD height
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1920,
        windowHeight: 1080,
        logging: false,
        removeContainer: true,
        foreignObjectRendering: true,
        imageTimeout: 15000,
        onclone: (clonedDoc: Document) => {
          // Remove any elements that shouldn't be in the PDF
          const elementsToRemove = clonedDoc.querySelectorAll('.no-print, .sidebar, .header, .navigation');
          elementsToRemove.forEach(el => el.remove());
          
          // Ensure proper styling for PDF
          const style = clonedDoc.createElement('style');
          style.textContent = `
            * { 
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            body { 
              background: white !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .dashboard-content {
              background: white !important;
              padding: 20px !important;
            }
          `;
          clonedDoc.head.appendChild(style);
        }
      };

      const canvas = await html2canvas(dashboardContentRef.current, canvasOptions);
      return canvas;
    } catch (error) {
      console.error('Error capturing tab content:', error);
      return null;
    }
  }

  /**
   * Add captured image to PDF
   */
  private async addTabImage(
    pdf: jsPDF, 
    canvas: HTMLCanvasElement, 
    pageWidth: number, 
    pageHeight: number, 
    margin: number,
    contentWidth: number,
    contentHeight: number
  ): Promise<void> {
    try {
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob!);
        }, 'image/png', 1.0);
      });

      // Convert blob to base64
      const base64 = await this.blobToBase64(blob);
      
      // Calculate image dimensions to fit the page
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // If image is too tall, scale it down
      let finalWidth = imgWidth;
      let finalHeight = imgHeight;
      
      if (imgHeight > contentHeight) {
        const scale = contentHeight / imgHeight;
        finalWidth = imgWidth * scale;
        finalHeight = imgHeight * scale;
      }
      
      // Center the image horizontally
      const x = margin + (contentWidth - finalWidth) / 2;
      const y = margin + 30; // Start below header
      
      // Add image to PDF
      pdf.addImage(base64, 'PNG', x, y, finalWidth, finalHeight);
      
    } catch (error) {
      console.error('Error adding image to PDF:', error);
    }
  }

  /**
   * Add footer to PDF
   */
  private addFooter(pdf: jsPDF, pageWidth: number, pageHeight: number, margin: number, currentPage: number, totalPages: number): void {
    const footerY = pageHeight - 15;
    
    pdf.setFillColor(52, 73, 94);
    pdf.rect(0, footerY, pageWidth, 15, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    // Left side - Company name
    pdf.text(this.options.companyName, margin, footerY + 10);
    
    // Center - Date
    pdf.text(`Generated on ${this.options.date.toLocaleDateString()}`, pageWidth / 2, footerY + 10, { align: 'center' });
    
    // Right side - Page numbers
    pdf.text(`Page ${currentPage} of ${totalPages}`, pageWidth - margin - 40, footerY + 10);
  }

  /**
   * Wait for content to render
   */
  private waitForContentRender(): Promise<void> {
    return new Promise((resolve) => {
      // Wait for next tick to ensure DOM updates
      setTimeout(resolve, 500);
    });
  }

  /**
   * Get scale factor based on quality setting
   */
  private getScaleFactor(): number {
    switch (this.options.quality) {
      case 'low': return 1;
      case 'medium': return 2;
      case 'high': return 3;
      default: return 2;
    }
  }

  /**
   * Convert blob to base64
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

/**
 * Factory function to create dashboard PDF export service
 */
export function createDashboardPDFExportService(options: Partial<PDFExportOptions> = {}): DashboardPDFExportService {
  return new DashboardPDFExportService(options);
}

/**
 * Export dashboard to PDF with tab captures
 */
export async function exportDashboardToPDF(
  tabs: DashboardTab[],
  activeTab: string,
  setActiveTab: (tab: string) => void,
  dashboardContentRef: React.RefObject<HTMLDivElement>,
  options: Partial<PDFExportOptions> = {}
): Promise<Blob> {
  const pdfService = createDashboardPDFExportService({
    title: 'Financial Dashboard Report',
    subtitle: 'Comprehensive Financial Analysis and Projections',
    companyName: 'Financial Modeling Suite',
    date: new Date(),
    pageSize: 'A4',
    orientation: 'portrait',
    quality: 'high',
    includeHeader: true,
    includeFooter: true,
    ...options
  });

  return await pdfService.exportDashboardToPDF(tabs, activeTab, setActiveTab, dashboardContentRef);
}