"""
DCF and Valuation Calculations (now in dcf_calculation.py)
- Discounted Cash Flow (DCF) Value
- Net Present Value (NPV)
- Internal Rate of Return (IRR)
- Owner ROI
"""
from typing import List, Optional, Union
import random
from collections import Counter


def calculate_terminal_value(
    method: str,
    last_fcf: float,
    discount_rate: float,
    terminal_growth: float = 0.0,
    tv_metric_value: float = 0.0,
    tv_multiple: float = 0.0,
    tv_custom_value: float = 0.0
) -> float:
    """
    Compute terminal value based on method:
    - perpetuity: Gordon Growth
    - exit-multiple: metric * multiple
    - liquidation: custom value
    - none: 0
    """
    if method == 'perpetuity':
        if discount_rate - terminal_growth > 0.001:
            return last_fcf * (1 + terminal_growth) / (discount_rate - terminal_growth)
        else:
            return 0.0
    elif method == 'exit-multiple':
        return tv_metric_value * tv_multiple
    elif method == 'liquidation':
        return tv_custom_value
    elif method == 'none':
        return 0.0
    else:
        return 0.0


def calculate_dcf_value(
    free_cash_flows: List[float],
    discount_rate: float,
    terminal_value: Optional[float] = None,
    terminal_year: Optional[int] = None
) -> float:
    """
    Calculate the DCF value given a list of free cash flows and a discount rate.
    Optionally include a terminal value (discounted at terminal_year).
    """
    dcf = 0.0
    for t, fcf in enumerate(free_cash_flows, 1):
        dcf += fcf / ((1 + discount_rate) ** t)
    if terminal_value is not None:
        if terminal_year is not None:
            dcf += terminal_value / ((1 + discount_rate) ** terminal_year)
        else:
            dcf += terminal_value / ((1 + discount_rate) ** len(free_cash_flows))
    return dcf


def calculate_npv(cash_flows: List[float], discount_rate: float) -> float:
    """
    Calculate Net Present Value (NPV) for a series of cash flows.
    """
    npv = 0.0
    for t, cf in enumerate(cash_flows, 0):
        npv += cf / ((1 + discount_rate) ** t)
    return npv


def calculate_irr(cash_flows: List[float], guess: float = 0.1, max_iter: int = 100, tol: float = 1e-6) -> float:
    """
    Calculate Internal Rate of Return (IRR) for a series of cash flows using Newton-Raphson.
    """
    rate = guess
    for _ in range(max_iter):
        npv = sum(cf / ((1 + rate) ** t) for t, cf in enumerate(cash_flows))
        d_npv = sum(-t * cf / ((1 + rate) ** (t + 1)) for t, cf in enumerate(cash_flows))
        if abs(npv) < tol:
            return rate
        if d_npv == 0:
            break
        rate -= npv / d_npv
    return rate


def calculate_owner_roi(owner_investments: List[float], owner_returns: List[float]) -> float:
    """
    Calculate Owner ROI as (Total Returns - Total Investments) / Total Investments.
    """
    total_invested = sum(owner_investments)
    total_returned = sum(owner_returns)
    if total_invested == 0:
        return 0.0
    return (total_returned - total_invested) / total_invested 


def calculate_payback_period(cash_flows: list) -> float:
    """
    Calculate the payback period for a series of cash flows.
    Returns the period (can be fractional) when cumulative cash flow turns positive.
    Returns None if payback never occurs.
    """
    cumulative = 0.0
    for i, cf in enumerate(cash_flows):
        prev_cumulative = cumulative
        cumulative += cf
        if prev_cumulative < 0 and cumulative >= 0:
            # Linear interpolation for fractional period
            if cf != 0:
                return i - prev_cumulative / cf
            else:
                return i
    return None  # Never paid back 


def calculate_sensitivity_matrix(free_cash_flows: List[float], wacc_range: List[float], terminal_growth_range: List[float], terminal_value_func) -> list:
    """
    Calculate a matrix of DCF values for combinations of WACC (discount rate) and terminal growth rate.
    terminal_value_func: function to compute terminal value given last FCF, growth, and discount rate
    Returns a list of dicts: [{wacc: x, values: [{growth: y, dcf: z}, ...]}, ...]
    """
    matrix = []
    for wacc in wacc_range:
        row = {'wacc': wacc, 'values': []}
        for growth in terminal_growth_range:
            # Calculate terminal value using provided function
            last_fcf = free_cash_flows[-1] if free_cash_flows else 0
            terminal_value = terminal_value_func(last_fcf, growth, wacc)
            dcf = calculate_dcf_value(free_cash_flows, wacc, terminal_value)
            row['values'].append({'growth': growth, 'dcf': dcf})
        matrix.append(row)
    return matrix


