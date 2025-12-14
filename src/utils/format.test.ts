
import { describe, it, expect } from 'vitest';
import { formatCurrency } from './format';

describe('formatCurrency', () => {
    it('formats values >= 1 Crore correctly with Cr suffix', () => {
        // 1 Crore
        expect(formatCurrency(10000000)).toBe('₹1.00 Cr');
        // 1.25 Crore
        expect(formatCurrency(12500000)).toBe('₹1.25 Cr');
        // 5 Crore
        expect(formatCurrency(50000000)).toBe('₹5.00 Cr');
        // 5.567 Crore -> 5.57
        expect(formatCurrency(55670000)).toBe('₹5.57 Cr');
    });

    it('formats smaller values effectively in standard Indian format by default', () => {
        expect(formatCurrency(1000)).toBe('₹1,000');
        expect(formatCurrency(50000)).toBe('₹50,000');
        expect(formatCurrency(100000)).toBe('₹1,00,000'); // 1 Lakh
        expect(formatCurrency(5500000)).toBe('₹55,00,000'); // 55 Lakhs
    });

    it('forces Cr format when forceCr is true', () => {
        // 50 Lakhs -> 0.50 Cr
        expect(formatCurrency(5000000, true)).toBe('₹0.50 Cr');
        // 1 Lakh -> 0.01 Cr
        expect(formatCurrency(100000, true)).toBe('₹0.01 Cr');
    });

    it('handles zero, null, and undefined', () => {
        expect(formatCurrency(0)).toBe('₹0');
        expect(formatCurrency(null)).toBe('₹0');
        expect(formatCurrency(undefined)).toBe('₹0');
    });
});
