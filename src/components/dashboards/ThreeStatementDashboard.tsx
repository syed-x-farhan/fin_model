import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { CalculationResult } from '@/services/api';

interface ThreeStatementStatementsProps {
  calculationResult: CalculationResult | null;
}

const ThreeStatementStatements: React.FC<ThreeStatementStatementsProps> = ({ calculationResult }) => {
  if (!calculationResult || !calculationResult.income_statement || !calculationResult.balance_sheet || !calculationResult.cash_flow) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-semibold mb-2">No Calculation Results</h3>
        <p className="text-muted-foreground">Please run a calculation to see the statements.</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
            {/* Income Statement */}
            <Card>
              <CardHeader>
                <CardTitle>Income Statement</CardTitle>
          <CardDescription>Multi-year professional statement</CardDescription>
              </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Line Item</TableHead>
                {calculationResult.income_statement.years.map((year: string) => (
                  <TableHead key={year}>{year}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {calculationResult.income_statement.line_items.map((item: any) => (
                <TableRow key={item.label}>
                  <TableCell>{item.label}</TableCell>
                  {item.values.map((val: number, idx: number) => (
                    <TableCell key={idx}>${val.toLocaleString()}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
              </CardContent>
            </Card>

            {/* Balance Sheet */}
            <Card>
              <CardHeader>
                <CardTitle>Balance Sheet</CardTitle>
          <CardDescription>Multi-year professional statement</CardDescription>
              </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Line Item</TableHead>
                {calculationResult.balance_sheet.years.map((year: string) => (
                  <TableHead key={year}>{year}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {calculationResult.balance_sheet.line_items.map((item: any) => (
                <TableRow key={item.label}>
                  <TableCell>{item.label}</TableCell>
                  {item.values.map((val: number, idx: number) => (
                    <TableCell key={idx}>${val.toLocaleString()}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
              </CardContent>
            </Card>

      {/* Cash Flow Statement */}
          <Card>
            <CardHeader>
                <CardTitle>Cash Flow Statement</CardTitle>
          <CardDescription>Multi-year professional statement</CardDescription>
              </CardHeader>
              <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Line Item</TableHead>
                {calculationResult.cash_flow.map((period: any) => (
                  <TableHead key={period.year}>{period.year}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Operating Activities Section */}
              <TableRow>
                <TableCell colSpan={calculationResult.cash_flow.length + 1} className="bg-slate-200 font-bold text-slate-900 text-base py-4 border-t-2 border-b border-slate-300 mt-6">Cash Flow from Operating Activities</TableCell>
              </TableRow>
              {calculationResult.cash_flow[0].operating_activities.map((item: any, idx: number) => (
                <TableRow key={item[0]} className={idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                  <TableCell className="text-slate-700 py-3">{item[0]}</TableCell>
                  {calculationResult.cash_flow.map((period: any) => {
                    const value = period.operating_activities[idx][1];
                    const isWorkingCapital = [
                      'Change in Accounts Receivable',
                      'Change in Accounts Payable',
                      'Change in Inventory',
                      'Change in Accounts Receivable',
                      'Change in Accounts Payable',
                      'Change in Inventory',
                    ].includes(item[0]);
                    let cellClass = 'text-right tabular-nums py-3';
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
                    return <TableCell key={period.year + '-' + idx} className={cellClass}>{display}</TableCell>;
                  })}
                </TableRow>
              ))}
              <TableRow className="font-extrabold text-slate-900 bg-slate-100 border-b-2 border-slate-300 text-lg">
                <TableCell className="py-3">Net Cash from Operating Activities</TableCell>
                {calculationResult.cash_flow.map((period: any) => (
                  <TableCell key={period.year + '-netop'} className={period.net_cash_from_operating_activities < 0 ? 'text-red-600 text-right py-3' : 'text-right py-3'}>{period.net_cash_from_operating_activities < 0 ? `($${Math.abs(period.net_cash_from_operating_activities).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})})` : `$${period.net_cash_from_operating_activities.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}</TableCell>
                ))}
              </TableRow>
              {/* Investing Activities Section */}
              <TableRow>
                <TableCell colSpan={calculationResult.cash_flow.length + 1} className="bg-slate-200 font-bold text-slate-900 text-base py-4 border-t-2 border-b border-slate-300 mt-6">Cash Flow from Investing Activities</TableCell>
              </TableRow>
              {calculationResult.cash_flow[0].investing_activities.map((item: any, idx: number) => (
                <TableRow key={item[0]} className={idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                  <TableCell className="text-slate-700 py-3">{item[0]}</TableCell>
                  {calculationResult.cash_flow.map((period: any) => (
                    <TableCell key={period.year + '-inv-' + idx} className="text-right tabular-nums py-3">{typeof period.investing_activities[idx][1] === 'number' ? (period.investing_activities[idx][1] < 0 ? <span className="text-red-600">(${'$'+Math.abs(period.investing_activities[idx][1]).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})})</span> : <span>{'$'+period.investing_activities[idx][1].toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>) : ''}</TableCell>
                  ))}
                </TableRow>
              ))}
              <TableRow className="font-extrabold text-slate-900 bg-slate-100 border-b-2 border-slate-300 text-lg">
                <TableCell className="py-3">Net Cash from Investing Activities</TableCell>
                {calculationResult.cash_flow.map((period: any) => (
                  <TableCell key={period.year + '-netinv'} className={period.net_cash_from_investing_activities < 0 ? 'text-red-600 text-right py-3' : 'text-right py-3'}>{period.net_cash_from_investing_activities < 0 ? `($${Math.abs(period.net_cash_from_investing_activities).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})})` : `$${period.net_cash_from_investing_activities.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}</TableCell>
                ))}
              </TableRow>
              {/* Financing Activities Section */}
              <TableRow>
                <TableCell colSpan={calculationResult.cash_flow.length + 1} className="bg-slate-200 font-bold text-slate-900 text-base py-4 border-t-2 border-b border-slate-300 mt-6">Cash Flow from Financing Activities</TableCell>
              </TableRow>
              {calculationResult.cash_flow[0].financing_activities.map((item: any, idx: number) => (
                <TableRow key={item[0]} className={idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                  <TableCell className="text-slate-700 py-3">{item[0]}</TableCell>
                  {calculationResult.cash_flow.map((period: any) => (
                    <TableCell key={period.year + '-fin-' + idx} className="text-right tabular-nums py-3">{typeof period.financing_activities[idx][1] === 'number' ? (period.financing_activities[idx][1] < 0 ? <span className="text-red-600">(${'$'+Math.abs(period.financing_activities[idx][1]).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})})</span> : <span>{'$'+period.financing_activities[idx][1].toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>) : ''}</TableCell>
                  ))}
                </TableRow>
              ))}
              <TableRow className="font-extrabold text-slate-900 bg-slate-100 border-b-2 border-slate-300 text-lg">
                <TableCell className="py-3">Net Cash from Financing Activities</TableCell>
                {calculationResult.cash_flow.map((period: any) => (
                  <TableCell key={period.year + '-netfin'} className={period.net_cash_from_financing_activities < 0 ? 'text-red-600 text-right py-3' : 'text-right py-3'}>{period.net_cash_from_financing_activities < 0 ? `($${Math.abs(period.net_cash_from_financing_activities).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})})` : `$${period.net_cash_from_financing_activities.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}</TableCell>
                ))}
              </TableRow>
              {/* Net Change, Opening, Closing */}
              <TableRow>
                <TableCell colSpan={calculationResult.cash_flow.length + 1} className="py-2"></TableCell>
              </TableRow>
              <TableRow className="bg-white">
                <TableCell className="text-slate-700 py-3">Net Change in Cash</TableCell>
                {calculationResult.cash_flow.map((period: any) => (
                  <TableCell key={period.year + '-netchg'} className={period.net_change_in_cash < 0 ? 'text-red-600 text-right py-3' : 'text-right py-3'}>{period.net_change_in_cash < 0 ? `($${Math.abs(period.net_change_in_cash).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})})` : `$${period.net_change_in_cash.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}</TableCell>
                ))}
              </TableRow>
              <TableRow className="bg-slate-50">
                <TableCell className="text-slate-700 py-3">Opening Cash Balance</TableCell>
                {calculationResult.cash_flow.map((period: any) => (
                  <TableCell key={period.year + '-open'} className={period.opening_cash_balance < 0 ? 'text-red-600 text-right py-3' : 'text-right py-3'}>{period.opening_cash_balance < 0 ? `($${Math.abs(period.opening_cash_balance).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})})` : `$${period.opening_cash_balance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}</TableCell>
                ))}
              </TableRow>
              <TableRow className="font-extrabold text-slate-900 bg-green-50 border-t-2 border-green-300 text-lg">
                <TableCell className="py-3">Closing Cash Balance</TableCell>
                {calculationResult.cash_flow.map((period: any) => (
                  <TableCell key={period.year + '-close'} className={period.closing_cash_balance < 0 ? 'text-red-600 text-right py-3' : 'text-right py-3'}>{period.closing_cash_balance < 0 ? `($${Math.abs(period.closing_cash_balance).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})})` : `$${period.closing_cash_balance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}</TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
              </CardContent>
            </Card>

      {/* Amortization Table (if present) */}
      {calculationResult.amortization_table && (
            <Card>
              <CardHeader>
            <CardTitle>Loan Amortization Table</CardTitle>
            <CardDescription>Yearly breakdown of loan principal and interest</CardDescription>
              </CardHeader>
              <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {calculationResult.amortization_table.headers.map((header: string) => (
                    <TableHead key={header}>{header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {calculationResult.amortization_table.rows.map((row: any, idx: number) => (
                  <TableRow key={idx}>
                    {row.map((cell: any, cidx: number) => (
                      <TableCell key={cidx}>{typeof cell === 'number' ? `$${cell.toLocaleString()}` : cell}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
              </CardContent>
            </Card>
      )}
    </div>
  );
};

export default ThreeStatementStatements;
