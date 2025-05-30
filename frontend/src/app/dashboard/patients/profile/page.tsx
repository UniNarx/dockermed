'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { motion } from 'framer-motion'
import Link from 'next/link'

type ApiPatientData = {
  _id: string; 
  id?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string; 
};

type ApiProfileData = {
  _id?: string;
  id?: string;
  dob?: string;       
  gender?: string;
};



export default function PatientProfilePage() {
  const [patient, setPatient] = useState<ApiPatientData | null>(null);
  const [profile, setProfile] = useState<ApiProfileData>({}); 

  const [fname, setFname]     = useState('');
  const [lname, setLname]     = useState('');
  const [dob,   setDob]       = useState('');   
  const [gender,setGender]    = useState('');
  const [saving,setSaving]    = useState(false);
  const [isLoading, setIsLoading] = useState(true); 
  const [error, setError]     = useState<string|null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    Promise.all([
      apiFetch<ApiPatientData>('/patients/me'),
      apiFetch<ApiProfileData>('/profiles/patient').catch(() => ({} as ApiProfileData)),
    ])
    .then(([patData, profData]) => {
      if (patData) {
        setPatient(patData);
        setFname(patData.firstName || '');
        setLname(patData.lastName || '');
        if (patData.dateOfBirth && !profData.dob) {
          setDob(patData.dateOfBirth.slice(0, 10));
        }
      }
      if (profData) {
        setProfile(profData);
        if (profData.dob) { 
          setDob(profData.dob.slice(0, 10));
        }
        setGender(profData.gender ?? '');
      }
    })
    .catch(e => {
      console.error("Ошибка загрузки данных профиля:", e);
      setError(e.message);
    })
    .finally(() => {
      setIsLoading(false);
    });
  }, []);

  const save = async () => {
    if (!fname.trim() || !lname.trim()) { alert('Введите имя и фамилию'); return }
    if (!dob)            { alert('Укажите дату рождения'); return }
    setSaving(true);
    setError(null);
    try {
      const updatedPatientData = await apiFetch<ApiPatientData>('/patients/me', { 
        method: 'PUT',
        body: JSON.stringify({
          firstName: fname,
          lastName: lname,
          dateOfBirth: dob,
        }),
      });
      if (updatedPatientData) {
        setPatient(updatedPatientData);
        setFname(updatedPatientData.firstName || '');
        setLname(updatedPatientData.lastName || '');
        if (updatedPatientData.dateOfBirth) {
            setDob(updatedPatientData.dateOfBirth.slice(0,10));
        }
      }
      console.log("Основные данные пациента обновлены");

      const updatedProfileData = await apiFetch<ApiProfileData>('/profiles/patient', {
        method: profile?.id || profile?._id ? 'PUT' : 'POST',
        body: JSON.stringify({ dob, gender }),
      });
      if (updatedProfileData) {
        setProfile(updatedProfileData);
        if (updatedProfileData.dob) {
            setDob(updatedProfileData.dob.slice(0,10));
        }
        setGender(updatedProfileData.gender ?? '');
      }
      console.log("Дополнительный профиль пациента обновлен/создан");

      alert('Профиль сохранён');
    } catch (e:any) {
      console.error("Ошибка сохранения профиля:", e);
      setError(e.message);
      alert(`Ошибка сохранения: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) return <p className="p-6 text-center text-gray-300">Загрузка профиля...</p>;
  if (error && !patient) return <p className="p-6 text-center text-red-400">Ошибка загрузки профиля: {error}</p>;

  const glassCard  = "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg"
  const glassInput = "w-full bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
  const btnBase    = "w-full py-2 rounded-lg font-medium transition-colors"
  const btnSave    = "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50"
  const btnPwd      = "bg-gradient-to-r from-red-500 to-pink-500 hover:from-pink-500 hover:to-red-500"

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`max-w-md mx-auto ${glassCard} p-6 space-y-4 text-white !mt-20`}
      >
        <h1 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
          Мой профиль
        </h1>

        {error && <p className="text-red-500 bg-red-900/20 p-2 rounded-md">Ошибка: {error}</p>}

        <label className="block space-y-1">
          <span className="font-medium">Имя</span>
          <input
            value={fname}
            onChange={e => setFname(e.target.value)}
            className={glassInput}
            placeholder="Ваше имя"
          />
        </label>

        <label className="block space-y-1">
          <span className="font-medium">Фамилия</span>
          <input
            value={lname}
            onChange={e => setLname(e.target.value)}
            className={glassInput}
            placeholder="Ваша фамилия"
          />
        </label>

        <label className="block space-y-1">
          <span className="font-medium">Дата рождения</span>
          <input
            type="date"
            value={dob}
            onChange={e => setDob(e.target.value)}
            className={glassInput}
          />
        </label>

        <label className="block space-y-1">
          <span className="font-medium">Пол</span>
          <select
            value={gender}
            onChange={e => setGender(e.target.value)}
            className={glassInput}
          >
            <option value="">— не выбрано —</option>
            <option value="male">Мужской</option>
            <option value="female">Женский</option>
            <option value="other">Другой</option> 
          </select>
        </label>

        <button
          onClick={save}
          disabled={saving || isLoading} 
          className={`${btnBase} ${btnSave}`}
        >
          {saving ? 'Сохраняем…' : (isLoading ? 'Загрузка...' : 'Сохранить')}
        </button>
        <Link href="/dashboard/patients/profile/password">
            <button className={`${btnBase} ${btnPwd}`} disabled={isLoading}>
              Сменить пароль
            </button>
          </Link>
      </motion.div>
    </div>
  )
}