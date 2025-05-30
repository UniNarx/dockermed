'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { motion } from 'framer-motion'

type CreatedDoctorResponse = {
  _id: string; // или id
  id?: string;
  firstName: string;
  lastName: string;
  specialty: string;
  user?: { _id: string; username: string };
}

export default function DoctorCreatePage() {
  const router = useRouter();
  const [username,  setUsername]  = useState('');
  const [password,  setPassword]  = useState('');
  const [firstName, setFirstName] = useState(''); 
  const [lastName,  setLastName]  = useState('');  
  const [specialty, setSpecialty] = useState(''); 
  const [error,     setError]     = useState<string|null>(null);
  const [saving,    setSaving]    = useState(false);

  const glassCard   = "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg";
  const glassInput  = "w-full bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400";
  const btnBase     = "w-full py-2 rounded-lg font-medium transition-colors";
  const btnSave     = "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50";
  const errorBox    = "text-red-400 bg-red-900/30 border border-red-600 rounded-lg px-4 py-2";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim() || !firstName.trim() || !lastName.trim() || !specialty.trim()) {
      setError("Все поля обязательны для заполнения.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
     
      await apiFetch<CreatedDoctorResponse>('/doctors', {
        method: 'POST',
        body: JSON.stringify({
          username,
          password,
          firstName, 
          lastName, 
          specialty,
        }),
      });
      
      router.push('/dashboard/doctors');
    } catch (err: any) {
      console.error("Ошибка создания врача:", err);
      setError(err.message || "Не удалось создать врача.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className={`max-w-md w-full ${glassCard} p-6 space-y-6 text-white`}
      >
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300 text-center">
          Добавить врача
        </h1>

        {error && <div className={errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1">
            <span className="font-medium">Логин (username)</span>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className={glassInput}
              required
            />
          </label>

          <label className="block space-y-1">
            <span className="font-medium">Пароль</span>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={glassInput}
              required
            />
          </label>

          <label className="block space-y-1">
            <span className="font-medium">Имя</span>
            <input
              type="text"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              className={glassInput}
              required
            />
          </label>

          <label className="block space-y-1">
            <span className="font-medium">Фамилия</span>
            <input
              type="text"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              className={glassInput}
              required
            />
          </label>

          <label className="block space-y-1">
            <span className="font-medium">Специализация</span>
            <input
              type="text"
              value={specialty}
              onChange={e => setSpecialty(e.target.value)}
              className={glassInput}
              required
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            className={`${btnBase} ${btnSave}`}
          >
            {saving ? 'Сохраняем…' : 'Сохранить'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}