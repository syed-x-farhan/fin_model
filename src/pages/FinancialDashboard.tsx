import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PlusCircle, Trash2, Calculator, TrendingUp, DollarSign, BarChart3, Activity, ChevronDown, Play, Building2, Laptop, Home, Factory, FileText, TrendingDown, Plus, Edit3, Upload, Loader2, FileDown, CreditCard, Banknote } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { useCalculationResult } from '@/contexts/CalculationResultContext';

// Import organized model configurations
import { MODEL_CONFIGS, ModelId, getModelConfig, isValidModelId } from '@/config/models';
import { Variable, VariableSection } from '@/config/models/threeStatementConfig';

// Import API service
import { api, CalculationResult } from '@/services/api';
import { exportDashboardToPDF } from '@/services/pdfExport';

// Import dashboard components
import ThreeStatementDashboard from '@/components/dashboards/ThreeStatementDashboard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import OnboardingQuestionnaire from '@/components/OnboardingQuestionnaire';

// Import Excel components
import { ImportWizard } from '@/components/excel/ImportWizard';
import { RowData, ColumnMapping } from '@/components/excel/DataPreviewTable';
import { ServiceBusinessInputForm } from '@/components/InputForm/ServiceBusinessInputForm';
import { RetailBusinessInputForm } from '@/components/InputForm/RetailBusinessInputForm';
import { CompanyTypeSelector } from '@/components/CompanyTypeSelector';
import { SaaSBusinessInputForm } from '@/components/InputForm/SaaSBusinessInputForm';
import { parseBusinessInputExcel } from '@/components/excel/businessInputParser';

/**
 * Form Data Interface for Variable Creation
 * This matches the Variable interface exactly to avoid type conflicts
 */
interface VariableFormData {
  name: string;
  value: number;
  input_type: 'percentage' | 'fixed' | 'formula';
  category: string;
  applies_to: 'income_statement' | 'balance_sheet' | 'cash_flow';
  description?: string;
  unit?: string;
  relative_to?: string;
}

// UI Configuration Options
const INPUT_TYPE_OPTIONS = [
  { value: 'percentage', label: 'Percentage' },
  { value: 'fixed', label: 'Fixed Amount' },
  { value: 'formula', label: 'Formula' }
];

const CATEGORY_OPTIONS = [
  { value: 'revenue', label: 'Revenue' },
  { value: 'expense', label: 'Expense' },
  { value: 'tax', label: 'Tax' },
  { value: 'capex', label: 'Capital Expenditure' },
  { value: 'working_capital', label: 'Working Capital' },
  { value: 'depreciation', label: 'Depreciation' },
  { value: 'interest', label: 'Interest' }
];

const APPLIES_TO_OPTIONS = [
  { value: 'income_statement', label: 'Income Statement' },
  { value: 'balance_sheet', label: 'Balance Sheet' },
  { value: 'cash_flow', label: 'Cash Flow' }
];

const RELATIVE_TO_OPTIONS = [
  { value: 'revenue', label: 'Revenue' },
  { value: 'gross_profit', label: 'Gross Profit' },
  { value: 'ebit', label: 'EBIT' },
  { value: 'ebitda', label: 'EBITDA' },
  { value: 'pre_tax_income', label: 'Pre-tax Income' },
  { value: 'net_income', label: 'Net Income' }
];

/**
 * Main Financial Dashboard Component
 * 
 * This component orchestrates the entire financial modeling experience.
 * It's organized to be backend-friendly with clear separation of concerns:
 * 
 * 1. Model Selection - Handled by AppSidebar
 * 2. Variable Configuration - Model-specific variable sections
 * 3. Dashboard Display - Model-specific dashboard components
 * 4. Data Management - Ready for FastAPI integration
 */
