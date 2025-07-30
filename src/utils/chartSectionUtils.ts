// Utility to map backend calculation data to chart sections for the dashboard

export type ChartSection = 'historical' | 'current' | 'forecast';

export interface ChartPeriod {
  date: string;
  revenue: number;
  ebitda: number;
  cashFlow: number;
  section: ChartSection;
}

/**
 * Given backend calculation results, returns an array of periods with section labels,
 * and the list of sections present (in order).
 * If no historical periods are present, only returns 'current' and 'forecast'.
 */
export function mapPeriodsToSections({ income_statement, cash_flow }: any): {
  data: ChartPeriod[];
  sections: ChartSection[];
} {
  // Defensive: check for years and line_items
  if (!income_statement || !income_statement.years || !income_statement.line_items) {
    return { data: [], sections: [] };
  }
  const years: string[] = income_statement.years;
  // Find line items for revenue, ebitda, fcf
  const getItem = (label: string) => income_statement.line_items.find((li: any) => li.label.toLowerCase() === label.toLowerCase());
  const revenueItem = getItem('Revenue');
  const ebitdaItem = getItem('EBITDA');
  const fcfItem = getItem('Free Cash Flow') || getItem('FCF') || getItem('Cash Flow');

  // Fallback: try to use cash_flow array for FCF if not in income_statement
  let cashFlowArr: number[] = [];
  if ((!fcfItem || !fcfItem.values) && Array.isArray(cash_flow)) {
    cashFlowArr = cash_flow.map((period: any) => period.net_change_in_cash ?? 0);
  }

  // Determine section split logic
  // For now: if more than 2 years, first N are historical, next M are current, rest are forecast
  // You may want to enhance this logic to use explicit flags from backend in future
  const total = years.length;
  let histEnd = -1, currEnd = -1;
  if (total >= 9) {
    histEnd = 3; // first 4 quarters
    currEnd = 7; // next 4 quarters
  } else if (total >= 6) {
    // fallback: split in half
    histEnd = Math.floor(total / 3) - 1;
    currEnd = Math.floor((2 * total) / 3) - 1;
  } else if (total >= 2) {
    histEnd = -1; // no historical
    currEnd = Math.floor(total / 2) - 1;
  }

  // Assign section for each period
  const data: ChartPeriod[] = years.map((date, idx) => {
    let section: ChartSection = 'forecast';
    if (histEnd >= 0 && idx <= histEnd) section = 'historical';
    else if (currEnd >= 0 && idx > histEnd && idx <= currEnd) section = 'current';
    else section = 'forecast';
    return {
      date,
      revenue: revenueItem?.values?.[idx] ?? 0,
      ebitda: ebitdaItem?.values?.[idx] ?? 0,
      cashFlow: fcfItem?.values?.[idx] ?? cashFlowArr[idx] ?? 0,
      section,
    };
  });

  // Detect which sections are present
  const sections: ChartSection[] = [];
  if (data.some(d => d.section === 'historical')) sections.push('historical');
  if (data.some(d => d.section === 'current')) sections.push('current');
  if (data.some(d => d.section === 'forecast')) sections.push('forecast');

  return { data, sections };
}
