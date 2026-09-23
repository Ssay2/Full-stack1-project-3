import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const EXTRACTION_PROMPT = `You are a receipt/invoice data extraction assistant. Look at the attached document (image or PDF) and extract structured data.

Respond with ONLY a single JSON object (no markdown, no commentary) matching this exact shape:
{
  "vendor": string | null,
  "date": string | null,       // ISO 8601 "YYYY-MM-DD" format, or null if unreadable
  "total": number | null,      // numeric total, no currency symbols
  "currency": string | null,   // ISO currency code e.g. "USD", or null if unknown
  "category": string | null,   // one of: "groceries", "dining", "transportation", "utilities", "entertainment", "office", "travel", "healthcare", "other"
  "line_items": [
    { "description": string, "amount": number | null }
  ],
  "confidence": "high" | "medium" | "low"
}

Rules:
- If a field cannot be determined from the document, use null rather than guessing.
- Set "confidence" to "low" if the document is blurry, cropped, or partially unreadable.
- Do not include any text outside the JSON object.`;

const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const PDF_MIME_TYPE = 'application/pdf';

export class AiExtractionError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'AiExtractionError';
    this.cause = cause;
  }
}

/**
 * Sends a receipt image or PDF to Claude and returns the parsed structured extraction.
 * @param {Buffer} fileBuffer
 * @param {string} mimeType
 */
export async function extractReceiptData(fileBuffer, mimeType) {
  const documentBlock = buildDocumentBlock(fileBuffer, mimeType);
  if (!documentBlock) {
    throw new AiExtractionError(`Unsupported file type for extraction: ${mimeType}`);
  }

  let response;
  try {
    response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            documentBlock,
            { type: 'text', text: EXTRACTION_PROMPT },
          ],
        },
      ],
    });
  } catch (err) {
    throw new AiExtractionError('AI provider request failed.', err);
  }

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock) {
    throw new AiExtractionError('AI response contained no text content.');
  }

  return parseExtractionResponse(textBlock.text);
}

function buildDocumentBlock(fileBuffer, mimeType) {
  const data = fileBuffer.toString('base64');

  if (IMAGE_MIME_TYPES.has(mimeType)) {
    return {
      type: 'image',
      source: { type: 'base64', media_type: mimeType, data },
    };
  }

  if (mimeType === PDF_MIME_TYPE) {
    return {
      type: 'document',
      source: { type: 'base64', media_type: PDF_MIME_TYPE, data },
    };
  }

  return null;
}

/**
 * Safely parses the model's JSON response, never trusting it blindly.
 */
export function parseExtractionResponse(rawText) {
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new AiExtractionError('Could not locate JSON in AI response.');
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch (err) {
    throw new AiExtractionError('AI response was not valid JSON.', err);
  }

  return normalizeExtraction(parsed);
}

const VALID_CATEGORIES = new Set([
  'groceries', 'dining', 'transportation', 'utilities',
  'entertainment', 'office', 'travel', 'healthcare', 'other',
]);
const VALID_CONFIDENCE = new Set(['high', 'medium', 'low']);

function normalizeExtraction(parsed) {
  const lineItems = Array.isArray(parsed.line_items)
    ? parsed.line_items
        .filter((item) => item && typeof item.description === 'string')
        .map((item) => ({
          description: item.description,
          amount: typeof item.amount === 'number' ? item.amount : null,
        }))
    : [];

  return {
    vendor: typeof parsed.vendor === 'string' ? parsed.vendor : null,
    date: typeof parsed.date === 'string' ? parsed.date : null,
    total: typeof parsed.total === 'number' ? parsed.total : null,
    currency: typeof parsed.currency === 'string' ? parsed.currency : null,
    category: VALID_CATEGORIES.has(parsed.category) ? parsed.category : 'other',
    line_items: lineItems,
    confidence: VALID_CONFIDENCE.has(parsed.confidence) ? parsed.confidence : 'low',
  };
}
