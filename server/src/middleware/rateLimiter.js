import rateLimit from 'express-rate-limit';

// Guards the AI-calling endpoint from being used to burn through API credits.
export const analyzeRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many analysis requests. Please try again later.' },
});
