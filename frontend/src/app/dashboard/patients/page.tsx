'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link' 
import { apiFetch } from '@/lib/api'
import { motion } from 'framer-motion'

type PatientData = {
  id?: string;          
  _id: string;         
  firstName: string;   
  lastName: string;    
  dateOfBirth: string;  
  createdAt: string;    
  user?: {             
    _id: string;
    username: string;
  };
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [error, setError]       = useState<string|null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const glassCard   = "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg";
  const headerText  = "text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400";
  const btnDelete   = "px-2 py-1 rounded-lg font-medium transition bg-gradient-to-r from-red-500 to-pink-500 hover:from-pink-500 hover:to-red-500 text-white";
  const rowHover    = "hover:bg-white/5 transition-colors";

  useEffect(() => {
    setIsLoading(true);
    apiFetch<PatientData[]>('/patients') 
      .then(data => {
        setPatients(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.error("Ошибка загрузки списка пациентов:", err);
        setError(err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleDeletePatient = async (patientId: string) => {
    if (!confirm('Удалить пациента? Это действие необратимо.')) return;
    try {
      await apiFetch<void>(`/patients/${patientId}`, { method: 'DELETE' });
      setPatients(prevPatients => prevPatients.filter(p => (p._id || p.id) !== patientId));
    } catch (e: any) {
      console.error(`Ошибка удаления пациента ${patientId}:`, e);
      alert('Ошибка при удалении пациента: ' + e.message);
    }
  };

  if (isLoading) return <p className="p-6 text-center text-gray-300">Загрузка списка пациентов...</p>;
  if (error) return <p className="p-6 text-center text-red-400">Ошибка: {error}</p>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-8 text-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`max-w-4xl mx-auto ${glassCard} p-6`} 
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className={`text-3xl font-bold ${headerText}`}>Пациенты</h1>
        </div>

        {patients.length === 0 && !isLoading && (
           <p className="text-center text-gray-400 py-4">Пациенты не найдены.</p>
        )}

        {patients.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-separate bg-white/10 rounded-lg">
              <thead className="text-left text-gray-300">
                <tr>
                  {['ID', 'Имя', 'Фамилия', 'ДР', 'Создано', 'Действия'].map(col => (
                    <th key={col} className="px-4 py-2">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {patients.map((p, i) => {
                  const patientId = p._id || p.id; 
                  return (
                    <motion.tr
                      key={patientId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className={`border-t border-white/20 ${rowHover}`}
                    >
                      <td className="px-4 py-3 text-gray-200 truncate max-w-[100px]">{patientId}</td>
                      <td className="px-4 py-3 text-gray-200">{p.firstName}</td>   
                      <td className="px-4 py-3 text-gray-200">{p.lastName}</td>    
                      <td className="px-4 py-3 text-gray-200">
                        {new Date(p.dateOfBirth).toLocaleDateString('ru-RU')} 
                      </td>
                      <td className="px-4 py-3 text-gray-200">
                        {new Date(p.createdAt).toLocaleString('ru-RU', { 
                          dateStyle: 'short', timeStyle: 'short'
                        })}
                      </td>
                      <td className="px-4 py-3 space-x-2">
                        <button
                          className={btnDelete}
                          onClick={() => patientId && handleDeletePatient(patientId)}
                          disabled={!patientId}
                        >
                          Удл.
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}