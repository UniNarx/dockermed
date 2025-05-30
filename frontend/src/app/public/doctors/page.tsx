'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { motion } from 'framer-motion'

type DoctorData = {
  _id: string;
  id?: string; 
  firstName: string;
  lastName: string;  
  specialty: string;
}

export default function PublicDoctorsListPage() { 
  const [doctors, setDoctors] = useState<DoctorData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    apiFetch<DoctorData[]>('/doctors')
      .then(data => {
        setDoctors(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.error("Ошибка загрузки списка врачей:", err);
        setError(err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const specialties = Array.from(new Set(doctors.map(d => d.specialty)))
    .sort((a, b) => a.localeCompare(b));

  const glassCard  = "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-md";
  const btnPrimary = "inline-block px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-purple-500 hover:to-indigo-500 transition-colors duration-200";

  if (isLoading) return <p className="p-8 text-center text-gray-300">Загрузка списка врачей...</p>;
  if (error) return (
    <div className="p-8 text-center">
      <p className="max-w-2xl mx-auto text-red-400 bg-red-900/30 border border-red-600 rounded-lg px-4 py-2 mb-10">
        Ошибка загрузки: {error}
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-8 text-white">
      <h1 className="text-4xl font-bold mb-10 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 text-center">
        Врачи по специализациям
      </h1>

      {doctors.length === 0 && !isLoading && ( 
        <p className="text-gray-400 italic text-center">Врачей пока нет.</p>
      )}

      {specialties.map(spec => (
        <section key={spec} className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 border-b border-white/20 pb-1">
            {spec}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors
              .filter(d => d.specialty === spec)
              .map((doctor, idx) => {
                const doctorId = doctor._id || doctor.id; 
                return (
                  <motion.div
                    key={doctorId} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.3 }}
                    className={`${glassCard} p-6 hover:shadow-lg transition-shadow`}
                  >
                    <h3 className="text-xl font-semibold mb-2">
                      {doctor.firstName} {doctor.lastName}
                    </h3>
                    {doctorId && ( 
                      <a
                        href={`/public/doctors/${doctorId}`}
                        className={btnPrimary}
                      >
                        Подробнее
                      </a>
                    )}
                  </motion.div>
                );
              })
            }
          </div>
        </section>
      ))}
    </div>
  );
}