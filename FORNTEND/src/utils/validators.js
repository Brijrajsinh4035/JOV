/**
 * Validation utilities for form inputs
 */

export const isValidEmail = (email) => {
  if (!email) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

export const isNonEmpty = (value) => {
  if (value === null || value === undefined) return false;
  return String(value).trim().length > 0;
};

export const hasMinLength = (value, min = 6) => {
  if (!value) return false;
  return String(value).length >= min;
};
