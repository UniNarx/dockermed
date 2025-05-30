'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { motion } from 'framer-motion';

type SelectOption = {
  value: string; 
  label: string; 
};

type ApiNameRecord = {
  _id: string;   
  id?: string;   
  firstName: string; 
  lastName: string; 
};

type CreatedAppointmentResponse = {
    _id: string;
    id?: string;
};

export default function AppointmentCreatePage() {
  const router = useRouter();

  const [doctorOptions, setDoctorOptions]   = useState<SelectOption[]>([]);
  const [patientOptions, setPatientOptions] = useState<SelectOption[]>([]);

  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(''); 
  const [selectedPatientId, setSelectedPatientId] = useState<string>(''); 

  const [appointmentTime, setAppointmentTime] = useState<string>(() => {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });

  const [error, setError]       = useState<string | null>(null);
  const [isSaving, setIsSaving]   = useState(false);
  const [isLoading, setIsLoading] = useState(true); 

  const glassCard  = "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg";
  const glassInput = "w-full bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-400";
  const btnBase    = "w-full py-2 rounded-lg font-medium transition-colors";
  const btnSave    = "bg-gradient-to-r from-green-400 to-teal-400 text-white hover:from-teal-400 hover:to-green-400 disabled:opacity-50";
  const errorBox   = "text-red-400 bg-red-900/30 border border-red-600 rounded-lg px-4 py-2";

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      apiFetch<ApiNameRecord[]>('/doctors'),
      apiFetch<ApiNameRecord[]>('/patients'),
    ])
    .then(([doctorsList, patientsList]) => {
      setDoctorOptions(
        doctorsList.map(d => ({
          value: d._id || d.id || '',
          label: `${d.firstName} ${d.lastName}`
        })).filter(opt => opt.value)
      );
      setPatientOptions(
        patientsList.map(p => ({
          value: p._id || p.id || '', 
          label: `${p.firstName} ${p.lastName}`
        })).filter(opt => opt.value)
      );
    })
    .catch((err) => {
        console.error("Ошибка загрузки справочников:", err);
        setError(err.message || "Не удалось загрузить списки врачей/пациентов.");
    })
    .finally(() => {
        setIsLoading(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId || !selectedPatientId || !appointmentTime) {
      setError("Необходимо выбрать доктора, пациента и указать время приёма.");
      return;
    }
    setIsSaving(true);
    setError(null);

    const isoApptTime = new Date(appointmentTime).toISOString();

    try {
      await apiFetch<CreatedAppointmentResponse>('/appointments', {
        method: 'POST',
        body: JSON.stringify({
          doctorId: selectedDoctorId,   
          patientId: selectedPatientId,  
          apptTime: isoApptTime,        
        }),
      });
      alert('Запись на приём успешно создана!');
      router.push('/dashboard/appointments'); 
    } catch (err: any) {
      console.error("Ошибка создания записи на приём:", err);
      setError(err.message || "Не удалось создать запись.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <p className="p-6 text-center text-gray-300">Загрузка данных...</p>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4 !-mt-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className={`max-w-md w-full ${glassCard} p-6 space-y-6 text-white`}
      >
        <h1 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-teal-300">
          Создать приём
        </h1>

        {error && <div className={errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1">
            <span className="font-medium">Доктор</span>
            <select
              name="doctorId" 
              className={glassInput}
              value={selectedDoctorId} 
              onChange={e => setSelectedDoctorId(e.target.value)} 
              required
              disabled={isLoading}
            >
              <option value="">— выберите доктора —</option>
              {doctorOptions.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </label>

          <label className="block space-y-1">
            <span className="font-medium">Пациент</span>
            <select
              name="patientId" 
              className={glassInput}
              value={selectedPatientId}
              onChange={e => setSelectedPatientId(e.target.value)}
              required
              disabled={isLoading}
            >
              <option value="">— выберите пациента —</option>
              {patientOptions.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </label>

          <label className="block space-y-1">
            <span className="font-medium">Дата и время</span>
            <input
              type="datetime-local"
              className={glassInput}
              value={appointmentTime}
              onChange={e => setAppointmentTime(e.target.value)}
              required
              disabled={isLoading}
            />
          </label>

          <button
            type="submit"
            disabled={isSaving || isLoading} 
            className={`${btnBase} ${btnSave}`}
          >
            {isSaving ? 'Создаю…' : 'Создать приём'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}