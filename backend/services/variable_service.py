"""
Variable service for managing financial model variables
"""

from typing import List, Dict, Any
from models.financial_models import Variable, VariableSection, VariableUpdateRequest
import json
import os


class VariableService:
    """Service for managing financial model variables"""
    
    def __init__(self):
        self.data_file = "data/three_statement_variables.json"
        self._ensure_data_directory()
    
    def _ensure_data_directory(self):
        """Ensure data directory exists"""
        os.makedirs("data", exist_ok=True)
    
    def get_three_statement_variables(self) -> List[VariableSection]:
        """Get default 3-Statement model variables"""
        # Return the default variables that match the frontend configuration
        return [
            VariableSection(
                id="income-statement-inputs",
                title="Income Statement Inputs",
                variables=[
                    Variable(
                        id="revenue",
                        name="Revenue",
                        value=10000000,
                        unit="$",
                        category="income_statement",
                        description="Total revenue or sales for the period"
                    ),
                    Variable(
                        id="cogs",
                        name="Cost of Goods Sold (COGS)",
                        value=4000000,
                        unit="$",
                        category="income_statement",
                        description="Direct costs attributable to production of goods sold"
                    ),
                    Variable(
                        id="operating-expenses",
                        name="Operating Expenses",
                        value=3000000,
                        unit="$",
                        category="income_statement",
                        description="Total operating expenses including SG&A"
                    ),
                    Variable(
                        id="depreciation-amortization",
                        name="Depreciation & Amortization",
                        value=500000,
                        unit="$",
                        category="income_statement",
                        description="Non-cash charges for asset depreciation and amortization"
                    ),
                    Variable(
                        id="interest-expense",
                        name="Interest Expense",
                        value=300000,
                        unit="$",
                        category="income_statement",
                        description="Interest paid on debt obligations"
                    ),
                    Variable(
                        id="taxes",
                        name="Taxes",
                        value=550000,
                        unit="$",
                        category="income_statement",
                        description="Income tax expense"
                    ),
                    Variable(
                        id="other-income",
                        name="Other Income (optional)",
                        value=0,
                        unit="$",
                        category="income_statement",
                        description="Non-operating income or other miscellaneous income"
                    )
                ]
            ),
            VariableSection(
                id="balance-sheet-inputs",
                title="Balance Sheet Inputs",
                variables=[
                    Variable(
                        id="cash",
                        name="Cash",
                        value=2000000,
                        unit="$",
                        category="balance_sheet",
                        description="Cash and cash equivalents"
                    ),
                    Variable(
                        id="accounts-receivable",
                        name="Accounts Receivable",
                        value=1500000,
                        unit="$",
                        category="balance_sheet",
                        description="Money owed by customers for goods/services delivered"
                    ),
                    Variable(
                        id="inventory",
                        name="Inventory",
                        value=800000,
                        unit="$",
                        category="balance_sheet",
                        description="Raw materials, work-in-process, and finished goods"
                    ),
                    Variable(
                        id="other-current-assets",
                        name="Other Current Assets (optional)",
                        value=200000,
                        unit="$",
                        category="balance_sheet",
                        description="Prepaid expenses and other short-term assets"
                    ),
                    Variable(
                        id="ppe-fixed-assets",
                        name="PP&E (Fixed Assets)",
                        value=5000000,
                        unit="$",
                        category="balance_sheet",
                        description="Property, plant, and equipment (net of depreciation)"
                    ),
                    Variable(
                        id="accounts-payable",
                        name="Accounts Payable",
                        value=600000,
                        unit="$",
                        category="balance_sheet",
                        description="Money owed to suppliers for goods/services received"
                    ),
                    Variable(
                        id="accrued-expenses",
                        name="Accrued Expenses",
                        value=400000,
                        unit="$",
                        category="balance_sheet",
                        description="Expenses incurred but not yet paid"
                    ),
                    Variable(
                        id="short-term-debt",
                        name="Short-Term Debt",
                        value=1000000,
                        unit="$",
                        category="balance_sheet",
                        description="Debt obligations due within one year"
                    ),
                    Variable(
                        id="long-term-debt",
                        name="Long-Term Debt",
                        value=3000000,
                        unit="$",
                        category="balance_sheet",
                        description="Debt obligations due after one year"
                    ),
                    Variable(
                        id="retained-earnings",
                        name="Retained Earnings",
                        value=2500000,
                        unit="$",
                        category="balance_sheet",
                        description="Accumulated earnings retained in the business"
                    ),
                    Variable(
                        id="share-capital-equity",
                        name="Share Capital / Equity",
                        value=2000000,
                        unit="$",
                        category="balance_sheet",
                        description="Paid-in capital from shareholders"
                    )
                ]
            ),
            VariableSection(
                id="cash-flow-inputs",
                title="Cash Flow Inputs",
                variables=[
                    Variable(
                        id="capex",
                        name="CapEx",
                        value=800000,
                        unit="$",
                        category="cash_flow",
                        description="Capital expenditures for property, plant, and equipment"
                    ),
                    Variable(
                        id="dividends-paid",
                        name="Dividends Paid",
                        value=200000,
                        unit="$",
                        category="cash_flow",
                        description="Dividends paid to shareholders"
                    ),
                    Variable(
                        id="new-debt-raised-repaid",
                        name="New Debt Raised / Repaid",
                        value=0,
                        unit="$",
                        category="cash_flow",
                        description="Net change in debt (positive for new debt, negative for repayment)"
                    ),
                    Variable(
                        id="new-equity-raised",
                        name="New Equity Raised",
                        value=0,
                        unit="$",
                        category="cash_flow",
                        description="New equity capital raised from shareholders"
                    )
                ]
            ),
            VariableSection(
                id="forecasting-assumptions",
                title="Forecasting Assumptions",
                variables=[
                    Variable(
                        id="revenue-growth-rate",
                        name="Revenue Growth Rate",
                        value=15,
                        unit="%",
                        category="assumption",
                        description="Annual revenue growth percentage"
                    ),
                    Variable(
                        id="gross-margin-percent",
                        name="Gross Margin %",
                        value=60,
                        unit="%",
                        category="assumption",
                        description="Gross profit as percentage of revenue"
                    ),
                    Variable(
                        id="opex-percent-revenue",
                        name="OpEx as % of Revenue",
                        value=30,
                        unit="%",
                        category="assumption",
                        description="Operating expenses as percentage of revenue"
                    ),
                    Variable(
                        id="capex-percent-revenue",
                        name="CapEx (% of revenue)",
                        value=8,
                        unit="%",
                        category="assumption",
                        description="Capital expenditures as percentage of revenue"
                    ),
                    Variable(
                        id="depreciation-percent",
                        name="Depreciation Method / %",
                        value=10,
                        unit="%",
                        category="assumption",
                        description="Annual depreciation rate on PP&E"
                    ),
                    Variable(
                        id="dso-days",
                        name="DSO (Days Sales Outstanding)",
                        value=45,
                        unit="days",
                        category="assumption",
                        description="Average collection period for receivables"
                    ),
                    Variable(
                        id="dpo-days",
                        name="DPO (Days Payable Outstanding)",
                        value=30,
                        unit="days",
                        category="assumption",
                        description="Average payment period for payables"
                    ),
                    Variable(
                        id="inventory-days",
                        name="Inventory Days",
                        value=60,
                        unit="days",
                        category="assumption",
                        description="Days of inventory on hand"
                    ),
                    Variable(
                        id="interest-rate-debt",
                        name="Interest Rate on Debt",
                        value=6,
                        unit="%",
                        category="assumption",
                        description="Annual interest rate on outstanding debt"
                    ),
                    Variable(
                        id="tax-rate",
                        name="Tax Rate",
                        value=25,
                        unit="%",
                        category="assumption",
                        description="Corporate income tax rate"
                    ),
                    Variable(
                        id="dividend-payout-percent",
                        name="Dividend Payout %",
                        value=20,
                        unit="%",
                        category="assumption",
                        description="Percentage of net income paid as dividends"
                    )
                ]
            )
        ]
    
    def save_three_statement_variables(self, variables: List[VariableSection]):
        """Save 3-Statement model variables (placeholder for database integration)"""
        # In a real application, this would save to a database
        # For now, we'll just print the variables
        print("Saving variables:", [section.dict() for section in variables])
    
    def add_variable(self, section_id: str, variable: Variable) -> Variable:
        """Add a new variable to a section"""
        # In a real application, this would add to a database
        # For now, we'll just return the variable as-is
        return variable
    
    def update_variable(self, section_id: str, variable_id: str, updates: VariableUpdateRequest) -> Variable:
        """Update a variable"""
        # In a real application, this would update in a database
        # For now, we'll create a mock updated variable
        from models.financial_models import InputType, AppliesTo
        
        return Variable(
            id=variable_id,
            name=updates.name or "Updated Variable",
            value=updates.value or 0,
            unit=updates.unit,
            category=updates.category or "income_statement",
            description=updates.description,
            input_type=updates.input_type or InputType.FIXED,
            applies_to=updates.applies_to or AppliesTo.INCOME_STATEMENT,
            relative_to=updates.relative_to
        )
    
    def delete_variable(self, section_id: str, variable_id: str):
        """Delete a variable"""
        # In a real application, this would delete from a database
        # For now, we'll just print the deletion
        print(f"Deleting variable {variable_id} from section {section_id}") 