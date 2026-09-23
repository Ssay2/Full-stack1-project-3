const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export async function analyzeReceipt(file) {
  const formData = new FormData();
  formData.append('receipt', file);

  const res = await fetch(`${API_BASE}/api/analyze`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to analyze receipt.');
  }
  return data.receipt;
}
