import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseExtractionResponse, AiExtractionError } from '../src/services/aiService.js';

test('parses a well-formed extraction JSON response', () => {
  const raw = JSON.stringify({
    vendor: 'Trader Joe\'s',
    date: '2026-01-15',
    total: 42.5,
    currency: 'USD',
    category: 'groceries',
    line_items: [{ description: 'Milk', amount: 3.5 }],
    confidence: 'high',
  });

  const result = parseExtractionResponse(raw);
  assert.equal(result.vendor, "Trader Joe's");
  assert.equal(result.total, 42.5);
  assert.equal(result.category, 'groceries');
  assert.equal(result.line_items.length, 1);
});

test('extracts JSON even when the model wraps it in markdown/commentary', () => {
  const raw = 'Here you go:\n```json\n{"vendor":"Shell","date":null,"total":55,"currency":"USD","category":"transportation","line_items":[],"confidence":"medium"}\n```';
  const result = parseExtractionResponse(raw);
  assert.equal(result.vendor, 'Shell');
  assert.equal(result.confidence, 'medium');
});

test('throws AiExtractionError on malformed JSON instead of crashing', () => {
  const raw = '{ this is not valid json ][';
  assert.throws(() => parseExtractionResponse(raw), AiExtractionError);
});

test('throws AiExtractionError when no JSON object is present', () => {
  const raw = 'Sorry, I could not read this document.';
  assert.throws(() => parseExtractionResponse(raw), AiExtractionError);
});

test('normalizes an unknown category to "other" instead of trusting the model blindly', () => {
  const raw = JSON.stringify({
    vendor: 'Acme',
    date: '2026-01-01',
    total: 10,
    currency: 'USD',
    category: 'not_a_real_category',
    line_items: [],
    confidence: 'nonsense',
  });

  const result = parseExtractionResponse(raw);
  assert.equal(result.category, 'other');
  assert.equal(result.confidence, 'low');
});

test('drops malformed line items instead of passing them through', () => {
  const raw = JSON.stringify({
    vendor: 'Acme',
    date: '2026-01-01',
    total: 10,
    currency: 'USD',
    category: 'other',
    line_items: [{ description: 'Widget', amount: 5 }, { amount: 5 }, null, 'garbage'],
    confidence: 'high',
  });

  const result = parseExtractionResponse(raw);
  assert.equal(result.line_items.length, 1);
  assert.equal(result.line_items[0].description, 'Widget');
});
