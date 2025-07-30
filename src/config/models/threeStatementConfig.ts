
import { DollarSign, TrendingUp, Building2, BarChart3, Calculator, Activity, FileText, CreditCard, Banknote, Target } from 'lucide-react';

/**
 * Variable Interface for Financial Models
 * Backend Integration: This interface maps directly to FastAPI Pydantic models
 * API Endpoint: POST /api/v1/models/{model_id}/variables
 */
export interface Variable {
  id: string;
  name: string;
  value: number;
  unit?: string;
  category: string;
  description?: string;
  // Additional properties for advanced variable configuration
  input_type: 'percentage' | 'fixed' | 'formula';
  applies_to: 'income_statement' | 'balance_sheet' | 'cash_flow';
  relative_to?: string; // For percentage-based calculations
}

/**
 * Variable Section Interface
 * Groups related variables together for UI organization
 */
export interface VariableSection {
  id: string;
  title: string;
  icon: any; // Lucide React icon component
  variables: Variable[];
}

/**
 * Model Information Interface
 * Contains metadata about each financial model
 */
export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  complexity: string;
  timeEstimate: string;
}

/**
 * Excel Import Configuration
 * Defines expected columns and mapping for Excel imports
 */
export interface ImportConfig {
  expectedColumns: string[];
  columnMappings: Record<string, string>;
  templateUrl?: string;
}

/**
 * 3-Statement Financial Model Variable Configuration
 * 
 * This configuration defines all the input variables needed for a comprehensive
 * 3-statement financial model including Income Statement, Balance Sheet, and Cash Flow.
 * 
 * Backend Integration Points:
 * - Each variable maps to database fields
 * - Categories help organize API responses
 * - Input types determine validation rules
 * - Applies_to helps route data to correct financial statements
 */
