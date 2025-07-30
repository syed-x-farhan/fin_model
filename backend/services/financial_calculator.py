"""
Financial calculation engine for 3-Statement model
"""

from typing import List, Dict, Any
from models.financial_models import (
    Variable, VariableSection, CalculationResult, IncomeStatement,
    BalanceSheet, BalanceSheetAssets, BalanceSheetLiabilities, 
    BalanceSheetEquity, CashFlow, KPIs, Projections
)
import numpy as np


class FinancialCalculator:
    """Financial calculation engine for 3-Statement model"""
    
    def __init__(self):
        self.default_tax_rate = 0.25  # 25%
        self.default_interest_rate = 0.06  # 6%
        self.default_short_term_rate = 0.05  # 5%
        self.default_long_term_rate = 0.06  # 6%
        self.default_investment_rate = 0.04  # 4%
        self.forecast_years = 5
    
    def get_variable_value(self, variables: List[Variable], variable_id: str, default: float = 0.0) -> float:
        """Get variable value by ID"""
        for var in variables:
            if var.id == variable_id:
                return var.value
        return default
    
    def get_variable_by_name(self, variables: List[Variable], name: str) -> Variable | None:
        """Get variable by name"""
        for var in variables:
            if var.name.lower() == name.lower():
                return var
        return None
    
    def get_interest_rates(self, data: Dict[str, Any]) -> Dict[str, float]:
        """Get interest rates from input data or use defaults"""
        global_rates = data.get('globalInterestRates', {})
        
        return {
            'short_term': global_rates.get('shortTerm', self.default_short_term_rate) / 100,
            'long_term': global_rates.get('longTerm', self.default_long_term_rate) / 100,
            'investment': global_rates.get('investment', self.default_investment_rate) / 100,
            'use_for_loans': global_rates.get('useForLoans', False),
        }
    
    def calculate_income_statement(self, variables: List[Variable]) -> IncomeStatement:
        """Calculate income statement using only user-provided variables"""
        revenue = self.get_variable_value(variables, 'revenue', 0)
        cogs = self.get_variable_value(variables, 'cogs', 0)
        operating_expenses = self.get_variable_value(variables, 'operating-expenses', 0)
        other_income = self.get_variable_value(variables, 'other-income', 0)
        other_costs = self.get_variable_value(variables, 'other-costs', 0)
        interest_expense = self.get_variable_value(variables, 'interest-expense', 0)
        tax_rate_var = self.get_variable_by_name(variables, 'tax rate')
        tax_rate = tax_rate_var.value / 100 if tax_rate_var else self.default_tax_rate

        gross_profit = revenue - cogs
        ebit = gross_profit - operating_expenses + other_income - other_costs
        ebt = ebit - interest_expense
        taxes = ebt * tax_rate if ebt > 0 else 0
        net_income = ebt - taxes

        return IncomeStatement(
            revenue=revenue,
            cogs=cogs,
            gross_profit=gross_profit,
            operating_expenses=operating_expenses,
            ebit=ebit,
            interest_expense=interest_expense,
            ebt=ebt,
            taxes=taxes,
            net_income=net_income
        )
    
    def calculate_balance_sheet(self, variables: List[Variable], income_statement: IncomeStatement, prior_retained_earnings: float = 0.0) -> BalanceSheet:
        """Calculate balance sheet using only user-provided variables and interconnected logic"""
        # Assets
        cash = self.get_variable_value(variables, 'cash', 0)
        ppe = self.get_variable_value(variables, 'ppe-fixed-assets', 0)
        # Liabilities
        long_term_debt = self.get_variable_value(variables, 'long-term-debt', 0)
        # Equity
        share_capital = cash  # Assume self-funding is initial equity
        retained_earnings = prior_retained_earnings + income_statement.net_income

        # Minimal balance sheet
        assets = BalanceSheetAssets(
            cash=cash,
            accounts_receivable=0,
            inventory=0,
            other_current_assets=0,
            total_current_assets=cash,
            ppe=ppe,
            total_assets=cash + ppe
        )
        liabilities = BalanceSheetLiabilities(
            accounts_payable=0,
            accrued_expenses=0,
            short_term_debt=0,
            total_current_liabilities=0,
            long_term_debt=long_term_debt,
            total_liabilities=long_term_debt
        )
        equity = BalanceSheetEquity(
            share_capital=share_capital,
            retained_earnings=retained_earnings,
            total_equity=share_capital + retained_earnings
        )
        return BalanceSheet(assets=assets, liabilities=liabilities, equity=equity)
    
    def calculate_cash_flow(self, variables: List[Variable], income_statement: IncomeStatement, balance_sheet: BalanceSheet) -> CashFlow:
        """Calculate cash flow statement using only user-provided variables and interconnected logic"""
        net_income = income_statement.net_income
        capex = self.get_variable_value(variables, 'capex', 0)
        loan_proceeds = self.get_variable_value(variables, 'long-term-debt', 0)
        # Operating cash flow: net income
        operating_cash_flow = net_income
        # Investing cash flow: -capex
        investing_cash_flow = -capex
        # Financing cash flow: loan proceeds
        financing_cash_flow = loan_proceeds
        # Net cash flow
        net_cash_flow = operating_cash_flow + investing_cash_flow + financing_cash_flow
        ending_cash = balance_sheet.assets.cash + net_cash_flow
        return CashFlow(
            operating_cash_flow=operating_cash_flow,
            investing_cash_flow=investing_cash_flow,
            financing_cash_flow=financing_cash_flow,
            net_cash_flow=net_cash_flow,
            ending_cash=ending_cash
        )
    
    def calculate_kpis(self, income_statement: IncomeStatement, balance_sheet: BalanceSheet) -> KPIs:
        """Calculate key performance indicators"""
        # Margins
        gross_margin = (income_statement.gross_profit / income_statement.revenue) * 100 if income_statement.revenue > 0 else 0
        operating_margin = (income_statement.ebit / income_statement.revenue) * 100 if income_statement.revenue > 0 else 0
        net_margin = (income_statement.net_income / income_statement.revenue) * 100 if income_statement.revenue > 0 else 0
        
        # Ratios
        current_ratio = balance_sheet.assets.total_current_assets / balance_sheet.liabilities.total_current_liabilities if balance_sheet.liabilities.total_current_liabilities > 0 else 0
        debt_to_equity = balance_sheet.liabilities.total_liabilities / balance_sheet.equity.total_equity if balance_sheet.equity.total_equity > 0 else 0
        roe = (income_statement.net_income / balance_sheet.equity.total_equity) * 100 if balance_sheet.equity.total_equity > 0 else 0
        roa = (income_statement.net_income / balance_sheet.assets.total_assets) * 100 if balance_sheet.assets.total_assets > 0 else 0
        
        return KPIs(
            gross_margin=gross_margin,
            operating_margin=operating_margin,
            net_margin=net_margin,
            current_ratio=current_ratio,
            debt_to_equity=debt_to_equity,
            roe=roe,
            roa=roa
        )
    
    def calculate_projections(self, variables: List[Variable], income_statement: IncomeStatement) -> Projections:
        """Calculate financial projections"""
        # Get growth assumptions
        revenue_growth = self.get_variable_value(variables, 'revenue-growth-rate', 15) / 100
        current_year = 2024
        
        years = list(range(current_year, current_year + self.forecast_years))
        revenue = [income_statement.revenue]
        net_income = [income_statement.net_income]
        ebitda = [income_statement.ebit + self.get_variable_value(variables, 'depreciation-amortization', 500000)]
        
        # Calculate projections
        for i in range(1, self.forecast_years):
            # Revenue growth
            new_revenue = revenue[i-1] * (1 + revenue_growth)
            revenue.append(new_revenue)
            
            # Assume net income grows proportionally
            new_net_income = net_income[i-1] * (1 + revenue_growth)
            net_income.append(new_net_income)
            
            # EBITDA projection
            new_ebitda = ebitda[i-1] * (1 + revenue_growth)
            ebitda.append(new_ebitda)
        
        # Free cash flow projection (simplified)
        depreciation = self.get_variable_value(variables, 'depreciation-amortization', 500000)
        capex = self.get_variable_value(variables, 'capex', 800000)
        free_cash_flow = [ni + depreciation - capex for ni in net_income]
        
        return Projections(
            years=years,
            revenue=revenue,
            net_income=net_income,
            ebitda=ebitda,
            free_cash_flow=free_cash_flow
        )
    
    def calculate_model(self, variable_sections: List[VariableSection]) -> CalculationResult:
        """Calculate complete 3-Statement model using only user-provided variables"""
        all_variables = []
        for section in variable_sections:
            all_variables.extend(section.variables)
        # Calculate interconnected statements
        income_statement = self.calculate_income_statement(all_variables)
        # For first period, prior retained earnings is 0
        balance_sheet = self.calculate_balance_sheet(all_variables, income_statement, prior_retained_earnings=0)
        cash_flow = self.calculate_cash_flow(all_variables, income_statement, balance_sheet)
        # KPIs and projections can be left as is or simplified
        kpis = self.calculate_kpis(income_statement, balance_sheet)
        projections = self.calculate_projections(all_variables, income_statement)
        return CalculationResult(
            income_statement=income_statement,
            balance_sheet=balance_sheet,
            cash_flow=cash_flow,
            kpis=kpis,
            projections=projections
        )


# Create global calculator instance
calculator = FinancialCalculator() 