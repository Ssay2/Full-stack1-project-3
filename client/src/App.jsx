import { useState } from 'react';
import UploadForm from './components/UploadForm';
import ReceiptCard from './components/ReceiptCard';
import { analyzeReceipt } from './api/analyze';
import './App.css';

function App() {
  const [receipt, setReceipt] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleAnalyze(file) {
    setIsLoading(true);
    setError(null);
    setReceipt(null);
    try {
      const result = await analyzeReceipt(file);
      setReceipt(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="app">
      <h1>Receipt Analyzer</h1>
      <p>Upload a receipt or invoice image and let AI extract the details.</p>

      <UploadForm onAnalyze={handleAnalyze} isLoading={isLoading} />

      {error && <p className="error-text">{error}</p>}
      {receipt && <ReceiptCard receipt={receipt} onUpdated={setReceipt} />}
    </div>
  );
}

export default App;
