import Tesseract from 'tesseract.js';

/**
 * Run OCR on an image file and extract text
 * @param {File} imageFile - The image file to process
 * @param {Function} onProgress - Callback with progress (0-100)
 * @returns {Promise<string>} - The extracted raw text
 */
export async function extractTextFromImage(imageFile, onProgress) {
  const result = await Tesseract.recognize(imageFile, 'eng', {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(Math.round(m.progress * 100));
      }
    },
  });
  return result.data.text;
}

/**
 * Parse merchant name from OCR text.
 * Typically the merchant name is in the first 1-3 lines.
 */
function parseMerchantName(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  // First non-empty line is usually the store/merchant name
  return lines[0] || '';
}

/**
 * Parse total amount from OCR text.
 * Looks for keywords like TOTAL, AMOUNT, GRAND TOTAL followed by a number.
 */
function parseTotalAmount(text) {
  const lines = text.split('\n');

  // Try to find a line with keywords
  const totalKeywords = /(?:total|grand total|amount|amount due|subtotal|net amount|to pay|payable)\s*[:\-]?\s*[₹$€£]?\s*(\d{1,6}(?:[.,]\d{1,2})?)/i;

  for (const line of lines) {
    const match = line.match(totalKeywords);
    if (match) {
      const amount = parseFloat(match[1].replace(',', '.'));
      if (!isNaN(amount) && amount > 0) {
        return amount;
      }
    }
  }

  // Fallback: find the largest currency-like number in the text
  const allAmounts = [...text.matchAll(/[₹$€£]?\s*(\d{1,6}[.,]\d{2})/g)]
    .map(m => parseFloat(m[1].replace(',', '.')))
    .filter(n => !isNaN(n) && n > 0);

  if (allAmounts.length > 0) {
    return Math.max(...allAmounts);
  }

  return null;
}

/**
 * Parse date from OCR text.
 * Looks for common date formats.
 */
function parseDate(text) {
  const datePatterns = [
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,   // DD/MM/YYYY or MM/DD/YYYY
    /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/,       // YYYY-MM-DD
    /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})/i, // DD Mon YYYY
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      const parsed = new Date(match[1]);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0]; // Return YYYY-MM-DD
      }
    }
  }

  return new Date().toISOString().split('T')[0]; // Default to today
}

/**
 * Main function: extract all expense fields from OCR text.
 * @param {File} imageFile - The receipt image file
 * @param {Function} onProgress - Callback with progress percentage
 * @returns {Promise<{merchantName, amount, expenseDate, rawText}>}
 */
export async function parseReceiptFromImage(imageFile, onProgress) {
  const rawText = await extractTextFromImage(imageFile, onProgress);
  
  const merchantName = parseMerchantName(rawText);
  const amount = parseTotalAmount(rawText);
  const expenseDate = parseDate(rawText);

  return {
    merchantName,
    amount,
    expenseDate,
    rawText,
  };
}
