# Dashboard PDF Export Feature

## Overview

This feature allows users to export the entire financial dashboard as a high-quality PDF document. Each dashboard tab is captured as a full HD image and included as a separate page in the PDF.

## Features

### ✅ What's Implemented

1. **Multi-Tab Export**: Captures all 6 dashboard tabs:
   - Business Overview
   - Performance Analysis
   - Capital & Ownership
   - Financial Analysis
   - Financial Ratios
   - Sensitivity Analysis

2. **High-Quality Images**: 
   - Full HD resolution (1920x1080)
   - High-quality rendering with html2canvas
   - Configurable quality settings (low/medium/high)

3. **Professional PDF Layout**:
   - Cover page with title and table of contents
   - Each tab gets its own page
   - Professional headers and footers
   - Page numbering

4. **Smart Content Handling**:
   - Automatically switches between tabs during export
   - Waits for content to render before capturing
   - Handles overflow content appropriately
   - Removes UI elements that shouldn't be in PDF

5. **User Experience**:
   - Export button in dashboard header
   - Loading state with spinner
   - Success/error notifications
   - Automatic file download with descriptive filename

## Technical Implementation

### Files Created/Modified

1. **`src/services/dashboardPdfExport.ts`** - New service for PDF export
2. **`src/pages/Dashboard.tsx`** - Added export functionality
3. **`src/index.css`** - Added PDF export styles

### Key Components

#### DashboardPDFExportService
- Handles the entire PDF generation process
- Manages tab switching and content capture
- Configures html2canvas for optimal quality
- Creates professional PDF layout

#### Export Function
```typescript
const handleExportPDF = async () => {
  // Validates dashboard content
  // Captures each tab as image
  // Generates PDF with all tabs
  // Downloads file automatically
}
```

### Dependencies Used

- **jsPDF**: PDF generation
- **html2canvas**: DOM to canvas conversion
- **React refs**: Content targeting
- **Toast notifications**: User feedback

## Usage

### For Users

1. Navigate to any dashboard page
2. Click the "Export to PDF" button in the header
3. Wait for the export process to complete
4. PDF will automatically download with filename: `{ModelName}_Dashboard_{Date}.pdf`

### For Developers

```typescript
import { exportDashboardToPDF } from '@/services/dashboardPdfExport';

// Basic usage
const pdfBlob = await exportDashboardToPDF(
  dashboardTabs,
  activeTab,
  setActiveTab,
  dashboardContentRef
);

// With custom options
const pdfBlob = await exportDashboardToPDF(
  dashboardTabs,
  activeTab,
  setActiveTab,
  dashboardContentRef,
  {
    title: 'Custom Title',
    quality: 'high',
    pageSize: 'A4',
    orientation: 'portrait'
  }
);
```

## Configuration Options

```typescript
interface PDFExportOptions {
  title: string;                    // PDF title
  subtitle?: string;                // PDF subtitle
  companyName?: string;             // Company name for footer
  date: Date;                       // Generation date
  pageSize: 'A4' | 'Letter';        // Page size
  orientation: 'portrait' | 'landscape'; // Page orientation
  quality: 'low' | 'medium' | 'high';    // Image quality
  includeHeader: boolean;           // Include page headers
  includeFooter: boolean;           // Include page footers
}
```

## Quality Settings

- **Low**: Scale factor 1x, faster export, smaller file size
- **Medium**: Scale factor 2x, balanced quality and performance
- **High**: Scale factor 3x, best quality, larger file size

## Browser Compatibility

- ✅ Chrome/Chromium (recommended)
- ✅ Firefox
- ✅ Safari
- ⚠️ Edge (may have issues with html2canvas)

## Performance Considerations

- Export time depends on dashboard complexity and quality setting
- Large dashboards may take 10-30 seconds to export
- Memory usage increases with higher quality settings
- Consider showing loading indicators for better UX

## Troubleshooting

### Common Issues

1. **Export fails**: Check browser console for errors
2. **Poor image quality**: Increase quality setting
3. **Missing content**: Ensure all charts are fully loaded
4. **Large file size**: Reduce quality setting

### Debug Mode

Enable debug logging by setting `logging: true` in html2canvas options.

## Future Enhancements

- [ ] Add export progress indicator
- [ ] Support for custom page layouts
- [ ] Watermark options
- [ ] Password protection
- [ ] Email integration
- [ ] Cloud storage integration
- [ ] Batch export multiple models
- [ ] Custom branding options