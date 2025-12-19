-- Fix incorrect billing amounts (converted to paise instead of rupees)
-- detailed: Some records were stored as 150000 instead of 1500. This script divides them by 100.

UPDATE billing_history
SET amount = amount / 100
WHERE amount > 10000;
