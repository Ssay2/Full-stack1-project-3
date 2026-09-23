import { useState } from 'react';

const CATEGORIES = [
  'groceries', 'dining', 'transportation', 'utilities',
  'entertainment', 'office', 'travel', 'healthcare', 'other',
];

const CATEGORY_COLORS = {
  groceries: '#16a34a',
  dining: '#ea580c',
  transportation: '#0891b2',
  utilities: '#7c3aed',
  entertainment: '#db2777',
  office: '#4f46e5',
  travel: '#0d9488',
  healthcare: '#dc2626',
  other: '#64748b',
};

function toFormState(r) {
  return {
    vendor: r.vendor ?? '',
    date: r.date ?? '',
    total: r.total ?? '',
    category: r.category ?? 'other',
  };
}

// v1 is stateless: edits only update local component state, nothing is sent back to the server.
export default function ReceiptCard({ receipt, onUpdated }) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(toFormState(receipt));

  function handleSave() {
    onUpdated({
      ...receipt,
      vendor: form.vendor || null,
      date: form.date || null,
      total: form.total === '' ? null : Number(form.total),
      category: form.category,
    });
    setIsEditing(false);
  }

  return (
    <div className="receipt-card">
      {receipt.confidence === 'low' && (
        <div className="confidence-warning">
          Low confidence extraction — please review the fields below.
        </div>
      )}

      {isEditing ? (
        <div className="receipt-edit-form">
          <label>
            Vendor
            <input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} />
          </label>
          <label>
            Date
            <input type="date" value={form.date ?? ''} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </label>
          <label>
            Total
            <input type="number" step="0.01" value={form.total} onChange={(e) => setForm({ ...form, total: e.target.value })} />
          </label>
          <label>
            Category
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <div className="edit-actions">
            <button onClick={handleSave}>Save</button>
            <button type="button" onClick={() => setIsEditing(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <table className="receipt-table">
            <tbody>
              <tr><th>Vendor</th><td>{receipt.vendor ?? '—'}</td></tr>
              <tr><th>Date</th><td>{receipt.date ?? '—'}</td></tr>
              <tr><th>Total</th><td>{receipt.total != null ? `$${Number(receipt.total).toFixed(2)}` : '—'}</td></tr>
              <tr>
                <th>Category</th>
                <td>
                  {receipt.category ? (
                    <span
                      className="category-badge"
                      style={{ backgroundColor: CATEGORY_COLORS[receipt.category] ?? CATEGORY_COLORS.other }}
                    >
                      {receipt.category}
                    </span>
                  ) : '—'}
                </td>
              </tr>
            </tbody>
          </table>

          {receipt.line_items?.length > 0 && (
            <ul className="line-items">
              {receipt.line_items.map((item, idx) => (
                <li key={idx}>
                  {item.description} {item.amount != null ? `— $${Number(item.amount).toFixed(2)}` : ''}
                </li>
              ))}
            </ul>
          )}

          <button onClick={() => setIsEditing(true)}>Edit</button>
        </>      )}
    </div>
  );
}
