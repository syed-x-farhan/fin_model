import { useState, useCallback } from 'react';
import { RowData, ColumnMapping } from '@/components/excel/DataPreviewTable';
import { applyColumnMappings } from '@/services/api';
import { parseBusinessInputExcel } from './excel/businessInputParser';

interface ImportedData {
  id: string;
  fileName: string;
  importDate: Date;
  data: RowData[];
  mappings: ColumnMapping[];
  source: 'excel';
}

interface UseExcelImportReturn {
  importedData: ImportedData | null;
  isImporting: boolean;
  importHistory: ImportedData[];
  handleImport: (data: RowData[], mappings: ColumnMapping[], fileName: string, modelId: string) => Promise<void>;
  clearImport: () => void;
  getVariableValue: (category: string, year?: string) => number | null;
  hasImportedData: boolean;
}

export const useExcelImport = (): UseExcelImportReturn => {
  const [importedData, setImportedData] = useState<ImportedData | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importHistory, setImportHistory] = useState<ImportedData[]>([]);

  const handleImport = useCallback(async (
    data: RowData[], 
    mappings: ColumnMapping[], 
    fileName: string,
    modelId: string
  ) => {
    setIsImporting(true);
    
    try {
      // NEW: Parse Excel data into business input structure
      const businessInput = parseBusinessInputExcel(data, mappings);
      // Optionally, send to backend or set as importedData
      const newImportedData: ImportedData = {
        id: `import_${Date.now()}`,
        fileName,
        importDate: new Date(),
        data,
        mappings,
        source: 'excel'
      };
      setImportedData(newImportedData);
      setImportHistory(prev => [newImportedData, ...prev.slice(0, 9)]);
      
    } catch (error) {
      console.error('Failed to import data:', error);
      throw error;
    } finally {
      setIsImporting(false);
    }
  }, []);

  const clearImport = useCallback(() => {
    setImportedData(null);
  }, []);

  const getVariableValue = useCallback((category: string, year?: string): number | null => {
    if (!importedData) return null;
    
    // Find the mapping for this category
    const mapping = importedData.mappings.find(m => m.mappedTo === category);
    if (!mapping) return null;
    
    // Find the data row for the specified year (or use first row if no year specified)
    let targetRow = importedData.data[0];
    if (year) {
      const yearRow = importedData.data.find(row => 
        row['Year']?.value === year || 
        row['year']?.value === year ||
        Object.values(row).some(cell => cell.value === year)
      );
      if (yearRow) targetRow = yearRow;
    }
    
    // Get the value from the mapped column
    const cellData = targetRow[mapping.excelColumn];
    if (!cellData) return null;
    
    const value = cellData.value;
    return typeof value === 'number' ? value : parseFloat(String(value).replace(/[,$%]/g, '')) || null;
  }, [importedData]);

  return {
    importedData,
    isImporting,
    importHistory,
    handleImport,
    clearImport,
    getVariableValue,
    hasImportedData: !!importedData
  };
};