def calculate_tornado_data(free_cash_flows: List[float], base_discount_rate: float, base_terminal_growth: float, variable_impacts: dict, terminal_value_func) -> list:
    """
    Calculate tornado chart data: impact of flexing each key variable on DCF value.
    variable_impacts: dict of {var_name: {'low': value, 'high': value, 'type': 'fcf' or 'wacc' or 'growth'}}
    Returns a list of dicts: [{variable: name, low: dcf_low, high: dcf_high, base: dcf_base}]
    """
    base_last_fcf = free_cash_flows[-1] if free_cash_flows else 0
    base_terminal_value = terminal_value_func(base_last_fcf, base_terminal_growth, base_discount_rate)
    base_dcf = calculate_dcf_value(free_cash_flows, base_discount_rate, base_terminal_value)
    tornado = []
    for var, impact in variable_impacts.items():
        # Flex variable low
        if impact['type'] == 'fcf':
            fcf_low = [fcf * impact['low'] for fcf in free_cash_flows]
            fcf_high = [fcf * impact['high'] for fcf in free_cash_flows]
            tv_low = terminal_value_func(fcf_low[-1], base_terminal_growth, base_discount_rate)
            tv_high = terminal_value_func(fcf_high[-1], base_terminal_growth, base_discount_rate)
            dcf_low = calculate_dcf_value(fcf_low, base_discount_rate, tv_low)
            dcf_high = calculate_dcf_value(fcf_high, base_discount_rate, tv_high)
        elif impact['type'] == 'wacc':
            tv = terminal_value_func(base_last_fcf, base_terminal_growth, impact['low'])
            dcf_low = calculate_dcf_value(free_cash_flows, impact['low'], tv)
            tv = terminal_value_func(base_last_fcf, base_terminal_growth, impact['high'])
            dcf_high = calculate_dcf_value(free_cash_flows, impact['high'], tv)
        elif impact['type'] == 'growth':
            tv_low = terminal_value_func(base_last_fcf, impact['low'], base_discount_rate)
            tv_high = terminal_value_func(base_last_fcf, impact['high'], base_discount_rate)
            dcf_low = calculate_dcf_value(free_cash_flows, base_discount_rate, tv_low)
            dcf_high = calculate_dcf_value(free_cash_flows, base_discount_rate, tv_high)
        else:
            dcf_low = dcf_high = base_dcf
        tornado.append({'variable': var, 'low': dcf_low, 'high': dcf_high, 'base': base_dcf})
    return tornado 


def monte_carlo_npv_simulation(
    free_cash_flows: list,
    discount_rate_range: tuple,
    terminal_growth_range: tuple,
    runs: int = 1000,
    bins: list = None
) -> list:
    """
    Run Monte Carlo simulation for NPV with random discount rate and terminal growth within given ranges.
    Returns a histogram of NPV bins.
    """
    if bins is None:
        bins = [-float('inf'), 0, 100_000, 200_000, 300_000, 400_000, 500_000, float('inf')]
    npv_results = []
    for _ in range(runs):
        dr = random.uniform(*discount_rate_range)
        tg = random.uniform(*terminal_growth_range)
        # For simplicity, use last FCF for terminal value
        terminal_value = calculate_terminal_value('perpetuity', free_cash_flows[-1], dr, tg)
        npv = calculate_npv(free_cash_flows + [terminal_value], dr)
        npv_results.append(npv)
    # Bin the results
    bin_labels = ['<0', '0-100k', '100k-200k', '200k-300k', '300k-400k', '400k-500k', '>500k']
    counts = Counter()
    for npv in npv_results:
        for i in range(len(bins)-1):
            if bins[i] <= npv < bins[i+1]:
                counts[bin_labels[i]] += 1
                break
    return [{"bin": label, "count": counts[label]} for label in bin_labels] 