export default function FinancialDashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { modelId } = useParams<{ modelId: string }>();
  const { setCalculationResult, calculationResult } = useCalculationResult();
  
  // State Management - Backend Integration Points
  const [selectedModel, setSelectedModel] = useState<ModelId | null>(modelId as ModelId || null);
  const [variableSections, setVariableSections] = useState<VariableSection[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedCompanyType, setSelectedCompanyType] = useState<string | null>(() => {
    // Try to restore company type from localStorage
    if (modelId) {
      return localStorage.getItem(`companyType_${modelId}`) || null;
    }
    return null;
  });
  const [showDashboard, setShowDashboard] = useState(false);
  // Change forecastPeriod state to string
  const [forecastPeriod, setForecastPeriod] = useState<string | undefined>(undefined);
  
  // Add state for Discount Rate and Terminal Growth Rate
  const [discountRate, setDiscountRate] = useState<number>(0.10); // 10% default
  const [terminalGrowth, setTerminalGrowth] = useState<number>(0.02); // 2% default
  
  // UI State for Variable Management
  const [newVariableName, setNewVariableName] = useState('');
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  const [isAddingVariable, setIsAddingVariable] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true); // Show onboarding by default
  const [showCompanyTypeSelector, setShowCompanyTypeSelector] = useState(false); // NEW: controls company type selector

  // Form Management for Adding Variables - Fixed Type Definition
  const addVariableForm = useForm<VariableFormData>({
    defaultValues: {
      name: '',
      value: 0,
      input_type: 'fixed',
      category: 'revenue',
      applies_to: 'income_statement',
      description: '',
      unit: '$'
    }
  });

  // Add state to store the full form data for layman input
  const [laymanFormData, setLaymanFormData] = useState<any>(null);

  // Wrapper function to save company type to localStorage
  const handleCompanyTypeSelect = (companyType: string | null) => {
    console.debug('[handleCompanyTypeSelect] selected companyType:', companyType);
    console.debug('[handleCompanyTypeSelect] laymanFormData before transform:', laymanFormData);
    setSelectedCompanyType(companyType);
    if (modelId && companyType) {
      localStorage.setItem(`companyType_${modelId}`, companyType);
    } else if (modelId) {
      localStorage.removeItem(`companyType_${modelId}`);
    }
    // Transform imported data to match the selected company type's form
    if (laymanFormData && companyType) {
      let transformed = laymanFormData;
      if (companyType === 'retail') {
        if (typeof transformRetailDataToVariableSections === 'function') {
          transformed = transformRetailDataToVariableSections(laymanFormData, companyType);
        }
      } else if (companyType === 'service') {
        if (typeof transformLaymanDataToVariableSections === 'function') {
          transformed = transformLaymanDataToVariableSections(laymanFormData, companyType);
        }
      } else if (companyType === 'saas') {
        if (typeof transformSaaSDataToVariableSections === 'function') {
          transformed = transformSaaSDataToVariableSections(laymanFormData, companyType);
        }
      }
      console.debug('[handleCompanyTypeSelect] transformed laymanFormData:', transformed);
      setLaymanFormData(transformed);
    }
  };

  /**
   * Handle Model Selection
   * Loads model-specific variables from API or configuration
   */
  const handleModelSelect = async (modelId: string) => {
    if (!isValidModelId(modelId)) {
      console.error(`Invalid model ID: ${modelId}`);
      return;
    }
    
    console.log(`Selecting model: ${modelId}`);
    setSelectedModel(modelId);
    setShowResults(false);
    setCalculationResult(null);
    setIsLoading(true);
    
    try {
      // For now, only handle 3-Statement model
      if (modelId === '3-statement') {
        const response = await api.getModelVariables(modelId);
        if (response.success && response.data) {
          setVariableSections(response.data);
        } else {
          // Fallback to config if API fails
          const modelConfig = getModelConfig(modelId);
          setVariableSections(modelConfig.variables);
        }
      } else {
        // For other models, use config for now
        const modelConfig = getModelConfig(modelId);
        setVariableSections(modelConfig.variables);
      }
    } catch (error) {
      console.error('Error loading model variables:', error);
      toast({
        title: "Error",
        description: "Failed to load model variables. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle Variable Addition
   * Adds new variable to the model via API
   */
  const handleAddVariable = async (sectionId: string) => {
    if (newVariableName.trim() && selectedModel) {
      const newVariable: Variable = {
        id: Date.now().toString(),
        name: newVariableName,
        value: 0,
        input_type: 'fixed',
        category: 'revenue',
        applies_to: 'income_statement',
        unit: '%',
      };
      
      try {
        const response = await api.addVariable(selectedModel, sectionId, newVariable);
        if (response.success) {
      setVariableSections(sections =>
        sections.map(section =>
          section.id === sectionId
            ? { ...section, variables: [...section.variables, newVariable] }
            : section
        )
      );
      setNewVariableName('');
          toast({
            title: "Variable Added",
            description: `"${newVariable.name}" has been added successfully.`
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to add variable. Please try again.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error adding variable:', error);
        toast({
          title: "Error",
          description: "Failed to add variable. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  /**
   * Handle Variable Removal
   * Removes variable from the model via API
   */
  const handleRemoveVariable = async (sectionId: string, variableId: string) => {
    if (!selectedModel) return;
    
    try {
              const response = await api.deleteVariable(selectedModel, sectionId, variableId);
      if (response.success) {
    setVariableSections(sections =>
      sections.map(section =>
        section.id === sectionId
          ? { ...section, variables: section.variables.filter(v => v.id !== variableId) }
          : section
      )
    );
        toast({
          title: "Variable Removed",
          description: "Variable has been removed successfully."
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to remove variable. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error removing variable:', error);
      toast({
        title: "Error",
        description: "Failed to remove variable. Please try again.",
        variant: "destructive"
      });
    }
  };

  /**
   * Handle Variable Value Changes
   * Updates variable value via API
   */
  const handleVariableChange = async (sectionId: string, variableId: string, value: number) => {
    if (!selectedModel) return;
    
    // Update local state immediately for responsive UI
    setVariableSections(sections =>
      sections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              variables: section.variables.map(variable =>
                variable.id === variableId ? { ...variable, value } : variable
              )
            }
          : section
      )
    );
    
    // Update in backend
    try {
      await api.updateVariable(selectedModel, sectionId, variableId, { value });
    } catch (error) {
      console.error('Error updating variable:', error);
      // Could show a subtle error notification here
    }
  };

  /**
   * Handle Model Calculation
   * Triggers backend calculation and displays results
   */
  const handleCalculateModel = async (period?: string, laymanData?: any) => {
    console.log('Starting calculation...');
    console.log('Selected model:', selectedModel);
    console.log('Variable sections:', variableSections);
    console.log('Forecast period:', period);
    console.log('LaymanData received:', laymanData);
    
    // If laymanData is provided, send it directly to the backend
    let payload;
    if (laymanData) {
      console.log('Using laymanData for payload construction');
      console.log('LaymanData keys:', Object.keys(laymanData));
      console.log('LaymanData.services:', laymanData.services);
      console.log('LaymanData.expenses:', laymanData.expenses);
      console.log('LaymanData.products:', laymanData.products);
      
      // Handle forecast period conversion and always set top-level forecastPeriod
      let forecastPeriod = laymanData.forecast?.period;
      let forecastType = laymanData.forecast?.type;
      if (forecastPeriod && forecastType === 'months') {
        forecastPeriod = Math.ceil(Number(forecastPeriod) / 12).toString();
      }
      if (forecastPeriod && forecastType === 'years') {
        forecastPeriod = forecastPeriod.toString();
      }
      payload = { ...laymanData, forecastPeriod, discountRate, terminalGrowth };
    } else {
      console.log('Using variableSections for payload construction');
      payload = { variables: variableSections, forecastPeriod: period, discountRate, terminalGrowth };
    }
    console.log('Request payload:', payload);
    console.log('Request payload keys:', Object.keys(payload));

    if (!selectedModel || (!variableSections.length && !laymanData)) {
      console.log('Missing model or variables');
      return;
    }
    
    setIsCalculating(true);
    try {
      console.log('Calling API...');
      // If laymanData is present, send it as the request body
      let response;
      if (laymanData) {
        response = await fetch(`http://localhost:8000/api/v1/models/${selectedModel}/calculate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        response = await response.json();
        response = { success: response.success, data: response };
      } else {
        response = await api.calculateModel(selectedModel, variableSections, period);
      }
      console.log('API response:', response); // Debug log
      
      if (response.success) {
        if (response.data) {
        setCalculationResult(response.data.data || response.data);
        } else {
          // Accept: { success: true, ...calculationResultFields }
          const { success, ...rest } = response;
          setCalculationResult(rest);
        }
        setShowResults(true);
        toast({
          title: "🎉 Calculation Complete",
          description: "Your financial model has been successfully calculated and is ready for analysis."
        });
        navigate(`/model/${selectedModel}/statements`);
      } else {
        console.log('Calculation failed:', response.error);
        toast({
          title: "Calculation Failed",
          description: response.error || "Failed to calculate model. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error calculating model:', error);
      toast({
        title: "Calculation Error",
        description: "An error occurred during calculation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCalculating(false);
    }
  };

  /**
   * Handle Excel Import
   */
  // Updated: After Excel import, pre-fill the input form with imported data (Option 2)
  const handleImportComplete = async (data: RowData[], mappings: ColumnMapping[]) => {
    try {
      console.debug('[handleImportComplete] Raw data received:', data);
      console.debug('[handleImportComplete] Raw mappings received:', mappings);
      
      // BYPASS BROKEN PARSER - Manually extract business data from Excel
      const businessInput: any = {};
      
      // Extract services data
      const servicesData = data.filter(row => (row as any).__sheetName === 'Services');
      if (servicesData.length > 0) {
        businessInput.services = servicesData.map(row => ({
          name: row['Service Name']?.value || '',
          price: Number(row['Price/Client']?.value || 0),
          clients: Number(row['Clients/Month']?.value || 0),
          growth: Number(row['Growth %']?.value || 0),
          cost: Number(row['Delivery Cost']?.value || 0),
          notes: row['Notes']?.value || ''
        }));
      }
      
      // Extract expenses data
      const expensesData = data.filter(row => (row as any).__sheetName === 'Expenses');
      if (expensesData.length > 0) {
        businessInput.expenses = expensesData.map(row => ({
          category: row['Category']?.value || '',
          amount: Number(row['Amount']?.value || 0),
          notes: row['Notes']?.value || ''
        }));
      }
      
      // Extract assumptions data
      const assumptionsData = data.filter(row => (row as any).__sheetName === 'Assumptions');
      if (assumptionsData.length > 0) {
        const assumptions = assumptionsData[0];
        businessInput.taxRate = Number(assumptions['Tax Rate (%)']?.value || 25);
        businessInput.selfFunding = Number(assumptions['Self Funding']?.value || 0);
        businessInput.forecast = {
          period: Number(assumptions['Forecast Period (years)']?.value || 5),
          type: 'years'
        };
      }
      
      console.debug('[handleImportComplete] Manually constructed businessInput:', businessInput);
      let detectedType: string | null = null;
      if (businessInput.services && businessInput.services.length > 0) detectedType = 'service';
      else if (businessInput.products && businessInput.products.length > 0) detectedType = 'retail';
      else if (businessInput.plans && businessInput.plans.length > 0) detectedType = 'saas';
      // Fallback: always default to 'service' if not detected
      if (!detectedType) detectedType = 'service';
      // Debug logs
      console.debug('[handleImportComplete] businessInput:', businessInput);
      console.debug('[handleImportComplete] detectedType:', detectedType);
      console.debug('[handleImportComplete] mappings:', mappings);
      
      // Set the imported data and company type
      setLaymanFormData(businessInput);
      setSelectedCompanyType(detectedType);
      setShowImportWizard(false);
      
      // Automatically trigger calculation with imported data
      toast({
        title: "Import Successful",
        description: `Imported ${data.length} rows of financial data. Calculating financial statements...`
      });
      
      // Prepare the data for calculation
      const calculationData = { ...businessInput, company_type: detectedType };
      console.debug('[handleImportComplete] calculationData being sent:', calculationData);
      
      // Trigger calculation with the imported business input data
      await handleCalculateModel(businessInput.forecast?.period, calculationData);
      
    } catch (error) {
      console.error('Import failed:', error);
      toast({
        title: "Import Failed",
        description: "There was an error importing your data. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleImportCancel = () => {
    setShowImportWizard(false);
  };

  /**
   * Handle PDF Export
   */
  const handleExportPDF = async () => {
    if (!calculationResult || !selectedModel) {
      toast({
        title: "Export Failed",
        description: "No calculation results available to export.",
        variant: "destructive"
      });
      return;
    }

    setIsExportingPDF(true);
    try {
      const modelName = getModelName();
      const pdfBlob = await exportDashboardToPDF(calculationResult, modelName);
      
      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${modelName.replace(/\s+/g, '_')}_Financial_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: "Financial report has been exported successfully."
      });
    } catch (error) {
      console.error('PDF export failed:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExportingPDF(false);
    }
  };

  /**
   * Get Model Display Information
   */
  const getModelName = () => {
    return selectedModel ? MODEL_CONFIGS[selectedModel].info.name : '';
  };

  const getModelDescription = () => {
    return selectedModel ? MODEL_CONFIGS[selectedModel].info.description : '';
  };

  /**
   * Render Model-Specific Dashboard
   * Currently only supports 3-Statement model
   */
  const renderModelDashboard = () => {
    if (!selectedModel || !showResults) return null;

    if (selectedModel === '3-statement') {
      return <ThreeStatementDashboard calculationResult={calculationResult} />;
    }

        return (
          <div className="p-8 space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold text-foreground">{getModelName()} Results</h1>
              <p className="text-muted-foreground">Financial analysis and projections dashboard</p>
            </div>
          </div>
        );
  };

  // Helper to transform layman-friendly form data to variable sections for calculation
  function transformLaymanDataToVariableSections(data, companyType) {
    // This mirrors the backend's transform_service_input_to_variable_sections logic
    function varObj(id, name, value, unit, category, description = '', input_type = 'fixed', applies_to = 'income_statement') {
      return {
        id,
        name,
        value: value !== undefined && value !== null && value !== '' ? Number(value) : 0,
        unit,
        category,
        description,
        input_type: input_type as 'fixed' | 'percentage' | 'formula',
        applies_to: applies_to as 'income_statement' | 'balance_sheet' | 'cash_flow',
      };
    }
    // Revenue: sum of all service revenue (price * clients)
    const total_revenue = (data.services || []).reduce((sum, s) => sum + (Number(s.price || 0) * Number(s.clients || 0)), 0);
    // COGS: sum of all service delivery costs (cost * clients)
    const total_cogs = (data.services || []).reduce((sum, s) => sum + (Number(s.cost || 0) * Number(s.clients || 0)), 0);
    // Operating Expenses: sum of all monthly expenses
    const total_expenses = (data.expenses || []).reduce((sum, e) => sum + Number(e.amount || 0), 0);
    // CapEx: sum of all equipment costs
    const total_capex = (data.equipment || []).reduce((sum, eq) => sum + Number(eq.cost || 0), 0);
    // Loans: sum of all loan amounts
    const total_loans = (data.loans || []).reduce((sum, l) => sum + Number(l.amount || 0), 0);
    // Tax Rate
    const tax_rate = Number(data.taxRate || 25);
    // Other income/costs
    const total_other_income = (data.other || []).filter(o => o.isIncome).reduce((sum, o) => sum + Number(o.amount || 0), 0);
    const total_other_costs = (data.other || []).filter(o => !o.isIncome).reduce((sum, o) => sum + Number(o.amount || 0), 0);
    // Build variable sections
    const income_vars = [
      varObj('revenue', 'Revenue', total_revenue, '$', 'income_statement', 'Total revenue from all services'),
      varObj('cogs', 'Cost of Goods Sold (COGS)', total_cogs, '$', 'income_statement', 'Total direct costs for services'),
      varObj('operating-expenses', 'Operating Expenses', total_expenses, '$', 'income_statement', 'Total monthly business expenses'),
      varObj('tax rate', 'Tax Rate', tax_rate, '%', 'income_statement', 'Tax rate applied to profit', 'percentage'),
      varObj('other-income', 'Other Income (optional)', total_other_income, '$', 'income_statement', 'Other income sources'),
      varObj('other-costs', 'Other Costs (optional)', total_other_costs, '$', 'income_statement', 'Other costs not included above'),
    ];
    const balance_vars = [
      varObj('cash', 'Cash', Number(data.selfFunding || 0), '$', 'balance_sheet', 'Initial cash/self-funding', 'fixed', 'balance_sheet'),
      varObj('long-term-debt', 'Long-Term Debt', total_loans, '$', 'balance_sheet', 'Total business loans', 'fixed', 'balance_sheet'),
      varObj('ppe-fixed-assets', 'PP&E (Fixed Assets)', total_capex, '$', 'balance_sheet', 'Total equipment/tools purchased', 'fixed', 'balance_sheet'),
    ];
    const cashflow_vars = [
      varObj('capex', 'CapEx', total_capex, '$', 'cash_flow', 'Capital expenditures for equipment/tools', 'fixed', 'cash_flow'),
    ];
    return [
      { id: 'income-statement-inputs', title: 'Income Statement Inputs', icon: FileText, variables: income_vars },
      { id: 'balance-sheet-inputs', title: 'Balance Sheet Inputs', icon: CreditCard, variables: balance_vars },
      { id: 'cash-flow-inputs', title: 'Cash Flow Inputs', icon: Banknote, variables: cashflow_vars },
    ];
  }

  // Helper to transform retail-friendly form data to variable sections for calculation
  function transformRetailDataToVariableSections(data, companyType) {
    // This mirrors the backend's transform_service_input_to_variable_sections logic for retail
    function varObj(id, name, value, unit, category, description = '', input_type = 'fixed', applies_to = 'income_statement') {
      return {
        id,
        name,
        value: value !== undefined && value !== null && value !== '' ? Number(value) : 0,
        unit,
        category,
        description,
        input_type: input_type as 'fixed' | 'percentage' | 'formula',
        applies_to: applies_to as 'income_statement' | 'balance_sheet' | 'cash_flow',
      };
    }
    // Revenue: sum of all product revenue (price * units)
    const total_revenue = (data.products || []).reduce((sum, p) => sum + (Number(p.price || 0) * Number(p.units || 0)), 0);
    // COGS: sum of all product costs (cost * units)
    const total_cogs = (data.products || []).reduce((sum, p) => sum + (Number(p.cost || 0) * Number(p.units || 0)), 0);
    // Operating Expenses: sum of all monthly fixed expenses
    const total_expenses = (data.expenses || []).reduce((sum, e) => sum + Number(e.amount || 0), 0);
    // CapEx: equipment/shop setup cost
    const total_capex = Number(data.equipmentCost || 0);
    // Loans: investment or loan
    const total_loans = Number(data.loanAmount || 0);
    // Tax Rate
    const tax_rate = Number(data.taxRate || 25);
    // Other income/costs
    const total_other_income = (data.other || []).filter(o => o.isIncome).reduce((sum, o) => sum + Number(o.amount || 0), 0);
    const total_other_costs = (data.other || []).filter(o => !o.isIncome).reduce((sum, o) => sum + Number(o.amount || 0), 0);
    // Inventory holding (days)
    const inventory_days = Number(data.inventoryDays || 0);
    // Growth rates per product (optional, not used in base calculation)
    // Build variable sections
    const income_vars = [
      varObj('revenue', 'Revenue', total_revenue, '$', 'income_statement', 'Total revenue from all products'),
      varObj('cogs', 'Cost of Goods Sold (COGS)', total_cogs, '$', 'income_statement', 'Total direct costs for products'),
      varObj('operating-expenses', 'Operating Expenses', total_expenses, '$', 'income_statement', 'Total monthly business expenses'),
      varObj('tax rate', 'Tax Rate', tax_rate, '%', 'income_statement', 'Tax rate applied to profit', 'percentage'),
      varObj('other-income', 'Other Income (optional)', total_other_income, '$', 'income_statement', 'Other income sources'),
      varObj('other-costs', 'Other Costs (optional)', total_other_costs, '$', 'income_statement', 'Other costs not included above'),
    ];
    const balance_vars = [
      varObj('cash', 'Cash', Number(data.selfFunding || 0), '$', 'balance_sheet', 'Initial cash/self-funding', 'fixed', 'balance_sheet'),
      varObj('long-term-debt', 'Long-Term Debt', total_loans, '$', 'balance_sheet', 'Total business loans', 'fixed', 'balance_sheet'),
      varObj('ppe-fixed-assets', 'PP&E (Fixed Assets)', total_capex, '$', 'balance_sheet', 'Total equipment/shop setup cost', 'fixed', 'balance_sheet'),
      varObj('inventory-days', 'Inventory Days', inventory_days, 'days', 'balance_sheet', 'Days of inventory on hand', 'fixed', 'balance_sheet'),
    ];
    const cashflow_vars = [
      varObj('capex', 'CapEx', total_capex, '$', 'cash_flow', 'Capital expenditures for equipment/shop setup', 'fixed', 'cash_flow'),
    ];
    return [
      { id: 'income-statement-inputs', title: 'Income Statement Inputs', icon: FileText, variables: income_vars },
      { id: 'balance-sheet-inputs', title: 'Balance Sheet Inputs', icon: CreditCard, variables: balance_vars },
      { id: 'cash-flow-inputs', title: 'Cash Flow Inputs', icon: Banknote, variables: cashflow_vars },
    ];
  }

  // Helper to transform SaaS-friendly form data to variable sections for calculation
  function transformSaaSDataToVariableSections(data, companyType) {
    function varObj(id, name, value, unit, category, description = '', input_type = 'fixed', applies_to = 'income_statement') {
      return {
        id,
        name,
        value: value !== undefined && value !== null && value !== '' ? Number(value) : 0,
        unit,
        category,
        description,
        input_type: input_type as 'fixed' | 'percentage' | 'formula',
        applies_to: applies_to as 'income_statement' | 'balance_sheet' | 'cash_flow',
      };
    }
    // Revenue: subscriptionPrice * currentUsers
    const total_revenue = Number(data.subscriptionPrice || 0) * Number(data.currentUsers || 0);
    // COGS: cost per user * current users
    const total_cogs = Number(data.costPerUser || 0) * Number(data.currentUsers || 0);
    // Operating Expenses: sum of all monthly expenses
    const total_expenses = (data.expenses || []).reduce((sum, e) => sum + Number(e.amount || 0), 0);
    // CapEx: equipment cost
    const total_capex = Number(data.equipmentCost || 0);
    // Loans: investment or loan
    const total_loans = Number(data.investmentOrLoan || 0);
    // Tax Rate
    const tax_rate = Number(data.taxRate || 25);
    // Build variable sections
    const income_vars = [
      varObj('revenue', 'Revenue', total_revenue, '$', 'income_statement', 'Total subscription revenue'),
      varObj('cogs', 'Cost of Goods Sold (COGS)', total_cogs, '$', 'income_statement', 'Total direct costs per user'),
      varObj('operating-expenses', 'Operating Expenses', total_expenses, '$', 'income_statement', 'Total monthly business expenses'),
      varObj('tax rate', 'Tax Rate', tax_rate, '%', 'income_statement', 'Tax rate applied to profit', 'percentage'),
    ];
    const balance_vars = [
      varObj('cash', 'Cash', 0, '$', 'balance_sheet', 'Initial cash/self-funding', 'fixed', 'balance_sheet'),
      varObj('long-term-debt', 'Long-Term Debt', total_loans, '$', 'balance_sheet', 'Total business loans/investment', 'fixed', 'balance_sheet'),
      varObj('ppe-fixed-assets', 'PP&E (Fixed Assets)', total_capex, '$', 'balance_sheet', 'Total equipment/tools purchased', 'fixed', 'balance_sheet'),
    ];
    const cashflow_vars = [
      varObj('capex', 'CapEx', total_capex, '$', 'cash_flow', 'Capital expenditures for equipment/tools', 'fixed', 'cash_flow'),
    ];
    return [
      { id: 'income-statement-inputs', title: 'Income Statement Inputs', icon: FileText, variables: income_vars },
      { id: 'balance-sheet-inputs', title: 'Balance Sheet Inputs', icon: CreditCard, variables: balance_vars },
      { id: 'cash-flow-inputs', title: 'Cash Flow Inputs', icon: Banknote, variables: cashflow_vars },
    ];
  }

  // Remove the welcome screen logic and always show onboarding first
  if (showOnboarding) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <SidebarProvider>
          <div className="flex-1 flex w-full pt-16">
            <AppSidebar selectedModel={selectedModel} onModelSelect={handleModelSelect} />
            <SidebarInset className="flex-1 flex items-center justify-center">
              <OnboardingQuestionnaire onComplete={() => { setShowOnboarding(false); setShowCompanyTypeSelector(true); }} />
            </SidebarInset>
          </div>
        </SidebarProvider>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <SidebarProvider>
        <div className="flex-1 flex w-full pt-16">
          {/* Sidebar - Model Selection */}
          <AppSidebar selectedModel={selectedModel} onModelSelect={handleModelSelect} />
          
          <SidebarInset className="flex-1">
            {/* Model Information and Actions */}
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-semibold text-foreground">{getModelName()}</h1>
                  <p className="text-sm text-muted-foreground">{getModelDescription()}</p>
                </div>
                {/* Export button */}
                {selectedModel && showResults && (
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="outline"
                      onClick={handleExportPDF}
                      disabled={isExportingPDF}
                      className="flex items-center gap-2"
                    >
                      {isExportingPDF ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileDown className="h-4 w-4" />
                      )}
                      {isExportingPDF ? 'Exporting...' : 'Export to PDF'}
                    </Button>
                  </div>
                )}
              </div>
            </div>

          {/* Main Content Area */}
          {showCompanyTypeSelector ? (
            <CompanyTypeSelector
              selectedType={selectedCompanyType}
              onSelect={(type) => { handleCompanyTypeSelect(type); setShowCompanyTypeSelector(false); }}
            />
          ) : !showResults ? (
            // Variable Configuration Screen
            <div className="flex-1 p-8">
              <div className="max-w-7xl mx-auto">
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-foreground">Model Variables</h2>
                    <Dialog open={showImportWizard} onOpenChange={setShowImportWizard}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="gap-2">
                          <Upload className="h-4 w-4" />
                          Import from Excel
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-6xl h-[90vh] overflow-auto">
                        <DialogHeader>
                          <DialogTitle>Import Financial Data</DialogTitle>
                          <DialogDescription>
                            Upload and map your Excel data to populate the model variables
                          </DialogDescription>
                        </DialogHeader>
                        <ImportWizard
                          onCancel={handleImportCancel}
                          modelId="3-statement"
                          onImportComplete={handleImportComplete}
                          onCalculationComplete={(result) => {
                            setCalculationResult(result);
                            toast({
                              title: "🎉 Calculation Complete",
                              description: "Your financial model has been successfully calculated and is ready for analysis."
                            });
                            navigate(`/model/3-statement/statements`);
                          }}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Layman-friendly input for 3-statement model */}
                  {selectedModel === '3-statement' ? (
                    !selectedCompanyType ? (
                      <CompanyTypeSelector
                        selectedType={selectedCompanyType}
                        onSelect={handleCompanyTypeSelect}
                      />
                    ) : !showResults ? (
                      laymanFormData ? (
                      selectedCompanyType === 'retail' ? (
                        <RetailBusinessInputForm
                            initialValues={laymanFormData}
                          onSubmit={(data) => {
                            setLaymanFormData(data);
                            handleCalculateModel(data.forecast?.period, { ...data, company_type: 'retail' });
                          }}
                          onBack={() => handleCompanyTypeSelect(null)}
                        />
                      ) : selectedCompanyType === 'service' ? (
                        <ServiceBusinessInputForm
                            initialValues={laymanFormData}
                          onSubmit={(data) => {
                            setLaymanFormData(data);
                            handleCalculateModel(data.forecast?.period, { ...data, company_type: 'service' });
                          }}
                          onBack={() => handleCompanyTypeSelect(null)}
                        />
                      ) : selectedCompanyType === 'saas' ? (
                        <SaaSBusinessInputForm
                            initialValues={laymanFormData}
                          onSubmit={(data) => {
                            setLaymanFormData(data);
                            handleCalculateModel(data.forecast?.period, { ...data, company_type: 'saas' });
                          }}
                          onBack={() => handleCompanyTypeSelect(null)}
                        />
                    ) : null
                      ) : (
                        selectedCompanyType === 'retail' ? (
                          <RetailBusinessInputForm
                            onSubmit={(data) => {
                              setLaymanFormData(data);
                              handleCalculateModel(data.forecast?.period, { ...data, company_type: 'retail' });
                            }}
                            onBack={() => handleCompanyTypeSelect(null)}
                          />
                        ) : selectedCompanyType === 'service' ? (
                          <ServiceBusinessInputForm
                            onSubmit={(data) => {
                              setLaymanFormData(data);
                              handleCalculateModel(data.forecast?.period, { ...data, company_type: 'service' });
                            }}
                            onBack={() => handleCompanyTypeSelect(null)}
                          />
                        ) : selectedCompanyType === 'saas' ? (
                          <SaaSBusinessInputForm
                            onSubmit={(data) => {
                              setLaymanFormData(data);
                              handleCalculateModel(data.forecast?.period, { ...data, company_type: 'saas' });
                            }}
                            onBack={() => handleCompanyTypeSelect(null)}
                          />
                        ) : null
                      )
                    ) : (
                      calculationResult ? renderModelDashboard() : null
                    )
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                      {variableSections.map((section) => {
                        // Handle missing icon gracefully
                        const IconComponent = section.icon || FileText;
                        return (
                          <Card key={section.id} className="h-fit">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2 text-base">
                                <IconComponent className="h-5 w-5" />
                                {section.title}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {/* Variable List */}
                              <div className="space-y-3">
                                {section.variables.map((variable) => (
                                  <div key={variable.id} className="flex items-center gap-2">
                                    <div className="flex-1">
                                      <Label htmlFor={variable.id} className="text-xs text-muted-foreground">
                                        {variable.name}
                                      </Label>
                                      <div className="flex items-center gap-1 mt-1">
                                        <Input
                                          id={variable.id}
                                          type="number"
                                          value={variable.value}
                                          onChange={(e) => handleVariableChange(
                                            section.id, 
                                            variable.id, 
                                            parseFloat(e.target.value) || 0
                                          )}
                                          className="h-8 text-xs"
                                        />
                                        {variable.unit && (
                                          <span className="text-xs text-muted-foreground min-w-fit">
                                            {variable.unit}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveVariable(section.id, variable.id)}
                                      className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>

                              {/* Add Variable Button and Dialog */}
                              <div className="border-t pt-3">
                                <Dialog open={isAddingVariable && activeSection === section.id} onOpenChange={(open) => {
                                  setIsAddingVariable(open);
                                  if (open) setActiveSection(section.id);
                                  else setActiveSection(null);
                                }}>
                                  <DialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="teal"
                                      className="w-full"
                                      onClick={() => {
                                        setActiveSection(section.id);
                                        setIsAddingVariable(true);
                                      }}
                                    >
                                      <Plus className="h-3 w-3 mr-2" />
                                      Add Variable
                                    </Button>
                                  </DialogTrigger>
                                  
                                  {/* Add Variable Dialog Content - Fixed Form Handling */}
                                  <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-2xl">
                                    <DialogHeader>
                                      <DialogTitle>Add Variable to {section.title}</DialogTitle>
                                      <DialogDescription className="text-gray-600">
                                        Configure a new variable with metadata for proper categorization
                                      </DialogDescription>
                                    </DialogHeader>
                                    <Form {...addVariableForm}>
                                      <form onSubmit={addVariableForm.handleSubmit((data: VariableFormData) => {
                                        const newVariable: Variable = {
                                          ...data,
                                          id: Date.now().toString(),
                                        };
                                        setVariableSections(sections =>
                                          sections.map(s =>
                                            s.id === section.id
                                              ? { ...s, variables: [...s.variables, newVariable] }
                                              : s
                                          )
                                        );
                                        setIsAddingVariable(false);
                                        setActiveSection(null);
                                        addVariableForm.reset();
                                        toast({
                                          title: "Variable Added",
                                          description: `"${data.name}" has been added to ${section.title}.`
                                        });
                                      })} className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                          <FormField
                                            control={addVariableForm.control}
                                            name="name"
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormLabel>Variable Name</FormLabel>
                                                <FormControl>
                                                  <Input {...field} className="bg-gray-50 border-gray-300 text-gray-900" placeholder="Enter variable name" />
                                                </FormControl>
                                                <FormMessage />
                                              </FormItem>
                                            )}
                                          />
                                          <FormField
                                            control={addVariableForm.control}
                                            name="value"
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormLabel>Value</FormLabel>
                                                <FormControl>
                                                  <Input 
                                                    type="number" 
                                                    {...field} 
                                                    value={field.value || 0}
                                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                    className="bg-gray-50 border-gray-300 text-gray-900" 
                                                    placeholder="0"
                                                  />
                                                </FormControl>
                                                <FormMessage />
                                              </FormItem>
                                            )}
                                          />
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                          <FormField
                                            control={addVariableForm.control}
                                            name="input_type"
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormLabel>Input Type</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                  <FormControl>
                                                    <SelectTrigger className="bg-gray-50 border-gray-300 text-gray-900">
                                                      <SelectValue placeholder="Select input type" />
                                                    </SelectTrigger>
                                                  </FormControl>
                                                  <SelectContent className="bg-white border-gray-200">
                                                    {INPUT_TYPE_OPTIONS.map((option) => (
                                                      <SelectItem key={option.value} value={option.value} className="text-gray-900 hover:bg-gray-100">
                                                        {option.label}
                                                      </SelectItem>
                                                    ))}
                                                  </SelectContent>
                                                </Select>
                                                <FormMessage />
                                              </FormItem>
                                            )}
                                          />
                                          <FormField
                                            control={addVariableForm.control}
                                            name="category"
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormLabel>Category</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                  <FormControl>
                                                    <SelectTrigger className="bg-gray-50 border-gray-300 text-gray-900">
                                                      <SelectValue placeholder="Select category" />
                                                    </SelectTrigger>
                                                  </FormControl>
                                                  <SelectContent className="bg-white border-gray-200">
                                                    {CATEGORY_OPTIONS.map((option) => (
                                                      <SelectItem key={option.value} value={option.value} className="text-gray-900 hover:bg-gray-100">
                                                        {option.label}
                                                      </SelectItem>
                                                    ))}
                                                  </SelectContent>
                                                </Select>
                                                <FormMessage />
                                              </FormItem>
                                            )}
                                          />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                          <FormField
                                            control={addVariableForm.control}
                                            name="applies_to"
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormLabel>Applies To</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                  <FormControl>
                                                    <SelectTrigger className="bg-gray-50 border-gray-300 text-gray-900">
                                                      <SelectValue placeholder="Select statement" />
                                                    </SelectTrigger>
                                                  </FormControl>
                                                  <SelectContent className="bg-white border-gray-200">
                                                    {APPLIES_TO_OPTIONS.map((option) => (
                                                      <SelectItem key={option.value} value={option.value} className="text-gray-900 hover:bg-gray-100">
                                                        {option.label}
                                                      </SelectItem>
                                                    ))}
                                                  </SelectContent>
                                                </Select>
                                                <FormMessage />
                                              </FormItem>
                                            )}
                                          />
                                          {addVariableForm.watch('input_type') === 'percentage' && (
                                            <FormField
                                              control={addVariableForm.control}
                                              name="relative_to"
                                              render={({ field }) => (
                                                <FormItem>
                                                  <FormLabel>Relative To</FormLabel>
                                                  <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                                                    <FormControl>
                                                      <SelectTrigger className="bg-gray-50 border-gray-300 text-gray-900">
                                                        <SelectValue placeholder="Select base value" />
                                                      </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="bg-white border-gray-200">
                                                      {RELATIVE_TO_OPTIONS.map((option) => (
                                                        <SelectItem key={option.value} value={option.value} className="text-gray-900 hover:bg-gray-100">
                                                          {option.label}
                                                        </SelectItem>
                                                      ))}
                                                    </SelectContent>
                                                  </Select>
                                                  <FormMessage />
                                                </FormItem>
                                              )}
                                            />
                                          )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                          <FormField
                                            control={addVariableForm.control}
                                            name="unit"
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormLabel>Unit</FormLabel>
                                                <FormControl>
                                                  <Input {...field} value={field.value || ''} className="bg-gray-50 border-gray-300 text-gray-900" placeholder="e.g., $, %, months" />
                                                </FormControl>
                                                <FormMessage />
                                              </FormItem>
                                            )}
                                          />
                                          <FormField
                                            control={addVariableForm.control}
                                            name="description"
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormLabel>Description (Optional)</FormLabel>
                                                <FormControl>
                                                  <Input {...field} value={field.value || ''} className="bg-gray-50 border-gray-300 text-gray-900" placeholder="Enter description" />
                                                </FormControl>
                                                <FormMessage />
                                              </FormItem>
                                            )}
                                          />
                                        </div>

                                        <DialogFooter>
                                          <Button type="button" variant="outline" onClick={() => {
                                            setIsAddingVariable(false);
                                            setActiveSection(null);
                                          }} className="bg-gray-100 border-gray-300 text-gray-900 hover:bg-gray-200">
                                            Cancel
                                          </Button>
                                          <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                                            Add Variable
                                          </Button>
                                        </DialogFooter>
                                      </form>
                                    </Form>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Results/Statements Page for 3-statement model */}
              {calculationResult ? (
                renderModelDashboard()
              ) : (
                <div className="text-center text-muted-foreground py-10">
                  No calculation results to display.
                </div>
              )}
              {selectedModel === '3-statement' && calculationResult && (
                <div className="flex justify-center gap-4 mt-8">
                  <Button size="lg" variant="outline" className="px-8 py-4 text-lg font-semibold shadow-lg" onClick={() => navigate(`/model/${selectedModel}/dashboard`)}>
                    Go to Dashboard
                  </Button>
                  <Button size="lg" className="px-8 py-4 text-lg font-semibold shadow-lg" onClick={() => navigate(`/model/${selectedModel}/statements`)}>
                    Go to Statements
                  </Button>
                </div>
              )}
            </>
          )}
        </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
