"""
Professional, sector-aware, and forecasted financial statement calculation engine.
"""
from typing import Dict, Any, List, Optional
import math
import datetime

# Main entry point for all statement calculations
# This function decides which business type's calculation logic to use
# based on the company_type provided.
def calculate_statements(company_type: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculate all financial statements and tables for the given company type and input data.
    Routes to the correct sector logic and includes forecasting and loan amortization if needed.
    Returns a dict with all statements and tables ready for rendering.
    """
    if company_type == 'retail':
        return calculate_retail_statements(data)
    elif company_type == 'service':
        return calculate_service_statements(data)
    elif company_type == 'saas':
        return calculate_saas_statements(data)
    else:
        raise ValueError(f"Unknown company type: {company_type}")

# Sector-specific calculation stubs
def calculate_kpis_and_projections(income_statement, balance_sheet, cash_flow, forecast):
    # Calculate KPIs (example logic, can be improved)
    if not income_statement or not balance_sheet:
        return {}, {}
    # Use first year for KPIs
    inc = income_statement[0]
    bal = balance_sheet[0]
    revenue = inc.get('revenue', 0)
    gross_profit = inc.get('gross_profit', 0)
    operating_expenses = inc.get('operating_expenses', 0)
    net_income = inc.get('net_income', 0)
    total_assets = bal['assets'].get('total_assets', 0)
    total_liabilities = bal['liabilities'].get('total_liabilities', 0)
    total_equity = bal['equity'].get('total_equity', 0)
    gross_margin = (gross_profit / revenue * 100) if revenue else 0
    operating_margin = ((inc.get('ebit', 0) / revenue) * 100) if revenue else 0
    net_margin = (net_income / revenue * 100) if revenue else 0
    current_ratio = 1  # Placeholder, can be improved
    debt_to_equity = (total_liabilities / total_equity) if total_equity else 0
    roe = (net_income / total_equity * 100) if total_equity else 0
    roa = (net_income / total_assets * 100) if total_assets else 0
    kpis = {
        'gross_margin': gross_margin,
        'operating_margin': operating_margin,
        'net_margin': net_margin,
        'current_ratio': current_ratio,
        'debt_to_equity': debt_to_equity,
        'roe': roe,
        'roa': roa,
    }
    # Projections (use forecast table)
    projections = {
        'years': [f['year'] for f in forecast],
        'revenue': [f['revenue'] for f in forecast],
        'net_income': [f['net_income'] for f in forecast],
        'ebitda': [inc.get('ebitda', 0) for inc in income_statement[:len(forecast)]],
        'free_cash_flow': [f['free_cash_flow'] for f in forecast],
    }
    return kpis, projections

# Helper for breakdowns (example: monthly, by category)
def build_breakdowns(income_statement, items, cash_flow, business_type=None):
    # Revenue breakdown by product/service (for first year only)
    revenue = []
    if business_type == 'retail':
        # items = products
        for p in items:
            name = p.get('name') or p.get('product') or p.get('category') or 'Product'
            price = float(p.get('price', 0))
            units = float(p.get('units', 0)) * 12  # annualize
            value = price * units
            revenue.append({'category': name, 'value': value})
    elif business_type == 'service':
        # items = services
        for s in items:
            name = s.get('name') or s.get('service') or s.get('category') or 'Service'
            price = float(s.get('price', 0))
            clients = float(s.get('clients', 0)) * 12  # annualize
            value = price * clients
            revenue.append({'category': name, 'value': value})
    else:
        # fallback: just by year (original logic)
        revenue = [{'month': str(item['year']), 'value': item['revenue'], 'profit': item['net_income']} for item in income_statement]

    # Expense breakdown (by category, dummy)
    expense_categories = {}
    for e in items:
        cat = e.get('name', 'Other')
        amt = float(e.get('amount', 0))
        if cat in expense_categories:
            expense_categories[cat] += amt
        else:
            expense_categories[cat] = amt
    total_exp = sum(expense_categories.values()) or 1
    expense_breakdown = [
        {'category': k, 'amount': v, 'percent': v/total_exp, 'color': '#'+format(abs(hash(k))%0xFFFFFF, '06x')}
        for k, v in expense_categories.items()
    ]
    # Cash flow breakdown (dummy: by year)
    cashflow = [{'month': str(item['year']), 'operating': item.get('net_cash_from_operating_activities', 0),
                 'investing': item.get('net_cash_from_investing_activities', 0),
                 'financing': item.get('net_cash_from_financing_activities', 0)} for item in cash_flow]
    return revenue, expense_breakdown, cashflow

# Helper function to get the month number from a month name (e.g. 'April' -> 4)
def get_fiscal_year_start_month(month_name):
    months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ]
    try:
        return months.index(month_name) + 1
    except Exception:
        return 1  # Default to January

def safe_float(val, default=0.0):
    try:
        if val is None or val == '':
            return default
        return float(val)
    except (TypeError, ValueError):
        return default

def get_interest_rates(data: Dict[str, Any]) -> Dict[str, float]:
    """Get interest rates from input data or use defaults"""
    global_rates = data.get('globalInterestRates', {})
    
    return {
        'short_term': global_rates.get('shortTerm', 5.0) / 100,  # Default 5%
        'long_term': global_rates.get('longTerm', 6.0) / 100,   # Default 6%
        'investment': global_rates.get('investment', 4.0) / 100, # Default 4%
        'use_for_loans': global_rates.get('useForLoans', False),
    }

# --- Depreciation Calculation Helpers ---
def calc_depr_straight_line(cost, useful_life, salvage=0):
    return [(cost - salvage) / useful_life for _ in range(useful_life)]

def calc_depr_double_declining(cost, useful_life, salvage=0):
    rate = 2 / useful_life
    book = cost
    depr = []
    for year in range(useful_life):
        d = book * rate
        # Don't depreciate below salvage value
        if book - d < salvage:
            d = book - salvage
        depr.append(max(d, 0))
        book -= d
        if book <= salvage:
            break
    # Pad with zeros if needed
    while len(depr) < useful_life:
        depr.append(0)
    return depr

def calc_depr_syd(cost, useful_life, salvage=0):
    syd = useful_life * (useful_life + 1) // 2
    depr = []
    for year in range(useful_life):
        remaining = useful_life - year
        d = (remaining / syd) * (cost - salvage)
        depr.append(d)
    return depr

def calc_depr_units_of_production(cost, total_units, units_per_year, salvage=0):
    if not total_units or not units_per_year:
        return [0 for _ in range(len(units_per_year or []))]
    per_unit = (cost - salvage) / total_units
    return [per_unit * safe_float(u, 0) for u in units_per_year]

def calc_partial_year_fraction(purchase_date, fiscal_month):
    # Returns the fraction of the fiscal year the asset was held in the first year
    # If fiscal year starts in January, this is (12 - purchase_month + 1) / 12
    # For other fiscal months, adjust accordingly
    purchase_month = purchase_date.month
    if purchase_month >= fiscal_month:
        months_held = 12 - (purchase_month - fiscal_month)
    else:
        months_held = fiscal_month - purchase_month
    return max(min(months_held / 12, 1.0), 0.0)

# --- Main calculation for Retail Business ---
def calculate_retail_statements(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculate statements for a retail business.
    This includes:
      - Parsing all user input (products, expenses, equipment, loans, etc.)
      - Calculating growth rates and base values
      - Building arrays for each year (revenue, expenses, etc.)
      - Calculating depreciation, loan amortization, and investments
      - Building the income statement, balance sheet, and cash flow statement
    """
    # --- Parse input data ---
    products = data.get('products', [])
    expenses = data.get('expenses', [])
    equipment = data.get('equipment', [])
    loans = data.get('loans', [])
    other = data.get('other', [])
    self_funding = float(data.get('selfFunding', 0))
    tax_rate = float(data.get('taxRate', 25)) / 100
    forecast_years = int(data.get('forecastPeriod', 5))
    if forecast_years < 1:
        forecast_years = 1
    # Revenue input type: 'monthly' (default) or 'annual'
    revenue_input_type = data.get('revenueInputType', 'monthly')
    # Calculate average growth rates from input if present
    product_growths = [float(p.get('growthRate', 0) or 0) for p in products if 'growthRate' in p and p.get('growthRate') not in (None, '')]
    expense_growths = [float(e.get('growthRate', 0) or 0) for e in expenses if 'growthRate' in e and e.get('growthRate') not in (None, '')]
    # Use calculated growth rates, fallback to global rates, or use reasonable defaults for retail
    revenue_growth = (sum(product_growths) / len(product_growths) / 100) if product_growths else float(data.get('revenueGrowth', 5)) / 100  # Default 5% revenue growth
    expense_growth = (sum(expense_growths) / len(expense_growths) / 100) if expense_growths else float(data.get('expenseGrowth', 3)) / 100  # Default 3% expense growth
    # --- Fiscal year and date logic ---
    fiscal_year_start = data.get('fiscalYearStart', 'January')
    fiscal_month = get_fiscal_year_start_month(fiscal_year_start)
    current_date_str = data.get('currentDate')
    if current_date_str:
        current_date = datetime.datetime.fromisoformat(current_date_str)
    else:
        current_date = datetime.datetime.today()
    if current_date.month >= fiscal_month:
        base_year = current_date.year
    else:
        base_year = current_date.year - 1
    total_years = forecast_years + 1  # 1 actual + N forecast
    years = [f"FY{base_year + i}-{fiscal_year_start}" for i in range(total_years)]
    # Map year index to fiscal year
    fiscal_years = [base_year + i for i in range(total_years)]

    # --- Aggregate base year values ---
    # Multiply units by 12 if monthly, else use as-is
    def annualize_units(val):
        return float(val) * 12 if revenue_input_type == 'monthly' else float(val)
    base_revenue = sum(float(p.get('price',0)) * annualize_units(p.get('units',0)) for p in products)
    base_cogs = sum(float(p.get('cost',0)) * annualize_units(p.get('units',0)) for p in products)
    # Annualize expenses (amount per month × 12)
    base_expenses = sum(float(e.get('amount',0)) * 12 for e in expenses)
    # --- CapEx and Depreciation (Professional) ---
    # CapEx per year: sum of equipment purchased in that fiscal year
    capex = [0.0 for _ in range(total_years)]
    # Depreciation per year: sum of depreciation for all equipment active in that year
    # --- Updated for multiple depreciation methods ---
    depreciation = [0.0 for _ in range(total_years)]
    for eq in equipment:
        cost = float(eq.get('cost', 0))
        useful_life = int(eq.get('usefulLife', 5) or 5)
        method = eq.get('depreciationMethod', 'straight_line')
        salvage = safe_float(eq.get('salvageValue', 0))
        total_units = safe_float(eq.get('totalUnits', 0))
        units_per_year = eq.get('unitsPerYear', [])
        purchase_date_str = eq.get('purchaseDate')
        # Default: if no purchase date, assume base year
        if purchase_date_str:
            try:
                purchase_date = datetime.datetime.fromisoformat(purchase_date_str)
            except Exception:
                purchase_date = current_date
        else:
            purchase_date = current_date
        # Determine purchase fiscal year
        if purchase_date.month >= fiscal_month:
            purchase_fiscal_year = purchase_date.year
        else:
            purchase_fiscal_year = purchase_date.year - 1
        # Find index in fiscal_years
        if purchase_fiscal_year < base_year:
            purchase_idx = 0
        else:
            purchase_idx = purchase_fiscal_year - base_year
        # Add CapEx to the correct year
        if 0 <= purchase_idx < total_years:
            capex[purchase_idx] += cost
        # Calculate depreciation schedule
        depr_sched = []
        if method == 'double_declining':
            depr_sched = calc_depr_double_declining(cost, useful_life, salvage)
        elif method == 'sum_of_years_digits':
            depr_sched = calc_depr_syd(cost, useful_life, salvage)
        elif method == 'units_of_production':
            # units_per_year may be a list of strings, ensure it's a list of floats
            if isinstance(units_per_year, str):
                units_per_year = [safe_float(u, 0) for u in units_per_year.split(',')]
            depr_sched = calc_depr_units_of_production(cost, total_units, units_per_year, salvage)
        else:
            depr_sched = calc_depr_straight_line(cost, useful_life, salvage)
        # Apply partial year logic (except for units of production)
        if method != 'units_of_production' and depr_sched:
            fraction = calc_partial_year_fraction(purchase_date, fiscal_month)
            depr_sched[0] = depr_sched[0] * fraction
        # Add depreciation to each year, starting from purchase_idx
        for i, d in enumerate(depr_sched):
            year_idx = purchase_idx + i
            if 0 <= year_idx < total_years:
                depreciation[year_idx] += d
    base_loans = sum(float(l.get('amount',0)) for l in loans)
    base_other_income = sum(float(o.get('amount',0)) for o in other if o.get('isIncome'))
    base_other_costs = sum(float(o.get('amount',0)) for o in other if not o.get('isIncome'))
    investments = data.get('investments', [])
    
    # Get global interest rates for investment calculations
    interest_rates = get_interest_rates(data)
    
    # Calculate investment income using global rates if no specific income amount provided
    base_investment_income = 0
    for inv in investments:
        if inv.get('income'):
            # Use specific income amount if provided, otherwise calculate from investment rate
            specific_income = float(inv.get('incomeAmount', 0) or 0)
            if specific_income > 0:
                base_investment_income += specific_income
            else:
                # Calculate income using global investment rate
                inv_amount = float(inv.get('amount', 0) or 0)
                base_investment_income += inv_amount * interest_rates['investment']

    # --- Forecast arrays ---
    # Forecast each product separately using its own growth rate, then sum for total revenue and COGS
    revenue = []
    cogs = []
    for year in range(total_years):
        year_revenue = 0.0
        year_cogs = 0.0
        for p in products:
            price = float(p.get('price', 0))
            units = annualize_units(p.get('units', 0))
            growth = float(p.get('growthRate', 0) or 0) / 100
            cost = float(p.get('cost', 0))
            # For year 0, no growth. For year n, apply (1+growth)^n
            year_factor = (1 + growth) ** year
            year_revenue += price * units * year_factor
            year_cogs += cost * units * year_factor
        revenue.append(year_revenue)
        cogs.append(year_cogs)
    # Forecast each expense separately using its own growth rate, then sum for total expenses
    expenses_forecast = []
    for year in range(total_years):
        year_expenses = 0.0
        for e in expenses:
            amount = float(e.get('amount', 0)) * 12  # annualize
            growth = float(e.get('growthRate', 0) or 0) / 100
            year_factor = (1 + growth) ** year
            year_expenses += amount * year_factor
        expenses_forecast.append(year_expenses)
    other_income = [base_other_income for _ in range(total_years)]
    other_costs = [base_other_costs for _ in range(total_years)]
    loan_proceeds = [base_loans]
    investment_income = [base_investment_income for _ in range(total_years)]
    for i in range(1, total_years):
        expenses_forecast.append(expenses_forecast[-1] * (1 + expense_growth))
        other_income.append(other_income[-1])
        other_costs.append(other_costs[-1])
        loan_proceeds.append(0)  # Assume loans only in year 1 for simplicity

    # --- Income Statement Calculation ---
    # This block builds the income statement for each year
    # It calculates each line: revenue, COGS, gross profit, EBITDA, EBIT, interest, taxes, net income
    income_statement = []
    for i in range(total_years):
        gross_profit = revenue[i] - cogs[i]
        ebitda = gross_profit - expenses_forecast[i] + other_income[i] + investment_income[i] - other_costs[i]
        da = depreciation[i] if i < len(depreciation) else 0
        ebit = ebitda - da
        interest_expense = 0  # We'll add this from amortization if loans exist
        ebt = ebit - interest_expense
        taxes = ebt * tax_rate if ebt > 0 else 0
        net_income = ebt - taxes
        income_statement.append({
            'year': years[i],
            'revenue': revenue[i],
            'cogs': cogs[i],
            'gross_profit': gross_profit,
            'operating_expenses': expenses_forecast[i],
            'other_income': other_income[i],
            'investment_income': investment_income[i],
            'other_costs': other_costs[i],
            'ebitda': ebitda,
            'depreciation_amortization': da,
            'ebit': ebit,
            'interest_expense': interest_expense,
            'ebt': ebt,
            'taxes': taxes,
            'net_income': net_income,
        })

    # --- Amortization Table (if loans exist) ---
    amortization_tables = []
    total_interest_by_year = [0.0 for _ in range(forecast_years)]
    total_principal_by_year = [0.0 for _ in range(forecast_years)]
    principal_remaining_by_year = [0.0 for _ in range(total_years)]
    short_term_debt_by_year = [0.0 for _ in range(total_years)]
    long_term_debt_by_year = [0.0 for _ in range(total_years)]
    
    # Get global interest rates
    interest_rates = get_interest_rates(data)
    
    if base_loans > 0 and loans:
        for loan in loans:
            loan_amount = float(loan.get('amount', 0))
            
            # Use global rates if enabled, otherwise use loan-specific rate
            if interest_rates['use_for_loans']:
                # Determine if short-term or long-term based on repayment period
                years_loan = int(loan.get('years', loan.get('repaymentPeriod', forecast_years)) or forecast_years)
                if years_loan <= 1:
                    annual_rate = interest_rates['short_term']
                else:
                    annual_rate = interest_rates['long_term']
            else:
                annual_rate = float(loan.get('rate', loan.get('interestRate', 6)) or 6) / 100
                years_loan = int(loan.get('years', loan.get('repaymentPeriod', forecast_years)) or forecast_years)
            # Determine loan start year index
            start_date_str = loan.get('startDate')
            if start_date_str:
                try:
                    start_date = datetime.datetime.fromisoformat(start_date_str)
                    # Fiscal year start month
                    fiscal_month = get_fiscal_year_start_month(data.get('fiscalYearStart', 'January'))
                    if start_date.month >= fiscal_month:
                        loan_start_year = start_date.year
                    else:
                        loan_start_year = start_date.year - 1
                    # Index in years[]
                    loan_start_idx = loan_start_year - base_year
                    if loan_start_idx < 0:
                        loan_start_idx = 0
                except Exception:
                    loan_start_idx = 0
            else:
                loan_start_idx = 0
            amort_table = generate_amortization_table(loan_amount, annual_rate, years_loan, periods_per_year=1)
            amortization_tables.append(amort_table)
            # Track principal remaining for each year
            principal_remaining = loan_amount
            for i, row in enumerate(amort_table):
                year_idx = loan_start_idx + i
                if 0 <= year_idx < forecast_years:
                    total_interest_by_year[year_idx] += row['interest']
                    total_principal_by_year[year_idx] += row['principal']
                    # For short/long-term split
                    principal_remaining_by_year[year_idx] += principal_remaining
                    # Short-term: principal due next year
                    if i + 1 < len(amort_table):
                        short_term_debt_by_year[year_idx] += amort_table[i+1]['principal']
                    else:
                        short_term_debt_by_year[year_idx] += 0
                    # Long-term: remaining principal minus next year's principal
                    long_term_debt_by_year[year_idx] += max(principal_remaining - (amort_table[i+1]['principal'] if i + 1 < len(amort_table) else 0), 0)
                    principal_remaining -= row['principal']
    # Add interest expense to income statement
    for i in range(forecast_years):
        if i < len(income_statement):
            income_statement[i]['interest_expense'] = total_interest_by_year[i]
            income_statement[i]['ebt'] -= total_interest_by_year[i]
            taxes = income_statement[i]['ebt'] * tax_rate if income_statement[i]['ebt'] > 0 else 0
            income_statement[i]['taxes'] = taxes
            income_statement[i]['net_income'] = income_statement[i]['ebt'] - taxes

    # --- Cash Flow Statement (professional breakdown, indirect method) ---
    cash_flow = []
    ending_cash = self_funding + base_loans - capex[0] # Use capex[0] for the first year's CapEx
    # --- Working Capital Inputs ---
    credit_sales_percent = float(data.get('creditSales', {}).get('percent', 0)) / 100
    ar_days = float(data.get('creditSales', {}).get('collectionDays', 0))
    ap_days = float(data.get('accountsPayable', {}).get('days', 0))
    inventory_days = float(data.get('inventoryDays', 0))
    prev_ar = prev_ap = prev_inventory = 0.0
    opening_cash = ending_cash
    # --- Investment cash flows ---
    # Build per-year investment outflows and inflows
    investment_outflows = {y: 0.0 for y in years[:forecast_years]}
    investment_inflows = {y: 0.0 for y in years[:forecast_years]}
    for inv in investments:
        try:
            inv_amount = float(inv.get('amount', 0) or 0)
            inv_date = int(inv.get('date', current_date.year))
            maturity = inv.get('maturity')
            expected_return = float(inv.get('expectedReturn', 0) or 0)
            maturity_year = None
            # Maturity can be a year or a duration (years from date)
            if isinstance(maturity, int) or (isinstance(maturity, str) and maturity.isdigit()):
                maturity_year = int(maturity)
                if maturity_year < 1900:  # treat as duration
                    maturity_year = inv_date + int(maturity_year)
            elif isinstance(maturity, str) and '-' in maturity:
                # Try to parse as YYYY-MM-DD
                try:
                    maturity_year = int(maturity.split('-')[0])
                except Exception:
                    maturity_year = inv_date
            else:
                maturity_year = inv_date
            # Outflow: when investment is made
            if inv_date in investment_outflows:
                investment_outflows[inv_date] += inv_amount
            # Inflow: when investment matures
            if maturity_year in investment_inflows:
                investment_inflows[maturity_year] += inv_amount + expected_return
        except Exception:
            pass
    for i in range(forecast_years):
        net_income = income_statement[i]['net_income']
        da = income_statement[i]['depreciation_amortization'] if 'depreciation_amortization' in income_statement[i] else 0
        credit_sales = revenue[i] * credit_sales_percent
        ar = (credit_sales * ar_days) / 365 if ar_days > 0 else 0
        cogs_val = cogs[i]
        inventory = (cogs_val * inventory_days) / 365 if inventory_days > 0 else 0
        ap = (cogs_val * ap_days) / 365 if ap_days > 0 else 0
        change_ar = ar - prev_ar
        change_ap = ap - prev_ap
        change_inventory = inventory - prev_inventory
        prev_ar, prev_ap, prev_inventory = ar, ap, inventory
        # Operating
        operating_items = [
            ('Net Income', net_income),
            ('+ Depreciation', da),
            ('± Change in Accounts Receivable', -change_ar),
            ('± Change in Accounts Payable', change_ap),
            ('± Change in Inventory', -change_inventory),
        ]
        net_operating = sum(x[1] for x in operating_items)
        # Investing
        investing_items = [
            ('‣ Purchase of Equipment (CapEx)', -capex[i]),
        ]
        # Add investment outflows/inflows
        y = years[i]
        if investment_outflows.get(y, 0):
            investing_items.append(('‣ Investments Made', -investment_outflows[y]))
        if investment_inflows.get(y, 0):
            investing_items.append(('‣ Investment Maturities/Returns', investment_inflows[y]))
        net_investing = sum(x[1] for x in investing_items)
        # Financing
        loan_received = loan_proceeds[i]
        loan_repayment = 0
        if amortization_tables:
            for amort_table in amortization_tables:
                if i < len(amort_table):
                    loan_repayment -= amort_table[i]['principal']
        equity_investment = 0  # Not tracked separately
        self_funding_item = 0  # Not tracked separately
        financing_items = [
            ('‣ Loan Received', loan_received),
            ('‣ Loan Repayment', loan_repayment),
            #('‣ Equity Investment', equity_investment),
            #('‣ Self-Funding', self_funding_item),
        ]
        net_financing = sum(x[1] for x in financing_items)
        net_change_in_cash = net_operating + net_investing + net_financing
        closing_cash = opening_cash + net_change_in_cash
        cash_flow.append({
            'year': y,
            'operating_activities': operating_items,
            'net_cash_from_operating_activities': net_operating,
            'investing_activities': investing_items,
            'net_cash_from_investing_activities': net_investing,
            'financing_activities': financing_items,
            'net_cash_from_financing_activities': net_financing,
            'net_change_in_cash': net_change_in_cash,
            'opening_cash_balance': opening_cash,
            'closing_cash_balance': closing_cash,
        })
        opening_cash = closing_cash

    # --- Balance Sheet (simple, professional) ---
    balance_sheet = []
    prior_retained_earnings = 0
    ppe = capex[0] # Use capex[0] for the first year's CapEx
    long_term_debt = base_loans
    prev_inventory = 0.0
    prev_ar = 0.0
    prev_ap = 0.0
    # Calculate outstanding investments for each year
    outstanding_investments = []
    investment_made_by_year = [0.0 for _ in range(total_years)]
    investment_returned_by_year = [0.0 for _ in range(total_years)]
    for inv in investments:
        try:
            inv_amount = float(inv.get('amount', 0) or 0)
            inv_date = int(inv.get('date', current_date.year))
            maturity = inv.get('maturity')
            maturity_year = None
            if isinstance(maturity, int) or (isinstance(maturity, str) and maturity.isdigit()):
                maturity_year = int(maturity)
                if maturity_year < 1900:
                    maturity_year = inv_date + int(maturity_year)
            elif isinstance(maturity, str) and '-' in maturity:
                try:
                    maturity_year = int(maturity.split('-')[0])
                except Exception:
                    maturity_year = inv_date
            else:
                maturity_year = inv_date
            made_idx = inv_date - base_year
            matured_idx = maturity_year - base_year
            if 0 <= made_idx < total_years:
                investment_made_by_year[made_idx] += inv_amount
            if 0 <= matured_idx < total_years:
                investment_returned_by_year[matured_idx] += inv_amount
        except Exception:
            pass
    running_investment = 0.0
    for i in range(total_years):
        running_investment += investment_made_by_year[i]
        running_investment -= investment_returned_by_year[i]
        outstanding_investments.append(running_investment)
    for i in range(total_years):
        cash = cash_flow[i]['closing_cash_balance'] if i < len(cash_flow) else self_funding + base_loans - capex[0]
        # Calculate inventory as a current asset
        cogs_val = cogs[i]
        inventory_days = float(data.get('inventoryDays', 0))
        inventory = (cogs_val * inventory_days) / 365 if inventory_days > 0 else 0
        # Calculate accounts receivable as a current asset
        credit_sales_percent = float(data.get('creditSales', {}).get('percent', 0)) / 100
        ar_days = float(data.get('creditSales', {}).get('collectionDays', 0))
        credit_sales = revenue[i] * credit_sales_percent
        ar = (credit_sales * ar_days) / 365 if ar_days > 0 else 0
        # Calculate accounts payable as a current liability
        ap_days = float(data.get('accountsPayable', {}).get('days', 0))
        ap = (cogs_val * ap_days) / 365 if ap_days > 0 else 0
        retained_earnings = prior_retained_earnings + income_statement[i]['net_income']
        assets = {
            'cash': cash,
            'accounts_receivable': ar,
            'inventory': inventory,
            'ppe': ppe,
            'investments': outstanding_investments[i],
            'total_assets': cash + ar + inventory + ppe + outstanding_investments[i],
        }
        liabilities = {
            'accounts_payable': ap,
            'short_term_debt': short_term_debt_by_year[i] if i < len(short_term_debt_by_year) else 0,
            'long_term_debt': long_term_debt_by_year[i] if i < len(long_term_debt_by_year) else 0,
            'total_liabilities': ap + (short_term_debt_by_year[i] if i < len(short_term_debt_by_year) else 0) + (long_term_debt_by_year[i] if i < len(long_term_debt_by_year) else 0),
        }
        equity = {
            'share_capital': self_funding,
            'retained_earnings': retained_earnings,
            'total_equity': self_funding + retained_earnings,
        }
        balance_sheet.append({
            'year': years[i],
            'assets': assets,
            'liabilities': liabilities,
            'equity': equity,
        })
        prior_retained_earnings = retained_earnings

    # --- Forecast Table (summary) ---
    forecast = []
    for i in range(forecast_years):
        forecast.append({
            'year': years[i],
            'revenue': revenue[i],
            'net_income': income_statement[i]['net_income'],
            'free_cash_flow': cash_flow[i]['net_change_in_cash'],
        })

    # --- Amortization Table Output ---
    amortization_table = []
    for idx, amort_table in enumerate(amortization_tables):
        for row in amort_table:
            row_copy = row.copy()
            row_copy['loan_index'] = idx
            amortization_table.append(row_copy)

    # --- KPIs, Projections, Breakdowns ---
    kpis, projections = calculate_kpis_and_projections(income_statement, balance_sheet, cash_flow, forecast)
    revenue_breakdown, expense_breakdown, cashflow_breakdown = build_breakdowns(income_statement, products, cash_flow, 'retail')

    return {
        'income_statement': income_statement,
        'balance_sheet': balance_sheet,
        'cash_flow': cash_flow,
        'forecast': forecast,
        'kpis': kpis,
        'projections': projections,
        'revenue_breakdown': revenue_breakdown,
        'expense_breakdown': expense_breakdown,
        'cashflow_breakdown': cashflow_breakdown,
    }

def calculate_service_statements(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculate statements for a service business, skipping/including lines as appropriate.
    Includes forecasting and loan amortization if needed.
    """
    # --- Parse input data ---
    services = data.get('services', [])
    expenses = data.get('expenses', [])
    equipment = data.get('equipment', [])
    loans = data.get('loans', [])
    other = data.get('other', [])
    self_funding = float(data.get('selfFunding', 0))
    tax_rate = float(data.get('taxRate', 25)) / 100
    forecast_years = int(data.get('forecastPeriod', 5))
    if forecast_years < 1:
        forecast_years = 1
    # Revenue input type: 'monthly' (default) or 'annual'
    revenue_input_type = data.get('revenueInputType', 'monthly')
    # Calculate average growth rates from input if present
    service_growths = [float(s.get('growth', 0) or 0) for s in services if 'growth' in s and s.get('growth') not in (None, '')]
    expense_growths = [float(e.get('growthRate', 0) or 0) for e in expenses if 'growthRate' in e and e.get('growthRate') not in (None, '')]
    revenue_growth = (sum(service_growths) / len(service_growths) / 100) if service_growths else float(data.get('revenueGrowth', 0)) / 100
    expense_growth = (sum(expense_growths) / len(expense_growths) / 100) if expense_growths else float(data.get('expenseGrowth', 0)) / 100
    fiscal_year_start = data.get('fiscalYearStart', 'January')
    fiscal_month = get_fiscal_year_start_month(fiscal_year_start)
    current_date_str = data.get('currentDate')
    if current_date_str:
        current_date = datetime.datetime.fromisoformat(current_date_str)
    else:
        current_date = datetime.datetime.today()
    if current_date.month >= fiscal_month:
        base_year = current_date.year
    else:
        base_year = current_date.year - 1
    total_years = forecast_years + 1
    years = [f"FY{base_year + i}-{fiscal_year_start}" for i in range(total_years)]

    # --- Aggregate base year values ---
    # Multiply clients by 12 if monthly, else use as-is
    def annualize_clients(val):
        return float(val) * 12 if revenue_input_type == 'monthly' else float(val)
    base_revenue = sum(float(s.get('price',0)) * annualize_clients(s.get('clients',0)) for s in services)
    base_cogs = sum(float(s.get('cost',0)) * annualize_clients(s.get('clients',0)) for s in services)
    # Annualize expenses (amount per month × 12)
    base_expenses = sum(float(e.get('amount',0)) * 12 for e in expenses)
    # --- CapEx and Depreciation (Professional) ---
    capex = [0.0 for _ in range(total_years)]
    depreciation = [0.0 for _ in range(total_years)]
    for eq in equipment:
        cost = float(eq.get('cost', 0))
        useful_life = int(eq.get('usefulLife', 5) or 5)
        method = eq.get('depreciationMethod', 'straight_line')
        salvage = safe_float(eq.get('salvageValue', 0))
        total_units = safe_float(eq.get('totalUnits', 0))
        units_per_year = eq.get('unitsPerYear', [])
        purchase_date_str = eq.get('purchaseDate')
        # Default: if no purchase date, assume base year
        if purchase_date_str:
            try:
                purchase_date = datetime.datetime.fromisoformat(purchase_date_str)
            except Exception:
                purchase_date = current_date
        else:
            purchase_date = current_date
        # Determine purchase fiscal year
        if purchase_date.month >= fiscal_month:
            purchase_fiscal_year = purchase_date.year
        else:
            purchase_fiscal_year = purchase_date.year - 1
        # Find index in fiscal_years
        if purchase_fiscal_year < base_year:
            purchase_idx = 0
        else:
            purchase_idx = purchase_fiscal_year - base_year
        # Add CapEx to the correct year
        if 0 <= purchase_idx < total_years:
            capex[purchase_idx] += cost
        # Calculate depreciation schedule
        depr_sched = []
        if method == 'double_declining':
            depr_sched = calc_depr_double_declining(cost, useful_life, salvage)
        elif method == 'sum_of_years_digits':
            depr_sched = calc_depr_syd(cost, useful_life, salvage)
        elif method == 'units_of_production':
            # units_per_year may be a list of strings, ensure it's a list of floats
            if isinstance(units_per_year, str):
                units_per_year = [safe_float(u, 0) for u in units_per_year.split(',')]
            depr_sched = calc_depr_units_of_production(cost, total_units, units_per_year, salvage)
        else:
            depr_sched = calc_depr_straight_line(cost, useful_life, salvage)
        # Apply partial year logic (except for units of production)
        if method != 'units_of_production' and depr_sched:
            fraction = calc_partial_year_fraction(purchase_date, fiscal_month)
            depr_sched[0] = depr_sched[0] * fraction
        # Add depreciation to each year, starting from purchase_idx
        for i, d in enumerate(depr_sched):
            year_idx = purchase_idx + i
            if 0 <= year_idx < total_years:
                depreciation[year_idx] += d
    base_loans = sum(float(l.get('amount',0)) for l in loans)
    base_other_income = sum(float(o.get('amount',0)) for o in other if o.get('isIncome'))
    base_other_costs = sum(float(o.get('amount',0)) for o in other if not o.get('isIncome'))
    investments = data.get('investments', [])
    
    # Get global interest rates for investment calculations
    interest_rates = get_interest_rates(data)
    
    # Calculate investment income using global rates if no specific income amount provided
    base_investment_income = 0
    for inv in investments:
        if inv.get('income'):
            # Use specific income amount if provided, otherwise calculate from investment rate
            specific_income = float(inv.get('incomeAmount', 0) or 0)
            if specific_income > 0:
                base_investment_income += specific_income
            else:
                # Calculate income using global investment rate
                inv_amount = float(inv.get('amount', 0) or 0)
                base_investment_income += inv_amount * interest_rates['investment']

    # --- Forecast arrays ---
    # Forecast each service separately using its own growth rate, then sum for total revenue and COGS
    revenue = []
    cogs = []
    for year in range(total_years):
        year_revenue = 0.0
        year_cogs = 0.0
        for s in services:
            price = float(s.get('price', 0))
            clients = annualize_clients(s.get('clients', 0))
            growth = float(s.get('growth', 0) or 0) / 100
            cost = float(s.get('cost', 0))
            year_factor = (1 + growth) ** year
            year_revenue += price * clients * year_factor
            year_cogs += cost * clients * year_factor
        revenue.append(year_revenue)
        cogs.append(year_cogs)
    # Forecast each expense separately using its own growth rate, then sum for total expenses
    expenses_forecast = []
    for year in range(total_years):
        year_expenses = 0.0
        for e in expenses:
            amount = float(e.get('amount', 0)) * 12  # annualize
            growth = float(e.get('growthRate', 0) or 0) / 100
            year_factor = (1 + growth) ** year
            year_expenses += amount * year_factor
        expenses_forecast.append(year_expenses)
    other_income = [base_other_income for _ in range(total_years)]
    other_costs = [base_other_costs for _ in range(total_years)]
    loan_proceeds = [base_loans]
    investment_income = [base_investment_income for _ in range(total_years)]
    for i in range(1, total_years):
        expenses_forecast.append(expenses_forecast[-1] * (1 + expense_growth))
        other_income.append(other_income[-1])
        other_costs.append(other_costs[-1])
        loan_proceeds.append(0)  # Assume loans only in year 1 for simplicity

    # --- Income Statement ---
    income_statement = []
    for i in range(total_years):
        gross_profit = revenue[i] - cogs[i]
        ebitda = gross_profit - expenses_forecast[i] + other_income[i] + investment_income[i] - other_costs[i]
        da = depreciation[i] if i < len(depreciation) else 0
        ebit = ebitda - da
        interest_expense = 0  # We'll add this from amortization if loans exist
        ebt = ebit - interest_expense
        taxes = ebt * tax_rate if ebt > 0 else 0
        net_income = ebt - taxes
        income_statement.append({
            'year': years[i],
            'revenue': revenue[i],
            'cogs': cogs[i],
            'gross_profit': gross_profit,
            'operating_expenses': expenses_forecast[i],
            'other_income': other_income[i],
            'investment_income': investment_income[i],
            'other_costs': other_costs[i],
            'ebitda': ebitda,
            'depreciation_amortization': da,
            'ebit': ebit,
            'interest_expense': interest_expense,
            'ebt': ebt,
            'taxes': taxes,
            'net_income': net_income,
        })

    # --- Amortization Table (if loans exist) ---
    amortization_tables = []
    total_interest_by_year = [0.0 for _ in range(forecast_years)]
    total_principal_by_year = [0.0 for _ in range(forecast_years)]
    principal_remaining_by_year = [0.0 for _ in range(total_years)]
    short_term_debt_by_year = [0.0 for _ in range(total_years)]
    long_term_debt_by_year = [0.0 for _ in range(total_years)]
    
    # Get global interest rates
    interest_rates = get_interest_rates(data)
    
    if base_loans > 0 and loans:
        for loan in loans:
            loan_amount = float(loan.get('amount', 0))
            
            # Use global rates if enabled, otherwise use loan-specific rate
            if interest_rates['use_for_loans']:
                # Determine if short-term or long-term based on repayment period
                years_loan = int(loan.get('years', forecast_years))
                if years_loan <= 1:
                    annual_rate = interest_rates['short_term']
                else:
                    annual_rate = interest_rates['long_term']
            else:
                annual_rate = float(loan.get('rate', 6)) / 100
                years_loan = int(loan.get('years', forecast_years))
            start_date_str = loan.get('startDate')
            if start_date_str:
                try:
                    start_date = datetime.datetime.fromisoformat(start_date_str)
                    fiscal_month = get_fiscal_year_start_month(data.get('fiscalYearStart', 'January'))
                    if start_date.month >= fiscal_month:
                        loan_start_year = start_date.year
                    else:
                        loan_start_year = start_date.year - 1
                    loan_start_idx = loan_start_year - base_year
                    if loan_start_idx < 0:
                        loan_start_idx = 0
                except Exception:
                    loan_start_idx = 0
            else:
                loan_start_idx = 0
            amort_table = generate_amortization_table(loan_amount, annual_rate, years_loan, periods_per_year=1)
            amortization_tables.append(amort_table)
            # Track principal remaining for each year
            principal_remaining = loan_amount
            for i, row in enumerate(amort_table):
                year_idx = loan_start_idx + i
                if 0 <= year_idx < forecast_years:
                    total_interest_by_year[year_idx] += row['interest']
                    total_principal_by_year[year_idx] += row['principal']
                    # For short/long-term split
                    principal_remaining_by_year[year_idx] += principal_remaining
                    # Short-term: principal due next year
                    if i + 1 < len(amort_table):
                        short_term_debt_by_year[year_idx] += amort_table[i+1]['principal']
                    else:
                        short_term_debt_by_year[year_idx] += 0
                    # Long-term: remaining principal minus next year's principal
                    long_term_debt_by_year[year_idx] += max(principal_remaining - (amort_table[i+1]['principal'] if i + 1 < len(amort_table) else 0), 0)
                    principal_remaining -= row['principal']
    # Add interest expense to income statement
    for i in range(forecast_years):
        if i < len(income_statement):
            income_statement[i]['interest_expense'] = total_interest_by_year[i]
            income_statement[i]['ebt'] -= total_interest_by_year[i]
            taxes = income_statement[i]['ebt'] * tax_rate if income_statement[i]['ebt'] > 0 else 0
            income_statement[i]['taxes'] = taxes
            income_statement[i]['net_income'] = income_statement[i]['ebt'] - taxes

    # --- Cash Flow Statement ---
    cash_flow = []
    ending_cash = self_funding + base_loans - capex[0] # Use capex[0] for the first year's CapEx
    # --- Working Capital Inputs ---
    credit_sales_percent = float(data.get('creditSales', {}).get('percent', 0)) / 100
    ar_days = float(data.get('creditSales', {}).get('collectionDays', 0))
    ap_days = float(data.get('accountsPayable', {}).get('days', 0))
    inventory_days = float(data.get('inventoryDays', 0))
    prev_ar = prev_ap = 0.0
    opening_cash = ending_cash
    for i in range(forecast_years):
        net_income = income_statement[i]['net_income']
        da = income_statement[i]['depreciation_amortization'] if 'depreciation_amortization' in income_statement[i] else 0
        credit_sales = revenue[i] * credit_sales_percent
        ar = (credit_sales * ar_days) / 365 if ar_days > 0 else 0
        cogs_val = cogs[i]
        ap = (cogs_val * ap_days) / 365 if ap_days > 0 else 0
        change_ar = ar - prev_ar
        change_ap = ap - prev_ap
        change_inventory = 0.0  # No inventory for service/saas
        prev_ar, prev_ap = ar, ap
        operating = net_income + da - change_ar + change_ap
        investing = -capex[i]
        financing = loan_proceeds[i]
        if amortization_tables:
            for amort_table in amortization_tables:
                if i < len(amort_table):
                    financing -= amort_table[i]['principal']
        net_cash_flow = operating + investing + financing
        ending_cash += net_cash_flow
        cash_flow.append({
            'year': years[i],
            'operating_activities': [
                ('Net Income', net_income),
                ('+ Depreciation', da),
                ('± Change in Accounts Receivable', -change_ar),
                ('± Change in Accounts Payable', change_ap),
                ('± Change in Inventory', -change_inventory),
            ],
            'net_cash_from_operating_activities': operating,
            'investing_activities': [('‣ Purchase of Equipment (CapEx)', -capex[i])],
            'net_cash_from_investing_activities': investing,
            'financing_activities': [
                ('‣ Loan Received', loan_proceeds[i]),
                ('‣ Loan Repayment', -financing),
            ],
            'net_cash_from_financing_activities': financing,
            'net_change_in_cash': net_cash_flow,
            'ending_cash': ending_cash,
            'change_ar': change_ar,
            'change_ap': change_ap,
        })
        opening_cash = ending_cash

    # --- Balance Sheet ---
    balance_sheet = []
    prior_retained_earnings = 0
    ppe = capex[0] # Use capex[0] for the first year's CapEx
    long_term_debt = base_loans
    # Calculate outstanding investments for each year
    outstanding_investments = []
    investment_made_by_year = [0.0 for _ in range(forecast_years)]
    investment_returned_by_year = [0.0 for _ in range(forecast_years)]
    for inv in investments:
        try:
            inv_amount = float(inv.get('amount', 0) or 0)
            inv_date = int(inv.get('date', current_date.year))
            maturity = inv.get('maturity')
            maturity_year = None
            if isinstance(maturity, int) or (isinstance(maturity, str) and str(maturity).isdigit()):
                maturity_year = int(maturity)
                if maturity_year < 1900:
                    maturity_year = inv_date + int(maturity_year)
            elif isinstance(maturity, str) and '-' in maturity:
                try:
                    maturity_year = int(maturity.split('-')[0])
                except Exception:
                    maturity_year = inv_date
            else:
                maturity_year = inv_date
            made_idx = inv_date - base_year
            matured_idx = maturity_year - base_year
            if 0 <= made_idx < forecast_years:
                investment_made_by_year[made_idx] += inv_amount
            if 0 <= matured_idx < forecast_years:
                investment_returned_by_year[matured_idx] += inv_amount
        except Exception:
            pass
    running_investment = 0.0
    for i in range(forecast_years):
        running_investment += investment_made_by_year[i]
        running_investment -= investment_returned_by_year[i]
        outstanding_investments.append(running_investment)
    for i in range(forecast_years):
        retained_earnings = prior_retained_earnings + income_statement[i]['net_income']
        assets = {
            'cash': cash_flow[i]['ending_cash'],
            'ppe': ppe,
            'investments': outstanding_investments[i],
            'total_assets': cash_flow[i]['ending_cash'] + ppe + outstanding_investments[i],
        }
        liabilities = {
            'long_term_debt': long_term_debt,
            'total_liabilities': long_term_debt,
        }
        equity = {
            'share_capital': self_funding,
            'retained_earnings': retained_earnings,
            'total_equity': self_funding + retained_earnings,
        }
        balance_sheet.append({
            'year': years[i] if i < len(years) else f'Year {i+1}',
            'assets': assets,
            'liabilities': liabilities,
            'equity': equity,
        })
        prior_retained_earnings = retained_earnings


    # --- Forecast Table ---
    forecast = []
    min_len = min(forecast_years, len(years), len(revenue), len(income_statement), len(cash_flow))
    for i in range(min_len):
        forecast.append({
            'year': years[i],
            'revenue': revenue[i],
            'net_income': income_statement[i]['net_income'],
            'free_cash_flow': cash_flow[i]['net_change_in_cash'],
        })

    # --- Amortization Table Output ---
    amortization_table = []
    for idx, amort_table in enumerate(amortization_tables):
        for row in amort_table:
            row_copy = row.copy()
            row_copy['loan_index'] = idx
            amortization_table.append(row_copy)

    # --- KPIs, Projections, Breakdowns ---
    kpis, projections = calculate_kpis_and_projections(income_statement, balance_sheet, cash_flow, forecast)
    revenue_breakdown, expense_breakdown, cashflow_breakdown = build_breakdowns(income_statement, services, cash_flow, 'service')

    return {
        'income_statement': income_statement,
        'balance_sheet': balance_sheet,
        'cash_flow': cash_flow,
        'forecast': forecast,
        'kpis': kpis,
        'projections': projections,
        'revenue_breakdown': revenue_breakdown,
        'expense_breakdown': expense_breakdown,
        'cashflow_breakdown': cashflow_breakdown,
    }


def calculate_saas_statements(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculate statements for a SaaS business, skipping/including lines as appropriate.
    Includes forecasting and loan amortization if needed.
    """
    # --- Defensive input validation ---
    plans = data.get('plans', [])
    if not plans or not isinstance(plans, list):
        raise ValueError("No SaaS plans provided. Please add at least one plan with valid data.")
    valid_plans = []
    for p in plans:
        try:
            price = safe_float(p.get('price', ''))
            users = safe_float(p.get('users', ''))
            cost_per_user = safe_float(p.get('costPerUser', ''))
            if price > 0 and users > 0 and cost_per_user >= 0:
                valid_plans.append(p)
        except (TypeError, ValueError):
            continue
    if len(valid_plans) == 0:
        raise ValueError("All SaaS plans are missing required fields or contain invalid numbers. Each plan must have a valid price, users, and cost per user.")
    plans = valid_plans
    # --- Parse input data ---
    # Always ensure lists
    expenses = data.get('expenses', []) or []
    equipment = data.get('equipment', []) or []
    loans = data.get('loans', []) or []
    other = data.get('other', []) or []
    investments = data.get('investments', []) or []
    self_funding = safe_float(data.get('selfFunding', 0))
    tax_rate = safe_float(data.get('taxRate', 25)) / 100
    # Robust forecast period extraction
    forecast_years = None
    if 'forecastPeriod' in data:
        forecast_years = safe_float(data.get('forecastPeriod', 5))
    elif 'forecast' in data and isinstance(data['forecast'], dict) and 'period' in data['forecast']:
        forecast_years = safe_float(data['forecast']['period'], 5)
    else:
        forecast_years = 5
    forecast_years = int(forecast_years)
    if forecast_years < 1:
        forecast_years = 1
    # Revenue input type: 'monthly' (default) or 'annual'
    revenue_input_type = data.get('revenueInputType', 'monthly')
    # Calculate average growth rates from input if present (like Service/Retail)
    plan_growths = [safe_float(p.get('growth', 0)) for p in plans if 'growth' in p and p.get('growth') not in (None, '')]
    expense_growths = [safe_float(e.get('growthRate', 0)) for e in expenses if 'growthRate' in e and e.get('growthRate') not in (None, '')]
    revenue_growth = (sum(plan_growths) / len(plan_growths) / 100) if plan_growths else safe_float(data.get('revenueGrowth', 0)) / 100
    expense_growth = (sum(expense_growths) / len(expense_growths) / 100) if expense_growths else safe_float(data.get('expenseGrowth', 0)) / 100
    fiscal_year_start = data.get('fiscalYearStart', 'January')
    fiscal_month = get_fiscal_year_start_month(fiscal_year_start)
    current_date_str = data.get('currentDate')
    if current_date_str:
        current_date = datetime.datetime.fromisoformat(current_date_str)
    else:
        current_date = datetime.datetime.today()
    if current_date.month >= fiscal_month:
        base_year = current_date.year
    else:
        base_year = current_date.year - 1
    total_years = forecast_years + 1
    years = [f"FY{base_year + i}-{fiscal_year_start}" for i in range(total_years)]

    # --- Aggregate base year values ---
    # Multiply users by 12 if monthly, else use as-is
    def annualize_users(val):
        return safe_float(val) * 12 if revenue_input_type == 'monthly' else safe_float(val)
    base_revenue = sum(safe_float(p.get('price',0)) * annualize_users(p.get('users',0)) for p in plans)
    base_cogs = sum(safe_float(p.get('costPerUser',0)) * annualize_users(p.get('users',0)) for p in plans)
    # Annualize expenses (amount per month × 12)
    base_expenses = sum(safe_float(e.get('amount',0)) * 12 for e in expenses)
    # --- CapEx and Depreciation (Professional) ---
    capex = [0.0 for _ in range(total_years)]
    depreciation = [0.0 for _ in range(total_years)]
    for eq in equipment:
        cost = safe_float(eq.get('cost', 0))
        useful_life = int(safe_float(eq.get('usefulLife', 5)) or 5)
        method = eq.get('depreciationMethod', 'straight_line')
        salvage = safe_float(eq.get('salvageValue', 0))
        total_units = safe_float(eq.get('totalUnits', 0))
        units_per_year = eq.get('unitsPerYear', [])
        purchase_date_str = eq.get('purchaseDate')
        if purchase_date_str:
            try:
                purchase_date = datetime.datetime.fromisoformat(purchase_date_str)
            except Exception:
                purchase_date = current_date
        else:
            purchase_date = current_date
        if purchase_date.month >= fiscal_month:
            purchase_fiscal_year = purchase_date.year
        else:
            purchase_fiscal_year = purchase_date.year - 1
        if purchase_fiscal_year < base_year:
            purchase_idx = 0
        else:
            purchase_idx = purchase_fiscal_year - base_year
        if 0 <= purchase_idx < total_years:
            capex[purchase_idx] += cost
        # Calculate depreciation schedule
        depr_sched = []
        if method == 'double_declining':
            depr_sched = calc_depr_double_declining(cost, useful_life, salvage)
        elif method == 'sum_of_years_digits':
            depr_sched = calc_depr_syd(cost, useful_life, salvage)
        elif method == 'units_of_production':
            # units_per_year may be a list of strings, ensure it's a list of floats
            if isinstance(units_per_year, str):
                units_per_year = [safe_float(u, 0) for u in units_per_year.split(',')]
            depr_sched = calc_depr_units_of_production(cost, total_units, units_per_year, salvage)
        else:
            depr_sched = calc_depr_straight_line(cost, useful_life, salvage)
        # Apply partial year logic (except for units of production)
        if method != 'units_of_production' and depr_sched:
            fraction = calc_partial_year_fraction(purchase_date, fiscal_month)
            depr_sched[0] = depr_sched[0] * fraction
        # Add depreciation to each year, starting from purchase_idx
        for i, d in enumerate(depr_sched):
            year_idx = purchase_idx + i
            if 0 <= year_idx < total_years:
                depreciation[year_idx] += d
    base_loans = sum(safe_float(l.get('amount',0)) for l in loans)
    base_other_income = sum(safe_float(o.get('amount',0)) for o in other if o.get('isIncome'))
    base_other_costs = sum(safe_float(o.get('amount',0)) for o in other if not o.get('isIncome'))
    
    # Get global interest rates for investment calculations
    interest_rates = get_interest_rates(data)
    
    # Calculate investment income using global rates if no specific income amount provided
    base_investment_income = 0
    for inv in investments:
        if inv.get('income'):
            # Use specific income amount if provided, otherwise calculate from investment rate
            specific_income = safe_float(inv.get('incomeAmount', 0))
            if specific_income > 0:
                base_investment_income += specific_income
            else:
                # Calculate income using global investment rate
                inv_amount = safe_float(inv.get('amount', 0))
                base_investment_income += inv_amount * interest_rates['investment']

    # --- Forecast arrays ---
    revenue = []
    cogs = []
    for year in range(total_years):
        year_revenue = 0.0
        year_cogs = 0.0
        for p in plans:
            price = safe_float(p.get('price', 0))
            users = annualize_users(p.get('users', 0))
            growth = safe_float(p.get('growth', 0)) / 100
            cost_per_user = safe_float(p.get('costPerUser', 0))
            year_factor = (1 + growth) ** year
            year_revenue += price * users * year_factor
            year_cogs += cost_per_user * users * year_factor
        revenue.append(year_revenue)
        cogs.append(year_cogs)
    expenses_forecast = []
    for year in range(total_years):
        year_expenses = 0.0
        for e in expenses:
            amount = safe_float(e.get('amount', 0)) * 12
            growth = safe_float(e.get('growthRate', 0)) / 100
            year_factor = (1 + growth) ** year
            year_expenses += amount * year_factor
        expenses_forecast.append(year_expenses)
    other_income = [base_other_income for _ in range(total_years)]
    other_costs = [base_other_costs for _ in range(total_years)]
    loan_proceeds = [base_loans]
    investment_income = [base_investment_income for _ in range(total_years)]
    for i in range(1, total_years):
        expenses_forecast.append(expenses_forecast[-1] * (1 + expense_growth))
        other_income.append(other_income[-1])
        other_costs.append(other_costs[-1])
        loan_proceeds.append(0)
    # ... existing code ...

    # --- Income Statement ---
    income_statement = []
    for i in range(total_years):
        gross_profit = revenue[i] - cogs[i]
        ebitda = gross_profit - expenses_forecast[i] + other_income[i] + investment_income[i] - other_costs[i]
        da = depreciation[i] if i < len(depreciation) else 0
        ebit = ebitda - da
        interest_expense = 0  # We'll add this from amortization if loans exist
        ebt = ebit - interest_expense
        taxes = ebt * tax_rate if ebt > 0 else 0
        net_income = ebt - taxes
        income_statement.append({
            'year': years[i],
            'revenue': revenue[i],
            'cogs': cogs[i],
            'gross_profit': gross_profit,
            'operating_expenses': expenses_forecast[i],
            'other_income': other_income[i],
            'investment_income': investment_income[i],
            'other_costs': other_costs[i],
            'ebitda': ebitda,
            'depreciation_amortization': da,
            'ebit': ebit,
            'interest_expense': interest_expense,
            'ebt': ebt,
            'taxes': taxes,
            'net_income': net_income,
        })

    # --- Amortization Table (if loans exist) ---
    amortization_tables = []
    total_interest_by_year = [0.0 for _ in range(forecast_years)]
    total_principal_by_year = [0.0 for _ in range(forecast_years)]
    principal_remaining_by_year = [0.0 for _ in range(total_years)]
    short_term_debt_by_year = [0.0 for _ in range(total_years)]
    long_term_debt_by_year = [0.0 for _ in range(total_years)]
    
    # Get global interest rates
    interest_rates = get_interest_rates(data)
    
    if base_loans > 0 and loans:
        for loan in loans:
            loan_amount = float(loan.get('amount', 0))
            
            # Use global rates if enabled, otherwise use loan-specific rate
            if interest_rates['use_for_loans']:
                # Determine if short-term or long-term based on repayment period
                years_loan = int(loan.get('years', forecast_years))
                if years_loan <= 1:
                    annual_rate = interest_rates['short_term']
                else:
                    annual_rate = interest_rates['long_term']
            else:
                annual_rate = float(loan.get('rate', 6)) / 100
                years_loan = int(loan.get('years', forecast_years))
            start_date_str = loan.get('startDate')
            if start_date_str:
                try:
                    start_date = datetime.datetime.fromisoformat(start_date_str)
                    fiscal_month = get_fiscal_year_start_month(data.get('fiscalYearStart', 'January'))
                    if start_date.month >= fiscal_month:
                        loan_start_year = start_date.year
                    else:
                        loan_start_year = start_date.year - 1
                    loan_start_idx = loan_start_year - base_year
                    if loan_start_idx < 0:
                        loan_start_idx = 0
                except Exception:
                    loan_start_idx = 0
            else:
                loan_start_idx = 0
            amort_table = generate_amortization_table(loan_amount, annual_rate, years_loan, periods_per_year=1)
            amortization_tables.append(amort_table)
            # Track principal remaining for each year
            principal_remaining = loan_amount
            for i, row in enumerate(amort_table):
                year_idx = loan_start_idx + i
                if 0 <= year_idx < forecast_years:
                    total_interest_by_year[year_idx] += row['interest']
                    total_principal_by_year[year_idx] += row['principal']
                    # For short/long-term split
                    principal_remaining_by_year[year_idx] += principal_remaining
                    # Short-term: principal due next year
                    if i + 1 < len(amort_table):
                        short_term_debt_by_year[year_idx] += amort_table[i+1]['principal']
                    else:
                        short_term_debt_by_year[year_idx] += 0
                    # Long-term: remaining principal minus next year's principal
                    long_term_debt_by_year[year_idx] += max(principal_remaining - (amort_table[i+1]['principal'] if i + 1 < len(amort_table) else 0), 0)
                    principal_remaining -= row['principal']
    # Add interest expense to income statement
    for i in range(forecast_years):
        if i < len(income_statement):
            income_statement[i]['interest_expense'] = total_interest_by_year[i]
            income_statement[i]['ebt'] -= total_interest_by_year[i]
            taxes = income_statement[i]['ebt'] * tax_rate if income_statement[i]['ebt'] > 0 else 0
            income_statement[i]['taxes'] = taxes
            income_statement[i]['net_income'] = income_statement[i]['ebt'] - taxes

    # --- Cash Flow Statement ---
    cash_flow = []
    ending_cash = self_funding + base_loans - capex[0] # Use capex[0] for the first year's CapEx
    # --- Working Capital Inputs ---
    credit_sales_percent = float(data.get('creditSales', {}).get('percent', 0)) / 100
    ar_days = float(data.get('creditSales', {}).get('collectionDays', 0))
    ap_days = float(data.get('accountsPayable', {}).get('days', 0))
    inventory_days = float(data.get('inventoryDays', 0))
    prev_ar = prev_ap = 0.0
    opening_cash = ending_cash
    for i in range(forecast_years):
        net_income = income_statement[i]['net_income']
        da = income_statement[i]['depreciation_amortization'] if 'depreciation_amortization' in income_statement[i] else 0
        credit_sales = revenue[i] * credit_sales_percent
        ar = (credit_sales * ar_days) / 365 if ar_days > 0 else 0
        cogs_val = cogs[i]
        ap = (cogs_val * ap_days) / 365 if ap_days > 0 else 0
        change_ar = ar - prev_ar
        change_ap = ap - prev_ap
        change_inventory = 0.0  # No inventory for service/saas
        prev_ar, prev_ap = ar, ap
        operating = net_income + da - change_ar + change_ap
        investing = -capex[i]
        financing = loan_proceeds[i]
        if amortization_tables:
            for amort_table in amortization_tables:
                if i < len(amort_table):
                    financing -= amort_table[i]['principal']
        net_cash_flow = operating + investing + financing
        ending_cash += net_cash_flow
        cash_flow.append({
            'year': years[i],
            'operating_activities': [
                ('Net Income', net_income),
                ('Depreciation', da),
                ('Change in Accounts Receivable', -change_ar),
                ('Change in Accounts Payable', change_ap),
                ('Change in Inventory', -change_inventory),
            ],
            'net_cash_from_operating_activities': operating,
            'investing_activities': [('‣ Purchase of Equipment (CapEx)', -capex[i])],
            'net_cash_from_investing_activities': investing,
            'financing_activities': [
                ('‣ Loan Received', loan_proceeds[i]),
                ('‣ Loan Repayment', -financing),
            ],
            'net_cash_from_financing_activities': financing,
            'net_change_in_cash': net_cash_flow,
            'ending_cash': ending_cash,
            'change_ar': change_ar,
            'change_ap': change_ap,
        })
        opening_cash = ending_cash

    # --- Owner Drawings (Professional) ---
    owner_drawings_input = data.get('ownerDrawings', 0)
    min_len_bs = min(total_years, len(income_statement), len(cash_flow), len(years))
    if isinstance(owner_drawings_input, list):
        owner_drawings = [safe_float(val) for val in owner_drawings_input] + [0.0] * (min_len_bs - len(owner_drawings_input))
        owner_drawings = owner_drawings[:min_len_bs]
    else:
        owner_drawings = [safe_float(owner_drawings_input) for _ in range(min_len_bs)]
    # --- Balance Sheet (subtract cumulative owner drawings from retained earnings) ---
    balance_sheet = []
    prior_retained_earnings = 0
    ppe = capex[0] if capex else 0 # Use capex[0] for the first year's CapEx
    long_term_debt = base_loans
    cumulative_drawings = 0.0
    # Calculate outstanding investments for each year
    outstanding_investments = []
    investment_made_by_year = [0.0 for _ in range(min_len_bs)]
    investment_returned_by_year = [0.0 for _ in range(min_len_bs)]
    for inv in investments:
        try:
            inv_amount = safe_float(inv.get('amount', 0))
            inv_date = int(inv.get('date', current_date.year))
            maturity = inv.get('maturity')
            maturity_year = None
            if isinstance(maturity, int) or (isinstance(maturity, str) and str(maturity).isdigit()):
                maturity_year = int(maturity)
                if maturity_year < 1900:
                    maturity_year = inv_date + int(maturity_year)
            elif isinstance(maturity, str) and '-' in maturity:
                try:
                    maturity_year = int(maturity.split('-')[0])
                except Exception:
                    maturity_year = inv_date
            else:
                maturity_year = inv_date
            made_idx = inv_date - base_year
            matured_idx = maturity_year - base_year
            if 0 <= made_idx < min_len_bs:
                investment_made_by_year[made_idx] += inv_amount
            if 0 <= matured_idx < min_len_bs:
                investment_returned_by_year[matured_idx] += inv_amount
        except Exception:
            pass
    running_investment = 0.0
    for i in range(min_len_bs):
        running_investment += investment_made_by_year[i]
        running_investment -= investment_returned_by_year[i]
        outstanding_investments.append(running_investment)
    for i in range(min_len_bs):
        retained_earnings = prior_retained_earnings + (income_statement[i]['net_income'] if i < len(income_statement) else 0) - (owner_drawings[i] if i < len(owner_drawings) else 0)
        assets = {
            'cash': cash_flow[i]['ending_cash'] if i < len(cash_flow) else 0,
            'ppe': ppe,
            'investments': outstanding_investments[i] if i < len(outstanding_investments) else 0,
            'total_assets': (cash_flow[i]['ending_cash'] if i < len(cash_flow) else 0) + ppe + (outstanding_investments[i] if i < len(outstanding_investments) else 0),
        }
        liabilities = {
            'long_term_debt': long_term_debt,
            'total_liabilities': long_term_debt,
        }
        equity = {
            'share_capital': self_funding,
            'retained_earnings': retained_earnings,
            'total_equity': self_funding + retained_earnings,
        }
        balance_sheet.append({
            'year': years[i] if i < len(years) else f'Year {i+1}',
            'assets': assets,
            'liabilities': liabilities,
            'equity': equity,
        })
        prior_retained_earnings = retained_earnings


    # --- Forecast Table ---
    forecast = []
    min_len = min(forecast_years, len(years), len(revenue), len(income_statement), len(cash_flow))
    for i in range(min_len):
        forecast.append({
            'year': years[i],
            'revenue': revenue[i],
            'net_income': income_statement[i]['net_income'],
            'free_cash_flow': cash_flow[i]['net_change_in_cash'],
        })

    # --- Amortization Table Output ---
    amortization_table = []
    for idx, amort_table in enumerate(amortization_tables):
        for row in amort_table:
            row_copy = row.copy()
            row_copy['loan_index'] = idx
            amortization_table.append(row_copy)

    # --- KPIs, Projections, Breakdowns ---
    kpis, projections = calculate_kpis_and_projections(income_statement, balance_sheet, cash_flow, forecast)
    revenue_breakdown, expense_breakdown, cashflow_breakdown = build_breakdowns(income_statement, plans, cash_flow, 'saas')

    return {
        'income_statement': income_statement,
        'balance_sheet': balance_sheet,
        'cash_flow': cash_flow,
        'forecast': forecast,
        'kpis': kpis,
        'projections': projections,
        'revenue_breakdown': revenue_breakdown,
        'expense_breakdown': expense_breakdown,
        'cashflow_breakdown': cashflow_breakdown,
    }

# Amortization table logic placeholder
def generate_amortization_table(loan_amount: float, annual_rate: float, years: int, periods_per_year: int = 12) -> List[Dict[str, float]]:
    """
    Generate a professional amortization table for a loan.
    Returns a list of dicts with keys: period, beginning_balance, payment, interest, principal, ending_balance.
    Supports monthly, quarterly, or annual payments via periods_per_year.
    """
    table = []
    n_periods = years * periods_per_year
    if n_periods == 0:
        return table
    period_rate = annual_rate / periods_per_year
    # Calculate payment using the annuity formula
    if period_rate > 0:
        payment = loan_amount * (period_rate * (1 + period_rate) ** n_periods) / ((1 + period_rate) ** n_periods - 1)
    else:
        payment = loan_amount / n_periods
    balance = loan_amount
    for period in range(1, n_periods + 1):
        interest = balance * period_rate
        principal = payment - interest
        ending_balance = balance - principal
        # Prevent negative balance in last period due to floating point
        if period == n_periods:
            principal = balance
            payment = principal + interest
            ending_balance = 0.0
        table.append({
            'period': period,
            'beginning_balance': balance,
            'payment': payment,
            'interest': interest,
            'principal': principal,
            'ending_balance': ending_balance,
        })
        balance = ending_balance
    return table 