export const threeStatementVariables: VariableSection[] = [
  {
    id: 'income-statement-inputs',
    title: 'Income Statement Inputs',
    icon: FileText,
    variables: [
      { 
        id: 'revenue', 
        name: 'Revenue', 
        value: 10000000, 
        unit: '$', 
        category: 'income_statement',
        input_type: 'fixed',
        applies_to: 'income_statement',
        description: 'Total revenue or sales for the period'
      },
      { 
        id: 'cogs', 
        name: 'Cost of Goods Sold (COGS)', 
        value: 4000000, 
        unit: '$', 
        category: 'income_statement',
        input_type: 'fixed',
        applies_to: 'income_statement',
        description: 'Direct costs attributable to production of goods sold'
      },
      { 
        id: 'operating-expenses', 
        name: 'Operating Expenses', 
        value: 3000000, 
        unit: '$', 
        category: 'income_statement',
        input_type: 'fixed',
        applies_to: 'income_statement',
        description: 'Total operating expenses including SG&A'
      },
      { 
        id: 'depreciation-amortization', 
        name: 'Depreciation & Amortization', 
        value: 500000, 
        unit: '$', 
        category: 'income_statement',
        input_type: 'fixed',
        applies_to: 'income_statement',
        description: 'Non-cash charges for asset depreciation and amortization'
      },
      { 
        id: 'interest-expense', 
        name: 'Interest Expense', 
        value: 300000, 
        unit: '$', 
        category: 'income_statement',
        input_type: 'fixed',
        applies_to: 'income_statement',
        description: 'Interest paid on debt obligations'
      },
      { 
        id: 'taxes', 
        name: 'Taxes', 
        value: 550000, 
        unit: '$', 
        category: 'income_statement',
        input_type: 'fixed',
        applies_to: 'income_statement',
        description: 'Income tax expense'
      },
      { 
        id: 'other-income', 
        name: 'Other Income (optional)', 
        value: 0, 
        unit: '$', 
        category: 'income_statement',
        input_type: 'fixed',
        applies_to: 'income_statement',
        description: 'Non-operating income or other miscellaneous income'
      }
    ]
  },
  {
    id: 'balance-sheet-inputs',
    title: 'Balance Sheet Inputs',
    icon: CreditCard,
    variables: [
      { 
        id: 'cash', 
        name: 'Cash', 
        value: 2000000, 
        unit: '$', 
        category: 'balance_sheet',
        input_type: 'fixed',
        applies_to: 'balance_sheet',
        description: 'Cash and cash equivalents'
      },
      { 
        id: 'accounts-receivable', 
        name: 'Accounts Receivable', 
        value: 1500000, 
        unit: '$', 
        category: 'balance_sheet',
        input_type: 'fixed',
        applies_to: 'balance_sheet',
        description: 'Money owed by customers for goods/services delivered'
      },
      { 
        id: 'inventory', 
        name: 'Inventory', 
        value: 800000, 
        unit: '$', 
        category: 'balance_sheet',
        input_type: 'fixed',
        applies_to: 'balance_sheet',
        description: 'Raw materials, work-in-process, and finished goods'
      },
      { 
        id: 'other-current-assets', 
        name: 'Other Current Assets (optional)', 
        value: 200000, 
        unit: '$', 
        category: 'balance_sheet',
        input_type: 'fixed',
        applies_to: 'balance_sheet',
        description: 'Prepaid expenses and other short-term assets'
      },
      { 
        id: 'ppe-fixed-assets', 
        name: 'PP&E (Fixed Assets)', 
        value: 5000000, 
        unit: '$', 
        category: 'balance_sheet',
        input_type: 'fixed',
        applies_to: 'balance_sheet',
        description: 'Property, plant, and equipment (net of depreciation)'
      },
      { 
        id: 'accounts-payable', 
        name: 'Accounts Payable', 
        value: 600000, 
        unit: '$', 
        category: 'balance_sheet',
        input_type: 'fixed',
        applies_to: 'balance_sheet',
        description: 'Money owed to suppliers for goods/services received'
      },
      { 
        id: 'accrued-expenses', 
        name: 'Accrued Expenses', 
        value: 400000, 
        unit: '$', 
        category: 'balance_sheet',
        input_type: 'fixed',
        applies_to: 'balance_sheet',
        description: 'Expenses incurred but not yet paid'
      },
      { 
        id: 'short-term-debt', 
        name: 'Short-Term Debt', 
        value: 1000000, 
        unit: '$', 
        category: 'balance_sheet',
        input_type: 'fixed',
        applies_to: 'balance_sheet',
        description: 'Debt obligations due within one year'
      },
      { 
        id: 'long-term-debt', 
        name: 'Long-Term Debt', 
        value: 3000000, 
        unit: '$', 
        category: 'balance_sheet',
        input_type: 'fixed',
        applies_to: 'balance_sheet',
        description: 'Debt obligations due after one year'
      },
      { 
        id: 'retained-earnings', 
        name: 'Retained Earnings', 
        value: 2500000, 
        unit: '$', 
        category: 'balance_sheet',
        input_type: 'fixed',
        applies_to: 'balance_sheet',
        description: 'Accumulated earnings retained in the business'
      },
      { 
        id: 'share-capital-equity', 
        name: 'Share Capital / Equity', 
        value: 2000000, 
        unit: '$', 
        category: 'balance_sheet',
        input_type: 'fixed',
        applies_to: 'balance_sheet',
        description: 'Paid-in capital from shareholders'
      }
    ]
  },
  {
    id: 'cash-flow-inputs',
    title: 'Cash Flow Inputs',
    icon: Banknote,
    variables: [
      { 
        id: 'capex', 
        name: 'CapEx', 
        value: 800000, 
        unit: '$', 
        category: 'cash_flow',
        input_type: 'fixed',
        applies_to: 'cash_flow',
        description: 'Capital expenditures for property, plant, and equipment'
      },
      { 
        id: 'dividends-paid', 
        name: 'Dividends Paid', 
        value: 200000, 
        unit: '$', 
        category: 'cash_flow',
        input_type: 'fixed',
        applies_to: 'cash_flow',
        description: 'Dividends paid to shareholders'
      },
      { 
        id: 'new-debt-raised-repaid', 
        name: 'New Debt Raised / Repaid', 
        value: 0, 
        unit: '$', 
        category: 'cash_flow',
        input_type: 'fixed',
        applies_to: 'cash_flow',
        description: 'Net change in debt (positive for new debt, negative for repayment)'
      },
      { 
        id: 'new-equity-raised', 
        name: 'New Equity Raised', 
        value: 0, 
        unit: '$', 
        category: 'cash_flow',
        input_type: 'fixed',
        applies_to: 'cash_flow',
        description: 'New equity capital raised from shareholders'
      }
    ]
  },
  {
    id: 'forecasting-assumptions',
    title: 'Forecasting Assumptions',
    icon: Target,
    variables: [
      { 
        id: 'revenue-growth-rate', 
        name: 'Revenue Growth Rate', 
        value: 15, 
        unit: '%', 
        category: 'assumption',
        input_type: 'percentage',
        applies_to: 'income_statement',
        relative_to: 'revenue',
        description: 'Annual revenue growth percentage'
      },
      { 
        id: 'gross-margin-percent', 
        name: 'Gross Margin %', 
        value: 60, 
        unit: '%', 
        category: 'assumption',
        input_type: 'percentage',
        applies_to: 'income_statement',
        relative_to: 'revenue',
        description: 'Gross profit as percentage of revenue'
      },
      { 
        id: 'opex-percent-revenue', 
        name: 'OpEx as % of Revenue', 
        value: 30, 
        unit: '%', 
        category: 'assumption',
        input_type: 'percentage',
        applies_to: 'income_statement',
        relative_to: 'revenue',
        description: 'Operating expenses as percentage of revenue'
      },
      { 
        id: 'capex-percent-revenue', 
        name: 'CapEx (% of revenue)', 
        value: 8, 
        unit: '%', 
        category: 'assumption',
        input_type: 'percentage',
        applies_to: 'cash_flow',
        relative_to: 'revenue',
        description: 'Capital expenditures as percentage of revenue'
      },
      { 
        id: 'depreciation-percent', 
        name: 'Depreciation Method / %', 
        value: 10, 
        unit: '%', 
        category: 'assumption',
        input_type: 'percentage',
        applies_to: 'income_statement',
        relative_to: 'ppe',
        description: 'Annual depreciation rate on PP&E'
      },
      { 
        id: 'dso-days', 
        name: 'DSO (Days Sales Outstanding)', 
        value: 45, 
        unit: 'days', 
        category: 'assumption',
        input_type: 'fixed',
        applies_to: 'balance_sheet',
        description: 'Average collection period for receivables'
      },
      { 
        id: 'dpo-days', 
        name: 'DPO (Days Payable Outstanding)', 
        value: 30, 
        unit: 'days', 
        category: 'assumption',
        input_type: 'fixed',
        applies_to: 'balance_sheet',
        description: 'Average payment period for payables'
      },
      { 
        id: 'inventory-days', 
        name: 'Inventory Days', 
        value: 60, 
        unit: 'days', 
        category: 'assumption',
        input_type: 'fixed',
        applies_to: 'balance_sheet',
        description: 'Days of inventory on hand'
      },
      { 
        id: 'interest-rate-debt', 
        name: 'Interest Rate on Debt', 
        value: 6, 
        unit: '%', 
        category: 'assumption',
        input_type: 'percentage',
        applies_to: 'income_statement',
        relative_to: 'debt',
        description: 'Annual interest rate on outstanding debt'
      },
      { 
        id: 'tax-rate', 
        name: 'Tax Rate', 
        value: 25, 
        unit: '%', 
        category: 'assumption',
        input_type: 'percentage',
        applies_to: 'income_statement',
        relative_to: 'pre_tax_income',
        description: 'Corporate income tax rate'
      },
      { 
        id: 'dividend-payout-percent', 
        name: 'Dividend Payout %', 
        value: 20, 
        unit: '%', 
        category: 'assumption',
        input_type: 'percentage',
        applies_to: 'cash_flow',
        relative_to: 'net_income',
        description: 'Percentage of net income paid as dividends'
      }
    ]
  }
];

