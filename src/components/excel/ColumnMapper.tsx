import React, { useState } from 'react';
import { ArrowRight, AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectGroup,
  SelectItem, 
  SelectLabel,
  SelectSeparator,
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { businessInputSections, businessInputFields } from './businessInputParser';

export interface ColumnMapping {
  excelColumn: string;
  mappedTo: string | null;
  dataType: 'text' | 'number' | 'currency' | 'percentage';
  isRequired: boolean;
  section: string;
}

interface ColumnMapperProps {
  columnMappings: ColumnMapping[];
  onMappingChange: (mappings: ColumnMapping[]) => void;
  columns: string[];
}

interface FinancialCategory {
  id: string;
  name: string;
  category: 'Income Statement' | 'Balance Sheet' | 'Cash Flow' | 'Assumptions';
  description: string;
  dataType: 'currency' | 'number' | 'percentage' | 'text';
  isRequired: boolean;
}

const financialCategories: FinancialCategory[] = [
  // Income Statement
  { id: 'revenue', name: 'Total Revenue', category: 'Income Statement', description: 'Total sales revenue', dataType: 'currency', isRequired: true },
  { id: 'cogs', name: 'Cost of Goods Sold', category: 'Income Statement', description: 'Direct costs of producing goods', dataType: 'currency', isRequired: true },
  { id: 'gross_profit', name: 'Gross Profit', category: 'Income Statement', description: 'Revenue minus COGS', dataType: 'currency', isRequired: false },
  { id: 'operating_expenses', name: 'Operating Expenses', category: 'Income Statement', description: 'General operating costs', dataType: 'currency', isRequired: true },
  { id: 'ebitda', name: 'EBITDA', category: 'Income Statement', description: 'Earnings before interest, taxes, depreciation', dataType: 'currency', isRequired: false },
  { id: 'depreciation', name: 'Depreciation & Amortization', category: 'Income Statement', description: 'Non-cash depreciation expense', dataType: 'currency', isRequired: true },
  { id: 'interest_expense', name: 'Interest Expense', category: 'Income Statement', description: 'Cost of debt financing', dataType: 'currency', isRequired: false },
  { id: 'tax_expense', name: 'Tax Expense', category: 'Income Statement', description: 'Income tax liability', dataType: 'currency', isRequired: false },
  { id: 'net_income', name: 'Net Income', category: 'Income Statement', description: 'Bottom line profit', dataType: 'currency', isRequired: true },

  // Balance Sheet
  { id: 'cash', name: 'Cash & Cash Equivalents', category: 'Balance Sheet', description: 'Liquid cash assets', dataType: 'currency', isRequired: true },
  { id: 'accounts_receivable', name: 'Accounts Receivable', category: 'Balance Sheet', description: 'Money owed by customers', dataType: 'currency', isRequired: false },
  { id: 'inventory', name: 'Inventory', category: 'Balance Sheet', description: 'Goods held for sale', dataType: 'currency', isRequired: false },
  { id: 'current_assets', name: 'Total Current Assets', category: 'Balance Sheet', description: 'Assets convertible to cash within 1 year', dataType: 'currency', isRequired: true },
  { id: 'ppe', name: 'Property, Plant & Equipment', category: 'Balance Sheet', description: 'Fixed assets', dataType: 'currency', isRequired: true },
  { id: 'total_assets', name: 'Total Assets', category: 'Balance Sheet', description: 'Sum of all assets', dataType: 'currency', isRequired: true },
  { id: 'accounts_payable', name: 'Accounts Payable', category: 'Balance Sheet', description: 'Money owed to suppliers', dataType: 'currency', isRequired: false },
  { id: 'current_liabilities', name: 'Total Current Liabilities', category: 'Balance Sheet', description: 'Debts due within 1 year', dataType: 'currency', isRequired: true },
  { id: 'long_term_debt', name: 'Long-term Debt', category: 'Balance Sheet', description: 'Debt due after 1 year', dataType: 'currency', isRequired: false },
  { id: 'total_liabilities', name: 'Total Liabilities', category: 'Balance Sheet', description: 'Sum of all liabilities', dataType: 'currency', isRequired: true },
  { id: 'shareholders_equity', name: "Shareholders' Equity", category: 'Balance Sheet', description: 'Ownership value', dataType: 'currency', isRequired: true },

  // Cash Flow
  { id: 'operating_cash_flow', name: 'Operating Cash Flow', category: 'Cash Flow', description: 'Cash from core business operations', dataType: 'currency', isRequired: true },
  { id: 'investing_cash_flow', name: 'Investing Cash Flow', category: 'Cash Flow', description: 'Cash from investments', dataType: 'currency', isRequired: false },
  { id: 'financing_cash_flow', name: 'Financing Cash Flow', category: 'Cash Flow', description: 'Cash from financing activities', dataType: 'currency', isRequired: false },
  { id: 'free_cash_flow', name: 'Free Cash Flow', category: 'Cash Flow', description: 'Cash available after investments', dataType: 'currency', isRequired: true },

  // Assumptions
  { id: 'revenue_growth_rate', name: 'Revenue Growth Rate', category: 'Assumptions', description: 'Annual revenue growth percentage', dataType: 'percentage', isRequired: true },
  { id: 'gross_margin', name: 'Gross Margin %', category: 'Assumptions', description: 'Gross profit as % of revenue', dataType: 'percentage', isRequired: true },
  { id: 'tax_rate', name: 'Tax Rate', category: 'Assumptions', description: 'Corporate tax rate', dataType: 'percentage', isRequired: true },
  { id: 'discount_rate', name: 'Discount Rate', category: 'Assumptions', description: 'Cost of capital for DCF', dataType: 'percentage', isRequired: false }
];

// Comprehensive synonym dictionary for auto-mapping
const synonymMap: Record<string, string[]> = {
  // Revenue & Income
  'revenue': ['revenue', 'sales', 'total revenue', 'turnover', 'income', 'gross sales', 'net sales', 'top line', 'revenues'],
  'gross_profit': ['gross profit', 'gross margin', 'gross income', 'gross earnings'],
  'net_income': ['net income', 'profit', 'earnings', 'net profit', 'bottom line', 'net earnings', 'profit after tax', 'pat'],
  'ebitda': ['ebitda', 'ebit da', 'operating income before depreciation', 'earnings before interest tax depreciation amortization'],
  
  // Costs & Expenses
  'cogs': ['cogs', 'cost of goods sold', 'cost of sales', 'direct costs', 'cost of revenue', 'cos'],
  'operating_expenses': ['operating expenses', 'opex', 'operating expense', 'operational expenses', 'sg&a', 'sga', 'selling general administrative'],
  'depreciation': ['depreciation', 'depreciation amortization', 'd&a', 'da', 'amortization', 'depreciation expense'],
  'interest_expense': ['interest expense', 'interest cost', 'finance cost', 'borrowing cost', 'debt service'],
  'tax_expense': ['tax', 'taxes', 'tax expense', 'income tax', 'tax provision', 'corporate tax'],
  
  // Balance Sheet - Assets
  'cash': ['cash', 'cash equivalents', 'cash and cash equivalents', 'liquid assets', 'cash balance'],
  'accounts_receivable': ['accounts receivable', 'receivables', 'ar', 'trade receivables', 'debtors'],
  'inventory': ['inventory', 'stock', 'finished goods', 'raw materials', 'work in progress', 'wip'],
  'current_assets': ['current assets', 'short term assets', 'liquid assets total'],
  'ppe': ['pp&e', 'ppe', 'fixed assets', 'property plant equipment', 'property, plant & equipment', 'capital assets', 'tangible assets'],
  'total_assets': ['total assets', 'assets total', 'sum of assets'],
  
  // Balance Sheet - Liabilities
  'accounts_payable': ['accounts payable', 'payables', 'ap', 'trade payables', 'creditors'],
  'current_liabilities': ['current liabilities', 'short term liabilities', 'current debt'],
  'long_term_debt': ['long term debt', 'long-term debt', 'ltd', 'term debt', 'bonds payable'],
  'total_liabilities': ['total liabilities', 'liabilities total', 'sum of liabilities'],
  
  // Equity
  'shareholders_equity': ['shareholders equity', 'stockholders equity', 'owners equity', 'equity', 'net worth'],
  'retained_earnings': ['retained earnings', 'accumulated earnings', 'earned surplus'],
  
  // Cash Flow
  'operating_cash_flow': ['operating cash flow', 'cash from operations', 'ocf', 'operating activities'],
  'investing_cash_flow': ['investing cash flow', 'cash from investing', 'investment activities', 'capex'],
  'financing_cash_flow': ['financing cash flow', 'cash from financing', 'financing activities'],
  'free_cash_flow': ['free cash flow', 'fcf', 'unlevered free cash flow'],
  
  // Financial Ratios & Assumptions
  'revenue_growth_rate': ['revenue growth', 'sales growth', 'growth rate', 'revenue growth rate', 'top line growth'],
  'gross_margin': ['gross margin', 'gross profit margin', 'gpm', 'gross margin %', 'gross margin percent'],
  'tax_rate': ['tax rate', 'effective tax rate', 'corporate tax rate', 'tax %'],
  'discount_rate': ['discount rate', 'wacc', 'cost of capital', 'hurdle rate']
};

// Enhanced normalization function
function normalize(str: string): string {
  return str.toLowerCase()
    .replace(/[&]/g, 'and')  // Convert & to 'and'
    .replace(/[%]/g, 'percent')  // Convert % to 'percent'
    .replace(/[^a-z0-9\s]/g, '')  // Remove special chars but keep spaces
    .replace(/\s+/g, ' ')  // Normalize multiple spaces
    .trim();
}

// Calculate similarity score between two strings
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalize(str1);
  const s2 = normalize(str2);
  
  // Exact match
  if (s1 === s2) return 1.0;
  
  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  // Check word overlap
  const words1 = s1.split(' ');
  const words2 = s2.split(' ');
  const commonWords = words1.filter(word => words2.includes(word));
  
  if (commonWords.length > 0) {
    return commonWords.length / Math.max(words1.length, words2.length) * 0.6;
  }
  
  // Levenshtein distance for fuzzy matching
  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);
  return Math.max(0, 1 - distance / maxLength) * 0.4;
}

