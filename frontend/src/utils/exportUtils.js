/**
 * Export Utilities
 * Handles triggering file downloads in the browser for all export formats.
 */
import axios from 'axios';
import { API } from '../config/api';

/**
 * Download a string as a file.
 *
 * @param {string} content - File content
 * @param {string} filename - Download filename
 * @param {string} [mimeType='text/plain'] - MIME type
 */
export function downloadString(content, filename, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  downloadBlob(blob, filename);
}

/**
 * Download a Blob as a file.
 *
 * @param {Blob} blob
 * @param {string} filename
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export mechanism parameters as JSON.
 *
 * @param {object} mechanismData - Mechanism result object
 * @param {string} [filename='zxynth-mechanism.json']
 */
export function exportJson(mechanismData, filename = 'zxynth-mechanism.json') {
  const content = JSON.stringify(mechanismData, null, 2);
  downloadString(content, filename, 'application/json');
}

/**
 * Export mechanism parameters as CSV.
 *
 * @param {object} mechanismData - Mechanism result with params
 * @param {string} [filename='zxynth-mechanism.csv']
 */
export function exportCsv(mechanismData, filename = 'zxynth-mechanism.csv') {
  const params = mechanismData.parameters || {};
  const lines = ['Parameter,Value'];

  for (const [key, val] of Object.entries(params)) {
    lines.push(`${key},${val}`);
  }

  // Add error metrics if available
  if (mechanismData.errorMetrics) {
    lines.push('');
    lines.push('Metric,Value');
    for (const [key, val] of Object.entries(mechanismData.errorMetrics)) {
      lines.push(`${key},${val}`);
    }
  }

  downloadString(lines.join('\n'), filename, 'text/csv');
}

/**
 * Request a server-generated export (PDF, GIF, DXF, SVG).
 * The backend generates the file and returns it as a blob.
 *
 * @param {'pdf'|'gif'|'dxf'|'svg'} format - Export format
 * @param {object} exportData - Data needed for export generation
 * @param {object} [options] - Format-specific options
 * @returns {Promise<void>}
 */
export async function requestServerExport(format, exportData, options = {}) {
  const endpoints = {
    pdf: API.exportPdf,
    gif: API.exportGif,
    dxf: API.exportDxf,
    svg: API.exportSvg,
  };

  const endpoint = endpoints[format];
  if (!endpoint) throw new Error(`Unknown export format: ${format}`);

  const extensions = { pdf: 'pdf', gif: 'gif', dxf: 'dxf', svg: 'svg' };
  const mimeTypes = {
    pdf: 'application/pdf',
    gif: 'image/gif',
    dxf: 'application/dxf',
    svg: 'image/svg+xml',
  };

  const response = await axios.post(
    endpoint,
    { ...exportData, options },
    { responseType: 'blob' }
  );

  const filename = `zxynth-mechanism.${extensions[format]}`;
  downloadBlob(response.data, filename);
}

/**
 * Handle export action from ExportMenu.
 *
 * @param {string} formatId - Export format id from ExportMenu
 * @param {object} mechanismData - Full mechanism result
 * @param {object} [options] - Extra options (gif frame rate, pdf mode, etc.)
 */
export async function handleExport(formatId, mechanismData, options = {}) {
  switch (formatId) {
    case 'json':
      exportJson(mechanismData);
      break;
    case 'csv':
      exportCsv(mechanismData);
      break;
    case 'pdf_full':
      await requestServerExport('pdf', mechanismData, { mode: 'full', ...options });
      break;
    case 'pdf_concise':
      await requestServerExport('pdf', mechanismData, { mode: 'concise', ...options });
      break;
    case 'gif':
      await requestServerExport('gif', mechanismData, options);
      break;
    case 'dxf':
      await requestServerExport('dxf', mechanismData, options);
      break;
    case 'svg':
      await requestServerExport('svg', mechanismData, options);
      break;
    default:
      throw new Error(`Unknown export format: ${formatId}`);
  }
}
