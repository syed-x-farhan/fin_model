import React, { useState, useCallback } from 'react';
import { Edit3, Check, X, AlertCircle, Info } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface CellData {
  value: string | number;
  type: 'text' | 'number' | 'currency' | 'percentage';
  isEdited?: boolean;
  hasError?: boolean;
  errorMessage?: string;
}

export interface RowData {
  [key: string]: CellData;
}

export interface ColumnMapping {
  excelColumn: string;
  mappedTo: string | null;
  dataType: 'text' | 'number' | 'currency' | 'percentage';
  isRequired: boolean;
}

interface DataPreviewTableProps {
  data: RowData[];
  columns: string[];
  columnMappings?: ColumnMapping[];
  onDataChange: (data: RowData[]) => void;
  onColumnMappingChange?: (mappings: ColumnMapping[]) => void;
  showMappingMode?: boolean;
  maxRows?: number;
}

export const DataPreviewTable: React.FC<DataPreviewTableProps> = ({
  data,
  columns,
  columnMappings = [],
  onDataChange,
  onColumnMappingChange,
  showMappingMode = false,
  maxRows = 50
}) => {
  const [editingCell, setEditingCell] = useState<{ row: number; column: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Financial categories for mapping
  const financialCategories = [
    'Revenue',
    'Cost of Goods Sold',
    'Operating Expenses',
    'Interest Expense',
    'Tax Expense',
    'Assets',
    'Liabilities',
    'Equity',
    'Cash Flow from Operations',
    'Cash Flow from Investing',
    'Cash Flow from Financing'
  ];

  const handleCellEdit = useCallback((rowIndex: number, columnKey: string, currentValue: CellData) => {
    setEditingCell({ row: rowIndex, column: columnKey });
    setEditValue(String(currentValue.value));
  }, []);

  const handleCellSave = useCallback((rowIndex: number, columnKey: string) => {
    const newData = [...data];
    const oldValue = newData[rowIndex][columnKey];
    
    // Validate the new value based on data type
    let validatedValue: string | number = editValue;
    let hasError = false;
    let errorMessage = '';

    if (oldValue.type === 'number' || oldValue.type === 'currency' || oldValue.type === 'percentage') {
      const numValue = parseFloat(editValue.replace(/[,$%]/g, ''));
      if (isNaN(numValue)) {
        hasError = true;
        errorMessage = 'Invalid number format';
      } else {
        validatedValue = numValue;
      }
    }

    newData[rowIndex][columnKey] = {
      ...oldValue,
      value: validatedValue,
      isEdited: true,
      hasError,
      errorMessage
    };

    onDataChange(newData);
    setEditingCell(null);
    setEditValue('');
  }, [data, editValue, onDataChange]);

  const handleCellCancel = useCallback(() => {
    setEditingCell(null);
    setEditValue('');
  }, []);

  const formatCellValue = (cell: CellData): string => {
    if (typeof cell.value === 'number') {
      switch (cell.type) {
        case 'currency':
          return `$${cell.value.toLocaleString()}`;
        case 'percentage':
          return `${cell.value}%`;
        case 'number':
          return cell.value.toLocaleString();
        default:
          return String(cell.value);
      }
    }
    return String(cell.value);
  };

  const getCellClassName = (cell: CellData | undefined): string => {
    let className = 'relative';
    if (!cell) return className;
    if (cell.isEdited) {
      className += ' bg-blue-50 border-l-2 border-l-blue-500';
    }
    if (cell.hasError) {
      className += ' bg-red-50 border-l-2 border-l-red-500';
    }
    return className;
  };

  const displayData = data.slice(0, maxRows);
  const totalErrors = data.reduce((count, row) => {
    return count + Object.values(row).filter(cell => cell.hasError).length;
  }, 0);
  
  const totalEdited = data.reduce((count, row) => {
    return count + Object.values(row).filter(cell => cell.isEdited).length;
  }, 0);

  return (
    <div className="space-y-4">
      {/* Data Quality Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Total Rows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.length}</div>
            {data.length > maxRows && (
              <p className="text-xs text-muted-foreground">
                Showing first {maxRows} rows
              </p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Edited Cells</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalEdited}</div>
            <p className="text-xs text-muted-foreground">Modified values</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Validation Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalErrors}</div>
            <p className="text-xs text-muted-foreground">Cells with errors</p>
          </CardContent>
        </Card>
      </div>

      {/* Validation Errors Alert */}
      {totalErrors > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {totalErrors} cell(s) contain validation errors. Please review and correct before proceeding.
          </AlertDescription>
        </Alert>
      )}

      {/* Instructions */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Click on any cell to edit values. Use Tab to navigate between cells. Changes are highlighted in blue.
        </AlertDescription>
      </Alert>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Preview</CardTitle>
          <CardDescription>
            Review and edit your imported financial data. Click any cell to make changes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  {columns.map((column) => (
                    <TableHead key={column} className="min-w-[120px]">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{column}</span>
                        {showMappingMode && (
                          <Badge variant="outline" className="text-xs">
                            {columnMappings.find(m => m.excelColumn === column)?.mappedTo || 'Unmapped'}
                          </Badge>
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayData.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    <TableCell className="font-medium text-muted-foreground">
                      {rowIndex + 1}
                    </TableCell>
                    {columns.map((column) => {
                      let cell = row[column];
                      if (!cell) {
                        cell = { value: '', type: 'text', isEdited: false, hasError: false, errorMessage: '' };
                      }
                      const isEditing = editingCell?.row === rowIndex && editingCell?.column === column;
                      return (
                        <TableCell key={column} className={getCellClassName(cell)}>
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <Input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleCellSave(rowIndex, column);
                                  } else if (e.key === 'Escape') {
                                    handleCellCancel();
                                  }
                                }}
                                className="h-8"
                                autoFocus
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleCellSave(rowIndex, column)}
                                className="h-8 w-8 p-0"
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleCellCancel}
                                className="h-8 w-8 p-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div 
                              className="flex items-center justify-between group cursor-pointer hover:bg-muted/50 p-1 rounded"
                              onClick={() => handleCellEdit(rowIndex, column, cell)}
                            >
                              <span className={cell.hasError ? 'text-red-600' : ''}>
                                {formatCellValue(cell)}
                              </span>
                              <Edit3 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                              {cell.isEdited && (
                                <Badge variant="secondary" className="ml-1 text-xs">
                                  Edited
                                </Badge>
                              )}
                              {cell.hasError && (
                                <AlertCircle className="h-3 w-3 text-red-500 ml-1" />
                              )}
                            </div>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
      
      {data.length > maxRows && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Showing {maxRows} of {data.length} rows. All data will be processed when you proceed.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};