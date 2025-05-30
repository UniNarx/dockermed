'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { motion } from 'framer-motion'

type DoctorInfoForAppointment = {
  _id: string; 
  id?: string;
  firstName: string;
  lastName: string;
  specialty: string;
};

type AppointmentData = {
  _id: string;
  id?: string;
  patientId?: string; 
  apptTime: string;
  status: string;
  doctor: DoctorInfoForAppointment; 
};

type DoctorListItem = {
  _id: string;
  id?: string;
  firstName: string;
  lastName: string;
  specialty: string;
};

type PatientProfile = {
  id?: string;
  _id: string;
  user?: string | { username?: string; _id?: string };
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
};


export default function MyAppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentData[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const glassCard = "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg";

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log("MyAppointmentsPage: Fetching current patient's appointments...");
        const appointmentList = await apiFetch<AppointmentData[]>(`/appointments/my`);
        console.log("MyAppointmentsPage: Fetched appointments:", JSON.stringify(appointmentList, null, 2));
        setAppointments(appointmentList || []);
      } catch (err: any) {
        console.error("MyAppointmentsPage: Error during data fetching:", err);
        setError(err.message || "Произошла ошибка при загрузке данных.");
      } finally {
        setIsLoading(false);
        console.log("MyAppointmentsPage: Fetching complete.");
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return <div className="p-4 text-center text-gray-200">Загрузка ваших приёмов...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-400">Ошибка: {error}</div>;
  }

  if (!appointments || appointments.length === 0) {
    return <div className="p-4 text-center text-gray-200">У вас ещё нет запланированных приёмов.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`max-w-5xl mx-auto ${glassCard} p-6 text-white`}
      >
        <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
          Мои приёмы
        </h1>

        <div className="overflow-x-auto">
          <table className="w-full table-auto border-separate bg-white/10 rounded-lg">
            <thead>
              <tr className="text-left text-gray-300">
                {['Дата／Время', 'Доктор', 'Специализация', 'Статус'].map(title => (
                  <th key={title} className="px-4 py-2">{title}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {appointments.map(appointment => {
                const appointmentDate = new Date(appointment.apptTime);
                const doctor = appointment.doctor;
               
                return (
                  <motion.tr
                    key={appointment._id || appointment.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.05 }}
                    className="border-t border-white/20 hover:bg-white/5"
                  >
                    <td className="px-4 py-2">
                      {appointmentDate.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-4 py-2">
                      {doctor ? `${doctor.firstName} ${doctor.lastName}` : `Доктор не указан`}
                    </td>
                    <td className="px-4 py-2">{doctor?.specialty || '–'}</td>
                    <td className="px-4 py-2 capitalize">{appointment.status}</td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}