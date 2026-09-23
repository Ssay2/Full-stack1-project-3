import multer from 'multer';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(new Error('UNSUPPORTED_FILE_TYPE'));
    return;
  }
  cb(null, true);
}

export const uploadReceipt = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 1 },
}).single('receipt');

export function handleUploadErrors(err, req, res, next) {
  if (!err) return next();

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large. Max size is 10MB.' });
    }
    return res.status(400).json({ error: `Upload error: ${err.code}` });
  }

  if (err.message === 'UNSUPPORTED_FILE_TYPE') {
    return res.status(415).json({ error: 'Unsupported file type. Use JPEG, PNG, WEBP, or PDF.' });
  }

  return res.status(500).json({ error: 'Unexpected upload error.' });
}
