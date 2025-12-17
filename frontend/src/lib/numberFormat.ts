/**
 * Number formatting utilities
 * Ensures all numeric values are displayed cleanly without long decimals
 */

/**
 * Format a number to a clean integer or single decimal place
 * @param value - The number to format
 * @param decimals - Number of decimal places (0-1, default: 0)
 * @returns Formatted number string
 */
export const formatNumber = (value: number | null | undefined, decimals: 0 | 1 = 0): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  
  // Round to avoid floating point issues
  const rounded = Math.round(value * (decimals === 1 ? 10 : 1)) / (decimals === 1 ? 10 : 1);
  
  return decimals === 1 ? rounded.toFixed(1) : Math.round(rounded).toString();
};

/**
 * Format a percentage value (0-100)
 * @param value - The percentage value
 * @returns Formatted percentage string (e.g., "85%")
 */
export const formatPercentage = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }
  
  const rounded = Math.round(value);
  return `${rounded}%`;
};

/**
 * Format a file size in bytes to KB or MB
 * @param bytes - File size in bytes
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted file size string (e.g., "2.5 MB")
 */
export const formatFileSize = (bytes: number | null | undefined, decimals: number = 1): string => {
  if (bytes === null || bytes === undefined || isNaN(bytes) || bytes === 0) {
    return '0 B';
  }
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  // Round to avoid long decimals
  const value = Math.round((bytes / Math.pow(k, i)) * Math.pow(10, dm)) / Math.pow(10, dm);
  
  return `${value} ${sizes[i]}`;
};

/**
 * Format a currency value
 * @param value - The currency value
 * @param currency - Currency symbol (default: '$')
 * @returns Formatted currency string (e.g., "$50,000")
 */
export const formatCurrency = (value: number | null | undefined, currency: string = '$'): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return `${currency}0`;
  }
  
  const rounded = Math.round(value);
  return `${currency}${rounded.toLocaleString()}`;
};

/**
 * Format a score (0-100) with proper rounding
 * @param value - The score value
 * @returns Formatted score string
 */
export const formatScore = (value: number | null | undefined): string => {
  return formatPercentage(value);
};

