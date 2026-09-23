import { Router } from 'express';
import { uploadReceipt, handleUploadErrors } from '../middleware/upload.js';
import { analyzeRateLimiter } from '../middleware/rateLimiter.js';
import { extractReceiptData, AiExtractionError } from '../services/aiService.js';

const router = Router();

// Stateless v1: upload -> extract -> return JSON. Nothing is persisted server-side.
router.post('/analyze', analyzeRateLimiter, uploadReceipt, handleUploadErrors, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded. Use field name "receipt".' });
  }

  try {
    const extraction = await extractReceiptData(req.file.buffer, req.file.mimetype);
    return res.status(200).json({ receipt: extraction });
  } catch (err) {
    if (err instanceof AiExtractionError) {
      console.error('AI extraction failed:', err.message, err.cause ?? '');
      return res.status(502).json({ error: 'Could not extract data from this document. Try a clearer image or file.' });
    }
    console.error('Unexpected error during receipt analysis:', err);
    return res.status(500).json({ error: 'Unexpected server error.' });
  }
});

export default router;