def calculate_scenario_kpis(
    base_forecast: List[dict],
    scenario_values: dict,
    base_discount_rate: float = 0.1,
    base_terminal_growth: float = 0.02
) -> dict:
    """
    Calculate KPIs for a specific scenario based on sensitivity values.
    
    Args:
        base_forecast: Base case forecast data
        scenario_values: Dictionary with sensitivity values for the scenario
        base_discount_rate: Base discount rate
        base_terminal_growth: Base terminal growth rate
    
    Returns:
        Dictionary with scenario KPIs
    """
    # Apply scenario adjustments to forecast
    adjusted_forecast = apply_scenario_to_forecast(base_forecast, scenario_values)
    
    # Extract free cash flows
    free_cash_flows = [year.get("free_cash_flow", 0) for year in adjusted_forecast]
    
    # Apply scenario adjustments to discount rate and terminal growth
    adjusted_discount_rate = base_discount_rate * (1 + scenario_values.get("wacc", 0) / 100)
    adjusted_terminal_growth = base_terminal_growth + scenario_values.get("terminalGrowth", 0) / 100
    
    # Calculate terminal value
    terminal_value = calculate_terminal_value(
        method='perpetuity',
        last_fcf=free_cash_flows[-1] if free_cash_flows else 0,
        discount_rate=adjusted_discount_rate,
        terminal_growth=adjusted_terminal_growth
    )
    
    # Calculate KPIs
    npv = calculate_npv(free_cash_flows, adjusted_discount_rate)
    try:
        irr = calculate_irr([-abs(free_cash_flows[0])] + free_cash_flows[1:]) if free_cash_flows and free_cash_flows[0] > 0 else calculate_irr(free_cash_flows)
    except Exception:
        irr = None
    
    try:
        payback_period = calculate_payback_period(free_cash_flows)
    except Exception:
        payback_period = None
    
    # Calculate cumulative FCF
    cumulative_fcf = sum(free_cash_flows)
    
    # Calculate revenue metrics
    year_1_revenue = adjusted_forecast[0].get("revenue", 0) if adjusted_forecast else 0
    year_5_revenue = adjusted_forecast[-1].get("revenue", 0) if len(adjusted_forecast) >= 5 else 0
    
    # Calculate margin metrics
    year_1_gross_margin = 0
    year_1_net_margin = 0
    if adjusted_forecast and year_1_revenue > 0:
        year_1_gross_profit = adjusted_forecast[0].get("gross_profit", 0)
        year_1_net_income = adjusted_forecast[0].get("net_income", 0)
        year_1_gross_margin = (year_1_gross_profit / year_1_revenue) * 100
        year_1_net_margin = (year_1_net_income / year_1_revenue) * 100
    
    return {
        "npv": npv,
        "irr": irr,
        "payback_period": payback_period,
        "cumulative_fcf": cumulative_fcf,
        "year_1_revenue": year_1_revenue,
        "year_5_revenue": year_5_revenue,
        "year_1_gross_margin": year_1_gross_margin,
        "year_1_net_margin": year_1_net_margin,
        "free_cash_flows": free_cash_flows,
        "adjusted_forecast": adjusted_forecast
    }


def apply_scenario_to_forecast(base_forecast: List[dict], scenario_values: dict) -> List[dict]:
    """
    Apply scenario sensitivity values to base forecast to create adjusted forecast.
    
    Args:
        base_forecast: Base case forecast data
        scenario_values: Dictionary with sensitivity values
    
    Returns:
        Adjusted forecast data
    """
    if not base_forecast:
        return []
    
    adjusted_forecast = []
    
    for i, year_data in enumerate(base_forecast):
        adjusted_year = year_data.copy()
        
        # Apply revenue growth adjustment
        revenue_growth_adjustment = scenario_values.get("revenueGrowth", 0) / 100
        if i > 0:  # Apply growth to subsequent years
            base_revenue = adjusted_forecast[i-1]["revenue"]
            adjusted_year["revenue"] = base_revenue * (1 + revenue_growth_adjustment)
        
        # Apply operating margin adjustment
        operating_margin_adjustment = scenario_values.get("operatingMargin", 0) / 100
        if adjusted_year["revenue"] > 0:
            # Adjust COGS and operating expenses proportionally
            current_margin = (adjusted_year.get("ebit", 0) / adjusted_year["revenue"]) if adjusted_year["revenue"] > 0 else 0
            target_margin = current_margin + operating_margin_adjustment
            
            # Simple adjustment: scale operating expenses
            current_operating_expenses = adjusted_year.get("operating_expenses", 0)
            adjusted_operating_expenses = current_operating_expenses * (1 - operating_margin_adjustment)
            adjusted_year["operating_expenses"] = max(0, adjusted_operating_expenses)
            
            # Recalculate EBIT
            adjusted_year["ebit"] = adjusted_year["revenue"] - adjusted_year.get("cogs", 0) - adjusted_year["operating_expenses"]
        
        # Apply CapEx adjustment
        capex_adjustment = scenario_values.get("capex", 0) / 100
        current_capex = adjusted_year.get("capex", 0)
        adjusted_year["capex"] = current_capex * (1 + capex_adjustment)
        
        # Apply working capital adjustment (simplified)
        working_capital_adjustment = scenario_values.get("workingCapitalDays", 0) / 100
        # This would require more complex working capital modeling
        # For now, we'll adjust inventory and receivables proportionally
        if "inventory" in adjusted_year:
            adjusted_year["inventory"] = adjusted_year["inventory"] * (1 + working_capital_adjustment)
        if "accounts_receivable" in adjusted_year:
            adjusted_year["accounts_receivable"] = adjusted_year["accounts_receivable"] * (1 + working_capital_adjustment)
        
        # Apply tax rate adjustment
        tax_rate_adjustment = scenario_values.get("taxRate", 0) / 100
        current_tax_rate = adjusted_year.get("tax_rate", 0.25)
        adjusted_year["tax_rate"] = max(0, min(1, current_tax_rate + tax_rate_adjustment))
        
        # Recalculate net income and FCF
        adjusted_year["ebt"] = adjusted_year.get("ebit", 0) + adjusted_year.get("other_income", 0) - adjusted_year.get("interest_expense", 0)
        adjusted_year["tax_expense"] = adjusted_year["ebt"] * adjusted_year["tax_rate"]
        adjusted_year["net_income"] = adjusted_year["ebt"] - adjusted_year["tax_expense"]
        
        # Recalculate free cash flow
        adjusted_year["free_cash_flow"] = (
            adjusted_year["net_income"] +
            adjusted_year.get("depreciation", 0) -
            adjusted_year["capex"] -
            adjusted_year.get("change_in_working_capital", 0)
        )
        
        adjusted_forecast.append(adjusted_year)
    
    return adjusted_forecast


