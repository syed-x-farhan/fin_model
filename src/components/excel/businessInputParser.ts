// businessInputParser.ts

// Define the sections and fields for business input import
export const businessInputSections = [
  'services', 'expenses', 'equipment', 'shareholders', 'loans', 'other', 'investments', 'assumptions'
];

export const businessInputFields = {
  services: ['name', 'price', 'clients', 'growth', 'cost'],
  expenses: ['category', 'amount', 'growthRate', 'notes'],
  equipment: ['name', 'cost', 'usefulLife', 'purchaseDate', 'notes'],
  shareholders: ['name', 'amount', 'percent', 'notes'],
  loans: ['amount', 'rate', 'years', 'startDate'],
  other: ['type', 'amount', 'notes', 'isIncome'],
  investments: ['name', 'amount', 'date', 'expectedReturn', 'maturityValue', 'maturityType', 'income', 'incomeAmount'],
  assumptions: ['taxRate', 'forecast', 'selfFunding', 'notes'],
};

export function getSectionFields(section) {
  return businessInputFields[section] || [];
}

// Main parser: takes Excel data and mappings, returns business input object
export function parseBusinessInputExcel(data, mappings) {
  // Debug logs for input
  console.debug('[parseBusinessInputExcel] input data:', data);
  console.debug('[parseBusinessInputExcel] mappings:', mappings);
  // For each section, extract rows and map columns to fields
  const result = {};
  for (const section of businessInputSections) {
    const sectionFields = businessInputFields[section];
    // Find mappings for this section
    const sectionMappings = mappings.filter(m => m.section === section && m.mappedTo);
    console.debug(`[parseBusinessInputExcel] section: ${section}, sectionMappings:`, sectionMappings);
    if (sectionMappings.length === 0) continue;
    // Extract rows for this section
    const sectionRows = data.filter(row => 
      (row.__section && row.__section === section) ||
      (row.__sheetName && row.__sheetName.toLowerCase() === section.toLowerCase())
    );
    console.debug(`[parseBusinessInputExcel] section: ${section}, sectionRows:`, sectionRows);
    result[section] = sectionRows.map((row, rowIdx) => {
      const obj = {};
      for (const mapping of sectionMappings) {
        // Log the mapping process
        console.debug(`[parseBusinessInputExcel] mapping row ${rowIdx}, excelColumn: ${mapping.excelColumn}, mappedTo: ${mapping.mappedTo}, value:`, row[mapping.excelColumn]?.value);
        obj[mapping.mappedTo] = row[mapping.excelColumn]?.value ?? '';
      }
      return obj;
    });
  }
  // Flatten first row of assumptions (if present) into top-level fields
  if ((result as any).assumptions && Array.isArray((result as any).assumptions) && (result as any).assumptions.length > 0) {
    const assumptions = (result as any).assumptions[0];
    for (const key in assumptions) {
      result[key] = assumptions[key];
    }
    delete (result as any).assumptions;
  }
  // Debug log for final result
  console.debug('[parseBusinessInputExcel] result:', result);
  return result;
} 