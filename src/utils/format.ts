
export const formatCurrency = (amount: number | null | undefined, forceCr: boolean = false): string => {
    if (amount === null || amount === undefined) return '₹0';

    // Requirement: "Convert all numerical values displayed in crore units ... consistently shown in crore denomination"
    // And "Display 'Cr' suffix after the amount (e.g., ₹1.25 Cr)"

    // If amount is large (>= 1 Crore) OR forceCr is true, format as Cr
    const CRORE = 100_00_000;


    // We should interpret "consistently shown in crore denomination" as prefering Cr for large values.
    // But if the value is small (e.g. 5000), showing ₹0.00 Cr is weird unless context demands it.
    // However, the prompt says "Convert all numerical values displayed in crore units" -> implying values that ARE effectively crores.
    // BUT the second sentence says "ensuring they are consistently shown in crore denomination rather than lacs".
    // This likely refers to aggregate metrics like Total Revenue, Targets etc.

    // Let's adopt a strategy: 
    // If val >= 1 Crore -> Format as Cr e.g. ₹1.25 Cr
    // If val >= 1 Lakh -> Use standard formatting or maybe Lakhs if not restricted? Prompt says "rather than lacs". 
    // So avoiding Lakhs suffix is the goal.
    // So for < 1 Cr, we should probably just show full number with commas? Or 0.XX Cr?
    // "Proper comma separators (e.g., ₹1,00,00,000 instead of 1 crore)" -> This example suggests full display is also acceptable/desired in some contexts?
    // "Display 'Cr' suffix after the amount (e.g., ₹1.25 Cr)" -> usage of suffix.

    // Best approach for an App like this:
    // For Dashboard/KPIs (Totals): Use Cr suffix.
    // For Tables (Individual Transactions usually < 1Cr): Standard comma separated.

    // But wait, the objective says "Convert all numerical values displayed in crore units to the Indian currency format (₹)... consistently shown in crore denomination rather than lacs".
    // This implies previously there might have been "XX Lacs". Now it should be "0.XX Cr" perhaps?
    // Let's stick to:
    // 1. If explicitly asked for Cr format (via forceCr or large value), return Cr.
    // 2. Otherwise return standard Indian format.

    if (amount >= CRORE || forceCr) {
        const crValue = amount / CRORE;
        // Maintain two decimal places
        return `₹${crValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Cr`;
    }

    // Standard Indian formatting for smaller amounts
    return `₹${amount.toLocaleString('en-IN')}`;
};

export const formatCurrencyInput = (value: string) => {
    // Helper for input fields to strip non-numeric
    return value.replace(/[^0-9.]/g, '');
};
