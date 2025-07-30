"""
Pydantic models for financial data structures
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Any
from enum import Enum


class InputType(str, Enum):
    """Variable input types"""
    PERCENTAGE = "percentage"
    FIXED = "fixed"
    FORMULA = "formula"


class AppliesTo(str, Enum):
    """Where the variable applies"""
    INCOME_STATEMENT = "income_statement"
    BALANCE_SHEET = "balance_sheet"
    CASH_FLOW = "cash_flow"


class Variable(BaseModel):
    """Financial model variable"""
    id: str
    name: str
    value: float
    unit: Optional[str] = None
    category: str
    description: Optional[str] = None
    input_type: InputType = InputType.FIXED
    applies_to: AppliesTo = AppliesTo.INCOME_STATEMENT
    relative_to: Optional[str] = None


class VariableSection(BaseModel):
    """Group of related variables"""
    id: str
    title: str
    variables: List[Variable]


class CalculationRequest(BaseModel):
    """Request for model calculation"""
    variables: List[VariableSection]


class IncomeStatement(BaseModel):
    """Income statement results"""
    revenue: float
    cogs: float
    gross_profit: float
    operating_expenses: float
    ebit: float
    interest_expense: float
    ebt: float
    taxes: float
    net_income: float


class BalanceSheetAssets(BaseModel):
    """Balance sheet assets"""
    cash: float
    accounts_receivable: float
    inventory: float
    other_current_assets: float
    total_current_assets: float
    ppe: float
    total_assets: float


class BalanceSheetLiabilities(BaseModel):
    """Balance sheet liabilities"""
    accounts_payable: float
    accrued_expenses: float
    short_term_debt: float
    total_current_liabilities: float
    long_term_debt: float
    total_liabilities: float


class BalanceSheetEquity(BaseModel):
    """Balance sheet equity"""
    share_capital: float
    retained_earnings: float
    total_equity: float


class BalanceSheet(BaseModel):
    """Complete balance sheet"""
    assets: BalanceSheetAssets
    liabilities: BalanceSheetLiabilities
    equity: BalanceSheetEquity


class CashFlow(BaseModel):
    """Cash flow statement"""
    operating_cash_flow: float
    investing_cash_flow: float
    financing_cash_flow: float
    net_cash_flow: float
    ending_cash: float


class KPIs(BaseModel):
    """Key Performance Indicators"""
    gross_margin: float
    operating_margin: float
    net_margin: float
    current_ratio: float
    debt_to_equity: float
    roe: float
    roa: float


class Projections(BaseModel):
    """Financial projections"""
    years: List[int]
    revenue: List[float]
    net_income: List[float]
    ebitda: List[float]
    free_cash_flow: List[float]


class CalculationResult(BaseModel):
    """Complete calculation result"""
    income_statement: IncomeStatement
    balance_sheet: BalanceSheet
    cash_flow: CashFlow
    kpis: KPIs
    projections: Projections


class ApiResponse(BaseModel):
    """Standard API response"""
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None
    message: Optional[str] = None


class SensitivityRequest(BaseModel):
    """Request for sensitivity analysis"""
    free_cash_flows: List[float]
    wacc_range: List[float]
    terminal_growth_range: List[float]
    terminal_value_method: str  # e.g., 'perpetuity', 'exit-multiple', etc.


class SensitivityMatrixEntry(BaseModel):
    """Entry in the sensitivity matrix"""
    wacc: float
    values: List[dict]  # Each dict: {'growth': float, 'dcf': float}


class SensitivityMatrixResponse(BaseModel):
    """Response for sensitivity analysis"""
    matrix: List[SensitivityMatrixEntry]


class VariableUpdateRequest(BaseModel):
    """Request to update a variable"""
    value: Optional[float] = None
    name: Optional[str] = None
    description: Optional[str] = None
    unit: Optional[str] = None
    category: Optional[str] = None
    input_type: Optional[InputType] = None
    applies_to: Optional[AppliesTo] = None
    relative_to: Optional[str] = None 