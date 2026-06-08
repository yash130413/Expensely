import express from 'express';

const router = express.Router();

/**
 * POST /api/ocr/upload
 * Processes an uploaded receipt image and returns extracted data
 * Note: In production, you'd use Tesseract server or Cloud Vision API
 * For now, this is a placeholder that accepts the data from frontend Tesseract.js
 */
router.post('/upload', async (req, res) => {
  try {
    const { rawText, extractedData } = req.body;

    if (!rawText) {
      return res.status(400).json({ message: 'Raw OCR text is required' });
    }

    // The frontend has already processed the OCR with Tesseract.js
    // This endpoint validates and optionally refines the extraction
    res.status(200).json({
      success: true,
      message: 'Receipt OCR processed successfully',
      data: extractedData || {
        merchantName: '',
        amount: null,
        expenseDate: new Date().toISOString().split('T')[0],
        rawText: rawText
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