/**
 * Default variable values for initialization
 */
export const defaultThreeStatementVariables: Record<string, number> = {
  // Income Statement
  'revenue': 10000000,
  'cogs': 4000000,
  'operating-expenses': 3000000,
  'depreciation-amortization': 500000,
  'interest-expense': 300000,
  'taxes': 550000,
  'other-income': 0,
  
  // Balance Sheet
  'cash': 2000000,
  'accounts-receivable': 1500000,
  'inventory': 800000,
  'other-current-assets': 200000,
  'ppe-fixed-assets': 5000000,
  'accounts-payable': 600000,
  'accrued-expenses': 400000,
  'short-term-debt': 1000000,
  'long-term-debt': 3000000,
  'retained-earnings': 2500000,
  'share-capital-equity': 2000000,
  
  // Cash Flow
  'capex': 800000,
  'dividends-paid': 200000,
  'new-debt-raised-repaid': 0,
  'new-equity-raised': 0,
  
  // Forecasting Assumptions
  'revenue-growth-rate': 15,
  'gross-margin-percent': 60,
  'opex-percent-revenue': 30,
  'capex-percent-revenue': 8,
  'depreciation-percent': 10,
  'dso-days': 45,
  'dpo-days': 30,
  'inventory-days': 60,
  'interest-rate-debt': 6,
  'tax-rate': 25,
  'dividend-payout-percent': 20,
};

/**
 * Excel Import Configuration for 3-Statement Model
 */
export const threeStatementImportConfig: ImportConfig = {
  expectedColumns: [
    'Variable Name',
    'Value',
    'Unit',
    'Category',
    'Description'
  ],
  columnMappings: {
    'Variable Name': 'name',
    'Variable': 'name',
    'Name': 'name',
    'Value': 'value',
    'Amount': 'value',
    'Number': 'value',
    'Unit': 'unit',
    'Units': 'unit',
    'Category': 'category',
    'Type': 'category',
    'Description': 'description',
    'Details': 'description',
    'Notes': 'description'
  }
};

/**
 * 3-Statement Model Information
 * Metadata for the financial model
 */
export const threeStatementModelInfo: ModelInfo = {
  id: '3-statement',
  name: '3-Statement Financial Model',
  description: 'Integrated Income Statement, Balance Sheet, and Cash Flow projections',
  complexity: 'Intermediate',
  timeEstimate: '15-30 min'
};
