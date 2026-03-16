import { useState, useCallback } from 'react';
import { parseSvg } from '../utils/svgParser';
import { parseCsv, parseFunctionCsv } from '../utils/csvParser';
import { svgToMechanism, normalizePoints } from '../utils/coordinateTransform';

/**
 * Hook for handling file uploads — reads file, detects type, parses,
 * and returns processed points.
 *
 * @param {object} options
 * @param {'path' | 'function'} [options.mode='path'] - Parsing mode
 * @param {number} [options.numSamples=101] - SVG sampling density
 * @param {number} [options.normalizeSize=0] - If > 0, normalize points to this extent
 */
export default function useFileUpload({
  mode = 'path',
  numSamples = 101,
  normalizeSize = 0,
} = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  /**
   * Process an uploaded file.
   * Called by FileUploader's onFileAccepted.
   *
   * @param {{ file: File, type: string, content: string }} fileData
   */
  const processFile = useCallback(
    async ({ file, type, content }) => {
      setLoading(true);
      setError(null);
      setResult(null);

      try {
        let points = [];
        let metadata = {};

        if (type === 'svg') {
          // Parse SVG → sample path → convert coordinates
          const parsed = parseSvg(content, numSamples);
          const mechPoints = svgToMechanism(parsed.points, parsed.viewBox);

          if (normalizeSize > 0) {
            const { points: norm, scaleFactor } = normalizePoints(mechPoints, normalizeSize);
            points = norm;
            metadata.scaleFactor = scaleFactor;
          } else {
            points = mechPoints;
          }

          metadata.source = 'svg';
          metadata.rawPath = parsed.rawPath;
          metadata.viewBox = parsed.viewBox;
          metadata.originalPointCount = parsed.points.length;
        } else if (type === 'csv') {
          if (mode === 'function') {
            // Function generation CSV: theta_in, theta_out
            const parsed = parseFunctionCsv(content);
            points = parsed.pairs.map((p) => ({ x: p.thetaIn, y: p.thetaOut }));
            metadata.source = 'csv';
            metadata.hasHeader = parsed.hasHeader;
            metadata.isMonotonic = parsed.isMonotonic;
            metadata.functionPairs = parsed.pairs;
            metadata.warnings = parsed.warnings;
          } else {
            // Path generation CSV: x, y
            const parsed = parseCsv(content, 'path');

            if (normalizeSize > 0) {
              const { points: norm, scaleFactor } = normalizePoints(parsed.points, normalizeSize);
              points = norm;
              metadata.scaleFactor = scaleFactor;
            } else {
              points = parsed.points;
            }

            metadata.source = 'csv';
            metadata.hasHeader = parsed.hasHeader;
            metadata.warnings = parsed.warnings;
          }

          metadata.rowCount = points.length;
        } else {
          throw new Error(`Unsupported file type: ${type}`);
        }

        const output = {
          points,
          metadata,
          fileName: file.name,
          fileSize: file.size,
          fileType: type,
        };

        setResult(output);
        setLoading(false);
        return output;
      } catch (err) {
        const msg = err.message || 'Failed to parse file';
        setError(msg);
        setLoading(false);
        throw err;
      }
    },
    [mode, numSamples, normalizeSize]
  );

  /**
   * Reset the upload state.
   */
  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    processFile,
    reset,
    loading,
    error,
    result,
  };
}
