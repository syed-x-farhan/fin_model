import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Upload, FileSpreadsheet, CheckCircle, Settings, Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ExcelUploadDialog } from './ExcelUploadDialog';
import { DataPreviewTable, RowData, ColumnMapping } from './DataPreviewTable';
import { ColumnMapper } from './ColumnMapper';
import { applyColumnMappings } from '@/services/api';
import { businessInputSections, getSectionFields, businessInputFields, parseBusinessInputExcel } from './businessInputParser';
import { useNavigate } from 'react-router-dom';
import { api as apiService } from '@/services/api';

interface ImportWizardProps {
  onImportComplete: (data: RowData[], mappings: ColumnMapping[]) => void;
  onCancel: () => void;
  modelId: string;
  onCalculationComplete?: (result: any) => void;
}

interface ImportStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  completed: boolean;
}

interface ParsedExcelData {
  sheets: string[];
  rowCount: number;
  fileName: string;
  data?: any[]; // Changed to any[] to match actual parsed data
  columns?: string[];
}

export const ImportWizard: React.FC<ImportWizardProps> = ({
  onImportComplete,
  onCancel,
  modelId,
  onCalculationComplete
}) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedExcelData | null>(null);
  const [previewData, setPreviewData] = useState<RowData[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');

  // Add state to track which sheet is selected for each section
  const [sectionSheets, setSectionSheets] = useState(() => {
    const obj = {};
    businessInputSections.forEach(section => { obj[section] = ''; });
    return obj;
  });
  // Add state to track mappings for all sections
  const [sectionMappings, setSectionMappings] = useState(() => {
    const obj = {};
    businessInputSections.forEach(section => { obj[section] = []; });
    return obj;
  });

  // Auto-select the most likely sheet for each section based on keywords
  useEffect(() => {
    if (sheetNames.length === 0) return;
    setSectionSheets(prev => {
      const updated = { ...prev };
      businessInputSections.forEach(section => {
        if (!updated[section]) {
          // Try to find a sheet whose name includes the section keyword (case-insensitive)
          const match = sheetNames.find(name => name.toLowerCase().includes(section.replace('_', '').toLowerCase()));
          if (match) updated[section] = match;
        }
      });
      return updated;
    });
  }, [sheetNames]);

  const steps: ImportStep[] = [
    {
      id: 'upload',
      title: 'Upload File',
      description: 'Select and upload your Excel file',
      icon: Upload,
      completed: !!parsedData
    },
    {
      id: 'preview',
      title: 'Preview Data',
      description: 'Review and edit imported data',
      icon: Eye,
      completed: previewData.length > 0 && currentStep > 1
    },
    {
      id: 'mapping',
      title: 'Map Columns',
      description: 'Map Excel columns to financial categories',
      icon: Settings,
      completed: false // This step is now flat, so it's always active
    },
    {
      id: 'confirm',
      title: 'Confirm Import',
      description: 'Review and confirm the import',
      icon: CheckCircle,
      completed: false
    }
  ];

  // Convert parsed Excel data to RowData format
  const convertExcelDataToRowData = (excelData: any): RowData[] => {
    console.log('convertExcelDataToRowData input:', excelData); // Debug log
    
    // Handle different data structures
    if (!excelData) {
      console.log('No excelData provided');
      return [];
    }
    
    // If it's already an array, use it directly
    if (Array.isArray(excelData)) {
      console.log('excelData is already an array');
    } else if (typeof excelData === 'object') {
      // If it's an object, try to find the data array
      if (excelData.data && Array.isArray(excelData.data)) {
        console.log('Found data array in excelData.data');
        excelData = excelData.data;
      } else if (excelData.rows && Array.isArray(excelData.rows)) {
        console.log('Found data array in excelData.rows');
        excelData = excelData.rows;
      } else {
        console.log('excelData is an object but no array found, converting to single row');
        excelData = [excelData];
      }
    } else {
      console.log('excelData is not an array or object, returning empty array');
      return [];
    }
    
    if (excelData.length === 0) {
      console.log('excelData array is empty');
      return [];
    }
    
    return excelData.map((row, index) => {
      console.log(`Processing row ${index}:`, row);
      const rowData: RowData = {};
      if (row && typeof row === 'object') {
        Object.keys(row).forEach(key => {
          if (key === '__sheetName') {
            rowData.__sheetName = row.__sheetName;
            return;
          }
          const value = row[key];
          // Determine data type
          let type: 'text' | 'number' | 'currency' | 'percentage' = 'text';
          if (typeof value === 'number') {
            type = 'currency'; // Default to currency for numbers
          } else if (typeof value === 'string') {
            if (value.includes('%')) {
              type = 'percentage';
            } else if (!isNaN(Number(value))) {
              type = 'currency';
            } else {
              type = 'text';
            }
          }
          rowData[key] = {
            value: value,
            type: type,
            isEdited: false,
            hasError: false,
            errorMessage: ''
          };
        });
      }
      return rowData;
    });
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleUploadComplete = (data: ParsedExcelData) => {
    console.log('Parsed data received:', data); // Debug log
    setParsedData(data);
    
    // Convert parsed data to RowData format
    const rowData = convertExcelDataToRowData(data.data || []);
    if (rowData.length > 0) {
      console.log('First converted row:', rowData[0]);
    }
    console.log('Converted row data:', rowData); // Debug log
    setPreviewData(rowData);

    // Force auto-mapping for common service-related columns
    const serviceColumnMap = {
      'Service Name': 'services.name',
      'Price/Client': 'services.price',
      'Clients/Month': 'services.clients',
      'Growth %': 'services.growth',
      'Delivery Cost': 'services.cost',
      'Notes': 'services.notes',
    };
    setColumnMappings((prev) => prev.map(mapping => {
      if (serviceColumnMap[mapping.excelColumn]) {
        return {
          ...mapping,
          mappedTo: serviceColumnMap[mapping.excelColumn],
          section: 'services',
        };
      }
      return mapping;
    }));
    setFlatColumnMappings((prev) => prev.map(mapping => {
      if (serviceColumnMap[mapping.excelColumn]) {
        return {
          ...mapping,
          mappedTo: serviceColumnMap[mapping.excelColumn],
          section: 'services',
        };
      }
      return mapping;
    }));
    // Debug log after mapping
    setTimeout(() => {
      console.debug('[ImportWizard] Forced service auto-mapping:', serviceColumnMap);
      console.debug('[ImportWizard] columnMappings:', columnMappings);
      console.debug('[ImportWizard] flatColumnMappings:', flatColumnMappings);
    }, 500);
    
    // Initialize column mappings
    const columns = data.columns || Object.keys(rowData[0] || {});
    console.log('Columns found:', columns); // Debug log
    const initialMappings: ColumnMapping[] = columns.map(column => ({
      excelColumn: column,
      mappedTo: null,
      dataType: rowData[0]?.[column]?.type as any || 'text',
      isRequired: false,
      section: '' // <-- add section here if used in mapping creation
    }));
    setColumnMappings(initialMappings);
    
    setCurrentStep(1);
  };

  const handleDataChange = (newData: RowData[]) => {
    setPreviewData(newData);
  };

  const handleMappingChange = (newMappings: ColumnMapping[]) => {
    setColumnMappings(newMappings);
  };

  // When a sheet is selected for a section, update sectionSheets
  const handleSectionSheetChange = (section: string, sheet: string) => {
    setSectionSheets(prev => ({ ...prev, [section]: sheet }));
  };
  // When mappings change for a section, update sectionMappings and add 'section' to each mapping
  const handleSectionMappingChange = (section: string, mappings: ColumnMapping[]) => {
    const mappingsWithSection = mappings.map(m => ({ ...m, section }));
    setSectionMappings(prev => ({ ...prev, [section]: mappingsWithSection }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsProcessing(true);
    try {
      console.debug('[ImportWizard] handleComplete called');
      console.debug('[ImportWizard] previewData:', previewData);
      console.debug('[ImportWizard] flatColumnMappings:', flatColumnMappings);
      
      // Call the onImportComplete callback with the data and mappings
      // The parent component (FinancialDashboard) will handle the calculation
      onImportComplete(previewData, flatColumnMappings);
      console.debug('[ImportWizard] onImportComplete called successfully');
    } catch (error) {
      console.error('Import completion failed:', error);
      alert("An error occurred during import completion. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return !!parsedData;
      case 1:
        return previewData.length > 0;
      case 2:
        return flatColumnMappings.some(m => m.mappedTo !== null);
      case 3:
        return true;
      default:
        return false;
    }
  };

  // Memoized filtered data and columns for the selected sheet
  const filteredPreviewData = useMemo(() => {
    if (!selectedSheet) return [];
    return previewData.filter(row => String(row.__sheetName).trim() === selectedSheet.trim());
  }, [previewData, selectedSheet]);

  const filteredColumns = useMemo(() => {
    // Find all columns for the selected sheet
    // Ensure robust typing: coerce to string before comparison
    const rows = previewData.filter(row => String(row.__sheetName).trim() === selectedSheet.trim());
    const colSet = new Set<string>();
    rows.forEach(row => {
      Object.keys(row).forEach(key => {
        if (key !== '__sheetName') colSet.add(key);
      });
    });
    return Array.from(colSet);
  }, [previewData, selectedSheet]);

  // For each section, get the columns from the selected sheet
  const getSectionColumns = (section: string) => {
    const sheet = sectionSheets[section];
    if (!sheet) return [];
    const rows = previewData.filter(row => String(row.__sheetName).trim() === sheet.trim());
    console.log('Section:', section, 'Sheet:', sheet, 'Rows:', rows);
    if (rows.length === 0) return [];
    const keys = Object.keys(rows[0]).filter(k => k !== '__sheetName');
    console.log('Columns for section', section, ':', keys);
    return keys;
  };

  // Aggregate all unique columns from all sheets after upload
  const allColumns = React.useMemo(() => {
    const colSet = new Set<string>();
    previewData.forEach(row => {
      Object.keys(row).forEach(key => {
        if (key !== '__sheetName') colSet.add(key);
      });
    });
    return Array.from(colSet);
  }, [previewData]);

  // All possible business input fields (flattened)
  const allBusinessFields = Object.entries(businessInputFields).flatMap(([section, fields]) =>
    Array.isArray(fields) ? fields.map(field => `${section}.${field}`) : []
  );

  // State for flat column mappings
  const [flatColumnMappings, setFlatColumnMappings] = useState<ColumnMapping[]>(() =>
    allColumns.map(col => ({ excelColumn: col, mappedTo: null, dataType: 'text', isRequired: false, section: '' }))
  );

  // Update mappings when columns change
  useEffect(() => {
    setFlatColumnMappings(
      allColumns.map(col => {
        const existing = flatColumnMappings.find(m => m.excelColumn === col);
        return existing || { excelColumn: col, mappedTo: null, dataType: 'text', isRequired: false, section: '' };
      })
    );
    // eslint-disable-next-line
  }, [allColumns.length]);

  // Normalization and synonym map for auto-mapping
  function normalize(str: string) {
    return str.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
  }
  // Comprehensive synonym map for business input fields
  const synonymMap = {
    // Service Business Fields
    'servicename': ['name', 'service', 'service name', 'product', 'offering'],
    'priceclient': ['price', 'priceperclient', 'amount', 'rate', 'fee', 'cost per client', 'unit price'],
    'clientsmonth': ['clients', 'clientspermonth', 'customers', 'users', 'subscribers', 'monthly clients'],
    'growth': ['growth', 'growthpercent', 'growth%', 'growth rate', 'expansion', 'increase'],
    'deliverycost': ['cost', 'deliverycost', 'delivery cost', 'service cost', 'operational cost'],
    
    // General Business Fields
    'category': ['category', 'type', 'classification', 'group'],
    'amount': ['amount', 'value', 'cost', 'price', 'total', 'sum'],
    'notes': ['notes', 'description', 'details', 'comments', 'remarks'],
    'itemname': ['name', 'item', 'product', 'asset', 'equipment'],
    'usefullife': ['usefullife', 'life', 'useful life', 'lifespan', 'duration'],
    'purchasedate': ['date', 'purchasedate', 'purchase date', 'acquisition date', 'buy date'],
    'taxrate': ['tax', 'taxrate', 'taxrate%', 'tax rate', 'tax percent'],
    
    // Financial Fields
    'revenue': ['revenue', 'sales', 'income', 'turnover', 'receipts'],
    'expenses': ['expenses', 'costs', 'expenditure', 'outgoings'],
    'profit': ['profit', 'earnings', 'net income', 'surplus'],
    'margin': ['margin', 'markup', 'profit margin', 'gross margin'],
    
    // SaaS Specific
    'mrr': ['mrr', 'monthly recurring revenue', 'recurring revenue'],
    'arr': ['arr', 'annual recurring revenue', 'yearly revenue'],
    'churn': ['churn', 'churn rate', 'attrition', 'customer loss'],
    'ltv': ['ltv', 'lifetime value', 'customer lifetime value', 'clv'],
    'cac': ['cac', 'customer acquisition cost', 'acquisition cost'],
    
    // Retail Specific
    'inventory': ['inventory', 'stock', 'goods', 'merchandise'],
    'cogs': ['cogs', 'cost of goods sold', 'cost of sales', 'direct costs'],
    'units': ['units', 'quantity', 'pieces', 'items sold'],
    'unitprice': ['unit price', 'price per unit', 'item price', 'selling price']
  };
  // Enhanced auto-mapping function with similarity scoring
  function autoMapColumn(col: string, allBusinessFields: string[]): string | null {
    let bestMatch: string | null = null;
    let bestScore = 0;
    const CONFIDENCE_THRESHOLD = 0.6;
    
    // Skip time period columns
    const timePeriodKeywords = ['year', 'period', 'date', 'month', 'quarter', 'fiscal', 'time'];
    if (timePeriodKeywords.some(keyword => normalize(col).includes(keyword))) {
      return null;
    }
    
    for (const field of allBusinessFields) {
      const fieldName = field.split('.')[1]; // Extract field name from section.fieldName
      
      // Direct field name match
      const directScore = calculateSimilarity(col, fieldName);
      if (directScore > bestScore) {
        bestScore = directScore;
        bestMatch = field;
      }
      
      // Check synonyms
      const fieldKey = normalize(fieldName);
      const synonyms = synonymMap[fieldKey] || [];
      
      for (const synonym of synonyms) {
        const synonymScore = calculateSimilarity(col, synonym);
        if (synonymScore > bestScore) {
          bestScore = synonymScore;
          bestMatch = field;
        }
      }
    }
    
    return bestMatch && bestScore >= CONFIDENCE_THRESHOLD ? bestMatch : null;
  }
  
  // Reuse similarity calculation functions from ColumnMapper
  function calculateSimilarity(str1: string, str2: string): number {
    const s1 = normalize(str1);
    const s2 = normalize(str2);
    
    if (s1 === s2) return 1.0;
    if (s1.includes(s2) || s2.includes(s1)) return 0.8;
    
    const words1 = s1.split(' ');
    const words2 = s2.split(' ');
    const commonWords = words1.filter(word => words2.includes(word));
    
    if (commonWords.length > 0) {
      return commonWords.length / Math.max(words1.length, words2.length) * 0.6;
    }
    
    const distance = levenshteinDistance(s1, s2);
    const maxLength = Math.max(s1.length, s2.length);
    return Math.max(0, 1 - distance / maxLength) * 0.4;
  }
  
  function levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  // Auto-map columns when allColumns or allBusinessFields changes
  useEffect(() => {
    setFlatColumnMappings(prev =>
      allColumns.map(col => {
        const existing = prev.find(m => m.excelColumn === col);
        // Only auto-map if not already mapped
        if (existing && existing.mappedTo) return existing;
        const auto = autoMapColumn(col, allBusinessFields);
        return { excelColumn: col, mappedTo: auto, dataType: 'text', isRequired: false };
      })
    );
    // eslint-disable-next-line
  }, [allColumns.join(','), allBusinessFields.join(',')]);

  // In the mapping step, show a single table for all columns
  const renderFlatMapping = () => (
    <div className="bg-muted/50 p-4 rounded-lg mb-4">
      <h4 className="font-medium mb-2">Map Excel Columns to Business Input Fields</h4>
      <table className="min-w-full border rounded bg-background text-foreground text-sm">
        <thead>
          <tr>
            <th className="p-2 border-b font-medium text-muted-foreground h-12 align-middle">Excel Column</th>
            <th className="p-2 border-b font-medium text-muted-foreground h-12 align-middle">Map To</th>
          </tr>
        </thead>
        <tbody>
          {flatColumnMappings.map((mapping, idx) => (
            <tr key={mapping.excelColumn}>
              <td className="p-2 border-b align-middle">{mapping.excelColumn}</td>
              <td className="p-2 border-b align-middle">
                <select
                  className="border rounded px-2 py-1 w-full"
                  value={mapping.mappedTo || ''}
                  onChange={e => {
                    const newVal = e.target.value || null;
                    setFlatColumnMappings(prev => prev.map((m, i) => i === idx ? { ...m, mappedTo: newVal } : m));
                  }}
                >
                  <option value="">No mapping</option>
                  {allBusinessFields.map(field => (
                    <option key={field} value={field}>{field}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const getStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <FileSpreadsheet className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Upload Your Financial Data</h3>
              <p className="text-muted-foreground">
                Select an Excel file containing your financial statements, assumptions, or forecasts
              </p>
            </div>
            
            <ExcelUploadDialog
              modelId={modelId}
              onFileSelect={handleFileSelect}
              onUploadComplete={(allSheetData: Record<string, any>) => {
                console.log('Raw allSheetData from backend:', allSheetData);
                // Merge all rows from all sheets into a single array
                const allRows: any[] = [];
                // Compute the union of all keys from all rows for columns
                let columnsSet = new Set<string>();
                const sheetNamesArr: string[] = Object.keys(allSheetData);
                setSheetNames(sheetNamesArr);
                let firstSheet = sheetNamesArr[0] || '';
                setSelectedSheet(firstSheet);
                Object.entries(allSheetData).forEach(([sheetName, sheet]: [string, any]) => {
                  if (sheet && Array.isArray(sheet.data)) {
                    sheet.data.forEach((row: any) => {
                      if (row && typeof row === 'object') {
                        // Attach sheet name to each row as a string
                        allRows.push({ ...(row || {}), __sheetName: String(sheetName) });
                        Object.keys(row).forEach(key => columnsSet.add(key));
                      }
                    });
                  }
                });
                const columns = Array.from(columnsSet);
                console.log('Merged allRows for preview:', allRows);
                // Debug: print all merged rows
                console.log('All merged rows:', allRows);
                // Debug: print first few rows before conversion
                if (allRows.length > 0) {
                  console.log('First merged row:', allRows[0]);
                }
                // Call the original handler with merged data
                handleUploadComplete({
                  sheets: Object.keys(allSheetData),
                  rowCount: allRows.length,
                  fileName: selectedFile?.name || 'Excel Import',
                  data: allRows,
                  columns: columns,
                });
              }}
              trigger={
                <Button size="lg" className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Excel File
                </Button>
              }
            />
            
            {parsedData && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">File Information</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">File:</span> {parsedData.fileName}</p>
                  <p><span className="font-medium">Sheets:</span> {parsedData.sheets?.join(', ') || 'N/A'}</p>
                  <p><span className="font-medium">Rows:</span> {parsedData.rowCount || 'N/A'}</p>
                </div>
              </div>
            )}
          </div>
        );

      case 1:
        // Debug logs for sheet filtering
        console.log('sheetNames:', sheetNames);
        console.log('selectedSheet:', selectedSheet);
        console.log('previewData:', previewData);
        console.log('filteredPreviewData:', filteredPreviewData);
        console.log('filteredColumns:', filteredColumns);
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Preview & Edit Data</h3>
              <p className="text-muted-foreground">
                Review the imported data and make any necessary corrections
              </p>
            </div>
            {/* Sheet Selector */}
            <div className="flex items-center gap-2 mb-2">
              <label htmlFor="sheet-select" className="font-medium">Sheet:</label>
              <select
                id="sheet-select"
                value={selectedSheet}
                onChange={e => setSelectedSheet(e.target.value)}
                className="border rounded px-2 py-1"
              >
                {sheetNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <DataPreviewTable
              data={filteredPreviewData}
              columns={filteredColumns}
              onDataChange={handleDataChange}
              maxRows={10}
            />
          </div>
        );

      case 2:
        // Card-based mapping UI for all columns
        return (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Map Excel Columns</h3>
                <p className="text-muted-foreground">
                  Map your Excel columns to the appropriate business input fields
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => {
                  setFlatColumnMappings(prev =>
                    prev.map(mapping => {
                      if (mapping.mappedTo) return mapping;
                      const auto = autoMapColumn(mapping.excelColumn, allBusinessFields);
                      return { ...mapping, mappedTo: auto };
                    })
                  );
                }} className="gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Auto-Map Columns
                </Button>
                <Button variant="ghost" size="sm" onClick={() => {
                  setFlatColumnMappings(prev => prev.map(m => ({ ...m, mappedTo: null })));
                }} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                  Clear All
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {flatColumnMappings.map((mapping, idx) => {
                const mappedField = mapping.mappedTo;
                let fieldSection = null, fieldName = null, fieldInfo = null;
                if (mappedField) {
                  [fieldSection, fieldName] = mappedField.split('.');
                  fieldInfo = businessInputFields[fieldSection]?.find(f => f === fieldName || f.field === fieldName || f.name === fieldName);
                }
                // Fallback: try to find required status by field name
                const isRequired = mappedField ? (fieldInfo?.isRequired || false) : false;
                return (
                  <Card key={mapping.excelColumn} className="relative overflow-hidden">
                    <CardHeader className="pb-2 space-y-1">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{mapping.excelColumn}</CardTitle>
                        <div className="flex gap-2">
                          {isRequired && (
                            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">Required</Badge>
                          )}
                          {mappedField && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">Mapped</Badge>
                          )}
                        </div>
                      </div>
                      <CardDescription className="text-xs">
                        {mappedField ? (fieldInfo?.description || 'Mapped field') : 'Select a mapping...'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <select
                          className="border rounded px-2 py-1 w-full"
                          value={mapping.mappedTo || ''}
                          onChange={e => {
                            const newVal = e.target.value || null;
                            setFlatColumnMappings(prev => prev.map((m, i) => i === idx ? { ...m, mappedTo: newVal } : m));
                          }}
                        >
                          <option value="">No mapping</option>
                          {allBusinessFields.map(field => (
                            <option key={field} value={field}>{field}</option>
                          ))}
                        </select>
                        {mapping.mappedTo && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => {
                            setFlatColumnMappings(prev => prev.map((m, i) => i === idx ? { ...m, mappedTo: null } : m));
                          }}>
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {fieldInfo && (
                        <div className="mt-2 pt-2 border-t">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Section: {fieldSection}</span>
                            <span>Field: {fieldName}</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Confirm Import</h3>
              <p className="text-muted-foreground">
                Review your settings and confirm the data import
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Import Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>File:</span>
                    <span className="font-medium">{parsedData?.fileName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rows:</span>
                    <span className="font-medium">{previewData.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Columns:</span>
                    <span className="font-medium">{flatColumnMappings.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mapped:</span>
                    <span className="font-medium">
                      {flatColumnMappings.filter(m => m.mappedTo).length}
                    </span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Column Mappings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {flatColumnMappings
                      .filter(m => m.mappedTo)
                      .map((mapping, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span>{mapping.excelColumn}</span>
                        <Badge variant="secondary">{mapping.mappedTo}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = step.completed;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    isActive 
                      ? 'border-primary bg-primary text-primary-foreground' 
                      : isCompleted
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-muted-foreground bg-background'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="mt-2 text-center">
                    <p className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <Separator className="w-24 mx-4" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <Card className="min-h-[500px]">
        <CardContent className="p-6">
          {getStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={currentStep === 0 ? onCancel : handleBack}
          disabled={isProcessing}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          {currentStep === 0 ? 'Cancel' : 'Back'}
        </Button>
        
        <Button
          onClick={currentStep === steps.length - 1 ? handleComplete : handleNext}
          disabled={!canProceed() || isProcessing}
        >
          {isProcessing ? 'Processing...' : currentStep === steps.length - 1 ? 'Complete Import' : 'Next'}
          {!isProcessing && currentStep < steps.length - 1 && (
            <ChevronRight className="h-4 w-4 ml-2" />
          )}
        </Button>
      </div>
    </div>
  );
};