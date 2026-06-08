import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Upload, ScanLine, CheckCircle, AlertCircle, Camera } from 'lucide-react';
import { parseReceiptFromImage } from '../lib/ocr';

const CATEGORIES = [
  'Food', 'Travel', 'Shopping', 'Utilities',
  'Healthcare', 'Entertainment', 'Education', 'Rent', 'Miscellaneous'
];

const defaultForm = {
  title: '',
  amount: '',
  category: 'Food',
  expenseDate: new Date().toISOString().split('T')[0],
  merchantName: '',
  description: ''
};

export default function ExpenseModal({ isOpen, onClose, onSave, initialData }) {
  const [formData, setFormData] = useState(defaultForm);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [ocrState, setOcrState] = useState('idle'); // idle | processing | success | error
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrRawText, setOcrRawText] = useState('');
  const [showRawText, setShowRawText] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          ...initialData,
          amount: initialData.amount.toString(),
          expenseDate: new Date(initialData.expenseDate).toISOString().split('T')[0]
        });
      } else {
        setFormData(defaultForm);
      }
      setReceiptPreview(null);
      setReceiptFile(null);
      setOcrState('idle');
      setOcrProgress(0);
      setOcrRawText('');
    }
  }, [initialData, isOpen]);

  const processImage = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) return;

    setReceiptFile(file);
    setReceiptPreview(URL.createObjectURL(file));
    setOcrState('processing');
    setOcrProgress(0);

    try {
      const result = await parseReceiptFromImage(file, (progress) => {
        setOcrProgress(progress);
      });

      setOcrRawText(result.rawText);

      // Auto-fill fields only if they are empty
      setFormData(prev => ({
        ...prev,
        merchantName: prev.merchantName || result.merchantName || '',
        amount: prev.amount || (result.amount ? result.amount.toString() : ''),
        expenseDate: prev.expenseDate || result.expenseDate || defaultForm.expenseDate,
        // Use merchant name as title if title is empty
        title: prev.title || result.merchantName || '',
      }));

      setOcrState('success');
    } catch (err) {
      console.error('OCR failed:', err);
      setOcrState('error');
    }
  }, []);

  const handleFileDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processImage(file);
  }, [processImage]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) processImage(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      amount: parseFloat(formData.amount)
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div className="flex items-center space-x-2">
            <ScanLine className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">
              {initialData ? 'Edit Expense' : 'Add Expense'}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Receipt Upload */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              📸 Scan Receipt (OCR)
            </h3>

            {/* Drop Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleFileDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`relative border-2 border-dashed rounded-xl transition-all cursor-pointer overflow-hidden
                ${isDragging ? 'border-blue-500 bg-blue-50 scale-[1.01]' : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50'}`}
              style={{ minHeight: receiptPreview ? 'auto' : '160px' }}
            >
              {receiptPreview ? (
                <div className="relative">
                  <img
                    src={receiptPreview}
                    alt="Receipt preview"
                    className="w-full object-cover max-h-48 rounded-xl"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-xl">
                    <p className="text-white text-xs font-medium bg-black/50 px-3 py-1 rounded-full">Click to change</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-center p-4">
                  <div className="p-3 bg-blue-100 rounded-full mb-3">
                    <Upload className="h-6 w-6 text-blue-500" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">Drop receipt here or click to upload</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP supported</p>
                </div>
              )}
            </div>

            {/* Camera Button */}
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-blue-400 transition-colors"
            >
              <Camera className="h-4 w-4 mr-2 text-gray-400" />
              Use Camera
            </button>

            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />

            {/* OCR Progress / Status */}
            {ocrState === 'processing' && (
              <div className="space-y-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-center justify-between text-xs text-blue-700 font-medium">
                  <span className="flex items-center"><ScanLine className="h-3.5 w-3.5 mr-1.5 animate-pulse" />Analyzing receipt...</span>
                  <span>{ocrProgress}%</span>
                </div>
                <div className="w-full bg-blue-100 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${ocrProgress}%` }}
                  />
                </div>
              </div>
            )}

            {ocrState === 'success' && (
              <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                <div className="flex items-center text-sm text-green-700 font-medium">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500 flex-shrink-0" />
                  Fields auto-filled from receipt!
                </div>
                <button
                  type="button"
                  onClick={() => setShowRawText(!showRawText)}
                  className="mt-2 text-xs text-green-600 hover:underline"
                >
                  {showRawText ? 'Hide' : 'Show'} extracted text
                </button>
                {showRawText && (
                  <pre className="mt-2 text-xs text-gray-500 whitespace-pre-wrap bg-white p-2 rounded-lg border border-green-100 max-h-32 overflow-y-auto font-mono">
                    {ocrRawText}
                  </pre>
                )}
              </div>
            )}

            {ocrState === 'error' && (
              <div className="p-3 bg-red-50 rounded-xl border border-red-100 flex items-start">
                <AlertCircle className="h-4 w-4 mr-2 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">OCR failed. Please fill in the fields manually.</p>
              </div>
            )}
          </div>

          {/* Right: Form */}
          <form id="expense-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                required
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                placeholder="e.g., Grocery Shopping"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  required
                  type="date"
                  value={formData.expenseDate}
                  onChange={e => setFormData({ ...formData, expenseDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-sm"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Merchant Name
                {ocrState === 'success' && formData.merchantName && (
                  <span className="ml-2 text-xs text-green-600 font-normal">✓ Auto-filled</span>
                )}
              </label>
              <input
                type="text"
                value={formData.merchantName}
                onChange={e => setFormData({ ...formData, merchantName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                placeholder="e.g., D-Mart"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm resize-none"
                placeholder="Optional notes..."
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="expense-form"
            disabled={ocrState === 'processing'}
            className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {ocrState === 'processing' ? (
              <>
                <ScanLine className="h-4 w-4 mr-2 animate-pulse" />
                Scanning...
              </>
            ) : (
              initialData ? 'Update Expense' : 'Save Expense'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
