'use client'

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { motion } from 'framer-motion';
import {
    getTokenFromStorage,
    getDecodedToken,
    DecodedJwtPayload,
    ROLE_NAMES
} from '@/lib/authUtils';

type PatientInfoForAppointment = {
  _id: string;
  id?: string;
  firstName: string;
  lastName: string;
};

type AppointmentData = {
  _id: string;
  id?: string;
  doctorId: string;
  patientId: string;
  patient: PatientInfoForAppointment; 
  apptTime: string;
  status: string;
};


export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentData[] | null>(null);
 
  const [error, setError]               = useState<string | null>(null);
  const [isLoading, setIsLoading]       = useState(true);

  const glassCard   = "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg";
  const headerText  = "text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400";
  const rowHover    = "hover:bg-white/5 transition-colors";
  const btnCancel   = "px-3 py-1 rounded-lg font-medium transition bg-gradient-to-r from-red-500 to-pink-500 hover:from-pink-500 hover:to-red-500 text-white disabled:opacity-50";
  const btnComplete = "px-3 py-1 rounded-lg font-medium transition bg-gradient-to-r from-green-400 to-teal-400 hover:from-teal-400 hover:to-green-400 text-white disabled:opacity-50";

  useEffect(() => {
    setIsLoading(true);
    const token = getTokenFromStorage();
    if (!token) {
      setError('Не авторизованы');
      setIsLoading(false);
      return;
    }

    const decodedToken = getDecodedToken(token);
    if (!decodedToken || decodedToken.roleName !== ROLE_NAMES.DOCTOR) {
      setError('Доступ только для врачей');
      setIsLoading(false);
      return;
    }

    apiFetch<AppointmentData[]>('/appointments/doctor/me')
      .then(myAppointments => {
        setAppointments(myAppointments || []);
      })
      .catch(e => {
        console.error("Ошибка загрузки записей врача:", e);
        setError(e.message || "Произошла ошибка");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const updateAppointmentStatus = async (appointmentId: string, newStatus: 'cancelled' | 'completed') => {
    if (!confirm(newStatus === 'cancelled' ? 'Отменить приём?' : 'Отметить как завершённый?')) return;

    const originalAppointments = appointments ? [...appointments] : [];

    setAppointments(prev => prev?.map(a =>
      (a._id || a.id) === appointmentId ? { ...a, status: newStatus, patient: a.patient } : a 
    ) || null);

    try {
      await apiFetch(`/appointments/${appointmentId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (e: any) {
      console.error(`Ошибка при обновлении статуса приёма ${appointmentId} на ${newStatus}:`, e);
      alert('Ошибка при обновлении статуса: ' + e.message);
      setAppointments(originalAppointments);
    }
  };

  if (isLoading) return <p className="p-6 text-center text-gray-300">Загрузка ваших приёмов...</p>;
  if (error) return <p className="p-6 text-center text-red-400">{error}</p>;
  if (!appointments || appointments.length === 0) return <p className="p-6 text-center text-gray-300">У вас нет запланированных приёмов.</p>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`max-w-4xl mx-auto ${glassCard} p-6 text-white`}
      >
        <h1 className={`text-3xl font-bold mb-6 ${headerText}`}>
          Мои приёмы
        </h1>

        <div className="overflow-x-auto">
          <table className="w-full table-auto border-separate bg-white/10 rounded-lg">
            <thead>
              <tr className="text-left text-gray-300">
                {['Дата / время', 'Пациент', 'Статус', 'Действия'].map(th => (
                  <th key={th} className="px-4 py-2">{th}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {appointments.map(appt => {
                const appointmentDate = new Date(appt.apptTime);
                const appointmentId = appt._id || appt.id;
                const patientName = appt.patient ? `${appt.patient.firstName} ${appt.patient.lastName}` : `#${appt.patientId}`;

                return (
                  <tr key={appointmentId} className={`border-t border-white/20 ${rowHover}`}>
                    <td className="px-4 py-3">
                      {appointmentDate.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-4 py-3">{patientName}</td>
                    <td className="px-4 py-3 capitalize">{appt.status}</td>
                    <td className="px-4 py-3 space-x-2">
                      {appt.status === 'scheduled' && appointmentId && (
                        <>
                          <button
                            onClick={() => updateAppointmentStatus(appointmentId, 'cancelled')}
                            className={btnCancel}
                          >
                            Отменить
                          </button>
                          <button
                            onClick={() => updateAppointmentStatus(appointmentId, 'completed')}
                            className={btnComplete}
                          >
                            Завершить
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}