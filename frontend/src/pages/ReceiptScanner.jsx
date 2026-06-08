import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { expensesApi } from '../lib/api';
import { parseReceiptFromImage } from '../lib/ocr';
import {
  Upload, ScanLine, CheckCircle, AlertCircle, Camera,
  ArrowRight, RefreshCw, Trash2, Save
} from 'lucide-react';

const CATEGORIES = [
  'Food', 'Travel', 'Shopping', 'Utilities',
  'Healthcare', 'Entertainment', 'Education', 'Rent', 'Miscellaneous'
];

const STEPS = {
  UPLOAD: 'upload',
  SCANNING: 'scanning',
  REVIEW: 'review',
  SAVED: 'saved',
};

export default function ReceiptScanner() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const cameraRef = useRef(null);

  const [step, setStep] = useState(STEPS.UPLOAD);
  const [isDragging, setIsDragging] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrError, setOcrError] = useState(null);
  const [rawText, setRawText] = useState('');
  const [showRawText, setShowRawText] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'Food',
    expenseDate: new Date().toISOString().split('T')[0],
    merchantName: '',
    description: ''
  });

  const saveMutation = useMutation({
    mutationFn: (data) => expensesApi.create({ ...data, userId: currentUser.uid }),
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses']);
      setStep(STEPS.SAVED);
    }
  });

  const processFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) return;

    setReceiptPreview(URL.createObjectURL(file));
    setStep(STEPS.SCANNING);
    setOcrProgress(0);
    setOcrError(null);

    try {
      const result = await parseReceiptFromImage(file, setOcrProgress);
      setRawText(result.rawText);
      setFormData({
        title: result.merchantName || '',
        merchantName: result.merchantName || '',
        amount: result.amount ? result.amount.toString() : '',
        expenseDate: result.expenseDate || new Date().toISOString().split('T')[0],
        category: 'Food',
        description: ''
      });
      setStep(STEPS.REVIEW);
    } catch (err) {
      setOcrError('OCR failed. You can still fill in the fields manually.');
      setStep(STEPS.REVIEW);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
  };

  const handleSave = (e) => {
    e.preventDefault();
    saveMutation.mutate({ ...formData, amount: parseFloat(formData.amount) });
  };

  const reset = () => {
    setStep(STEPS.UPLOAD);
    setReceiptPreview(null);
    setOcrProgress(0);
    setOcrError(null);
    setRawText('');
    setFormData({
      title: '', amount: '', category: 'Food',
      expenseDate: new Date().toISOString().split('T')[0],
      merchantName: '', description: ''
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <ScanLine className="h-6 w-6 text-blue-600 mr-2" />
          Receipt Scanner
        </h1>
        <p className="text-sm text-gray-500 mt-1">Snap or upload a receipt — we'll auto-fill the expense details for you.</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center space-x-2 text-sm">
        {[
          { key: STEPS.UPLOAD, label: '1. Upload' },
          { key: STEPS.SCANNING, label: '2. Scan' },
          { key: STEPS.REVIEW, label: '3. Review & Save' },
        ].map((s, idx) => (
          <div key={s.key} className="flex items-center">
            <span className={`px-3 py-1 rounded-full font-medium transition-colors ${
              step === s.key
                ? 'bg-blue-600 text-white'
                : step === STEPS.SAVED || (idx < [STEPS.UPLOAD, STEPS.SCANNING, STEPS.REVIEW].indexOf(step))
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-400'
            }`}>
              {s.label}
            </span>
            {idx < 2 && <ArrowRight className="h-4 w-4 text-gray-300 mx-1" />}
          </div>
        ))}
      </div>

      {/* Step: Upload */}
      {step === STEPS.UPLOAD && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Drag & Drop Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            className={`cursor-pointer border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-10 transition-all
              ${isDragging ? 'border-blue-500 bg-blue-50 scale-[1.02]' : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50'}`}
          >
            <div className={`p-4 rounded-full mb-4 transition-colors ${isDragging ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <Upload className={`h-8 w-8 ${isDragging ? 'text-blue-600' : 'text-gray-400'}`} />
            </div>
            <p className="text-base font-semibold text-gray-700">Drop your receipt here</p>
            <p className="text-sm text-gray-400 mt-1">or click to browse files</p>
            <p className="text-xs text-gray-300 mt-3">JPG, PNG, WEBP, PDF supported</p>
          </div>

          {/* Camera */}
          <div
            onClick={() => cameraRef.current?.click()}
            className="cursor-pointer border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center p-10 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50 transition-all"
          >
            <div className="p-4 bg-gray-100 rounded-full mb-4">
              <Camera className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-base font-semibold text-gray-700">Use Camera</p>
            <p className="text-sm text-gray-400 mt-1">Take a live photo of your receipt</p>
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
        </div>
      )}

      {/* Step: Scanning */}
      {step === STEPS.SCANNING && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col items-center justify-center space-y-6">
          {receiptPreview && (
            <img src={receiptPreview} alt="Receipt" className="max-h-48 rounded-xl object-contain border border-gray-100 shadow" />
          )}
          <div className="w-full max-w-sm space-y-3">
            <div className="flex items-center justify-between text-sm text-blue-700 font-medium">
              <span className="flex items-center">
                <ScanLine className="h-4 w-4 mr-2 animate-pulse" />
                Reading receipt text...
              </span>
              <span>{ocrProgress}%</span>
            </div>
            <div className="w-full bg-blue-100 rounded-full h-3">
              <div
                className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${ocrProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 text-center">This usually takes 5-15 seconds...</p>
          </div>
        </div>
      )}

      {/* Step: Review */}
      {step === STEPS.REVIEW && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Receipt Preview */}
          <div className="space-y-4">
            {receiptPreview ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
                <img src={receiptPreview} alt="Receipt" className="w-full object-contain max-h-72 rounded-lg" />
              </div>
            ) : null}

            {/* OCR Result status */}
            {ocrError ? (
              <div className="flex items-start p-3 bg-red-50 rounded-xl border border-red-100 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                {ocrError}
              </div>
            ) : (
              <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                <div className="flex items-center text-sm text-green-700 font-medium mb-1">
                  <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                  Receipt scanned! Fields auto-filled.
                </div>
                <button
                  onClick={() => setShowRawText(!showRawText)}
                  className="text-xs text-green-600 hover:underline"
                >
                  {showRawText ? 'Hide' : 'Show'} raw extracted text
                </button>
                {showRawText && rawText && (
                  <pre className="mt-2 text-xs text-gray-500 whitespace-pre-wrap font-mono bg-white p-2 rounded-lg border border-green-100 max-h-40 overflow-y-auto">
                    {rawText}
                  </pre>
                )}
              </div>
            )}

            <button
              onClick={reset}
              className="w-full flex items-center justify-center text-sm text-gray-500 hover:text-red-600 border border-gray-200 rounded-xl py-2 hover:border-red-200 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Discard & Scan Again
            </button>
          </div>

          {/* Expense Form */}
          <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Verify Details</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                required
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                placeholder="Expense title"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (₹) *
                  {formData.amount && <span className="ml-1 text-xs text-green-600">✓ auto</span>}
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                  {formData.expenseDate && <span className="ml-1 text-xs text-green-600">✓ auto</span>}
                </label>
                <input
                  required
                  type="date"
                  value={formData.expenseDate}
                  onChange={e => setFormData({ ...formData, expenseDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
              >
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Merchant Name
                {formData.merchantName && <span className="ml-1 text-xs text-green-600">✓ auto</span>}
              </label>
              <input
                type="text"
                value={formData.merchantName}
                onChange={e => setFormData({ ...formData, merchantName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                placeholder="Merchant name"
              />
            </div>

            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="w-full flex items-center justify-center bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? 'Saving...' : 'Save Expense'}
            </button>
          </form>
        </div>
      )}

      {/* Step: Saved */}
      {step === STEPS.SAVED && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 flex flex-col items-center text-center space-y-4">
          <div className="p-4 bg-green-100 rounded-full">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Expense Saved! 🎉</h2>
          <p className="text-gray-500">Your receipt has been scanned and expense recorded successfully.</p>
          <div className="flex space-x-3 pt-2">
            <button
              onClick={reset}
              className="flex items-center px-5 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Scan Another
            </button>
            <button
              onClick={() => navigate('/expenses')}
              className="flex items-center px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700"
            >
              View Expenses
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