def calculate_scenario_comparison(base_forecast: List[dict], scenario_configs: dict) -> dict:
    """
    Calculate KPIs for all scenarios (Base, Best, Worst).
    
    Args:
        base_forecast: Base case forecast data
        scenario_configs: Dictionary with scenario configurations
    
    Returns:
        Dictionary with all scenario results
    """
    results = {}
    
    # Calculate base case
    base_values = {
        "revenueGrowth": 0,
        "operatingMargin": 0,
        "capex": 0,
        "workingCapitalDays": 0,
        "taxRate": 0,
        "wacc": 0,
        "terminalGrowth": 0
    }
    results["base"] = calculate_scenario_kpis(base_forecast, base_values)
    
    # Calculate best case
    best_values = scenario_configs.get("best", {})
    results["best"] = calculate_scenario_kpis(base_forecast, best_values)
    
    # Calculate worst case
    worst_values = scenario_configs.get("worst", {})
    results["worst"] = calculate_scenario_kpis(base_forecast, worst_values)
    
    return results


def calculate_sensitivity_analysis(
    base_forecast: List[dict],
    sensitivity_ranges: dict,
    base_discount_rate: float = 0.1,
    base_terminal_growth: float = 0.02
) -> dict:
    """
    Calculate comprehensive sensitivity analysis.
    
    Args:
        base_forecast: Base case forecast data
        sensitivity_ranges: Dictionary with sensitivity ranges for each variable
        base_discount_rate: Base discount rate
        base_terminal_growth: Base terminal growth rate
    
    Returns:
        Dictionary with sensitivity analysis results
    """
    results = {}
    
    # Calculate tornado chart data
    tornado_data = []
    
    for variable, range_config in sensitivity_ranges.items():
        low_value = range_config.get("low", 0)
        high_value = range_config.get("high", 0)
        
        # Calculate NPV at low value
        low_scenario = {variable: low_value}
        low_kpis = calculate_scenario_kpis(base_forecast, low_scenario, base_discount_rate, base_terminal_growth)
        
        # Calculate NPV at high value
        high_scenario = {variable: high_value}
        high_kpis = calculate_scenario_kpis(base_forecast, high_scenario, base_discount_rate, base_terminal_growth)
        
        # Calculate impact
        base_kpis = calculate_scenario_kpis(base_forecast, {}, base_discount_rate, base_terminal_growth)
        base_npv = base_kpis["npv"]
        
        low_impact = ((low_kpis["npv"] - base_npv) / base_npv * 100) if base_npv != 0 else 0
        high_impact = ((high_kpis["npv"] - base_npv) / base_npv * 100) if base_npv != 0 else 0
        
        tornado_data.append({
            "variable": variable,
            "low_impact": low_impact,
            "high_impact": high_impact,
            "low_npv": low_kpis["npv"],
            "high_npv": high_kpis["npv"],
            "base_npv": base_npv
        })
    
    # Sort by absolute impact
    tornado_data.sort(key=lambda x: abs(x["high_impact"] - x["low_impact"]), reverse=True)
    
    results["tornado_data"] = tornado_data
    
    # Calculate sensitivity matrix (heatmap)
    sensitivity_matrix = calculate_sensitivity_matrix(
        [year.get("free_cash_flow", 0) for year in base_forecast],
        [0.07, 0.08, 0.09, 0.10, 0.11, 0.12],
        [0.01, 0.02, 0.03, 0.04],
        lambda last_fcf, g, wacc: calculate_terminal_value('perpetuity', last_fcf, wacc, g)
    )
    
    results["sensitivity_matrix"] = sensitivity_matrix
    
    return results 