// Simple Levenshtein distance implementation
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

export const ColumnMapper: React.FC<ColumnMapperProps> = ({
  columnMappings,
  onMappingChange,
  columns
}) => {
  const [selectedSection, setSelectedSection] = useState(businessInputSections[0]);
  const sectionFields = businessInputFields[selectedSection];
  const sectionMappings = columnMappings.filter(m => m.section === selectedSection);

  const handleMappingChange = (excelColumn: string, mappedTo: string | null) => {
    const newMappings = columnMappings.map(mapping => {
      if (mapping.excelColumn === excelColumn) {
        const category = mappedTo ? financialCategories.find(c => c.id === mappedTo) : null;
        return {
          ...mapping,
          mappedTo,
          dataType: category?.dataType || mapping.dataType,
          isRequired: category?.isRequired || false
        };
      }
      return mapping;
    });
    onMappingChange(newMappings);
  };

  const clearAllMappings = () => {
    const clearedMappings = columnMappings.map(mapping => ({
      ...mapping,
      mappedTo: null,
      isRequired: false
    }));
    onMappingChange(clearedMappings);
  };

  const autoMapColumns = () => {
    const newMappings = columnMappings.map(mapping => {
      const columnName = mapping.excelColumn;
      let bestMatch: FinancialCategory | null = null;
      let bestScore = 0;

      // Skip time period columns (Year, Period, Date, etc.)
      const timePeriodKeywords = ['year', 'period', 'date', 'month', 'quarter', 'fiscal', 'time'];
      if (timePeriodKeywords.some(keyword => normalize(columnName).includes(keyword))) {
        return {
          ...mapping,
          mappedTo: null, // Don't map time periods
          dataType: 'text' as const,
          isRequired: false
        };
      }

      // Enhanced matching with similarity scoring
      for (const category of financialCategories) {
        const categoryId = category.id.toLowerCase();
        const synonyms = synonymMap[categoryId] || [];
        
        // Check direct name match
        const nameScore = calculateSimilarity(columnName, category.name);
        if (nameScore > bestScore) {
          bestScore = nameScore;
          bestMatch = category;
        }
        
        // Check category ID match
        const idScore = calculateSimilarity(columnName, categoryId);
        if (idScore > bestScore) {
          bestScore = idScore;
          bestMatch = category;
        }
        
        // Check synonym matches
        for (const synonym of synonyms) {
          const synonymScore = calculateSimilarity(columnName, synonym);
          if (synonymScore > bestScore) {
            bestScore = synonymScore;
            bestMatch = category;
          }
        }
      }

      // Only map if confidence is above threshold
      const CONFIDENCE_THRESHOLD = 0.6;
      return bestMatch && bestScore >= CONFIDENCE_THRESHOLD
        ? {
            ...mapping,
            mappedTo: bestMatch.id,
            dataType: bestMatch.dataType,
            isRequired: bestMatch.isRequired
          }
        : mapping;
    });
    
    onMappingChange(newMappings);
    
    // Show mapping results to user
    const mappedCount = newMappings.filter(m => m.mappedTo).length;
    console.log(`Auto-mapped ${mappedCount} out of ${newMappings.length} columns`);
  };

  const categories = ['all', ...Array.from(new Set(financialCategories.map(c => c.category)))];
  const filteredCategories = categories.map(category => category === 'all' ? 'All Categories' : category);

  const mappedColumns = sectionMappings.filter(m => m.mappedTo).length;
  const requiredMappings = sectionFields.filter(f => f.isRequired).length;
  const mappedRequired = sectionMappings.filter(m => 
    m.mappedTo && sectionFields.find(f => f.id === m.mappedTo)?.isRequired
  ).length;

  // Group mappings by their mapped status and required status
  const unmappedRequired = sectionFields.filter(
    field => field.isRequired && 
    !sectionMappings.some(m => m.mappedTo === field.id)
  ).length;

  const completionPercentage = requiredMappings > 0 
    ? Math.round((mappedRequired / requiredMappings) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header with KPIs and Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Map Your Data</h2>
          <p className="text-muted-foreground">
            Match your Excel columns to the appropriate financial categories
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={autoMapColumns}
            className="gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Auto-Map Columns
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearAllMappings}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            Clear All
          </Button>
        </div>
      </div>

      {/* Progress and KPIs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Mapping Progress</span>
              <Badge variant={unmappedRequired === 0 ? 'outline' : 'secondary'}
                     className={unmappedRequired === 0 ? 'bg-green-50 text-green-700 border-green-200' : ''}>
                {unmappedRequired === 0 ? 'Ready to proceed' : `${unmappedRequired} required fields left`}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {mappedColumns} of {sectionMappings.length} columns mapped ({completionPercentage}% complete)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Mapped: {mappedRequired}/{requiredMappings} required
            </Badge>
          </div>
        </div>
        
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Section Selector */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Section</label>
          <Badge variant="outline" className="text-xs">
            {sectionMappings.length} columns • {sectionFields.filter(f => f.isRequired).length} required
          </Badge>
        </div>
        <Select 
          value={selectedSection} 
          onValueChange={setSelectedSection}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a section" />
          </SelectTrigger>
          <SelectContent>
            {businessInputSections.map((section) => (
              <SelectItem key={section} value={section}>
                {section}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {/* Mapping Interface */}
      <div className="space-y-4">
        {/* Required Fields Section */}
        {unmappedRequired > 0 && (
          <Alert className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <span className="font-medium">{unmappedRequired} required field{unmappedRequired !== 1 ? 's' : ''} need attention.</span>{' '}
              Map all required fields to proceed.
          </AlertDescription>
        </Alert>
      )}

        {/* Mapped Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sectionMappings.map((mapping, index) => {
            const field = mapping.mappedTo 
              ? financialCategories.find(f => f.id === mapping.mappedTo)
              : null;
            const isRequired = field?.isRequired || false;
            
            return (
              <Card 
                key={index} 
                className={`relative overflow-hidden ${
                  mapping.mappedTo 
                    ? isRequired 
                      ? 'border-l-4 border-l-green-500' 
                      : 'border-l-4 border-l-blue-500'
                    : isRequired 
                      ? 'border-l-4 border-l-amber-500 bg-amber-50/50' 
                      : 'bg-muted/30'
                }`}
              >
                <CardHeader className="pb-2 space-y-1">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">
                      {mapping.excelColumn}
                    </CardTitle>
                    {isRequired && (
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          mapping.mappedTo 
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {mapping.mappedTo ? 'Mapped' : 'Required'}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs">
                    {field?.description || 'Select a mapping...'}
            </CardDescription>
          </CardHeader>
          <CardContent>
                  <div className="flex items-center gap-2">
                    <Select
                      value={mapping.mappedTo || 'none'}
                      onValueChange={(value) => handleMappingChange(mapping.excelColumn, value === 'none' ? null : value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          <span className="text-muted-foreground">Not mapped</span>
                        </SelectItem>
                        <SelectGroup>
                          <SelectLabel>Suggested Mappings</SelectLabel>
                          {financialCategories
                            .filter(cat => {
                              const normalizedColumn = normalize(mapping.excelColumn);
                              const normalizedName = normalize(cat.name);
                              return (
                                normalizedColumn.includes(normalizedName) ||
                                normalizedName.includes(normalizedColumn) ||
                                (synonymMap[cat.id]?.some(syn => 
                                  normalizedColumn.includes(normalize(syn)) ||
                                  normalize(syn).includes(normalizedColumn)
                                ))
                              );
                            })
                            .slice(0, 3) // Limit to top 3 suggestions
                            .map(category => (
                              <SelectItem key={category.id} value={category.id}>
                                <div className="flex items-center gap-2">
                                  <span>{category.name}</span>
                                  {category.isRequired && (
                                    <Badge variant="outline" className="h-4 px-1 text-xs text-amber-600 border-amber-200">
                                      Required
                                    </Badge>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                        </SelectGroup>
                        <SelectSeparator />
                        <SelectGroup>
                          <SelectLabel>All Fields</SelectLabel>
                          {financialCategories
                            .filter(cat => cat.category === selectedSection || selectedSection === 'all')
                            .map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            <div className="flex items-center gap-2">
                              <span>{category.name}</span>
                              {category.isRequired && (
                                    <Badge variant="outline" className="h-4 px-1 text-xs text-amber-600 border-amber-200">
                                      Required
                                    </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    
                    {mapping.mappedTo && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleMappingChange(mapping.excelColumn, null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  {field && (
                    <div className="mt-2 pt-2 border-t">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Category: {field.category}</span>
                        <span className="capitalize">Type: {field.dataType}</span>
                </div>
            </div>
                  )}
          </CardContent>
        </Card>
            );
          })}
        </div>
      </div>
      
      {/* Required Fields Summary */}
      {unmappedRequired > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-800">
              <AlertCircle className="h-4 w-4" />
              Required Fields Remaining
            </CardTitle>
          </CardHeader>
          <CardContent>
                    <div className="space-y-2">
              {sectionFields
                .filter(field => field.isRequired)
                .filter(field => !sectionMappings.some(m => m.mappedTo === field.id))
                .map((field, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 rounded-full bg-amber-400"></div>
                    <span className="font-medium">{field.name}</span>
                    <span className="text-xs text-muted-foreground">{field.description}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mapping Status */}
      {mappedRequired >= requiredMappings && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            All required fields have been mapped! You can proceed to the next step.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};