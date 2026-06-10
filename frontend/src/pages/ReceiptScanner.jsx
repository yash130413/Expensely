import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { expensesApi } from '../lib/api';
import { parseReceiptFromImage } from '../lib/ocr';
import { Upload, ScanLine, CheckCircle, AlertCircle, Camera, ArrowRight, RefreshCw, Trash2, Save, Sparkles, FileImage } from 'lucide-react';

const CATEGORIES = ['Food','Travel','Shopping','Utilities','Healthcare','Entertainment','Education','Rent','Miscellaneous'];
const STEPS = { UPLOAD: 'upload', SCANNING: 'scanning', REVIEW: 'review', SAVED: 'saved' };

const inputCls = "w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white";
const labelCls = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5";

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
  const [formData, setFormData] = useState({ title:'', amount:'', category:'Food', expenseDate: new Date().toISOString().split('T')[0], merchantName:'', description:'' });

  const saveMutation = useMutation({
    mutationFn: (data) => expensesApi.create({ ...data, userId: currentUser.uid }),
    onSuccess: () => { queryClient.invalidateQueries(['expenses']); setStep(STEPS.SAVED); }
  });

  const processFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setReceiptPreview(URL.createObjectURL(file));
    setStep(STEPS.SCANNING); setOcrProgress(0); setOcrError(null);
    try {
      const result = await parseReceiptFromImage(file, setOcrProgress);
      setRawText(result.rawText);
      setFormData({ title: result.merchantName||'', merchantName: result.merchantName||'', amount: result.amount?result.amount.toString():'', expenseDate: result.expenseDate||new Date().toISOString().split('T')[0], category:'Food', description:'' });
      setStep(STEPS.REVIEW);
    } catch { setOcrError('OCR failed. Fill in details manually.'); setStep(STEPS.REVIEW); }
  }, []);

  const handleDrop = useCallback((e) => { e.preventDefault(); setIsDragging(false); const f=e.dataTransfer.files[0]; if(f) processFile(f); }, [processFile]);
  const reset = () => { setStep(STEPS.UPLOAD); setReceiptPreview(null); setOcrProgress(0); setOcrError(null); setRawText(''); setFormData({title:'',amount:'',category:'Food',expenseDate:new Date().toISOString().split('T')[0],merchantName:'',description:''}); };

  const stepList = [
    { key: STEPS.UPLOAD, num: '01', label: 'Upload' },
    { key: STEPS.SCANNING, num: '02', label: 'Scan' },
    { key: STEPS.REVIEW, num: '03', label: 'Review & Save' },
  ];
  const stepIdx = { [STEPS.UPLOAD]:0, [STEPS.SCANNING]:1, [STEPS.REVIEW]:2, [STEPS.SAVED]:3 };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-violet-100 p-1.5 rounded-lg">
              <ScanLine className="h-4 w-4 text-violet-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Receipt Scanner</h1>
          </div>
          <p className="text-sm text-gray-500">Upload a receipt — OCR will auto-fill the expense details for you</p>
        </div>
        {step !== STEPS.UPLOAD && step !== STEPS.SAVED && (
          <button onClick={reset} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 bg-white border border-gray-200 hover:border-red-200 hover:bg-red-50 px-3 py-2 rounded-xl transition-all">
            <RefreshCw className="h-3.5 w-3.5" /> Start Over
          </button>
        )}
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-0 bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5">
        {stepList.map((s, i) => {
          const current = step === s.key;
          const done = stepIdx[step] > i;
          return (
            <div key={s.key} className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all ${current ? 'bg-blue-600 text-white shadow-sm' : done ? 'text-emerald-600' : 'text-gray-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${current ? 'bg-white/20 text-white' : done ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                {done ? '✓' : s.num}
              </span>
              {s.label}
            </div>
          );
        })}
      </div>

      {/* Upload Step */}
      {step === STEPS.UPLOAD && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            className={`cursor-pointer rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-12 transition-all ${isDragging ? 'border-blue-500 bg-blue-50 scale-[1.02]' : 'border-gray-200 bg-gray-50/50 hover:border-blue-400 hover:bg-blue-50/30'}`}
          >
            <div className={`p-5 rounded-2xl mb-5 transition-all ${isDragging ? 'bg-blue-100' : 'bg-white border border-gray-100 shadow-sm'}`}>
              <Upload className={`h-8 w-8 ${isDragging ? 'text-blue-600' : 'text-gray-400'}`} />
            </div>
            <p className="text-base font-bold text-gray-800">Drop receipt here</p>
            <p className="text-sm text-gray-400 mt-1">or click to browse files</p>
            <div className="flex items-center gap-2 mt-4">
              {['JPG','PNG','WEBP'].map(f => <span key={f} className="text-xs bg-white border border-gray-100 text-gray-500 px-2 py-0.5 rounded-md font-medium shadow-sm">{f}</span>)}
            </div>
          </div>

          <div
            onClick={() => cameraRef.current?.click()}
            className="cursor-pointer rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 flex flex-col items-center justify-center p-12 hover:border-violet-400 hover:bg-violet-50/30 transition-all group"
          >
            <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm mb-5 group-hover:border-violet-100 group-hover:bg-violet-50 transition-all">
              <Camera className="h-8 w-8 text-gray-400 group-hover:text-violet-500 transition-colors" />
            </div>
            <p className="text-base font-bold text-gray-800">Use Camera</p>
            <p className="text-sm text-gray-400 mt-1">Take a live photo of your receipt</p>
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && processFile(e.target.files[0])} />
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => e.target.files[0] && processFile(e.target.files[0])} />
        </div>
      )}

      {/* Scanning Step */}
      {step === STEPS.SCANNING && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 flex flex-col items-center space-y-8">
          {receiptPreview && <img src={receiptPreview} alt="Receipt" className="max-h-52 rounded-2xl object-contain border border-gray-100 shadow-md" />}
          <div className="w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-600">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
                <span className="text-sm font-semibold">Analyzing receipt with OCR...</span>
              </div>
              <span className="text-2xl font-extrabold text-blue-600">{ocrProgress}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-violet-500 h-3 rounded-full transition-all duration-300 relative overflow-hidden" style={{width:`${ocrProgress}%`}}>
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>
            <p className="text-xs text-center text-gray-400">This usually takes 5–15 seconds depending on image quality</p>
          </div>
        </div>
      )}

      {/* Review Step */}
      {step === STEPS.REVIEW && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Left: Preview + Status */}
          <div className="space-y-4">
            {receiptPreview && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
                  <FileImage className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Receipt Preview</span>
                </div>
                <img src={receiptPreview} alt="Receipt" className="w-full object-contain max-h-64 p-3" />
              </div>
            )}

            {ocrError ? (
              <div className="flex items-start gap-3 p-4 bg-red-50 rounded-2xl border border-red-100">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-700">OCR Failed</p>
                  <p className="text-xs text-red-500 mt-0.5">{ocrError}</p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <p className="text-sm font-bold text-emerald-700">Receipt scanned successfully!</p>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                  <p className="text-xs text-emerald-600">Fields have been auto-filled from receipt data</p>
                </div>
                <button onClick={() => setShowRawText(!showRawText)} className="mt-2 text-xs text-emerald-600 hover:underline font-medium">
                  {showRawText ? 'Hide' : 'View'} extracted text
                </button>
                {showRawText && <pre className="mt-2 text-xs text-gray-500 whitespace-pre-wrap bg-white p-3 rounded-xl border border-emerald-100 max-h-36 overflow-y-auto font-mono">{rawText}</pre>}
              </div>
            )}

            <button onClick={reset} className="w-full flex items-center justify-center gap-2 text-sm font-medium text-gray-500 hover:text-red-600 bg-white border border-gray-200 hover:border-red-200 hover:bg-red-50 rounded-2xl py-3 transition-all">
              <Trash2 className="h-4 w-4" /> Discard & Scan Again
            </button>
          </div>

          {/* Right: Form */}
          <form onSubmit={e=>{e.preventDefault();saveMutation.mutate({...formData,amount:parseFloat(formData.amount)});}} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Verify & Save Details</h3>
              <p className="text-xs text-gray-400 mt-0.5">Review auto-filled fields before saving</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={labelCls}>Title *</label>
                <input required type="text" value={formData.title} onChange={e=>setFormData({...formData,title:e.target.value})} className={inputCls} placeholder="e.g., Grocery Shopping" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Amount (₹) * {formData.amount && <span className="text-emerald-500 normal-case font-semibold">✓ auto</span>}</label>
                  <input required type="number" min="0" step="0.01" value={formData.amount} onChange={e=>setFormData({...formData,amount:e.target.value})} className={inputCls} placeholder="0.00" />
                </div>
                <div>
                  <label className={labelCls}>Date * {formData.expenseDate && <span className="text-emerald-500 normal-case font-semibold">✓ auto</span>}</label>
                  <input required type="date" value={formData.expenseDate} onChange={e=>setFormData({...formData,expenseDate:e.target.value})} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Category *</label>
                <select value={formData.category} onChange={e=>setFormData({...formData,category:e.target.value})} className={inputCls}>
                  {CATEGORIES.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Merchant Name {formData.merchantName && <span className="text-emerald-500 normal-case font-semibold">✓ auto</span>}</label>
                <input type="text" value={formData.merchantName} onChange={e=>setFormData({...formData,merchantName:e.target.value})} className={inputCls} placeholder="e.g., D-Mart" />
              </div>
              <button type="submit" disabled={saveMutation.isPending}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md shadow-blue-200 disabled:opacity-50 text-sm">
                <Save className="h-4 w-4" />
                {saveMutation.isPending ? 'Saving...' : 'Save Expense'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Saved Step */}
      {step === STEPS.SAVED && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 flex flex-col items-center text-center">
          <div className="relative mb-6">
            <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center border-4 border-emerald-100">
              <CheckCircle className="h-12 w-12 text-emerald-500" />
            </div>
            <div className="absolute -top-1 -right-1 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-lg shadow-lg">🎉</div>
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">Expense Saved!</h2>
          <p className="text-gray-500 text-sm mt-2 max-w-xs">Your receipt has been scanned and the expense has been recorded successfully.</p>
          <div className="flex gap-3 mt-8">
            <button onClick={reset} className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all">
              <RefreshCw className="h-4 w-4" /> Scan Another
            </button>
            <button onClick={() => navigate('/expenses')} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-200">
              View Expenses <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
