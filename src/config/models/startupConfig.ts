import { TrendingUp, Calculator, Building2, BarChart3, DollarSign, Activity } from 'lucide-react';
import { VariableSection } from './threeStatementConfig';

/**
 * Startup Financial Model Variable Configuration
 * Backend Integration: Maps to FastAPI endpoints for startup financial projections
 */
export const startupVariables: VariableSection[] = [
  {
    id: 'revenue-model',
    title: 'Revenue Model Assumptions',
    icon: TrendingUp,
    variables: [
      // Revenue Streams - Core business model components
      { id: 'product-sales', name: 'Product Sales Revenue Stream', value: 100000, unit: '$', category: 'revenue', input_type: 'fixed', applies_to: 'income_statement' },
      { id: 'subscription-revenue', name: 'Subscription Revenue Stream', value: 50000, unit: '$', category: 'revenue', input_type: 'fixed', applies_to: 'income_statement' },
      
      // Pricing - Revenue per unit/customer metrics
      { id: 'price-per-unit', name: 'Pricing per Unit', value: 99, unit: '$', category: 'pricing', input_type: 'fixed', applies_to: 'income_statement' },
      { id: 'price-per-customer', name: 'Pricing per Customer (Monthly)', value: 29, unit: '$', category: 'pricing', input_type: 'fixed', applies_to: 'income_statement' },
      
      // Customer Metrics - Growth and retention drivers
      { id: 'initial-customers', name: 'Expected Customers Month 1', value: 100, unit: 'customers', category: 'customers', input_type: 'fixed', applies_to: 'income_statement' },
      { id: 'customer-growth', name: 'Customer Growth Rate (Monthly)', value: 20, unit: '%', category: 'customers', input_type: 'percentage', applies_to: 'income_statement', relative_to: 'customers' },
      { id: 'conversion-rate', name: 'Visitor to Customer Conversion Rate', value: 2.5, unit: '%', category: 'customers', input_type: 'percentage', applies_to: 'income_statement' },
      { id: 'churn-rate', name: 'Monthly Churn Rate', value: 5, unit: '%', category: 'customers', input_type: 'percentage', applies_to: 'income_statement', relative_to: 'customers' },
      { id: 'arpu', name: 'Average Revenue Per User (ARPU)', value: 45, unit: '$', category: 'customers', input_type: 'fixed', applies_to: 'income_statement' },
    ]
  },
  {
    id: 'cost-structure',
    title: 'Cost Structure',
    icon: Calculator,
    variables: [
      // Cost of Goods Sold - Variable costs tied to revenue
      { id: 'cogs-per-unit', name: 'COGS per Unit', value: 25, unit: '$', category: 'cogs', input_type: 'fixed', applies_to: 'income_statement' },
      
      // Fixed Costs - Monthly operational expenses
      { id: 'monthly-salaries', name: 'Monthly Salaries', value: 50000, unit: '$', category: 'fixed-costs', input_type: 'fixed', applies_to: 'income_statement' },
      { id: 'monthly-rent', name: 'Monthly Rent', value: 8000, unit: '$', category: 'fixed-costs', input_type: 'fixed', applies_to: 'income_statement' },
      { id: 'monthly-marketing', name: 'Monthly Marketing Spend', value: 15000, unit: '$', category: 'fixed-costs', input_type: 'fixed', applies_to: 'income_statement' },
      { id: 'monthly-software', name: 'Monthly Software/IT Costs', value: 3000, unit: '$', category: 'fixed-costs', input_type: 'fixed', applies_to: 'income_statement' },
      { id: 'monthly-professional', name: 'Monthly Professional Services', value: 5000, unit: '$', category: 'fixed-costs', input_type: 'fixed', applies_to: 'income_statement' },
      
      // Variable Costs - Costs that scale with customers/usage
      { id: 'variable-cost-per-customer', name: 'Variable Cost per Customer', value: 10, unit: '$', category: 'variable-costs', input_type: 'fixed', applies_to: 'income_statement' },
      { id: 'cac', name: 'Customer Acquisition Cost (CAC)', value: 120, unit: '$', category: 'variable-costs', input_type: 'fixed', applies_to: 'income_statement' },
    ]
  },
  {
    id: 'headcount-plan',
    title: 'Headcount Plan',
    icon: Building2,
    variables: [
      // Engineering - Technical team growth
      { id: 'eng-hires', name: 'Engineering Hires (Next 12 Months)', value: 5, unit: 'people', category: 'headcount', input_type: 'fixed', applies_to: 'income_statement' },
      { id: 'eng-salary', name: 'Average Engineering Salary', value: 120000, unit: '$', category: 'headcount', input_type: 'fixed', applies_to: 'income_statement' },
      
      // Sales - Revenue generation team
      { id: 'sales-hires', name: 'Sales Hires (Next 12 Months)', value: 3, unit: 'people', category: 'headcount', input_type: 'fixed', applies_to: 'income_statement' },
      { id: 'sales-salary', name: 'Average Sales Salary', value: 80000, unit: '$', category: 'headcount', input_type: 'fixed', applies_to: 'income_statement' },
      
      // Marketing - Customer acquisition team
      { id: 'marketing-hires', name: 'Marketing Hires (Next 12 Months)', value: 2, unit: 'people', category: 'headcount', input_type: 'fixed', applies_to: 'income_statement' },
      { id: 'marketing-salary', name: 'Average Marketing Salary', value: 90000, unit: '$', category: 'headcount', input_type: 'fixed', applies_to: 'income_statement' },
      
      // Operations - Support and administrative functions
      { id: 'ops-hires', name: 'Operations Hires (Next 12 Months)', value: 2, unit: 'people', category: 'headcount', input_type: 'fixed', applies_to: 'income_statement' },
      { id: 'ops-salary', name: 'Average Operations Salary', value: 75000, unit: '$', category: 'headcount', input_type: 'fixed', applies_to: 'income_statement' },
    ]
  },
  {
    id: 'capex',
    title: 'Capital Expenditures',
    icon: BarChart3,
    variables: [
      // Capital investments for growth and operations
      { id: 'initial-setup', name: 'Initial Equipment & Office Setup', value: 100000, unit: '$', category: 'capex', input_type: 'fixed', applies_to: 'cash_flow' },
      { id: 'tech-development', name: 'Technology Development (Capitalized)', value: 200000, unit: '$', category: 'capex', input_type: 'fixed', applies_to: 'cash_flow' },
      { id: 'annual-capex', name: 'Annual CapEx Budget', value: 50000, unit: '$', category: 'capex', input_type: 'fixed', applies_to: 'cash_flow' },
    ]
  },
  {
    id: 'funding-plan',
    title: 'Funding Plan',
    icon: DollarSign,
    variables: [
      // Existing Funding - Current cash position
      { id: 'existing-cash', name: 'Existing Cash', value: 500000, unit: '$', category: 'funding', input_type: 'fixed', applies_to: 'balance_sheet' },
      
      // Seed Round - Early stage funding
      { id: 'seed-amount', name: 'Seed Round Amount', value: 1000000, unit: '$', category: 'funding', input_type: 'fixed', applies_to: 'cash_flow' },
      { id: 'seed-timing', name: 'Seed Round Timing (Months)', value: 6, unit: 'months', category: 'funding', input_type: 'fixed', applies_to: 'cash_flow' },
      { id: 'seed-pre-money', name: 'Pre-Money Valuation (Seed)', value: 4000000, unit: '$', category: 'valuation', input_type: 'fixed', applies_to: 'balance_sheet' },
      
      // Series A - Growth stage funding
      { id: 'series-a-amount', name: 'Series A Amount', value: 5000000, unit: '$', category: 'funding', input_type: 'fixed', applies_to: 'cash_flow' },
      { id: 'series-a-timing', name: 'Series A Timing (Months)', value: 18, unit: 'months', category: 'funding', input_type: 'fixed', applies_to: 'cash_flow' },
      { id: 'series-a-pre-money', name: 'Pre-Money Valuation (Series A)', value: 20000000, unit: '$', category: 'valuation', input_type: 'fixed', applies_to: 'balance_sheet' },
      
      // Investor Terms - Equity and control considerations
      { id: 'target-ownership', name: 'Target Investor Ownership (%)', value: 25, unit: '%', category: 'equity', input_type: 'percentage', applies_to: 'balance_sheet', relative_to: 'total_equity' },
    ]
  },
  {
    id: 'other-assumptions',
    title: 'Other Assumptions',
    icon: Activity,
    variables: [
      // General financial assumptions
      { id: 'tax-rate', name: 'Tax Rate (%)', value: 21, unit: '%', category: 'taxes', input_type: 'percentage', applies_to: 'income_statement', relative_to: 'pre_tax_income' },
      { id: 'monthly-burn', name: 'Monthly Burn Rate Target', value: 75000, unit: '$', category: 'cash-flow', input_type: 'fixed', applies_to: 'cash_flow' },
      { id: 'target-runway', name: 'Target Runway (Months)', value: 18, unit: 'months', category: 'cash-flow', input_type: 'fixed', applies_to: 'cash_flow' },
      { id: 'depreciation-rate', name: 'Depreciation Rate (%)', value: 20, unit: '%', category: 'accounting', input_type: 'percentage', applies_to: 'income_statement', relative_to: 'ppe' },
    ]
  }
];

export const startupModelInfo = {
  id: 'startup',
  name: 'Startup Financial Model',
  description: 'Growth-focused financial projections for early-stage companies',
  complexity: 'Beginner',
  timeEstimate: '10-20 min'
};
