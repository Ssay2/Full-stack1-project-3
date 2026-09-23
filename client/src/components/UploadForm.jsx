import { useRef, useState } from 'react';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

export default function UploadForm({ onAnalyze, isLoading }) {
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState(null);
  const inputRef = useRef(null);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    setError(null);
    setFileName(null);
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Unsupported file type. Use JPEG, PNG, WEBP, or PDF.');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError('File too large. Max size is 10MB.');
      e.target.value = '';
      return;
    }

    setFileName(file.name);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setError('Please choose a file first.');
      return;
    }
    onAnalyze(file);
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        onChange={handleFileChange}
        disabled={isLoading}
      />
      {fileName && <p className="file-name">Selected: {fileName}</p>}
      {error && <p className="error-text">{error}</p>}
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Analyzing…' : 'Analyze receipt'}
      </button>
    </form>
  );
}
