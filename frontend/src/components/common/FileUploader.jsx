import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, Image, X, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

/**
 * Drag-and-drop file uploader with type detection and validation.
 *
 * @param {object} props
 * @param {function} props.onFileAccepted - Called with { file, type: 'svg'|'csv', content: string }
 * @param {string[]} [props.accept] - Accepted file types, default ['svg', 'csv']
 * @param {string} [props.label] - Custom label text
 * @param {string} [props.className] - Additional classes
 */
export default function FileUploader({
  onFileAccepted,
  accept = ['svg', 'csv'],
  label,
  className = '',
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const acceptStr = accept.map((t) => `.${t}`).join(',');
  const typeLabels = accept.map((t) => t.toUpperCase()).join(' / ');

  const validateAndProcess = useCallback(
    async (selectedFile) => {
      setError(null);

      // Check extension
      const ext = selectedFile.name.split('.').pop().toLowerCase();
      if (!accept.includes(ext)) {
        setError(`Invalid file type. Please upload ${typeLabels}.`);
        return;
      }

      // Size check — max 5MB
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File too large. Maximum 5MB.');
        return;
      }

      // Read content
      try {
        const content = await selectedFile.text();

        // Basic validation
        if (ext === 'svg') {
          if (!content.includes('<svg') && !content.includes('<SVG')) {
            setError('Invalid SVG: no <svg> element found.');
            return;
          }
        }

        if (ext === 'csv') {
          const lines = content.trim().split('\n');
          if (lines.length < 2) {
            setError('CSV must have at least 2 data rows.');
            return;
          }
          // Check that first data line has comma-separated numbers
          const firstDataLine = lines[0].replace(/^\uFEFF/, ''); // Remove BOM
          const parts = firstDataLine.split(',');
          if (parts.length < 2 || parts.some((p) => isNaN(parseFloat(p.trim())))) {
            setError('CSV format: each row should be x,y numeric values.');
            return;
          }
        }

        setFile(selectedFile);
        onFileAccepted?.({ file: selectedFile, type: ext, content });
      } catch (err) {
        setError(`Failed to read file: ${err.message}`);
      }
    },
    [accept, typeLabels, onFileAccepted]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFile = e.dataTransfer?.files?.[0];
      if (droppedFile) validateAndProcess(droppedFile);
    },
    [validateAndProcess]
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleInputChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) validateAndProcess(selectedFile);
  };

  const clearFile = () => {
    setFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className={className}>
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={clsx(
          'relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200',
          isDragging
            ? 'border-blueprint-400 bg-blueprint-500/10 scale-[1.01]'
            : 'border-[var(--color-border)] hover:border-blueprint-400/50 hover:bg-[var(--color-bg-input)]/50',
          file && 'border-emerald-500/50 bg-emerald-500/5'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptStr}
          onChange={handleInputChange}
          className="hidden"
        />

        {file ? (
          /* File loaded state */
          <div className="flex items-center justify-center gap-3">
            {file.name.endsWith('.svg') ? (
              <Image size={20} className="text-emerald-400" />
            ) : (
              <FileText size={20} className="text-emerald-400" />
            )}
            <div className="text-left">
              <p className="text-sm font-medium text-emerald-400">{file.name}</p>
              <p className="text-2xs text-[var(--color-text-muted)]">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); clearFile(); }}
              className="ml-2 p-1 rounded hover:bg-red-500/10 text-[var(--color-text-muted)] hover:text-red-400 transition-colors"
              title="Remove file"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center gap-2">
            <Upload
              size={24}
              className={clsx(
                'transition-colors',
                isDragging ? 'text-blueprint-400' : 'text-[var(--color-text-muted)]'
              )}
            />
            <p className="text-sm text-[var(--color-text-secondary)]">
              {label || `Drag & drop ${typeLabels} file here`}
            </p>
            <p className="text-2xs text-[var(--color-text-muted)]">
              or click to browse (max 5MB)
            </p>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-2 mt-2 p-2 rounded-md bg-red-500/10 border border-red-500/20">
          <AlertCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
