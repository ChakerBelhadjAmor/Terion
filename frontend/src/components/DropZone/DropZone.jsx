import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, Download } from 'lucide-react';
import { parseExcelFile, downloadTemplate } from '../../utils/excelParser';
import { useApp } from '../../context/AppContext';

export default function DropZone({ onSuccess }) {
  const { loadExcelData } = useApp();
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');

  const onDrop = useCallback(async (accepted) => {
    if (!accepted.length) return;
    const file = accepted[0];
    setStatus('loading');
    setErrorMsg('');
    try {
      const products = await parseExcelFile(file);
      loadExcelData(products, file.name);
      setStatus('success');
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1200);
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message);
    }
  }, [loadExcelData, onSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
    disabled: status === 'loading',
  });

  return (
    <motion.div
      {...getRootProps()}
      className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 p-12 flex flex-col items-center gap-4 text-center select-none ${
        isDragActive
          ? 'border-primary bg-primary/5 shadow-glow-primary'
          : status === 'success'
          ? 'border-green-400 bg-green-50'
          : status === 'error'
          ? 'border-red-300 bg-red-50'
          : 'border-gray-200 bg-white hover:border-primary/50 hover:bg-primary/2'
      }`}
      animate={isDragActive ? { scale: 1.01 } : { scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <input {...getInputProps()} />

      <AnimatePresence mode="wait">
        {status === 'loading' && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
            <p className="text-gray-600 font-medium">Analyse du fichier en cours…</p>
          </motion.div>
        )}
        {status === 'success' && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <p className="text-green-700 font-semibold text-lg">PDP chargé avec succès !</p>
            <p className="text-gray-500 text-sm">Redirection vers le tableau de bord…</p>
          </motion.div>
        )}
        {status === 'error' && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <div>
              <p className="text-red-700 font-semibold">Erreur de lecture</p>
              <p className="text-red-500 text-sm mt-1">{errorMsg}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setStatus('idle'); }}
              className="text-sm text-primary underline"
            >
              Réessayer
            </button>
          </motion.div>
        )}
        {(status === 'idle') && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-5">
            <motion.div
              animate={isDragActive ? { y: -8 } : { y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              className={`w-24 h-24 rounded-2xl flex items-center justify-center transition-colors ${
                isDragActive ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'
              }`}
            >
              {isDragActive ? (
                <FileSpreadsheet className="w-12 h-12" />
              ) : (
                <Upload className="w-12 h-12" />
              )}
            </motion.div>

            <div>
              <p className="text-gray-800 font-semibold text-xl">
                {isDragActive ? 'Déposez votre fichier ici' : 'Déposez votre PDP Excel ici'}
              </p>
              <p className="text-gray-400 mt-2 text-sm">
                Formats supportés : .xlsx, .xls · ou{' '}
                <span className="text-primary font-medium">cliquez pour parcourir</span>
              </p>
            </div>

            <div className="flex gap-2 mt-2">
              {['.xlsx', '.xls', 'PDP', 'Gammes'].map(tag => (
                <span key={tag} className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-500 font-medium">
                  {tag}
                </span>
              ))}
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); downloadTemplate(); }}
              className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              Télécharger le modèle Excel
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
