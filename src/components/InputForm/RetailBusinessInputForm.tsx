import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface Product {
  name: string;
  price: string;
  units: string;
  growthRate?: string;
  cost: string;
}

interface Expense {
  name: string;
  amount: string;
  growthRate?: string;
}

interface Equipment {
  name: string;
  cost: string;
  usefulLife?: string;
  purchaseDate?: string;
  notes?: string;
  depreciationMethod?: 'straight_line' | 'double_declining' | 'sum_of_years_digits' | 'units_of_production';
  salvageValue?: string; // for SYD
  totalUnits?: string; // for Units of Production
  unitsPerYear?: string[]; // for Units of Production
}

interface Loan {
  amount: string;
  interestRate?: string;
  repaymentPeriod?: string;
  startDate?: string;
}

interface OtherItem {
  name: string;
  amount: string;
  isIncome: boolean;
}

interface Investment {
  name: string;
  amount: string;
  date: string;
  expectedReturn?: string;
  maturityValue?: string;
  maturityType?: 'year' | 'duration';
  income: boolean;
  incomeAmount?: string;
}

interface RetailBusinessInputFormProps {
  onSubmit: (data: any) => void;
  onBack?: () => void;
  initialValues?: any;
}

export const RetailBusinessInputForm: React.FC<RetailBusinessInputFormProps> = ({ onSubmit, onBack, initialValues }) => {
  // Section toggles
  const [hasProducts, setHasProducts] = useState(initialValues?.products ? true : true);
  const [hasExpenses, setHasExpenses] = useState(initialValues?.expenses ? true : true);
  const [hasEquipment, setHasEquipment] = useState(initialValues?.equipment ? true : false);
  const [hasLoan, setHasLoan] = useState(initialValues?.loans ? true : false);
  const [hasTax, setHasTax] = useState(initialValues?.taxRate !== undefined ? true : true);
  const [hasOther, setHasOther] = useState(initialValues?.other ? true : false);
  const [hasEquity, setHasEquity] = useState(false);
  const [equity, setEquity] = useState('');
  const [hasCreditSales, setHasCreditSales] = useState(initialValues?.creditSales ? true : false);
  const [creditSalesPercent, setCreditSalesPercent] = useState(initialValues?.creditSales?.percent || '');
  const [creditCollectionDays, setCreditCollectionDays] = useState(initialValues?.creditSales?.collectionDays || '');
  const [forecastPeriod, setForecastPeriod] = useState(initialValues?.forecast?.period || '12');
  const [forecastType, setForecastType] = useState<'months' | 'years'>(initialValues?.forecast?.type || 'months');
  const [hasOwnerSalary, setHasOwnerSalary] = useState(initialValues?.ownerSalary ? true : false);
  const [ownerSalary, setOwnerSalary] = useState(initialValues?.ownerSalary?.amount || '');
  const [ownerSalaryFrequency, setOwnerSalaryFrequency] = useState(initialValues?.ownerSalary?.frequency || 'monthly');
  const [hasAP, setHasAP] = useState(initialValues?.accountsPayable ? true : false);
  const [apDays, setApDays] = useState(initialValues?.accountsPayable?.days || '');
  const [hasShareholders, setHasShareholders] = useState(initialValues?.shareholders ? true : false);
  const [shareholders, setShareholders] = useState(initialValues?.shareholders || [{ name: '', amount: '', percent: '', notes: '' }]);
  const [expenseInputType, setExpenseInputType] = useState<'monthly' | 'annual'>('monthly');
  const [fiscalYearStart, setFiscalYearStart] = useState(initialValues?.fiscalYearStart || 'January');
  // Add revenue input type toggle
  const [revenueInputType, setRevenueInputType] = useState<'monthly' | 'annual'>('monthly');
  // Add state for Discount Rate and Terminal Growth Rate
  const [discountRate, setDiscountRate] = useState(initialValues?.discountRate || '10');
  const [terminalGrowth, setTerminalGrowth] = useState(initialValues?.terminalGrowth || '2');
  // Add state for WACC build-up
  const [useWaccBuildUp, setUseWaccBuildUp] = useState(false);
  const [useCostOfEquityOnly, setUseCostOfEquityOnly] = useState(false);
  const [rfRate, setRfRate] = useState('4');
  const [beta, setBeta] = useState('1.0');
  const [marketPremium, setMarketPremium] = useState('6');
  const [costOfDebt, setCostOfDebt] = useState('6');
  const [taxRateWacc, setTaxRateWacc] = useState(initialValues?.taxRate || '25');
  const [equityPct, setEquityPct] = useState('60');
  const [debtPct, setDebtPct] = useState('40');
  
  // Global Interest Rate Settings
  const [hasGlobalInterestRates, setHasGlobalInterestRates] = useState(initialValues?.globalInterestRates ? true : false);
  const [shortTermInterestRate, setShortTermInterestRate] = useState(initialValues?.globalInterestRates?.shortTerm || '5');
  const [longTermInterestRate, setLongTermInterestRate] = useState(initialValues?.globalInterestRates?.longTerm || '6');
  const [investmentInterestRate, setInvestmentInterestRate] = useState(initialValues?.globalInterestRates?.investment || '4');
  const [useGlobalRatesForLoans, setUseGlobalRatesForLoans] = useState(initialValues?.globalInterestRates?.useForLoans || false);
  // Calculate Cost of Equity and WACC
  const calcCostOfEquity = () => {
    const rf = parseFloat(rfRate) || 0;
    const b = parseFloat(beta) || 0;
    const mp = parseFloat(marketPremium) || 0;
    return rf + b * mp;
  };
  const calcAfterTaxCostOfDebt = () => {
    const kd = parseFloat(costOfDebt) || 0;
    const t = (parseFloat(taxRateWacc) || 0) / 100;
    return kd * (1 - t);
  };
  const calcWacc = () => {
    const ke = calcCostOfEquity();
    const kd = calcAfterTaxCostOfDebt();
    const e = (parseFloat(equityPct) || 0) / 100;
    const d = (parseFloat(debtPct) || 0) / 100;
    return e * ke + d * kd;
  };

  // Dynamic lists
  const [products, setProducts] = useState<Product[]>(initialValues?.products || [{ name: '', price: '', units: '', growthRate: '', cost: '' }]);
  const [expenses, setExpenses] = useState<Expense[]>(initialValues?.expenses || [{ name: '', amount: '', growthRate: '' }]);
  const [equipment, setEquipment] = useState<Equipment[]>(initialValues?.equipment || []);
  const [loans, setLoans] = useState<Loan[]>(initialValues?.loans || []);
  const [other, setOther] = useState<OtherItem[]>(initialValues?.other || []);
  const [investments, setInvestments] = useState<Investment[]>(initialValues?.investments || []);

  // Simple fields
  const [inventoryDays, setInventoryDays] = useState(initialValues?.inventoryDays || '');
  const [selfFunding, setSelfFunding] = useState(initialValues?.selfFunding || '');
  const [taxRate, setTaxRate] = useState(initialValues?.taxRate || '25');

  // Handlers for dynamic lists
  const handleProductChange = (idx: number, field: keyof Product, value: string) => {
    setProducts(products => products.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };
  const addProduct = () => setProducts([...products, { name: '', price: '', units: '', growthRate: '', cost: '' }]);
  const removeProduct = (idx: number) => setProducts(products => products.filter((_, i) => i !== idx));

  const handleExpenseChange = (idx: number, field: keyof Expense, value: string) => {
    setExpenses(expenses => expenses.map((e, i) => i === idx ? { ...e, [field]: value } : e));
  };
  const addExpense = () => setExpenses([...expenses, { name: '', amount: '', growthRate: '' }]);
  const removeExpense = (idx: number) => setExpenses(expenses => expenses.filter((_, i) => i !== idx));

  const handleEquipmentChange = (idx: number, field: keyof Equipment, value: string | string[]) => {
    setEquipment(eq => eq.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };
  const addEquipment = () => setEquipment(eq => [...eq, { name: '', cost: '', notes: '', usefulLife: '', purchaseDate: '', depreciationMethod: 'straight_line' }]);
  const removeEquipment = (idx: number) => setEquipment(eq => eq.filter((_, i) => i !== idx));

  const handleLoanChange = (idx: number, field: keyof Loan, value: string) => {
    setLoans(l => l.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };
  const addLoan = () => setLoans(l => [...l, { amount: '', interestRate: '', repaymentPeriod: '', startDate: '' }]);
  const removeLoan = (idx: number) => setLoans(l => l.filter((_, i) => i !== idx));

  const handleOtherChange = (idx: number, field: keyof OtherItem, value: string | boolean) => {
    setOther(o => o.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };
  const addOther = () => setOther(o => [...o, { name: '', amount: '', isIncome: false }]);
  const removeOther = (idx: number) => setOther(o => o.filter((_, i) => i !== idx));

  // Shareholder handlers
  const handleShareholderChange = (idx: number, field: string, value: string) => {
    setShareholders(s => s.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };
  const addShareholder = () => setShareholders(s => [...s, { name: '', amount: '', percent: '', notes: '' }]);
  const removeShareholder = (idx: number) => setShareholders(s => s.filter((_, i) => i !== idx));

  // Investment handlers
  const handleInvestmentChange = (idx: number, field: keyof Investment, value: string | boolean) => {
    setInvestments(investments => investments.map((inv, i) => i === idx ? { ...inv, [field]: value } : inv));
  };
  const addInvestment = () => setInvestments([...investments, { name: '', amount: '', date: '', expectedReturn: '', maturityValue: '', maturityType: 'year', income: false, incomeAmount: '' }]);
  const removeInvestment = (idx: number) => setInvestments(investments => investments.filter((_, i) => i !== idx));

  // Submission
  const sanitizeNumber = (val: any) => {
    if (val === undefined || val === null || val === '') return 0;
    return isNaN(Number(val)) ? 0 : Number(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Convert annual expenses to monthly if needed
    let processedExpenses = expenses;
    if (expenseInputType === 'annual') {
      processedExpenses = expenses.map(exp => ({
        ...exp,
        amount: exp.amount ? (parseFloat(exp.amount) / 12).toString() : ''
      }));
    }
    // Convert annual revenue to monthly if needed
    let processedProducts = products;
    if (revenueInputType === 'annual') {
      processedProducts = products.map(product => ({
        ...product,
        units: product.units ? (parseFloat(product.units) / 12).toString() : '',
        // Optionally, you could also divide price if price is annual, but usually price is per unit
      }));
    }
    onSubmit({
      products: hasProducts ? processedProducts.map(p => ({
        ...p,
        price: sanitizeNumber(p.price),
        units: sanitizeNumber(p.units),
        growthRate: sanitizeNumber(p.growthRate),
        cost: sanitizeNumber(p.cost),
      })) : [],
      expenses: hasExpenses ? processedExpenses.map(e => ({
        ...e,
        amount: sanitizeNumber(e.amount),
        growthRate: sanitizeNumber(e.growthRate),
      })) : [],
      equipment: hasEquipment ? equipment.map(eq => ({
        ...eq,
        cost: sanitizeNumber(eq.cost),
        usefulLife: sanitizeNumber(eq.usefulLife),
        salvageValue: sanitizeNumber(eq.salvageValue),
        totalUnits: sanitizeNumber(eq.totalUnits),
        unitsPerYear: Array.isArray(eq.unitsPerYear) ? eq.unitsPerYear.map(sanitizeNumber) : [],
      })) : [],
      inventoryDays: sanitizeNumber(inventoryDays),
      selfFunding: sanitizeNumber(selfFunding),
      shareholders: hasShareholders ? shareholders : [],
      loans: hasLoan ? loans.map(l => ({
        ...l,
        amount: sanitizeNumber(l.amount),
        interestRate: sanitizeNumber(l.interestRate),
        repaymentPeriod: sanitizeNumber(l.repaymentPeriod),
      })) : [],
      taxRate: hasTax ? sanitizeNumber(taxRate) : null,
      other: hasOther ? other : [],
      creditSales: {
        percent: sanitizeNumber(creditSalesPercent),
        collectionDays: sanitizeNumber(creditCollectionDays)
      },
      accountsPayable: hasAP ? {
        days: sanitizeNumber(apDays)
      } : undefined,
      forecast: {
        period: sanitizeNumber(forecastPeriod),
        type: forecastType
      },
      ownerSalary: hasOwnerSalary ? {
        amount: sanitizeNumber(ownerSalary),
        frequency: ownerSalaryFrequency
      } : undefined,
      investments: investments.map(inv => ({
        ...inv,
        amount: sanitizeNumber(inv.amount),
        expectedReturn: sanitizeNumber(inv.expectedReturn),
        maturityValue: sanitizeNumber(inv.maturityValue),
        incomeAmount: sanitizeNumber(inv.incomeAmount),
      })),
      fiscalYearStart,
      currentDate: new Date().toISOString(),
      discountRate: useCostOfEquityOnly ? calcWacc() : sanitizeNumber(discountRate),
      terminalGrowth: sanitizeNumber(terminalGrowth),
      tvMethod,
      tvMetric,
      tvMultiple: sanitizeNumber(tvMultiple),
      tvCustomValue: sanitizeNumber(tvCustomValue),
      tvYear: sanitizeNumber(tvYear),
      globalInterestRates: hasGlobalInterestRates ? {
        shortTerm: sanitizeNumber(shortTermInterestRate),
        longTerm: sanitizeNumber(longTermInterestRate),
        investment: sanitizeNumber(investmentInterestRate),
        useForLoans: useGlobalRatesForLoans,
      } : undefined,
    });
  };

  // If initialValues changes after mount, update state
  React.useEffect(() => {
    if (initialValues) {
      setProducts(initialValues.products || [{ name: '', price: '', units: '', growthRate: '', cost: '' }]);
      setExpenses(initialValues.expenses || [{ name: '', amount: '', growthRate: '' }]);
      setEquipment(initialValues.equipment || []);
      setLoans(initialValues.loans || []);
      setOther(initialValues.other || []);
      setInvestments(initialValues.investments || []);
      setInventoryDays(initialValues.inventoryDays || '');
      setSelfFunding(initialValues.selfFunding || '');
      setTaxRate(initialValues.taxRate || '25');
      setHasProducts(initialValues.products ? true : true);
      setHasExpenses(initialValues.expenses ? true : true);
      setHasEquipment(initialValues.equipment ? true : false);
      setHasLoan(initialValues.loans ? true : false);
      setHasTax(initialValues.taxRate !== undefined ? true : true);
      setHasOther(initialValues.other ? true : false);
      setHasCreditSales(initialValues.creditSales ? true : false);
      setCreditSalesPercent(initialValues.creditSales?.percent || '');
      setCreditCollectionDays(initialValues.creditSales?.collectionDays || '');
      setForecastPeriod(initialValues.forecast?.period || '12');
      setForecastType(initialValues.forecast?.type || 'months');
      setHasOwnerSalary(initialValues.ownerSalary ? true : false);
      setOwnerSalary(initialValues.ownerSalary?.amount || '');
      setOwnerSalaryFrequency(initialValues.ownerSalary?.frequency || 'monthly');
      setHasAP(initialValues.accountsPayable ? true : false);
      setApDays(initialValues.accountsPayable?.days || '');
      setHasShareholders(initialValues.shareholders ? true : false);
      setShareholders(initialValues.shareholders || [{ name: '', amount: '', percent: '', notes: '' }]);
      setExpenseInputType('monthly');
      setFiscalYearStart(initialValues.fiscalYearStart || 'January');
      setRevenueInputType(initialValues.revenueInputType || 'monthly');
      setDiscountRate(initialValues.discountRate || '10');
      setTerminalGrowth(initialValues.terminalGrowth || '2');
      setUseWaccBuildUp(initialValues.useWaccBuildUp || false);
      setUseCostOfEquityOnly(initialValues.useCostOfEquityOnly || false);
      setRfRate(initialValues.rfRate || '4');
      setBeta(initialValues.beta || '1.0');
      setMarketPremium(initialValues.marketPremium || '6');
      setCostOfDebt(initialValues.costOfDebt || '6');
      setTaxRateWacc(initialValues.taxRateWacc || '25');
      setEquityPct(initialValues.equityPct || '60');
      setDebtPct(initialValues.debtPct || '40');
      setTvMethod(initialValues.tvMethod || 'perpetuity');
      setTvMetric(initialValues.tvMetric || 'EBITDA');
      setTvMultiple(initialValues.tvMultiple || '8');
      setTvCustomValue(initialValues.tvCustomValue || '');
      setTvYear(initialValues.tvYear || '5');
    }
  }, [initialValues]);

  const [expandedEquipment, setExpandedEquipment] = useState<number | null>(null);
  const [tvMethod, setTvMethod] = useState('perpetuity');
  const [tvMetric, setTvMetric] = useState('EBITDA');
  const [tvMultiple, setTvMultiple] = useState('8');
  const [tvCustomValue, setTvCustomValue] = useState('');
  const [tvYear, setTvYear] = useState(forecastPeriod || '5');

  return (
    <form onSubmit={handleSubmit} className="max-w-6xl mx-auto space-y-10 py-8 px-2">
      {onBack && (
        <div className="mb-6">
          <Button type="button" variant="outline" onClick={onBack} className="mr-2">
            ← Back
          </Button>
        </div>
      )}
      {/* Fiscal Year Selector */}
      <div className="mb-6">
        <Label className="block mb-2 font-semibold">Fiscal Year Starts In</Label>
        <select
          value={fiscalYearStart}
          onChange={e => setFiscalYearStart(e.target.value)}
          className="border rounded px-3 py-2 w-full max-w-xs"
        >
          {[
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
          ].map(month => (
            <option key={month} value={month}>{month}</option>
          ))}
        </select>
      </div>
      {/* Products Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Products
            <Switch checked={hasProducts} onCheckedChange={setHasProducts} />
          </CardTitle>
          <div className="mt-1 mb-2 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <div className="font-semibold text-base">What products do you sell?</div>
              <div className="text-sm text-muted-foreground">List each product, its price, units sold per {revenueInputType === 'monthly' ? 'month' : 'year'}, growth, and cost per item.</div>
            </div>
            <div className="mt-2 md:mt-0 flex items-center gap-2">
              <Label htmlFor="revenueInputType" className="mr-2">Enter as:</Label>
              <select id="revenueInputType" value={revenueInputType} onChange={e => setRevenueInputType(e.target.value as 'monthly' | 'annual')} className="border rounded px-2 py-1">
                <option value="monthly">Monthly</option>
                <option value="annual">Annual</option>
              </select>
            </div>
          </div>
        </CardHeader>
        {hasProducts && (
          <CardContent className="space-y-2 mb-10">
            <div className="font-semibold text-lg mb-4">Products</div>
            <Label className="block mb-4">Add your products</Label>
            {/* Header Row for Products */}
            <div className="grid grid-cols-6 md:grid-cols-7 gap-4 items-center mb-2 px-1">
              <div className="text-xs font-semibold text-muted-foreground">Product Name</div>
              <div className="text-xs font-semibold text-muted-foreground">Price</div>
              <div className="text-xs font-semibold text-muted-foreground">Units/{revenueInputType === 'monthly' ? 'Month' : 'Year'}</div>
              <div className="text-xs font-semibold text-muted-foreground">Growth %</div>
              <div className="text-xs font-semibold text-muted-foreground">Cost/Item</div>
              <div className="text-xs" />
              <div className="text-xs" />
            </div>
            {products.map((product, idx) => (
              <div key={idx} className="grid grid-cols-6 md:grid-cols-7 gap-4 items-center mb-2 px-1">
                <Input placeholder="Product Name" value={product.name} onChange={e => handleProductChange(idx, 'name', e.target.value)} className="flex-1" />
                <Input placeholder="$20" value={product.price} onChange={e => handleProductChange(idx, 'price', e.target.value)} className="w-24" />
                <Input placeholder={revenueInputType === 'monthly' ? '100' : '1200'} value={product.units} onChange={e => handleProductChange(idx, 'units', e.target.value)} className="w-24" />
                <Input placeholder="10%" value={product.growthRate} onChange={e => handleProductChange(idx, 'growthRate', e.target.value)} className="w-24" />
                <Input placeholder="$5" value={product.cost} onChange={e => handleProductChange(idx, 'cost', e.target.value)} className="w-24" />
                <div />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeProduct(idx)} className="justify-self-end"><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addProduct} className="mt-2"><Plus className="w-4 h-4 mr-1" /> Add Another Product</Button>
          </CardContent>
        )}
      </Card>

      {/* Expenses Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Business Expenses
            <Switch checked={hasExpenses} onCheckedChange={setHasExpenses} />
          </CardTitle>
          <div className="mt-1 mb-2 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <div className="font-semibold text-base">What are your regular business expenses?</div>
              <div className="text-sm text-muted-foreground">Add your recurring costs like rent, salaries, marketing, or utilities.</div>
            </div>
            <div className="mt-2 md:mt-0 flex items-center gap-2">
              <Label htmlFor="expenseInputType" className="mr-2">Enter as:</Label>
              <select id="expenseInputType" value={expenseInputType} onChange={e => setExpenseInputType(e.target.value as 'monthly' | 'annual')} className="border rounded px-2 py-1">
                <option value="monthly">Monthly</option>
                <option value="annual">Annual</option>
              </select>
            </div>
          </div>
        </CardHeader>
        {hasExpenses && (
          <CardContent className="space-y-2 mb-10">
            <div className="font-semibold text-lg mb-4">{expenseInputType === 'monthly' ? 'Monthly Fixed Expenses' : 'Annual Fixed Expenses'}</div>
            <Label className="block mb-4">Add your {expenseInputType === 'monthly' ? 'monthly' : 'annual'} expenses</Label>
            {/* Header Row for Expenses */}
            <div className="flex gap-x-4 items-center mb-2 px-1">
              <div className="text-xs font-semibold text-muted-foreground w-40">Expense Name</div>
              <div className="text-xs font-semibold text-muted-foreground w-24">Amount ({expenseInputType === 'monthly' ? '$/month' : '$/year'})</div>
              <div className="text-xs font-semibold text-muted-foreground w-20">Growth %</div>
              <div className="text-xs w-10" />
            </div>
            {expenses.map((expense, idx) => (
              <div key={idx} className="flex gap-x-4 items-center mb-2 px-1">
                <Input placeholder="Expense Name" value={expense.name} onChange={e => handleExpenseChange(idx, 'name', e.target.value)} className="w-40" />
                <Input placeholder={expenseInputType === 'monthly' ? '$200' : '$2400'} value={expense.amount} onChange={e => handleExpenseChange(idx, 'amount', e.target.value)} className="w-24" />
                <Input placeholder="5%" value={expense.growthRate || ''} onChange={e => handleExpenseChange(idx, 'growthRate', e.target.value)} className="w-20" />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeExpense(idx)} className="ml-auto"><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addExpense} className="mt-2"><Plus className="w-4 h-4 mr-1" /> Add Another Expense</Button>
          </CardContent>
        )}
      </Card>

      {/* Equipment Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Equipment / Shop Setup
            <Switch checked={hasEquipment} onCheckedChange={setHasEquipment} />
          </CardTitle>
          <div className="mt-1 mb-2">
            <div className="font-semibold text-base">Did you buy any equipment or setup your shop?</div>
            <div className="text-sm text-muted-foreground">List any one-time purchases like shelves, POS, or furniture for your retail business.</div>
          </div>
        </CardHeader>
        {hasEquipment && (
          <CardContent className="space-y-2 mb-10">
            <div className="font-semibold text-lg mb-4">Equipment / Shop Setup</div>
            <Label className="block mb-4">Have you bought any equipment or setup your shop?</Label>
            {equipment.map((item, idx) => {
              const needsExtra = item.depreciationMethod === 'sum_of_years_digits' || item.depreciationMethod === 'units_of_production';
              return (
                <div key={idx} className="bg-white rounded-lg shadow border mb-6 p-6 flex flex-col gap-2 relative">
                  {/* Delete button in top-right */}
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeEquipment(idx)} className="absolute top-2 right-2 z-10"><Trash2 className="w-4 h-4" /></Button>
                  <div className="flex flex-col md:flex-row md:items-end md:gap-6 gap-2">
                    <div className="flex flex-col flex-1 min-w-[180px]">
                      <Label className="text-xs mb-1">Item Name</Label>
                      <Input placeholder="e.g. Shelves" value={item.name} onChange={e => handleEquipmentChange(idx, 'name', e.target.value)} />
                    </div>
                    <div className="flex flex-col w-32">
                      <Label className="text-xs mb-1">Cost</Label>
                      <Input placeholder="$1000" value={item.cost} onChange={e => handleEquipmentChange(idx, 'cost', e.target.value)} />
                    </div>
                    <div className="flex flex-col w-32">
                      <Label className="text-xs mb-1">Useful Life (years)</Label>
                      <Input placeholder="e.g. 5" value={item.usefulLife || ''} onChange={e => handleEquipmentChange(idx, 'usefulLife', e.target.value)} />
                    </div>
                    <div className="flex flex-col w-40">
                      <Label className="text-xs mb-1">Purchase Date</Label>
                      <Input type="date" value={item.purchaseDate || ''} onChange={e => handleEquipmentChange(idx, 'purchaseDate', e.target.value)} title="If left blank, we'll assume you bought this at the start of your forecast." />
                    </div>
                    <div className="flex flex-col flex-1 min-w-[120px]">
                      <Label className="text-xs mb-1">Notes</Label>
                      <Input placeholder="Optional" value={item.notes} onChange={e => handleEquipmentChange(idx, 'notes', e.target.value)} />
                    </div>
                    <div className="flex flex-col w-56">
                      <Label className="text-xs mb-1">Depreciation Method</Label>
                      <select value={item.depreciationMethod || 'straight_line'} onChange={e => handleEquipmentChange(idx, 'depreciationMethod', e.target.value as Equipment['depreciationMethod'])} className="h-10 rounded border px-2">
                        <option value="straight_line">Straight-Line</option>
                        <option value="double_declining">Double Declining Balance</option>
                        <option value="sum_of_years_digits">Sum-of-the-Years'-Digits</option>
                        <option value="units_of_production">Units of Production</option>
                      </select>
                    </div>
                  </div>
                  {needsExtra && (
                    <div className="border-t pt-3 mt-2 flex flex-col md:flex-row md:items-end md:gap-6 gap-2 bg-gray-50 rounded">
                      <span className="text-xs font-semibold text-muted-foreground mb-2 md:mb-0 md:mr-4">Additional Depreciation Details:</span>
                      {item.depreciationMethod === 'sum_of_years_digits' && (
                        <div className="flex flex-col w-32">
                          <Label className="text-xs mb-1">Salvage Value</Label>
                          <Input placeholder="Optional" value={item.salvageValue || ''} onChange={e => handleEquipmentChange(idx, 'salvageValue', e.target.value)} />
                        </div>
                      )}
                      {item.depreciationMethod === 'units_of_production' && (
                        <>
                          <div className="flex flex-col w-32">
                            <Label className="text-xs mb-1">Total Expected Units</Label>
                            <Input placeholder="e.g. 10000" value={item.totalUnits || ''} onChange={e => handleEquipmentChange(idx, 'totalUnits', e.target.value)} />
                          </div>
                          <div className="flex flex-col w-48">
                            <Label className="text-xs mb-1">Units per Year (comma separated)</Label>
                            <Input placeholder="e.g. 2000,2000,2000,2000,2000" value={item.unitsPerYear ? item.unitsPerYear.join(',') : ''} onChange={e => handleEquipmentChange(idx, 'unitsPerYear', e.target.value.split(','))} />
                          </div>
                        </>
                      )}
            </div>
                  )}
              </div>
              );
            })}
            <Button type="button" variant="teal" onClick={addEquipment} className="mt-2"><Plus className="w-4 h-4 mr-1" /> Add Another</Button>
          </CardContent>
        )}
      </Card>

      {/* Inventory Section */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Holding (days)</CardTitle>
          <div className="text-sm text-muted-foreground">How many days of inventory do you keep on hand?</div>
        </CardHeader>
        <CardContent>
          <Input type="number" value={inventoryDays} onChange={e => setInventoryDays(e.target.value)} placeholder="Optional" />
        </CardContent>
      </Card>

      {/* Funding, Loans & Shareholders Section */}
      <Card>
        <CardHeader>
          <CardTitle>Funding & Loans</CardTitle>
          <div className="mt-1 mb-2">
            <div className="font-semibold text-base">How did you start your retail business?</div>
            <div className="text-sm text-muted-foreground">Tell us about your own investment, any business loans, and other shareholders (if any).</div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 mb-10">
          <div className="font-semibold text-lg mb-4">Funding & Loans</div>
          <Label className="block mb-4">Your own investment (Owner Equity)</Label>
          <Input placeholder="Your own investment (e.g. $5000)" value={selfFunding} onChange={e => setSelfFunding(e.target.value)} className="mb-2" />
          <div className="flex items-center gap-2 mb-2">
            <Label className="mr-2">Any other shareholder(s)?</Label>
            <Switch checked={hasShareholders} onCheckedChange={setHasShareholders} />
          </div>
          {hasShareholders && (
            <div className="space-y-2">
              <Label className="block mb-4">Other Shareholder(s)</Label>
              {/* Header Row for Shareholders */}
              <div className="grid grid-cols-4 md:grid-cols-5 gap-4 items-center mb-2 px-1">
                <div className="text-xs font-semibold text-muted-foreground">Name</div>
                <div className="text-xs font-semibold text-muted-foreground">Amount</div>
                <div className="text-xs font-semibold text-muted-foreground">% Ownership</div>
                <div className="text-xs font-semibold text-muted-foreground">Notes</div>
                <div className="text-xs" />
              </div>
              {shareholders.map((sh, idx) => (
                <div key={idx} className="grid grid-cols-4 md:grid-cols-5 gap-4 items-center mb-2 px-1">
                  <Input placeholder="Name" value={sh.name} onChange={e => handleShareholderChange(idx, 'name', e.target.value)} className="flex-1" />
                  <Input placeholder="$10000" value={sh.amount} onChange={e => handleShareholderChange(idx, 'amount', e.target.value)} className="w-32" />
                  <Input placeholder="50" value={sh.percent} onChange={e => handleShareholderChange(idx, 'percent', e.target.value)} className="w-24" />
                  <Input placeholder="Notes (optional)" value={sh.notes} onChange={e => handleShareholderChange(idx, 'notes', e.target.value)} className="flex-1" />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeShareholder(idx)} className="justify-self-end"><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))}
              <Button type="button" variant="teal" onClick={addShareholder} className="mt-2"><Plus className="w-4 h-4 mr-1" /> Add Another Shareholder</Button>
            </div>
          )}
          <div className="flex items-center gap-2 mb-2">
            <Label className="mr-2">Did you take a loan?</Label>
            <Switch checked={hasLoan} onCheckedChange={setHasLoan} />
          </div>
          {hasLoan && (
            <div className="space-y-2">
              {/* Header Row for Loans */}
              <div className="flex gap-x-4 items-center mb-2 px-1">
                <div className="text-xs font-semibold text-muted-foreground w-32">Amount</div>
                <div className="text-xs font-semibold text-muted-foreground w-24">Interest Rate %</div>
                <div className="text-xs font-semibold text-muted-foreground w-24">Repayment (months)</div>
                <div className="text-xs font-semibold text-muted-foreground">Start Date</div>
                <div className="text-xs w-10" />
              </div>
              {loans.map((loan, idx) => (
                <div key={idx} className="flex gap-x-4 items-center mb-2 px-1">
                  <Input placeholder="$10000" value={loan.amount} onChange={e => handleLoanChange(idx, 'amount', e.target.value)} className="w-32" />
                  <Input placeholder="5%" value={loan.interestRate} onChange={e => handleLoanChange(idx, 'interestRate', e.target.value)} className="w-24" />
                  <Input placeholder="12" value={loan.repaymentPeriod} onChange={e => handleLoanChange(idx, 'repaymentPeriod', e.target.value)} className="w-24" />
                  <Input type="date" value={loan.startDate || ''} onChange={e => handleLoanChange(idx, 'startDate', e.target.value)} className="w-40" title="Loan Start Date (optional)" />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeLoan(idx)} className="ml-auto"><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addLoan} className="mt-2"><Plus className="w-4 h-4 mr-1" /> Add Another Loan</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Global Interest Rate Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Global Interest Rate Settings
            <Switch checked={hasGlobalInterestRates} onCheckedChange={setHasGlobalInterestRates} />
          </CardTitle>
          <div className="mt-1 mb-2">
            <div className="font-semibold text-base">Set default interest rates for calculations</div>
            <div className="text-sm text-muted-foreground">These rates will be used for general calculations and can override individual loan rates.</div>
          </div>
        </CardHeader>
        {hasGlobalInterestRates && (
          <CardContent className="space-y-4 mb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="block text-sm font-semibold mb-2">Short-term Interest Rate (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={50}
                  step={0.1}
                  value={shortTermInterestRate}
                  onChange={e => setShortTermInterestRate(e.target.value)}
                  placeholder="5.0"
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground mt-1">For loans &lt; 1 year, working capital</div>
              </div>
              <div>
                <Label className="block text-sm font-semibold mb-2">Long-term Interest Rate (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={50}
                  step={0.1}
                  value={longTermInterestRate}
                  onChange={e => setLongTermInterestRate(e.target.value)}
                  placeholder="6.0"
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground mt-1">For loans &gt; 1 year, term debt</div>
              </div>
            </div>
            <div>
              <Label className="block text-sm font-semibold mb-2">Investment Interest Rate (%)</Label>
              <Input
                type="number"
                min={0}
                max={50}
                step={0.1}
                value={investmentInterestRate}
                onChange={e => setInvestmentInterestRate(e.target.value)}
                placeholder="4.0"
                className="w-full"
              />
              <div className="text-xs text-muted-foreground mt-1">For cash investments, savings accounts</div>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="useGlobalRatesForLoans"
                checked={useGlobalRatesForLoans}
                onChange={e => setUseGlobalRatesForLoans(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="useGlobalRatesForLoans" className="text-sm">
                Use global rates for individual loans (overrides loan-specific rates)
              </Label>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Credit Sales Section (always present) */}
      <Card>
        <CardHeader>
          <CardTitle>Credit Sales</CardTitle>
          <div className="mt-1 mb-2">
            <div className="font-semibold text-base">Do you sell on credit?</div>
            <div className="text-sm text-muted-foreground">Specify what % of sales are on credit and the average collection period.</div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 mb-10">
          <div className="font-semibold text-lg mb-4">Credit Sales</div>
          <Label>Percent of Sales on Credit (%)</Label>
          <Input type="number" value={creditSalesPercent} onChange={e => setCreditSalesPercent(e.target.value)} placeholder="e.g. 20" />
          <Label>Average Collection Period (days)</Label>
          <Input type="number" value={creditCollectionDays} onChange={e => setCreditCollectionDays(e.target.value)} placeholder="e.g. 30" />
        </CardContent>
      </Card>
      {/* Accounts Payable Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Accounts Payable
            <Switch checked={hasAP} onCheckedChange={setHasAP} />
          </CardTitle>
          <div className="mt-1 mb-2">
            <div className="font-semibold text-base">Do you pay your suppliers on credit?</div>
            <div className="text-sm text-muted-foreground">Specify the average number of days you take to pay your suppliers/vendors.</div>
          </div>
        </CardHeader>
        {hasAP && (
          <CardContent className="space-y-2 mb-10">
            <div className="font-semibold text-lg mb-4">Accounts Payable</div>
            <Label>Average Payment Period (days)</Label>
            <Input type="number" value={apDays} onChange={e => setApDays(e.target.value)} placeholder="e.g. 30" />
          </CardContent>
        )}
      </Card>
      {/* Forecasting Section */}
      <Card>
        <CardHeader>
          <CardTitle>Forecasting</CardTitle>
          <div className="text-sm text-muted-foreground">How far into the future do you want to forecast?</div>
        </CardHeader>
        <CardContent className="space-y-2 mb-10">
          <div className="font-semibold text-lg mb-4">Forecasting</div>
          <Label>Forecast Period</Label>
          <div className="flex gap-x-4 items-center">
            <Input type="number" value={forecastPeriod} onChange={e => setForecastPeriod(e.target.value)} className="w-24" />
            <select value={forecastType} onChange={e => setForecastType(e.target.value as 'months' | 'years')} className="border rounded px-2 py-1">
              <option value="months">Months</option>
              <option value="years">Years</option>
            </select>
          </div>
        </CardContent>
      </Card>
      {/* DCF Parameters Section */}
      <Card>
        <CardHeader>
          <CardTitle>DCF Valuation Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 mb-10">
          <div className="mb-2">
            <Label className="block text-xs font-semibold mb-1 text-muted-foreground">How do you want to set your discount rate?</Label>
            <div className="flex gap-4 items-center">
              <button type="button" className={`px-3 py-1 rounded ${!useWaccBuildUp ? 'bg-teal-600 text-white' : 'bg-gray-200'}`} onClick={() => setUseWaccBuildUp(false)}>Enter WACC Directly</button>
              <button type="button" className={`px-3 py-1 rounded ${useWaccBuildUp ? 'bg-teal-600 text-white' : 'bg-gray-200'}`} onClick={() => setUseWaccBuildUp(true)}>Build WACC from Components</button>
            </div>
          </div>
          {!useWaccBuildUp && (
            <div>
              <Label className="block text-xs font-semibold mb-1 text-muted-foreground">Discount Rate (WACC) %</Label>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={discountRate}
                onChange={e => setDiscountRate(e.target.value)}
                className="w-32"
              />
            </div>
          )}
          {useWaccBuildUp && (
            <div className="space-y-4 border rounded p-4 bg-gray-50">
              <div className="font-semibold text-sm mb-2">Cost of Equity (CAPM)</div>
              <div className="flex flex-wrap gap-4 items-end mb-2">
                <div><Label className="text-xs">Risk-Free Rate (%)</Label><Input type="number" value={rfRate} onChange={e => setRfRate(e.target.value)} className="w-24" /></div>
                <div><Label className="text-xs">Beta</Label><Input type="number" value={beta} onChange={e => setBeta(e.target.value)} className="w-24" /></div>
                <div><Label className="text-xs">Market Risk Premium (%)</Label><Input type="number" value={marketPremium} onChange={e => setMarketPremium(e.target.value)} className="w-24" /></div>
                <div className="font-semibold text-xs">= Cost of Equity: <span className="text-teal-700">{calcCostOfEquity().toFixed(2)}%</span></div>
              </div>
              <div className="font-semibold text-sm mb-2 mt-4">Cost of Debt</div>
              <div className="flex flex-wrap gap-4 items-end mb-2">
                <div><Label className="text-xs">Pre-Tax Cost of Debt (%)</Label><Input type="number" value={costOfDebt} onChange={e => setCostOfDebt(e.target.value)} className="w-24" /></div>
                <div><Label className="text-xs">Tax Rate (%)</Label><Input type="number" value={taxRateWacc} onChange={e => setTaxRateWacc(e.target.value)} className="w-24" /></div>
                <div className="font-semibold text-xs">= After-Tax Cost of Debt: <span className="text-teal-700">{calcAfterTaxCostOfDebt().toFixed(2)}%</span></div>
              </div>
              <div className="font-semibold text-sm mb-2 mt-4">Capital Structure</div>
              <div className="flex flex-wrap gap-4 items-end mb-2">
                <div><Label className="text-xs">Equity (%)</Label><Input type="number" value={equityPct} onChange={e => setEquityPct(e.target.value)} className="w-24" /></div>
                <div><Label className="text-xs">Debt (%)</Label><Input type="number" value={debtPct} onChange={e => setDebtPct(e.target.value)} className="w-24" /></div>
              </div>
              <div className="font-semibold text-xs mt-2">WACC: <span className="text-teal-700">{calcWacc().toFixed(2)}%</span></div>
              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" id="useCostOfEquityOnly" checked={useCostOfEquityOnly} onChange={e => setUseCostOfEquityOnly(e.target.checked)} />
                <Label htmlFor="useCostOfEquityOnly" className="text-xs">Use Cost of Equity as Discount Rate (Levered DCF)</Label>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Terminal Value Parameters Section */}
      <Card>
        <CardHeader>
          <CardTitle>Terminal Value Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 mb-10">
          <div className="mt-2">
            <Label className="block text-xs font-semibold mb-1 text-muted-foreground">Terminal Value Method</Label>
            <select value={tvMethod} onChange={e => setTvMethod(e.target.value)} className="border rounded px-2 py-1 w-64">
              <option value="perpetuity">Perpetuity Growth (Gordon Growth)</option>
              <option value="exit-multiple">Exit Multiple</option>
              <option value="liquidation">Liquidation Value</option>
              <option value="none">No Terminal Value</option>
            </select>
          </div>
          {tvMethod === 'perpetuity' && (
            <div className="flex gap-4 items-end mt-2">
            <div>
              <Label className="block text-xs font-semibold mb-1 text-muted-foreground">Terminal Growth Rate %</Label>
              <Input
                type="number"
                min={-10}
                max={20}
                step={0.01}
                value={terminalGrowth}
                onChange={e => setTerminalGrowth(e.target.value)}
                className="w-32"
              />
            </div>
            </div>
          )}
          {tvMethod === 'exit-multiple' && (
            <div className="flex gap-4 items-end mt-2">
              <div>
                <Label className="block text-xs font-semibold mb-1 text-muted-foreground">Metric</Label>
                <select value={tvMetric} onChange={e => setTvMetric(e.target.value)} className="border rounded px-2 py-1 w-32">
                  <option value="EBITDA">EBITDA</option>
                  <option value="EBIT">EBIT</option>
                  <option value="Revenue">Revenue</option>
                  <option value="NetIncome">Net Income</option>
                </select>
              </div>
              <div>
                <Label className="block text-xs font-semibold mb-1 text-muted-foreground">Multiple (e.g. 8x)</Label>
                <Input type="number" min={0} step={0.1} value={tvMultiple} onChange={e => setTvMultiple(e.target.value)} className="w-24" />
              </div>
            </div>
          )}
          {tvMethod === 'liquidation' && (
            <div className="flex gap-4 items-end mt-2">
              <div>
                <Label className="block text-xs font-semibold mb-1 text-muted-foreground">Custom Terminal Value ($)</Label>
                <Input type="number" min={0} step={1} value={tvCustomValue} onChange={e => setTvCustomValue(e.target.value)} className="w-32" />
              </div>
            </div>
          )}
          <div className="mt-2">
            <Label className="block text-xs font-semibold mb-1 text-muted-foreground">Terminal Year</Label>
            <Input type="number" min={1} max={forecastPeriod} value={tvYear} onChange={e => setTvYear(e.target.value)} className="w-24" />
          </div>
        </CardContent>
      </Card>
      {/* Owner Salary/Drawings Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Owner Salary / Drawings
            <Switch checked={hasOwnerSalary} onCheckedChange={setHasOwnerSalary} />
          </CardTitle>
          <div className="mt-1 mb-2">
            <div className="font-semibold text-base">Do you take money out of the business?</div>
            <div className="text-sm text-muted-foreground">Specify if/how much you take as salary or drawings.</div>
          </div>
        </CardHeader>
        {hasOwnerSalary && (
          <CardContent className="space-y-2 mb-10">
            <div className="font-semibold text-lg mb-4">Owner Salary / Drawings</div>
            <Label>Amount</Label>
            <Input type="number" value={ownerSalary} onChange={e => setOwnerSalary(e.target.value)} placeholder="e.g. 2000" />
            <Label>Frequency</Label>
            <select value={ownerSalaryFrequency} onChange={e => setOwnerSalaryFrequency(e.target.value)} className="border rounded px-2 py-1">
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </CardContent>
        )}
      </Card>

      {/* Tax Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Tax
            <Switch checked={hasTax} onCheckedChange={setHasTax} />
          </CardTitle>
          <div className="mt-1 mb-2">
            <div className="font-semibold text-base">Do you want to apply a tax rate?</div>
            <div className="text-sm text-muted-foreground">Default is 25% if enabled.</div>
          </div>
        </CardHeader>
        {hasTax && (
          <CardContent className="space-y-2 mb-10">
            <div className="font-semibold text-lg mb-4">Tax</div>
            <Label>Tax Rate (%)</Label>
            <Input type="number" value={taxRate} onChange={e => setTaxRate(e.target.value)} placeholder="Optional, default 25%" />
          </CardContent>
        )}
      </Card>

      {/* Other Income/Costs Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Other Income / Costs
            <Switch checked={hasOther} onCheckedChange={setHasOther} />
          </CardTitle>
          <div className="mt-1 mb-2">
            <div className="font-semibold text-base">Any other income or costs?</div>
            <div className="text-sm text-muted-foreground">Add any additional income or costs not covered above.</div>
          </div>
        </CardHeader>
        {hasOther && (
          <CardContent className="space-y-2 mb-10">
            <div className="font-semibold text-lg mb-4">Other Income / Costs</div>
            <Label className="block mb-4">Other Income or Costs</Label>
            {/* Header Row for Other Income/Costs */}
            <div className="flex gap-x-4 items-center mb-2 px-1">
              <div className="text-xs font-semibold text-muted-foreground w-40">Name/Description</div>
              <div className="text-xs font-semibold text-muted-foreground w-24">Amount</div>
              <div className="text-xs font-semibold text-muted-foreground w-24">Income?</div>
              <div className="text-xs w-10" />
            </div>
            {other.map((item, idx) => (
              <div key={idx} className="flex gap-x-4 items-center mb-2 px-1">
                <Input placeholder="Type (e.g. Grant)" value={item.name} onChange={e => handleOtherChange(idx, 'name', e.target.value)} className="w-40" />
                <Input placeholder="$100" value={item.amount} onChange={e => handleOtherChange(idx, 'amount', e.target.value)} className="w-24" />
                <select value={item.isIncome ? 'income' : 'cost'} onChange={e => handleOtherChange(idx, 'isIncome', e.target.value === 'income')} className="w-24 border rounded px-2 py-1">
                  <option value="income">Income</option>
                  <option value="cost">Cost</option>
                </select>
                <Button type="button" variant="ghost" size="icon" onClick={() => removeOther(idx)} className="ml-auto"><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addOther} className="mt-2"><Plus className="w-4 h-4 mr-1" /> Add Another</Button>
          </CardContent>
        )}
      </Card>

      {/* Business Investments Section */}
      <Card>
        <CardHeader>
          <CardTitle>Business Investments</CardTitle>
          <div className="mt-1 mb-2">
            <div className="font-semibold text-base">Do you have any business investments?</div>
            <div className="text-sm text-muted-foreground">Add details for each investment your business has made.</div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 mb-10">
          <div className="font-semibold text-lg mb-4">Investments</div>
          <Label className="block mb-4">Add your business investments</Label>
          {/* Header Row for Investments */}
          <div className="grid grid-cols-9 gap-4 items-center mb-2 px-1 text-xs font-semibold text-muted-foreground">
            <div>Investment Name</div>
            <div>Amount</div>
            <div>Date</div>
            <div>Expected Return (%)</div>
            <div>Maturity Type</div>
            <div>Maturity</div>
            <div>Income?</div>
            <div className="w-8" />
          </div>
          {investments.map((inv, idx) => (
            <div key={idx} className="grid grid-cols-9 gap-4 items-center mb-4 px-1 py-2 bg-white rounded shadow-sm">
              <Input placeholder="e.g. Mutual Fund in ABC" value={inv.name} onChange={e => handleInvestmentChange(idx, 'name', e.target.value)} className="w-full" />
              <Input placeholder="$5000" value={inv.amount} onChange={e => handleInvestmentChange(idx, 'amount', e.target.value)} className="w-full" />
              <Input type="date" value={inv.date} onChange={e => handleInvestmentChange(idx, 'date', e.target.value)} className="w-full" />
              <Input placeholder="8" value={inv.expectedReturn || ''} onChange={e => handleInvestmentChange(idx, 'expectedReturn', e.target.value)} className="w-full" />
              <select value={inv.maturityType || 'year'} onChange={e => handleInvestmentChange(idx, 'maturityType', e.target.value as 'year' | 'duration')} className="border rounded px-2 py-1 w-full">
                <option value="year">Year</option>
                <option value="duration">Duration (years)</option>
              </select>
              <Input placeholder={inv.maturityType === 'duration' ? '5' : '2028'} value={inv.maturityValue || ''} onChange={e => handleInvestmentChange(idx, 'maturityValue', e.target.value)} className="w-full" />
              <select value={inv.income ? 'yes' : 'no'} onChange={e => handleInvestmentChange(idx, 'income', e.target.value === 'yes')} className="border rounded px-2 py-1 w-full">
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
              {inv.income ? (
                <Input placeholder="Annual Income ($)" value={inv.incomeAmount || ''} onChange={e => handleInvestmentChange(idx, 'incomeAmount', e.target.value)} className="w-full ml-2" />
              ) : (
                <div />
              )}
              <Button type="button" variant="ghost" size="icon" onClick={() => removeInvestment(idx)} className="ml-auto"><Trash2 className="w-4 h-4" /></Button>
            </div>
          ))}
          <Button type="button" variant="teal" onClick={addInvestment} className="mt-2"><Plus className="w-4 h-4 mr-1" /> Add Another Investment</Button>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-center pt-4">
        <Button type="submit" size="lg" variant="teal" className="px-8 py-3 text-lg font-semibold shadow-md">Calculate Financials</Button>
      </div>
    </form>
  );
}; 