/**
 * Dialog for bulk importing translations from CSV.
 */

import React, { useState, useRef } from 'react';
import { X, Upload, FileText, Check, AlertCircle } from 'lucide-react';
import { bulkImportCSV } from '@/services/api/translations';
import type { BulkImportResponse } from '@/types/translation';

interface BulkImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const BulkImportDialog: React.FC<BulkImportDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BulkImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      setFile(droppedFile);
      setResult(null);
      setError(null);
    } else {
      setError('Please upload a CSV file');
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const response = await bulkImportCSV(file);
      setResult(response);
      if (response.imported > 0 || response.updated > 0) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Bulk Import Translations
          </h3>
          <button
            onClick={handleClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {/* Content */}
        {!result ? (
          <>
            {/* Drop Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="mb-4 cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-8 text-center hover:border-blue-500 dark:border-gray-600 dark:hover:border-blue-400"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              {file ? (
                <div className="flex items-center justify-center gap-2 text-gray-700 dark:text-gray-300">
                  <FileText className="h-6 w-6 text-blue-500" />
                  <span>{file.name}</span>
                </div>
              ) : (
                <>
                  <Upload className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Drag CSV file here, or click to select
                  </p>
                </>
              )}
            </div>
            {/* Format Help */}
            <div className="mb-4 rounded-lg bg-gray-50 p-4 text-sm dark:bg-gray-700/50">
              <p className="mb-2 font-medium text-gray-700 dark:text-gray-300">
                CSV Format:
              </p>
              <code className="block text-xs text-gray-600 dark:text-gray-400">
                ticker,market,name_en,name_zh_tw
                <br />
                NVDA,US,NVIDIA CORP,輝達
                <br />
                AAPL,US,Apple Inc.,蘋果
              </code>
            </div>
            {/* Error */}
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={handleClose}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!file || loading}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Importing...' : 'Start Import'}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Result */}
            <div className="mb-4">
              <div className="mb-4 flex items-center justify-center">
                <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
                  <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <p className="mb-4 text-center text-gray-700 dark:text-gray-300">
                Import Complete
              </p>
              <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {result.imported}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Added
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {result.updated}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Updated
                  </div>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="mt-4 rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                  <p className="mb-2 text-sm font-medium text-red-600 dark:text-red-400">
                    {result.errors.length} errors:
                  </p>
                  <ul className="max-h-32 overflow-y-auto text-xs text-red-500 dark:text-red-400">
                    {result.errors.slice(0, 10).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                    {result.errors.length > 10 && (
                      <li>... and {result.errors.length - 10} more errors</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
            {/* Close */}
            <div className="flex justify-end">
              <button
                onClick={handleClose}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
