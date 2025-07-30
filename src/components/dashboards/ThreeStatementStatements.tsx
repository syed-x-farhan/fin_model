import React, { useState, useEffect } from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useCalculationResult } from '@/contexts/CalculationResultContext';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Header } from '@/components/Header';

const isTotalRow = (label: string) =>
  /total|net income|net cash|ending cash|gross profit|ebit|ebt|assets|liabilities|equity/i.test(label);

// Helper function to format years cleanly
const formatYear = (year: string | number, idx: number): string => {
  let yearStr = String(year);
  
  // Extract year from formats like "FY2025-January" or "2025"
  const yearMatch = yearStr.match(/\d{4}/);
  if (yearMatch) {
    const yearNum = yearMatch[0];
    return idx === 0 ? `${yearNum}A` : `${yearNum}F`;
  }
  
  // Fallback for other formats
  return idx === 0 ? `${yearStr}A` : `${yearStr}F`;
};

const ThreeStatementStatements: React.FC = () => {
  const { calculationResult, setCalculationResult } = useCalculationResult();
  console.log('ThreeStatementStatements calculationResult:', calculationResult);
  const navigate = useNavigate();
  const { modelId } = useParams<{ modelId: string }>();
  const [tab, setTab] = useState('income');
  // Sidebar state (default to 3-statement)
  const [selectedModel, setSelectedModel] = useState<string>('3-statement');
  const handleModelSelect = (modelId: string) => setSelectedModel(modelId);

  useEffect(() => {
    if (calculationResult) {
      localStorage.setItem('model_3-statement_variables', JSON.stringify(calculationResult));
      setCalculationResult(calculationResult); // Ensure context is always up to date
    }
  }, [calculationResult, setCalculationResult]);

  if (!calculationResult || !calculationResult.income_statement || !calculationResult.balance_sheet || !calculationResult.cash_flow) {
    return (
      <div className="text-center py-16">
        <h3 className="text-lg font-semibold mb-2">No Calculation Results</h3>
        <p className="text-muted-foreground">Please run a calculation to see the statements.</p>
      </div>
    );
  }

  const showAmort = !!calculationResult.amortization_table;
  const tabsGridClass = showAmort ? 'grid-cols-4' : 'grid-cols-3';

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <SidebarProvider>
        <div className="flex-1 flex w-full pt-16 bg-gradient-to-br from-slate-50 to-slate-100">
          {/* Sidebar */}
          <div className="hidden md:block w-64 border-r bg-white/90">
            <AppSidebar selectedModel={selectedModel} onModelSelect={handleModelSelect} />
          </div>
          {/* Main Content */}
          <div className="flex-1 flex flex-col items-center px-2">
          <div className="w-full max-w-5xl mx-auto mt-10 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">Financial Statements</h1>
              <p className="text-slate-500 text-base">Multi-year professional statements for your model</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="h-10 px-6 text-base font-semibold shadow-sm"
                onClick={() => navigate(`/model/${modelId || '3-statement'}`)}
              >Back to Configuration</Button>
              <Button
                variant="outline"
                className="h-10 px-6 text-base font-semibold shadow-sm"
                onClick={() => navigate(`/model/${modelId || '3-statement'}/dashboard`)}
              >Go to Dashboard</Button>
              <Button
                style={{ backgroundColor: '#14b8a6', color: '#fff', border: 'none' }}
                className="h-10 px-6 text-base font-bold shadow-sm hover:opacity-90"
                onClick={() => {
                  // Import export logic
                  import('@/components/excel/exportStatementsToExcel').then(({ exportStatementsToExcel }) => {
                    exportStatementsToExcel({
                      modelName: '3-Statement Model',
                      incomeStatement: calculationResult.income_statement,
                      balanceSheet: calculationResult.balance_sheet,
                      cashFlow: calculationResult.cash_flow,
                    });
                  });
                }}
              >Export to Excel</Button>
            </div>
          </div>
          <Card className="w-full max-w-5xl shadow-xl border-slate-200">
            <CardHeader className="pb-2">
              <Tabs value={tab} onValueChange={setTab} className="w-full">
                <TabsList className={`grid ${tabsGridClass} w-full mb-2`}>
                  <TabsTrigger value="income">Income Statement</TabsTrigger>
                  <TabsTrigger value="balance">Balance Sheet</TabsTrigger>
                  <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
                  {showAmort && <TabsTrigger value="amortization">Amortization</TabsTrigger>}
                </TabsList>
                <TabsContent value="income">
                  <StatementTable statement={calculationResult.income_statement} years={calculationResult.income_statement.years} />
                </TabsContent>
                <TabsContent value="balance">
                  <StatementTable statement={calculationResult.balance_sheet} years={calculationResult.balance_sheet.years} />
                </TabsContent>
                <TabsContent value="cashflow">
                  {Array.isArray(calculationResult.cash_flow) ? (
                    <div className="overflow-x-auto">
                      <Table className="min-w-[600px]">
                        <TableHeader className="sticky top-0 bg-white/90 z-10">
                          <TableRow>
                            <TableHead className="w-56 text-slate-700 text-base font-semibold">Line Item</TableHead>
                            {calculationResult.cash_flow.map((period: any, idx: number) => (
                              <TableHead key={period.year} className="text-slate-700 text-base font-semibold text-right">
                                {formatYear(period.year, idx)}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {/* Opening Cash Balance at the top */}
                          <TableRow className="text-slate-700">
                            <TableCell className="py-2">Opening Cash Balance</TableCell>
                            {calculationResult.cash_flow.map((period: any) => {
                              const val = period.opening_cash_balance ?? period.ending_cash;
                              return (
                                <TableCell key={period.year + "-open"} className={val < 0 ? 'text-red-600 text-right tabular-nums' : 'text-right tabular-nums'}>
                                  {typeof val === 'number'
                                    ? (val < 0
                                      ? `($${Math.abs(val).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})})`
                                      : `$${val.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`)
                                    : '-'}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                          {/* Operating Activities Section Header */}
                          <TableRow>
                            <TableCell colSpan={calculationResult.cash_flow.length + 1} className="font-bold text-slate-900 bg-slate-100 text-base py-2">Operating Activities</TableCell>
                          </TableRow>
                          {/* Operating Activities */}
                          {calculationResult.cash_flow[0].operating_activities.map((item: any, idx: number) => (
                            <TableRow key={"op-" + idx} className={idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                              <TableCell className="text-slate-700 py-2 pl-6">{item[0]}</TableCell>
                              {calculationResult.cash_flow.map((period: any) => {
                                const value = period.operating_activities[idx]?.[1];
                                const isWorkingCapital = [
                                  '± Change in Accounts Receivable',
                                  '± Change in Accounts Payable',
                                  '± Change in Inventory',
                                  'Change in Accounts Receivable',
                                  'Change in Accounts Payable',
                                  'Change in Inventory',
                                ].includes(item[0]);
                                let cellClass = 'text-right tabular-nums';
                                let display;
                                if (typeof value === 'number') {
                                  if (isWorkingCapital) {
                                    if (value < 0) {
                                      cellClass += ' text-green-600'; // inflow
                                      display = `($${Math.abs(value).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})})`;
                                    } else if (value > 0) {
                                      cellClass += ' text-red-600'; // outflow
                                      display = `$${value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
                                    } else {
                                      display = '$0.00';
                                    }
                                  } else {
                                    if (value < 0) {
                                      cellClass += ' text-red-600';
                                      display = `($${Math.abs(value).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})})`;
                                    } else {
                                      display = `$${value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
                                    }
                                  }
                                } else {
                                  display = '';
                                }
                                return <TableCell key={period.year + "-op-" + idx} className={cellClass}>{display}</TableCell>;
                              })}
                            </TableRow>
                          ))}
                          {/* Net Cash from Operating Activities */}
                          <TableRow className="font-bold text-slate-900">
                            <TableCell className="py-2">Net Cash from Operating Activities</TableCell>
                            {calculationResult.cash_flow.map((period: any) => (
                              <TableCell key={period.year + "-netop"} className={period.net_cash_from_operating_activities < 0 ? 'text-red-600 text-right font-bold tabular-nums' : 'text-right font-bold tabular-nums'}>
                                {typeof period.net_cash_from_operating_activities === 'number'
                                  ? (period.net_cash_from_operating_activities < 0
                                    ? `($${Math.abs(period.net_cash_from_operating_activities).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})})`
                                    : `$${period.net_cash_from_operating_activities.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`)
                                  : ''}
                              </TableCell>
                            ))}
                          </TableRow>
                          {/* Investing Activities Section Header */}
                          <TableRow>
                            <TableCell colSpan={calculationResult.cash_flow.length + 1} className="font-bold text-slate-900 bg-slate-100 text-base py-2">Investing Activities</TableCell>
                          </TableRow>
                          {/* Investing Activities */}
                          {calculationResult.cash_flow[0].investing_activities.map((item: any, idx: number) => (
                            <TableRow key={"inv-" + idx} className={idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                              <TableCell className="text-slate-700 py-2 pl-6">{item[0]}</TableCell>
                              {calculationResult.cash_flow.map((period: any) => (
                                <TableCell key={period.year + "-inv-" + idx} className={period.investing_activities[idx]?.[1] < 0 ? 'text-red-600 text-right tabular-nums' : 'text-right tabular-nums'}>
                                  {typeof period.investing_activities[idx]?.[1] === 'number'
                                    ? (period.investing_activities[idx][1] < 0
                                      ? `($${Math.abs(period.investing_activities[idx][1]).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})})`
                                      : `$${period.investing_activities[idx][1].toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`)
                                    : ''}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                          {/* Net Cash from Investing Activities */}
                          <TableRow className="font-bold text-slate-900">
                            <TableCell className="py-2">Net Cash from Investing Activities</TableCell>
                            {calculationResult.cash_flow.map((period: any) => (
                              <TableCell key={period.year + "-netinv"} className={period.net_cash_from_investing_activities < 0 ? 'text-red-600 text-right font-bold tabular-nums' : 'text-right font-bold tabular-nums'}>
                                {typeof period.net_cash_from_investing_activities === 'number'
                                  ? (period.net_cash_from_investing_activities < 0
                                    ? `($${Math.abs(period.net_cash_from_investing_activities).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})})`
                                    : `$${period.net_cash_from_investing_activities.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`)
                                  : ''}
                              </TableCell>
                            ))}
                          </TableRow>
                          {/* Financing Activities Section Header */}
                          <TableRow>
                            <TableCell colSpan={calculationResult.cash_flow.length + 1} className="font-bold text-slate-900 bg-slate-100 text-base py-2">Financing Activities</TableCell>
                          </TableRow>
                          {/* Financing Activities */}
                          {calculationResult.cash_flow[0].financing_activities.map((item: any, idx: number) => (
                            <TableRow key={"fin-" + idx} className={idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                              <TableCell className="text-slate-700 py-2 pl-6">{item[0]}</TableCell>
                              {calculationResult.cash_flow.map((period: any) => (
                                <TableCell key={period.year + "-fin-" + idx} className={period.financing_activities[idx]?.[1] < 0 ? 'text-red-600 text-right tabular-nums' : 'text-right tabular-nums'}>
                                  {typeof period.financing_activities[idx]?.[1] === 'number'
                                    ? (period.financing_activities[idx][1] < 0
                                      ? `($${Math.abs(period.financing_activities[idx][1]).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})})`
                                      : `$${period.financing_activities[idx][1].toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`)
                                    : ''}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                          {/* Net Cash from Financing Activities */}
                          <TableRow className="font-bold text-slate-900">
                            <TableCell className="py-2">Net Cash from Financing Activities</TableCell>
                            {calculationResult.cash_flow.map((period: any) => (
                              <TableCell key={period.year + "-netfin"} className={period.net_cash_from_financing_activities < 0 ? 'text-red-600 text-right font-bold tabular-nums' : 'text-right font-bold tabular-nums'}>
                                {typeof period.net_cash_from_financing_activities === 'number'
                                  ? (period.net_cash_from_financing_activities < 0
                                    ? `($${Math.abs(period.net_cash_from_financing_activities).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})})`
                                    : `$${period.net_cash_from_financing_activities.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`)
                                  : ''}
                              </TableCell>
                            ))}
                          </TableRow>
                          {/* Net Change in Cash */}
                          <TableRow className="text-slate-700 bg-slate-50">
                            <TableCell className="py-2 font-semibold">Net Change in Cash</TableCell>
                            {calculationResult.cash_flow.map((period: any) => (
                              <TableCell key={period.year + "-netchg"} className={period.net_change_in_cash < 0 ? 'text-red-600 text-right font-semibold tabular-nums' : 'text-right font-semibold tabular-nums'}>
                                {typeof period.net_change_in_cash === 'number'
                                  ? (period.net_change_in_cash < 0
                                    ? `($${Math.abs(period.net_change_in_cash).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})})`
                                    : `$${period.net_change_in_cash.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`)
                                  : ''}
                              </TableCell>
                            ))}
                          </TableRow>
                          {/* Closing Cash Balance at the very end */}
                          <TableRow className="font-extrabold text-slate-900 bg-white text-lg">
                            <TableCell className="py-3">Closing Cash Balance</TableCell>
                            {calculationResult.cash_flow.map((period: any) => {
                              const val = period.closing_cash_balance ?? period.ending_cash;
                              return (
                                <TableCell key={period.year + "-close"} className={val < 0 ? 'text-red-600 text-right py-3 tabular-nums' : 'text-right py-3 tabular-nums'}>
                                  {typeof val === 'number'
                                    ? (val < 0
                                      ? `($${Math.abs(val).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})})`
                                      : `$${val.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`)
                                    : '-'}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-red-500 font-semibold p-4">
                      Cash flow data is not in the expected format. Please recalculate or check your backend.
                    </div>
                  )}
                </TabsContent>
                {showAmort && (
                  <TabsContent value="amortization">
                    <AmortizationTable table={calculationResult.amortization_table} />
                  </TabsContent>
                )}
              </Tabs>
            </CardHeader>
          </Card>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
};

const StatementTable: React.FC<{ statement: any; years: string[] | number[] }> = ({ statement, years }) => (
  <div className="overflow-x-auto">
    <Table className="min-w-[600px]">
      <TableHeader className="sticky top-0 bg-white/90 z-10">
        <TableRow>
          <TableHead className="w-56 text-slate-700 text-base font-semibold">Line Item</TableHead>
          {years.map((year: string | number, idx: number) => (
            <TableHead key={year} className="text-slate-700 text-base font-semibold text-right">
              {formatYear(year, idx)}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {statement.line_items.map((item: any, idx: number) => (
          <TableRow
            key={item.label}
            className={
              `${idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'} ` +
              (isTotalRow(item.label) ? ' font-bold text-slate-900' : 'text-slate-700')
            }
          >
            <TableCell className="w-56 text-slate-700">{item.label}</TableCell>
            {item.values.map((val: number, i: number) => (
              <TableCell key={i} className="text-right tabular-nums">${val.toLocaleString()}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

const AmortizationTable: React.FC<{ table: any }> = ({ table }) => (
  <div className="overflow-x-auto">
    <Table className="min-w-[600px]">
      <TableHeader className="sticky top-0 bg-white/90 z-10">
        <TableRow>
          {table.headers.map((header: string) => (
            <TableHead key={header} className="text-slate-700 text-base font-semibold text-right first:text-left">{header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {table.rows.map((row: any, idx: number) => (
          <TableRow key={idx} className={idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
            {row.map((cell: any, cidx: number) => (
              <TableCell key={cidx} className={cidx === 0 ? 'text-left' : 'text-right tabular-nums'}>
                {typeof cell === 'number' ? `$${cell.toLocaleString()}` : cell}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

export default ThreeStatementStatements;