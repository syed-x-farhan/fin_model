"""
API routes for financial modeling endpoints
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Request, Body
from typing import List, Dict, Any
import json
import pandas as pd
import io

from models.financial_models import (
    VariableSection, CalculationRequest, CalculationResult, 
    ApiResponse, Variable, VariableUpdateRequest, InputType, AppliesTo
)
from services.financial_calculator import calculator
from services.variable_service import VariableService
from services.statement_calculator import calculate_statements
from services.dcf_calculation import (
    calculate_terminal_value, calculate_dcf_value, calculate_npv, calculate_irr, 
    calculate_payback_period, calculate_sensitivity_matrix, calculate_tornado_data, 
    monte_carlo_npv_simulation, calculate_scenario_kpis, calculate_scenario_comparison, 
    calculate_sensitivity_analysis
)

# Create router
models_router = APIRouter(prefix="/models", tags=["Financial Models"])

# Initialize services
variable_service = VariableService()


@models_router.get("/{model_id}/variables")
async def get_model_variables(model_id: str) -> List[VariableSection]:
    """Get variables for a specific model"""
    try:
        if model_id == "3-statement":
            return variable_service.get_three_statement_variables()
        else:
            raise HTTPException(status_code=404, detail=f"Model {model_id} not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@models_router.post("/{model_id}/variables")
async def save_model_variables(model_id: str, variables: List[VariableSection]) -> ApiResponse:
    """Save variables for a specific model"""
    try:
        if model_id == "3-statement":
            variable_service.save_three_statement_variables(variables)
            return ApiResponse(
                success=True,
                message="Variables saved successfully"
            )
        else:
            raise HTTPException(status_code=404, detail=f"Model {model_id} not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@models_router.post("/{model_id}/sections/{section_id}/variables")
async def add_variable(
    model_id: str, 
    section_id: str, 
    variable: Variable
) -> Variable:
    """Add a new variable to a section"""
    try:
        if model_id == "3-statement":
            return variable_service.add_variable(section_id, variable)
        else:
            raise HTTPException(status_code=404, detail=f"Model {model_id} not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@models_router.put("/{model_id}/sections/{section_id}/variables/{variable_id}")
async def update_variable(
    model_id: str,
    section_id: str,
    variable_id: str,
    updates: VariableUpdateRequest
) -> Variable:
    """Update a variable"""
    try:
        if model_id == "3-statement":
            return variable_service.update_variable(section_id, variable_id, updates)
        else:
            raise HTTPException(status_code=404, detail=f"Model {model_id} not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@models_router.delete("/{model_id}/sections/{section_id}/variables/{variable_id}")
async def delete_variable(
    model_id: str,
    section_id: str,
    variable_id: str
) -> ApiResponse:
    """Delete a variable"""
    try:
        if model_id == "3-statement":
            variable_service.delete_variable(section_id, variable_id)
            return ApiResponse(
                success=True,
                message="Variable deleted successfully"
            )
        else:
            raise HTTPException(status_code=404, detail=f"Model {model_id} not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def transform_service_input_to_variable_sections(data: dict) -> list:
    """
    Transform layman-friendly service business input into variable sections for calculation.
    """
    import uuid
    # Helper to create a variable
    def var(id, name, value, unit, category, description="", input_type=InputType.FIXED, applies_to=AppliesTo.INCOME_STATEMENT):
        return Variable(
            id=id,
            name=name,
            value=float(value) if value not in (None, "") else 0.0,
            unit=unit,
            category=category,
            description=description,
            input_type=input_type,
            applies_to=applies_to
        )

    # Revenue: sum of all service revenue (price * clients)
    total_revenue = sum(float(s.get("price",0)) * float(s.get("clients",0)) for s in data.get("services", []))
    # COGS: sum of all service delivery costs (cost * clients)
    total_cogs = sum(float(s.get("cost",0)) * float(s.get("clients",0)) for s in data.get("services", []))
    # Operating Expenses: sum of all monthly expenses
    total_expenses = sum(float(e.get("amount",0)) for e in data.get("expenses", []))
    # CapEx: sum of all equipment costs
    total_capex = sum(float(eq.get("cost",0)) for eq in data.get("equipment", []))
    # Loans: sum of all loan amounts
    total_loans = sum(float(l.get("amount",0)) for l in data.get("loans", []))
    # Tax Rate
    tax_rate = float(data.get("taxRate", 25))
    # Other income/costs
    total_other_income = sum(float(o.get("amount",0)) for o in data.get("other", []) if o.get("isIncome"))
    total_other_costs = sum(float(o.get("amount",0)) for o in data.get("other", []) if not o.get("isIncome"))

    # Add investments if present
    investments = data.get('investments', [])

    # Build variable sections
    income_vars = [
        var("revenue", "Revenue", total_revenue, "$", "income_statement", "Total revenue from all services"),
        var("cogs", "Cost of Goods Sold (COGS)", total_cogs, "$", "income_statement", "Total direct costs for services"),
        var("operating-expenses", "Operating Expenses", total_expenses, "$", "income_statement", "Total monthly business expenses"),
        var("tax rate", "Tax Rate", tax_rate, "%", "income_statement", "Tax rate applied to profit", InputType.PERCENTAGE),
        var("other-income", "Other Income (optional)", total_other_income, "$", "income_statement", "Other income sources"),
        var("other-costs", "Other Costs (optional)", total_other_costs, "$", "income_statement", "Other costs not included above"),
    ]
    balance_vars = [
        var("cash", "Cash", float(data.get("selfFunding",0)), "$", "balance_sheet", "Initial cash/self-funding", InputType.FIXED, AppliesTo.BALANCE_SHEET),
        var("long-term-debt", "Long-Term Debt", total_loans, "$", "balance_sheet", "Total business loans", InputType.FIXED, AppliesTo.BALANCE_SHEET),
        var("ppe-fixed-assets", "PP&E (Fixed Assets)", total_capex, "$", "balance_sheet", "Total equipment/tools purchased", InputType.FIXED, AppliesTo.BALANCE_SHEET),
    ]
    cashflow_vars = [
        var("capex", "CapEx", total_capex, "$", "cash_flow", "Capital expenditures for equipment/tools", InputType.FIXED, AppliesTo.CASH_FLOW),
    ]
    return [
        VariableSection(id="income-statement-inputs", title="Income Statement Inputs", variables=income_vars),
        VariableSection(id="balance-sheet-inputs", title="Balance Sheet Inputs", variables=balance_vars),
        VariableSection(id="cash-flow-inputs", title="Cash Flow Inputs", variables=cashflow_vars),
        # Optionally, add a section for investments if needed in the future
    ]


def transform_retail_input_to_variable_sections(data: dict) -> list:
    """
    Transform layman-friendly retail business input into variable sections for calculation.
    """
    import uuid
    def var(id, name, value, unit, category, description="", input_type=InputType.FIXED, applies_to=AppliesTo.INCOME_STATEMENT):
        return Variable(
            id=id,
            name=name,
            value=float(value) if value not in (None, "") else 0.0,
            unit=unit,
            category=category,
            description=description,
            input_type=input_type,
            applies_to=applies_to
        )
    # Revenue: sum of all product revenue (price * units)
    total_revenue = sum(float(p.get("price",0)) * float(p.get("units",0)) for p in data.get("products", []))
    # COGS: sum of all product costs (cost * units)
    total_cogs = sum(float(p.get("cost",0)) * float(p.get("units",0)) for p in data.get("products", []))
    # Operating Expenses: sum of all monthly fixed expenses
    total_expenses = sum(float(e.get("amount",0)) for e in data.get("expenses", []))
    # CapEx: equipment/shop setup cost
    total_capex = float(data.get("equipmentCost", 0))
    # Loans: investment or loan
    total_loans = float(data.get("loanAmount", 0))
    # Tax Rate
    tax_rate = float(data.get("taxRate", 25))
    # Other income/costs
    total_other_income = sum(float(o.get("amount",0)) for o in data.get("other", []) if o.get("isIncome"))
    total_other_costs = sum(float(o.get("amount",0)) for o in data.get("other", []) if not o.get("isIncome"))
    # Inventory holding (days)
    inventory_days = float(data.get("inventoryDays", 0))
    # Add investments if present
    investments = data.get('investments', [])
    # Build variable sections
    income_vars = [
        var("revenue", "Revenue", total_revenue, "$", "income_statement", "Total revenue from all products"),
        var("cogs", "Cost of Goods Sold (COGS)", total_cogs, "$", "income_statement", "Total direct costs for products"),
        var("operating-expenses", "Operating Expenses", total_expenses, "$", "income_statement", "Total monthly business expenses"),
        var("tax rate", "Tax Rate", tax_rate, "%", "income_statement", "Tax rate applied to profit", InputType.PERCENTAGE),
        var("other-income", "Other Income (optional)", total_other_income, "$", "income_statement", "Other income sources"),
        var("other-costs", "Other Costs (optional)", total_other_costs, "$", "income_statement", "Other costs not included above"),
    ]
    balance_vars = [
        var("cash", "Cash", float(data.get("selfFunding",0)), "$", "balance_sheet", "Initial cash/self-funding", InputType.FIXED, AppliesTo.BALANCE_SHEET),
        var("long-term-debt", "Long-Term Debt", total_loans, "$", "balance_sheet", "Total business loans", InputType.FIXED, AppliesTo.BALANCE_SHEET),
        var("ppe-fixed-assets", "PP&E (Fixed Assets)", total_capex, "$", "balance_sheet", "Total equipment/shop setup cost", InputType.FIXED, AppliesTo.BALANCE_SHEET),
        var("inventory-days", "Inventory Days", inventory_days, "days", "balance_sheet", "Days of inventory on hand", InputType.FIXED, AppliesTo.BALANCE_SHEET),
    ]
    cashflow_vars = [
        var("capex", "CapEx", total_capex, "$", "cash_flow", "Capital expenditures for equipment/shop setup", InputType.FIXED, AppliesTo.CASH_FLOW),
    ]
    return [
        VariableSection(id="income-statement-inputs", title="Income Statement Inputs", variables=income_vars),
        VariableSection(id="balance-sheet-inputs", title="Balance Sheet Inputs", variables=balance_vars),
        VariableSection(id="cash-flow-inputs", title="Cash Flow Inputs", variables=cashflow_vars),
    ]

def transform_saas_input_to_variable_sections(data: dict) -> list:
    """
    Transform layman-friendly SaaS business input into variable sections for calculation.
    """
    import uuid
    def var(id, name, value, unit, category, description="", input_type=InputType.FIXED, applies_to=AppliesTo.INCOME_STATEMENT):
        return Variable(
            id=id,
            name=name,
            value=float(value) if value not in (None, "") else 0.0,
            unit=unit,
            category=category,
            description=description,
            input_type=input_type,
            applies_to=applies_to
        )
    # Revenue: subscriptionPrice * currentUsers
    total_revenue = float(data.get("subscriptionPrice",0)) * float(data.get("currentUsers",0))
    # COGS: cost per user * current users
    total_cogs = float(data.get("costPerUser",0)) * float(data.get("currentUsers",0))
    # Operating Expenses: total monthly
    total_expenses = float(data.get("operatingExpenses",0))
    # CapEx: equipment cost
    total_capex = float(data.get("equipmentCost",0))
    # Loans: investment or loan
    total_loans = float(data.get("investmentOrLoan",0))
    # Tax Rate
    tax_rate = float(data.get("taxRate", 25))
    # Add investments if present
    investments = data.get('investments', [])
    # Build variable sections
    income_vars = [
        var("revenue", "Revenue", total_revenue, "$", "income_statement", "Total subscription revenue"),
        var("cogs", "Cost of Goods Sold (COGS)", total_cogs, "$", "income_statement", "Total direct costs per user"),
        var("operating-expenses", "Operating Expenses", total_expenses, "$", "income_statement", "Total monthly business expenses"),
        var("tax rate", "Tax Rate", tax_rate, "%", "income_statement", "Tax rate applied to profit", InputType.PERCENTAGE),
    ]
    balance_vars = [
        var("cash", "Cash", 0, "$", "balance_sheet", "Initial cash/self-funding", InputType.FIXED, AppliesTo.BALANCE_SHEET),
        var("long-term-debt", "Long-Term Debt", total_loans, "$", "balance_sheet", "Total business loans/investment", InputType.FIXED, AppliesTo.BALANCE_SHEET),
        var("ppe-fixed-assets", "PP&E (Fixed Assets)", total_capex, "$", "balance_sheet", "Total equipment/tools purchased", InputType.FIXED, AppliesTo.BALANCE_SHEET),
    ]
    cashflow_vars = [
        var("capex", "CapEx", total_capex, "$", "cash_flow", "Capital expenditures for equipment/tools", InputType.FIXED, AppliesTo.CASH_FLOW),
    ]
    return [
        VariableSection(id="income-statement-inputs", title="Income Statement Inputs", variables=income_vars),
        VariableSection(id="balance-sheet-inputs", title="Balance Sheet Inputs", variables=balance_vars),
        VariableSection(id="cash-flow-inputs", title="Cash Flow Inputs", variables=cashflow_vars),
    ]


def transform_statement_for_frontend(statement_list, shareholders=None):
    if not statement_list or not isinstance(statement_list, list):
        return {'years': [], 'line_items': []}
    years = [str(item['year']) for item in statement_list]
    line_items = []
    # Collect all keys except 'year'
    keys = [k for k in statement_list[0] if k != 'year']
    # Custom order: always put 'investment_income' right after 'other_income' if both exist
    if 'other_income' in keys and 'investment_income' in keys:
        new_keys = []
        for k in keys:
            new_keys.append(k)
            if k == 'other_income' and 'investment_income' in keys:
                new_keys.append('investment_income')
        # Remove duplicate if 'investment_income' was already in keys
        keys = [k for k in new_keys if k != 'investment_income' or new_keys.count(k) == 1]
    # Remove 'investment_income' from its old position if it was not after 'other_income'
    seen_other_income = False
    final_keys = []
    for k in keys:
        if k == 'investment_income' and not seen_other_income:
            continue
        final_keys.append(k)
        if k == 'other_income':
            seen_other_income = True
            if 'investment_income' in keys:
                final_keys.append('investment_income')
    if 'investment_income' in keys and 'other_income' not in keys:
        final_keys.append('investment_income')
    # Now build line_items in this order
    for key in final_keys:
        if key == 'year':
            continue
        if isinstance(statement_list[0][key], dict):
            for subkey in statement_list[0][key]:
                label = subkey.replace('_', ' ').title()
                if shareholders and subkey == 'share_capital':
                    breakdown = ', '.join(f"{s['percent']}%" for s in shareholders if s.get('percent') is not None)
                    if breakdown:
                        label += f" ({breakdown})"
                line_items.append({
                    'label': label,
                    'values': [item[key][subkey] for item in statement_list]
                })
        else:
            label = key.replace('_', ' ').title()
            line_items.append({
                'label': label,
                'values': [item[key] for item in statement_list]
            })
    return {'years': years, 'line_items': line_items}


def transform_amortization_table_for_frontend(table):
    if not table or not isinstance(table, list) or len(table) == 0:
        return None
    headers = list(table[0].keys())
    rows = [[row.get(h, "") for h in headers] for row in table]
    return {"headers": headers, "rows": rows}


@models_router.get("/{model_id}/results")
async def get_model_results(model_id: str) -> ApiResponse:
    """Get latest calculation results for a model"""
    try:
        if model_id == "3-statement":
            # For now, return empty result - in a real app, this would fetch from database
            raise HTTPException(status_code=404, detail="No results found. Please calculate the model first.")
        else:
            raise HTTPException(status_code=404, detail=f"Model {model_id} not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@models_router.post("/{model_id}/import")
async def import_excel_data(
    model_id: str,
    file: UploadFile = File(...)
) -> ApiResponse:
    """Import financial data from Excel file (return all sheets and all data, no mapping)"""
    try:
        if model_id != "3-statement":
            raise HTTPException(status_code=404, detail=f"Model {model_id} not found")

        if not file.filename or not file.filename.lower().endswith((".xlsx", ".xls")):
            raise HTTPException(status_code=400, detail="File must be an Excel file (.xlsx, .xls)")

        content = await file.read()
        excel_data = pd.read_excel(io.BytesIO(content), sheet_name=None)  # ✅ Load all sheets

        all_sheet_data = {}
        for sheet_name, df in excel_data.items():
            all_sheet_data[sheet_name] = {
                "columns": df.columns.tolist(),
                "rowCount": len(df),
                "data": df.fillna("").to_dict('records')  # Optional: Replace NaNs with empty strings
            }
        # Debug logging
        print("Sheets found:", list(all_sheet_data.keys()))
        for sheet, data in all_sheet_data.items():
            print(f"Sheet: {sheet}, Rows: {data['rowCount']}, Columns: {data['columns']}")

        return ApiResponse(
            success=True,
            message=f"Successfully imported all data from {file.filename}",
            data={
                "sheets": list(all_sheet_data.keys()),
                "all_sheet_data": all_sheet_data,
                "fileName": file.filename
            }
        )

    except Exception as e:
        return ApiResponse(
            success=False,
            error=str(e)
        )


# Excel parsing endpoints
@models_router.post("/parse-excel")
async def parse_excel_file(file: UploadFile = File(...)) -> ApiResponse:
    """Parse Excel file and return structured data"""
    try:
        # Validate file type
        if not file.filename or not file.filename.lower().endswith(('.xlsx', '.xls', '.csv')):
            raise HTTPException(status_code=400, detail="File must be an Excel file (.xlsx, .xls) or CSV")
        
        # Read file content
        content = await file.read()
        
        # Parse based on file type
        if file.filename and file.filename.lower().endswith('.csv'):
            df = pd.read_csv(io.BytesIO(content))
        else:
            df = pd.read_excel(io.BytesIO(content), sheet_name=0)  # Read first sheet
        
        # Convert DataFrame to list of dictionaries
        data = df.to_dict('records')
        
        # Get column names
        columns = df.columns.tolist()
        
        # Get sheet names (for Excel files)
        sheets = []
        if not file.filename or not file.filename.lower().endswith('.csv'):
            try:
                excel_file = pd.ExcelFile(io.BytesIO(content))
                sheets = excel_file.sheet_names
            except:
                sheets = ['Sheet1']
        else:
            sheets = ['Data']
        
        return ApiResponse(
            success=True,
            data={
                "sheets": sheets,
                "columns": columns,
                "data": data,
                "fileName": file.filename,
                "rowCount": len(data)
            }
        )
        
    except Exception as e:
        return ApiResponse(
            success=False,
            error=f"Failed to parse Excel file: {str(e)}"
        )


@models_router.post("/{model_id}/apply-mappings")
async def apply_column_mappings(
    model_id: str,
    request: Dict[str, Any]
) -> ApiResponse:
    """Apply column mappings and update model variables"""
    try:
        if model_id != "3-statement":
            raise HTTPException(status_code=404, detail=f"Model {model_id} not found")
        
        mappings = request.get("mappings", [])
        data = request.get("data", [])
        
        if not mappings or not data:
            raise HTTPException(status_code=400, detail="Mappings and data are required")
        
        # Get current variables
        current_variables = variable_service.get_three_statement_variables()
        
        # Apply mappings to update variables
        updated_variables = []
        for section in current_variables:
            updated_section = section.copy()
            updated_section.variables = []
            
            for variable in section.variables:
                # Find if this variable has a mapping
                mapping = next((m for m in mappings if m["mapped_to"] == variable.id), None)
                
                if mapping and data:
                    # Get value from Excel data (use first row for now)
                    excel_column = mapping["excel_column"]
                    excel_value = data[0].get(excel_column)
                    
                    if excel_value is not None:
                        # Update variable value
                        updated_variable = variable.copy()
                        updated_variable.value = float(excel_value) if isinstance(excel_value, (int, float)) else excel_value
                        updated_section.variables.append(updated_variable)
                        continue
                
                # Keep original variable if no mapping found
                updated_section.variables.append(variable)
            
            updated_variables.append(updated_section)
        
        # Save updated variables
        variable_service.save_three_statement_variables(updated_variables)
        
        return ApiResponse(
            success=True,
            message="Column mappings applied successfully",
            data={"updated_variables": len(updated_variables)}
        )
        
    except Exception as e:
        return ApiResponse(
            success=False,
            error=f"Failed to apply mappings: {str(e)}"
        ) 


def variable_sections_to_layman_data(variable_sections, company_type):
    """
    Convert frontend variable sections to layman data dict for calculation.
    """
    data = {}
    # Flatten all variables
    all_vars = []
    for section in variable_sections:
        all_vars.extend(section.get('variables', []))
    # Helper to get variable by id
    def get_var(var_id, default=0):
        v = next((v for v in all_vars if v.get('id') == var_id), None)
        return v.get('value', default) if v else default
    # Helper to get variable by name
    def get_var_by_name(name, default=0):
        v = next((v for v in all_vars if v.get('name', '').lower() == name.lower()), None)
        return v.get('value', default) if v else default

    if company_type == 'service':
        # Service business mapping
        data['services'] = []  # Not enough info to reconstruct full list, so skip
        data['expenses'] = []
        data['equipment'] = []
        data['loans'] = []
        data['other'] = []
        data['selfFunding'] = get_var('cash', 0)
        data['taxRate'] = get_var_by_name('tax rate', 25)
        data['forecastPeriod'] = get_var('forecastPeriod', 5)
        # Map main fields
        data['revenue'] = get_var('revenue', 0)
        data['cogs'] = get_var('cogs', 0)
        data['operatingExpenses'] = get_var('operating-expenses', 0)
        data['capex'] = get_var('capex', 0)
        data['longTermDebt'] = get_var('long-term-debt', 0)
        data['otherIncome'] = get_var('other-income', 0)
        data['otherCosts'] = get_var('other-costs', 0)
    elif company_type == 'retail':
        data['products'] = []
        data['expenses'] = []
        data['equipment'] = []
        data['loans'] = []
        data['other'] = []
        data['selfFunding'] = get_var('cash', 0)
        data['taxRate'] = get_var_by_name('tax rate', 25)
        data['forecastPeriod'] = get_var('forecastPeriod', 5)
        data['revenue'] = get_var('revenue', 0)
        data['cogs'] = get_var('cogs', 0)
        data['operatingExpenses'] = get_var('operating-expenses', 0)
        data['capex'] = get_var('capex', 0)
        data['longTermDebt'] = get_var('long-term-debt', 0)
        data['otherIncome'] = get_var('other-income', 0)
        data['otherCosts'] = get_var('other-costs', 0)
        data['inventoryDays'] = get_var('inventory-days', 0)
    elif company_type == 'saas':
        data['plans'] = []
        data['costs'] = []
        data['equipment'] = []
        data['loans'] = []
        data['other'] = []
        data['selfFunding'] = get_var('cash', 0)
        data['taxRate'] = get_var_by_name('tax rate', 25)
        data['forecastPeriod'] = get_var('forecastPeriod', 5)
        data['revenue'] = get_var('revenue', 0)
        data['cogs'] = get_var('cogs', 0)
        data['operatingExpenses'] = get_var('operating-expenses', 0)
        data['capex'] = get_var('capex', 0)
        data['longTermDebt'] = get_var('long-term-debt', 0)
    # Add investments if present in variable sections
    for section in variable_sections:
        if section.get('id', '').lower().find('investment') != -1:
            data['investments'] = section.get('variables', [])
    return data

@models_router.post("/{model_id}/calculate")
async def calculate_model(model_id: str, request: Dict[str, Any] = Body(...)) -> ApiResponse:
    """Calculate the financial model with all input fields from the request"""
    try:
        if model_id != "3-statement":
            raise HTTPException(status_code=404, detail=f"Model {model_id} not found")
        variables = request.get("variables", [])
        forecast_period = request.get("forecastPeriod")
        # Try to extract company_type from variables or request (default to 'service')
        company_type = request.get("company_type")
        if not company_type:
            for section in variables:
                if section.get("id", "").startswith("retail") or section.get("title", "").lower().startswith("retail"):
                    company_type = "retail"
                    break
                if section.get("id", "").startswith("saas") or section.get("title", "").lower().startswith("saas"):
                    company_type = "saas"
                    break
                if section.get("id", "").startswith("service") or section.get("title", "").lower().startswith("service"):
                    company_type = "service"
                    break
            if not company_type:
                company_type = "service"  # fallback
        # Use the request data directly if it contains detailed lists
        if any(k in request for k in ["services", "products", "plans"]):
            data = dict(request)  # make a copy
            if forecast_period:
                data["forecastPeriod"] = forecast_period
            # Pass through investments if present
            if "investments" in request:
                data["investments"] = request["investments"]
        else:
            data = variable_sections_to_layman_data(variables, company_type)
            if forecast_period:
                data["forecastPeriod"] = forecast_period
        print("[DEBUG] company_type:", company_type)
        print("[DEBUG] Calculation input data:", data)
        # Patch: Always ensure both 'costs' and 'expenses' are available and equivalent
        if "costs" in data and "expenses" not in data:
            data["expenses"] = data["costs"]
        elif "expenses" in data and "costs" not in data:
            data["costs"] = data["expenses"]
        result = calculate_statements(company_type, data)
        print("[DEBUG] Raw calculation result:", result)
        # DCF & Valuation KPIs Integration
        forecast = result.get("forecast", [])
        free_cash_flows = [year.get("free_cash_flow", 0) for year in forecast]
        # --- WACC Build-Up Logic ---
        def get_float(val, default=0.0):
            try:
                return float(val)
            except Exception:
                return default
        use_wacc_build_up = request.get("useWaccBuildUp", False)
        use_cost_of_equity_only = request.get("useCostOfEquityOnly", False)
        rf_rate = get_float(request.get("rfRate", None))
        beta = get_float(request.get("beta", None))
        market_premium = get_float(request.get("marketPremium", None))
        cost_of_debt = get_float(request.get("costOfDebt", None))
        tax_rate_main = get_float(request.get("taxRate", 25)) / 100
        tax_rate_wacc = get_float(request.get("taxRateWacc", None))
        if not tax_rate_wacc:
            tax_rate_wacc = tax_rate_main
        else:
            tax_rate_wacc = tax_rate_wacc / 100
        equity_pct = get_float(request.get("equityPct", None))
        debt_pct = get_float(request.get("debtPct", None))
        # Calculate Cost of Equity and WACC if build-up is used
        if use_wacc_build_up:
            cost_of_equity = rf_rate + beta * market_premium
            after_tax_cost_of_debt = cost_of_debt * (1 - tax_rate_wacc)
            e = equity_pct / 100 if equity_pct is not None else 0.6
            d = debt_pct / 100 if debt_pct is not None else 0.4
            wacc = e * cost_of_equity + d * after_tax_cost_of_debt
            if use_cost_of_equity_only:
                discount_rate = cost_of_equity / 100  # Convert to decimal
            else:
                discount_rate = wacc / 100  # Convert to decimal
        else:
            discount_rate = float(request.get("discountRate", 0.1))
        terminal_growth = float(request.get("terminalGrowth", 0.02))
        # --- Terminal Value Logic ---
        tv_method = request.get('tvMethod', 'perpetuity')
        tv_metric = request.get('tvMetric', 'EBITDA')
        tv_multiple = float(request.get('tvMultiple', 0))
        tv_custom_value = float(request.get('tvCustomValue', 0))
        tv_year = int(request.get('tvYear', len(free_cash_flows))) if request.get('tvYear') else len(free_cash_flows)
        # For exit-multiple, get the correct metric from the forecast
        tv_metric_value = 0.0
        if tv_method == 'exit-multiple' and forecast:
            metric_map = {
                'EBITDA': 'ebitda',
                'EBIT': 'ebit',
                'Revenue': 'revenue',
                'NetIncome': 'net_income',
            }
            metric_key = metric_map.get(tv_metric, 'ebitda')
            tv_metric_value = forecast[-1].get(metric_key, 0)
        # Compute terminal value
        terminal_value = calculate_terminal_value(
            method=tv_method,
            last_fcf=free_cash_flows[-1] if free_cash_flows else 0,
            discount_rate=discount_rate,
            terminal_growth=terminal_growth,
            tv_metric_value=tv_metric_value,
            tv_multiple=tv_multiple,
            tv_custom_value=tv_custom_value
        )
        # DCF calculation with terminal year
        dcf_value = calculate_dcf_value(free_cash_flows, discount_rate, terminal_value, terminal_year=tv_year)
        npv = calculate_npv(free_cash_flows, discount_rate)
        try:
            irr = calculate_irr([-abs(free_cash_flows[0])] + free_cash_flows[1:]) if free_cash_flows and free_cash_flows[0] > 0 else calculate_irr(free_cash_flows)
        except Exception:
            irr = None
        try:
            payback_period = calculate_payback_period(free_cash_flows)
        except Exception:
            payback_period = None
        # --- Sensitivity Matrix (Heatmap) ---
        wacc_range = [round(x, 3) for x in [0.07, 0.08, 0.09, 0.10, 0.11, 0.12]]
        terminal_growth_range = [round(x, 3) for x in [0.01, 0.02, 0.03, 0.04]]
        def terminal_value_func(last_fcf, g, wacc):
            # Avoid division by zero or negative denominator
            if wacc - g <= 0.001:
                return 0
            return last_fcf * (1 + g) / (wacc - g)
        sensitivity_matrix = calculate_sensitivity_matrix(free_cash_flows, wacc_range, terminal_growth_range, terminal_value_func)
        # --- Tornado Chart Data ---
        # Flex revenue growth, EBITDA margin, WACC, terminal growth
        variable_impacts = {
            'Revenue Growth': {'low': 0.95, 'high': 1.05, 'type': 'fcf'},
            'EBITDA Margin': {'low': 0.9, 'high': 1.1, 'type': 'fcf'},
            'WACC': {'low': max(0.01, discount_rate - 0.01), 'high': discount_rate + 0.01, 'type': 'wacc'},
            'Terminal Growth': {'low': max(0.0, terminal_growth - 0.01), 'high': terminal_growth + 0.01, 'type': 'growth'},
        }
        tornado_data = calculate_tornado_data(free_cash_flows, discount_rate, terminal_growth, variable_impacts, terminal_value_func)
        # Get balance sheet for net debt calculation (use first year)
        balance_sheet = result.get("balance_sheet", [])
        if isinstance(balance_sheet, list) and balance_sheet:
            bs = balance_sheet[0] if isinstance(balance_sheet[0], dict) else {}
            assets = bs.get('assets', {})
            liabilities = bs.get('liabilities', {})
            cash = assets.get('cash', 0)
            long_term_debt = liabilities.get('long_term_debt', 0)
        else:
            cash = 0
            long_term_debt = 0
        net_debt = long_term_debt - cash
        enterprise_value = dcf_value
        equity_value = enterprise_value - net_debt
        result["valuation"] = {
            "enterprise_value": enterprise_value,
            "equity_value": equity_value,
            "irr": irr,
            "npv": npv,
            "payback_period": payback_period
        }
        result["dcf"] = {"dcf_value": dcf_value, "discount_rate": discount_rate, "terminal_value": terminal_value, "terminal_growth": terminal_growth, "free_cash_flows": free_cash_flows, "tv_method": tv_method, "tv_metric": tv_metric, "tv_multiple": tv_multiple, "tv_custom_value": tv_custom_value, "tv_year": tv_year}
        result["sensitivityMatrix"] = sensitivity_matrix
        result["tornadoData"] = tornado_data
        # Transform statements for frontend
        from api.routes import transform_statement_for_frontend
        result["income_statement"] = transform_statement_for_frontend(result["income_statement"])
        # Pass shareholders to balance sheet transformation if present
        shareholders = data.get("shareholders")
        result["balance_sheet"] = transform_statement_for_frontend(result["balance_sheet"], shareholders=shareholders)
        # result["cash_flow"] = transform_statement_for_frontend(result["cash_flow"])  # Removed, return as-is
        # Only include amortization_table if it is non-empty
        amort = result.get("amortization_table")
        from api.routes import transform_amortization_table_for_frontend
        amort_transformed = transform_amortization_table_for_frontend(amort)
        if amort_transformed:
            result["amortization_table"] = amort_transformed
        else:
            result.pop("amortization_table", None)
        # Build expense_breakdown from costs or expenses array in request, if present
        expense_breakdown = []
        # Try costs first (SaaS), then expenses (Service/Retail)
        expense_data = request.get('costs', []) or request.get('expenses', [])
        if isinstance(expense_data, list):
            for item in expense_data:
                name = item.get('category') or item.get('name') or 'Unknown'
                try:
                    value = float(item.get('amount', 0))
                except Exception:
                    value = 0
                expense_breakdown.append({'name': name, 'value': value})
        result['expense_breakdown'] = expense_breakdown
        # Build equity data from shareholders and owner salary in request
        equity_data = {}
        # Process shareholders data
        shareholders = request.get('shareholders', [])
        if isinstance(shareholders, list):
            processed_shareholders = []
            for shareholder in shareholders:
                if shareholder.get('name'):  # Only include shareholders with names
                    try:
                        amount = float(shareholder.get('amount', 0))
                        percent = float(shareholder.get('percent', 0))
                    except (ValueError, TypeError):
                        amount = 0
                        percent = 0
                    processed_shareholders.append({
                        'name': shareholder.get('name', 'Unknown'),
                        'shares': percent,
                        'value': amount
                    })
            equity_data['shareholders'] = processed_shareholders
        else:
            equity_data['shareholders'] = []
        # Process owner salary data
        owner_salary_data = request.get('ownerSalary', {})
        if isinstance(owner_salary_data, dict) and owner_salary_data.get('amount'):
            try:
                amount = float(owner_salary_data.get('amount', 0))
                frequency = owner_salary_data.get('frequency', 'monthly')
                # Convert to annual if needed
                if frequency == 'monthly':
                    annual_amount = amount * 12
                elif frequency == 'weekly':
                    annual_amount = amount * 52
                else:  # assume annual
                    annual_amount = amount
                equity_data['ownerSalary'] = annual_amount
            except (ValueError, TypeError):
                equity_data['ownerSalary'] = 0
        else:
            equity_data['ownerSalary'] = 0
        result['equity'] = equity_data
        print("[DEBUG] Final API response (about to return):", json.dumps(result, indent=2, default=str))
        if 'income_statement' in result:
            print("[DEBUG] Final income_statement:", json.dumps(result['income_statement'], indent=2, default=str))
        return ApiResponse(success=True, data=result)
    except Exception as e:
        return ApiResponse(success=False, error=str(e)) 

# Monte Carlo Simulation Endpoint
from fastapi import APIRouter, Body
from fastapi.responses import JSONResponse

@models_router.post("/monte-carlo")
async def monte_carlo_endpoint(
    request: Dict[str, Any] = Body(...)
):
    """
    Run Monte Carlo simulation for NPV. Expects:
    {
      "free_cash_flows": [number, ...],
      "discount_rate_range": [min, max],
      "terminal_growth_range": [min, max],
      "runs": number
    }
    """
    try:
        free_cash_flows = request.get("free_cash_flows", [])
        discount_rate_range = tuple(request.get("discount_rate_range", [0.08, 0.12]))
        terminal_growth_range = tuple(request.get("terminal_growth_range", [0.01, 0.03]))
        runs = int(request.get("runs", 1000))
        histogram = monte_carlo_npv_simulation(free_cash_flows, discount_rate_range, terminal_growth_range, runs)
        return JSONResponse({"npvDistribution": histogram})
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500) 


@models_router.post("/scenario-calculate")
async def scenario_calculation_endpoint(
    request: Dict[str, Any] = Body(...)
):
    """
    Calculate scenario KPIs and comparisons. Expects:
    {
      "base_forecast": [year_data, ...],
      "scenario_configs": {
        "best": {"revenueGrowth": 10, "operatingMargin": 5, ...},
        "worst": {"revenueGrowth": -10, "operatingMargin": -5, ...}
      },
      "base_discount_rate": 0.1,
      "base_terminal_growth": 0.02
    }
    """
    try:
        base_forecast = request.get("base_forecast", [])
        scenario_configs = request.get("scenario_configs", {})
        base_discount_rate = float(request.get("base_discount_rate", 0.1))
        base_terminal_growth = float(request.get("base_terminal_growth", 0.02))
        
        if not base_forecast:
            return JSONResponse({"error": "Base forecast is required"}, status_code=400)
        
        # Calculate scenario comparisons
        scenario_results = calculate_scenario_comparison(base_forecast, scenario_configs)
        
        return JSONResponse({
            "scenarios": scenario_results,
            "base_discount_rate": base_discount_rate,
            "base_terminal_growth": base_terminal_growth
        })
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


@models_router.post("/sensitivity-analysis")
async def sensitivity_analysis_endpoint(
    request: Dict[str, Any] = Body(...)
):
    """
    Calculate comprehensive sensitivity analysis. Expects:
    {
      "base_forecast": [year_data, ...],
      "sensitivity_ranges": {
        "revenueGrowth": {"low": -20, "high": 20},
        "operatingMargin": {"low": -10, "high": 10},
        "wacc": {"low": -2, "high": 2},
        "terminalGrowth": {"low": -1, "high": 1}
      },
      "base_discount_rate": 0.1,
      "base_terminal_growth": 0.02
    }
    """
    try:
        base_forecast = request.get("base_forecast", [])
        sensitivity_ranges = request.get("sensitivity_ranges", {})
        base_discount_rate = float(request.get("base_discount_rate", 0.1))
        base_terminal_growth = float(request.get("base_terminal_growth", 0.02))
        
        if not base_forecast:
            return JSONResponse({"error": "Base forecast is required"}, status_code=400)
        
        # Calculate sensitivity analysis
        sensitivity_results = calculate_sensitivity_analysis(
            base_forecast, sensitivity_ranges, base_discount_rate, base_terminal_growth
        )
        
        return JSONResponse(sensitivity_results)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


@models_router.post("/single-scenario")
async def single_scenario_endpoint(
    request: Dict[str, Any] = Body(...)
):
    """
    Calculate KPIs for a single scenario. Expects:
    {
      "base_forecast": [year_data, ...],
      "scenario_values": {"revenueGrowth": 10, "operatingMargin": 5, ...},
      "base_discount_rate": 0.1,
      "base_terminal_growth": 0.02
    }
    """
    try:
        base_forecast = request.get("base_forecast", [])
        scenario_values = request.get("scenario_values", {})
        base_discount_rate = float(request.get("base_discount_rate", 0.1))
        base_terminal_growth = float(request.get("base_terminal_growth", 0.02))
        
        if not base_forecast:
            return JSONResponse({"error": "Base forecast is required"}, status_code=400)
        
        # Calculate single scenario KPIs
        scenario_kpis = calculate_scenario_kpis(
            base_forecast, scenario_values, base_discount_rate, base_terminal_growth
        )
        
        return JSONResponse(scenario_kpis)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500) 