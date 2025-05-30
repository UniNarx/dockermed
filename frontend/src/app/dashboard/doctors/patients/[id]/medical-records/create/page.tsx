'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { motion } from 'framer-motion'


type CreatedMedicalRecordResponse = {
  _id: string;
  id?: string;
  visitDate: string;
  notes?: string;
  attachments?: string[];
  patientId: string;
  doctorId: string;
};

export default function CreateMedicalRecordPage() {
  const params = useParams();

  const patientIdParam = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();

  const [visitDate, setVisitDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [notes, setNotes]             = useState('');
  const [files, setFiles]             = useState<FileList | null>(null); 
  const [error, setError]             = useState<string | null>(null);
  const [submitting, setSubmitting]   = useState(false);

  const glassCard  = "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg";
  const glassInput = "w-full bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400";
  const btnBase    = "w-full py-2 rounded-lg font-medium transition-colors";
  const btnSave    = "bg-gradient-to-r from-green-400 to-teal-400 text-white hover:from-teal-400 hover:to-green-400 disabled:opacity-50";
  const errorBox   = "text-red-400 bg-red-900/30 border border-red-600 rounded-lg px-4 py-2";


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitDate || !notes.trim()) {
        setError("Дата визита и заметки обязательны.");
        return;
    }
    if (!patientIdParam) {
        setError("ID пациента не определен.");
        return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const newRecord = await apiFetch<CreatedMedicalRecordResponse>(
        '/medical-records',
        {
          method: 'POST',
          body: JSON.stringify({
            patientId: patientIdParam,
            visitDate: visitDate,
            notes,
          }),
        }
      );

      const recordId = newRecord._id || newRecord.id;

      if (recordId && files && files.length > 0) {
        const formData = new FormData();
        Array.from(files).forEach(file => formData.append('files', file));
        
        const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080') + '/api';
        const token = localStorage.getItem('token');

        const attachmentResponse = await fetch(
          `${apiBaseUrl}/medical-records/${recordId}/attachments`, // Используем medical-records (с дефисом)
          {
            method: 'POST',
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: formData,
          }
        );

        if (!attachmentResponse.ok) {
          const attachErrorData = await attachmentResponse.text();
          throw new Error(`Ошибка загрузки вложений: ${attachmentResponse.status} ${attachmentResponse.statusText} - ${attachErrorData}`);
        }
        console.log("Вложения успешно загружены.");
      }

      router.push(`/dashboard/doctors/patients/${patientIdParam}`);
    } catch (err: any) {
      console.error("Ошибка создания медицинской записи:", err);
      setError(err.message || "Не удалось создать медицинскую запись.");
    } finally {
      setSubmitting(false);
    }
  };

// ... (остальной JSX компонента)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-8 !-mt-20"> {/* Убрал !-mt-20, если не нужно */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`max-w-lg mx-auto ${glassCard} p-6 space-y-6 text-white`}
      >
        <h1 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-teal-300">
          Новая запись в медкарте
        </h1>

        {error && (
          <div className={errorBox}> {/* Используем errorBox */}
            {error} {/* Убрали "Ошибка: " т.к. error уже содержит это */}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="visitDate" className="block mb-1 font-medium">Дата приёма</label>
            <input
              id="visitDate"
              type="date"
              value={visitDate}
              onChange={e => setVisitDate(e.target.value)}
              className={glassInput}
              required
            />
          </div>

          <div>
            <label htmlFor="notes" className="block mb-1 font-medium">Заметки</label>
            <textarea
              id="notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className={`${glassInput} h-32 resize-y`} // Увеличил высоту и разрешил resize по Y
              required
            />
          </div>

          <div>
            <label htmlFor="attachments" className="block mb-1 font-medium">Вложения (макс. 5МБ каждое)</label>
            <input
              id="attachments"
              type="file"
              multiple
              onChange={e => setFiles(e.target.files)}
              className={`${glassInput} file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100`}
            />
            {files && files.length > 0 && (
                <div className="mt-2 text-xs text-gray-300">Выбрано файлов: {files.length}</div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`${btnBase} ${btnSave}`}
          >
            {submitting ? 'Сохраняем…' : 'Сохранить запись'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}