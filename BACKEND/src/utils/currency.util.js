/**
 * Currency and Indian Numbering System Utilities
 */

export const formatIndianCurrency = (amountInCrores) => {
  if (amountInCrores === undefined || amountInCrores === null) return '₹0 Cr';
  const num = Number(amountInCrores);
  if (isNaN(num)) return '₹0 Cr';
  return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr`;
};

export const calculateUtilizationPercent = (totalBudget, utilizedBudget) => {
  const total = Number(totalBudget) || 0;
  const utilized = Number(utilizedBudget) || 0;
  if (total <= 0) return 0;
  return Math.min(100, Math.round((utilized / total) * 100));
};
