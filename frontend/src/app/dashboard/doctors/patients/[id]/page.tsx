'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { motion } from 'framer-motion'

type PatientData = {
  _id: string;
  id?: string;
  firstName: string;
  lastName: string;  
  dateOfBirth: string; 
};

type MedicalRecordData = {
  _id: string;
  id?: string; 
  visitDate: string; 
  notes?: string;
  attachments?: string[]; 
};

export default function DoctorViewPatientPage() { 
  const params = useParams();
  const patientIdParam = Array.isArray(params.id) ? params.id[0] : params.id; 
  const router = useRouter();

  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecordData[] | null>(null);
  const [errorPatient, setErrorPatient] = useState<string | null>(null);
  const [errorRecords, setErrorRecords] = useState<string | null>(null);
  const [isLoadingPatient, setIsLoadingPatient] = useState(true);
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);

  const glassCard    = "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg";
  const headerText   = "text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400";
  const btnAdd       = "px-4 py-2 rounded-lg font-medium transition bg-gradient-to-r from-green-400 to-teal-400 text-white hover:from-teal-400 hover:to-green-400";
  const btnEdit      = "text-indigo-300 hover:text-indigo-100 underline transition-colors";
  const sectionSpace = "space-y-4";

  useEffect(() => {
    if (!patientIdParam) {
      setErrorPatient("ID пациента не указан в URL.");
      setIsLoadingPatient(false);
      return;
    }
    setIsLoadingPatient(true);
    apiFetch<PatientData>(`/patients/${patientIdParam}`)
      .then(data => {
        if (!data) throw new Error("Пациент не найден.");
        setPatientData(data);
      })
      .catch(e => setErrorPatient(e.message))
      .finally(() => setIsLoadingPatient(false));
  }, [patientIdParam]);

  useEffect(() => {
    if (!patientIdParam) {
      setIsLoadingRecords(false);
      return;
    }
    setIsLoadingRecords(true);
    apiFetch<MedicalRecordData[]>(`/patients/${patientIdParam}/medical-records`)
      .then(data => setMedicalRecords(data || []))
      .catch(e => setErrorRecords(e.message))
      .finally(() => setIsLoadingRecords(false));
  }, [patientIdParam]);


  useEffect(() => {
    const combinedError = errorPatient || errorRecords;
    if (combinedError?.includes('401') || combinedError?.includes('Не авторизован')) { 
      alert('Сессия истекла или вы не авторизованы. Пожалуйста, войдите снова.');
      localStorage.removeItem('token'); 
      window.dispatchEvent(new Event('token-changed')); 
      router.push('/public/login');
    }
  }, [errorPatient, errorRecords, router]);

  const handleCreateMedicalRecord = async () => {
    const visitDateInput  = prompt('Дата визита (YYYY-MM-DD):', new Date().toISOString().slice(0, 10));
    if (!visitDateInput) return;

    const notesInput = prompt('Заметки (необязательно):', '');
    if (!patientIdParam) {
        alert("ID пациента не определен.");
        return;
    }

    try {

      const newRecord = await apiFetch<MedicalRecordData>('/medical-records', {
        method: 'POST',
        body: JSON.stringify({
            patientId: patientIdParam, 
            visitDate: visitDateInput,  
            notes: notesInput || undefined 
        }),
      });
      setMedicalRecords(prevRecords => prevRecords ? [...prevRecords, newRecord] : [newRecord]);
      alert("Медицинская запись успешно создана!");
    } catch (e: any) {
      console.error("Ошибка создания медкарты:", e);
      alert('Ошибка при создании медкарты: ' + e.message);
    }
  };

  if (isLoadingPatient) return <p className="p-6 text-center text-gray-300">Загрузка данных пациента…</p>;
  if (errorPatient) return <p className="p-6 text-center text-red-400">{`Пациент: ${errorPatient}`}</p>;
  if (!patientData) return <p className="p-6 text-center text-gray-300">Данные пациента не найдены.</p>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-8 text-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`max-w-3xl mx-auto ${glassCard} p-6 ${sectionSpace}`}
      >
        <section className={sectionSpace}>
          <h1 className={`text-2xl font-bold ${headerText}`}>
            {patientData.firstName} {patientData.lastName} 
          </h1>
          <p className="text-gray-200">
            Дата рождения: {new Date(patientData.dateOfBirth).toLocaleDateString('ru-RU')} 
          </p>
        </section>

        <section className={sectionSpace}>
          <div className="flex justify-between items-center">
            <h2 className={`text-xl font-semibold ${headerText}`}>Медкарты</h2>
            <button onClick={handleCreateMedicalRecord} className={btnAdd}>
              + Новая запись
            </button>
          </div>

          {isLoadingRecords && <p className="text-gray-300">Загрузка медкарт…</p>}
          {errorRecords && <p className="text-red-400">Медкарты: {errorRecords}</p>}
          {!isLoadingRecords && !errorRecords && medicalRecords && medicalRecords.length === 0 && (
            <p className="text-gray-300">Записей пока нет.</p>
          )}
          {!isLoadingRecords && !errorRecords && medicalRecords && medicalRecords.length > 0 && (
            <ul className="space-y-3">
              {medicalRecords.map(record => {
                const recordId = record._id || record.id;
                return (
                  <motion.li
                    key={recordId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex justify-between items-center bg-white/10 backdrop-blur-sm p-3 rounded-lg"
                  >
                    <div className="text-gray-200">
                      <strong>{new Date(record.visitDate).toLocaleDateString('ru-RU')}</strong> 
                      {record.notes && <> — {record.notes}</>}
                    </div>
                    {recordId && (
                        <Link href={`/dashboard/doctors/patients/${patientIdParam}/medical-records/${recordId}/edit`}>
                            <button className={btnEdit}>Редактировать</button>
                        </Link>
                    )}
                  </motion.li>
                );
                })}
            </ul>
          )}
        </section>

        <button
          onClick={() => router.back()}
          className="mt-4 text-indigo-300 hover:underline"
        >
          ← Назад к списку пациентов
        </button>
      </motion.div>
    </div>
  );
}