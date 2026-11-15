
export const formatCurrency = (amount: number | string | null | undefined, forceCr: boolean = false): string => {
    if (amount === null || amount === undefined || amount === '') return '₹0';

    const num = typeof amount === 'number' ? amount : parseFloat(String(amount));
    if (isNaN(num)) return '₹0';

    // Requirement: "Convert all numerical values displayed in crore units ... consistently shown in crore denomination"
    // And "Display 'Cr' suffix after the amount (e.g., ₹1.25 Cr)"

    // If amount is large (>= 1 Crore) OR forceCr is true, format as Cr
    const CRORE = 100_00_000;

    if (num >= CRORE || forceCr) {
        const crValue = num / CRORE;
        // Maintain two decimal places
        return `₹${crValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Cr`;
    }

    // Standard Indian formatting for smaller amounts
    return `₹${num.toLocaleString('en-IN')}`;
};

export const formatCurrencyInput = (value: string) => {
    // Helper for input fields to strip non-numeric
    return value.replace(/[^0-9.]/g, '');
};
