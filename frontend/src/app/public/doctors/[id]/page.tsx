'use client'

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { apiFetch } from '@/lib/api';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    getTokenFromStorage,
    getRoleNameFromToken,
    ROLE_NAMES,
    RoleName
} from '@/lib/authUtils';

type DoctorData = {
  _id: string;
  id?: string;
  firstName: string;
  lastName: string;
  specialty: string;
  avatarUrl?: string; 
  description?: string;

};

type PatientProfileInfo = {
    _id: string;
    id?: string;
};

export default function PublicDoctorProfilePage() {
  const params = useParams();
  const doctorIdParam = Array.isArray(params.id) ? params.id[0] : params.id as string;
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<RoleName>(ROLE_NAMES.ANONYMOUS);
  const [currentPatientProfileId, setCurrentPatientProfileId] = useState<string | null>(null);
  
  const [doctor, setDoctor] = useState<DoctorData | null>(null);
  const [doctorError, setDoctorError] = useState<string | null>(null);
  const [isLoadingDoctor, setIsLoadingDoctor] = useState(true);

  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [selectedBookingSlot, setSelectedBookingSlot] = useState<string>('');
  const [isBooking, setIsBooking] = useState(false);

  const glassCard = "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg";
  const glassInput = "bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-gray-300 rounded-lg px-3 py-2";
  const btnBase = "px-4 py-2 font-medium rounded-lg transition";
  const slotBtn = (active: boolean) =>
    `text-white ${btnBase} ${active ? "bg-gradient-to-r from-indigo-500 to-purple-500 shadow-lg" : "bg-white/20 hover:bg-white/30"}`;

  useEffect(() => {
    const storedToken = getTokenFromStorage();
    setToken(storedToken);
    const roleName = getRoleNameFromToken(storedToken);
    setCurrentUserRole(roleName);

    if (storedToken && roleName === ROLE_NAMES.PATIENT) {
      apiFetch<PatientProfileInfo>('/patients/me')
        .then(profile => {
          setCurrentPatientProfileId(profile._id || profile.id || null);
        })
        .catch(() => {
          console.error("Не удалось загрузить профиль пациента для записи.");
          setCurrentPatientProfileId(null);
        });
    }
  }, []);

  useEffect(() => {
    if (!doctorIdParam) {
      setDoctorError("ID врача не указан.");
      setIsLoadingDoctor(false);
      return;
    }
    setIsLoadingDoctor(true);
    setDoctorError(null); 
    apiFetch<DoctorData>(`/doctors/${doctorIdParam}`)
      .then(data => {
        if (!data) throw new Error('Врач не найден');
        setDoctor(data);
      })
      .catch(e => setDoctorError(e.message))
      .finally(() => setIsLoadingDoctor(false));
  }, [doctorIdParam]);

  useEffect(() => {
    if (!doctorIdParam || !selectedDate) return;
    setIsLoadingSlots(true);
    setAvailableSlots([]);
    setSlotsError(null);
    apiFetch<string[]>(`/doctors/${doctorIdParam}/availability?date=${selectedDate}`)
      .then(setAvailableSlots)
      .catch(e => setSlotsError(e.message))
      .finally(() => setIsLoadingSlots(false));
  }, [doctorIdParam, selectedDate]);

  const handleBookAppointment = async () => {
    if (!selectedBookingSlot || !currentPatientProfileId || !doctor) return;
    setIsBooking(true);
    try {
      await apiFetch('/appointments', {
        method: 'POST',
        body: JSON.stringify({
          doctorId: doctor._id || doctor.id,
          patientId: currentPatientProfileId,
          apptTime: `${selectedDate}T${selectedBookingSlot}:00Z`,
        }),
      });
      alert('Приём успешно забронирован!');
      setIsLoadingSlots(true);
      const freshSlots = await apiFetch<string[]>(`/doctors/${doctorIdParam}/availability?date=${selectedDate}`);
      setAvailableSlots(freshSlots);
      setSelectedBookingSlot('');
    } catch (e: any) {
      alert('Ошибка при бронировании: ' + e.message);
    } finally {
      setIsBooking(false);
      setIsLoadingSlots(false);
    }
  };

  if (isLoadingDoctor) return <p className="p-8 text-center text-white">Загрузка данных врача...</p>;
  if (doctorError) return <p className="p-8 text-center text-red-600">Ошибка: {doctorError}</p>;
  if (!doctor) return <p className="p-8 text-center text-white">Информация о враче не найдена.</p>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`max-w-2xl mx-auto ${glassCard} p-8 space-y-6 text-white`}
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 mb-6">
          {doctor.avatarUrl ? (
            <Image
              src={doctor.avatarUrl}
              alt={`Аватар ${doctor.firstName} ${doctor.lastName}`}
              width={128} 
              height={128} 
              className="rounded-lg object-cover w-64 h-90 border-2 border-indigo-400 shadow-lg"
              priority 
            />
          ) : (
            <div className="w-32 h-32 bg-gray-700 rounded-full flex items-center justify-center text-gray-400 text-4xl">
              {doctor.firstName?.charAt(0)}{doctor.lastName?.charAt(0)}
            </div>
          )}
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              {doctor.firstName} {doctor.lastName}
            </h1>
            <p className="inline-block mt-1 px-3 py-1 rounded-lg bg-white/20 backdrop-blur-sm text-sm font-medium text-gray-100">
              {doctor.specialty}
            </p>
            {doctor.description && (
              <div className="mt-4 text-gray-300 text-sm sm:text-base">
                <h3 className="text-md font-semibold text-indigo-200 mb-1">О враче:</h3>
                <p className="whitespace-pre-wrap leading-relaxed">{doctor.description}</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="appointmentDate" className="block text-sm font-medium">Дата приёма:</label>
          <input
            id="appointmentDate"
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className={glassInput}
            min={today}
          />
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Свободные слоты:</h3>
          {isLoadingSlots && <p className="text-gray-400">Загрузка слотов...</p>}
          {slotsError && <p className="text-red-400 mb-2">Не удалось загрузить слоты: {slotsError}</p>}
          {!isLoadingSlots && !slotsError && availableSlots.length === 0 && (
            <span className="col-span-3 text-gray-400">Нет свободных слотов на выбранную дату.</span>
          )}
          {!isLoadingSlots && !slotsError && availableSlots.length > 0 && (
             <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {availableSlots.map(timeSlot => (
                <button
                  key={timeSlot}
                  onClick={() => setSelectedBookingSlot(timeSlot)}
                  className={slotBtn(selectedBookingSlot === timeSlot)}
                >
                  {timeSlot}
                </button>
              ))}
            </div>
          )}
        </div>

        {!token && (
          <Link href="/public/login" className="text-indigo-300 hover:underline block text-center pt-4">
            Войдите, чтобы записаться
          </Link>
        )}
        {token && currentUserRole === ROLE_NAMES.PATIENT && !currentPatientProfileId && !isLoadingDoctor &&(
            <p className="text-yellow-400 text-center pt-4">Загрузка вашего профиля для записи...</p>
        )}
        {token && currentUserRole !== ROLE_NAMES.PATIENT && (
          <p className="text-gray-300 text-center pt-4">Запись доступна только пациентам.</p>
        )}
        {token && currentUserRole === ROLE_NAMES.PATIENT && currentPatientProfileId &&(
          <button
            onClick={handleBookAppointment}
            disabled={!selectedBookingSlot || isBooking || isLoadingSlots}
            className={`${btnBase} w-full mt-4 ${
              selectedBookingSlot
                ? 'bg-gradient-to-r from-green-400 to-teal-400 text-white hover:from-teal-400 hover:to-green-400'
                : 'bg-gray-500 text-gray-300 cursor-not-allowed'
            }`}
          >
            {isBooking ? 'Бронируем...' :
             selectedBookingSlot ? `Записаться на ${selectedBookingSlot}` : 'Выберите слот'}
          </button>
        )}
         <button
            onClick={() => router.back()}
            className="w-full mt-4 text-indigo-300 hover:underline"
          >
            &larr; К списку врачей
          </button>
      </motion.div>
    </div>
  );
}