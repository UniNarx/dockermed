'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { motion } from 'framer-motion'

export default function PasswordChangePage() {
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState('');         
  const [newPassword, setNewPassword] = useState('');       
  const [confirmPassword, setConfirmPassword] = useState(''); 
  const [error, setError] = useState<string|null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => { 
    e.preventDefault();
    setError(null); 

    if (newPassword !== confirmPassword) {
      setError('Новый пароль и его подтверждение не совпадают.');
      return;
    }
    if (!oldPassword || !newPassword) {
        setError('Все поля должны быть заполнены.');
        return;
    }

    setSubmitting(true);
    try {
      await apiFetch<void>('/users/me/password', { 
        method: 'PUT',
        body: JSON.stringify({
          oldPassword: oldPassword, 
          newPassword: newPassword 
        }),
      });
      alert('Пароль успешно изменен!'); 
      router.push('/dashboard/profile');
    } catch (err: any) {
      console.error("Ошибка смены пароля:", err);
      setError(err.message || "Произошла ошибка при смене пароля.");
    } finally {
      setSubmitting(false);
    }
  };

  const glassCard   = "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg";
  const glassInput  = "w-full bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400";
  const btnBase     = "w-full py-2 rounded-lg font-medium transition-colors";
  const btnChange   = "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50";
  const errorBox    = "text-red-400 bg-red-900/30 border border-red-600 rounded-lg px-4 py-2";

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4 !-mt-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className={`max-w-md w-full ${glassCard} p-6 space-y-6 text-white`}
      >
        <h1 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">
          Сменить пароль
        </h1>

        {error && (
          <div className={errorBox}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="oldPassword" className="block mb-1 font-medium">Старый пароль</label> 
            <input
              id="oldPassword" 
              type="password"
              value={oldPassword}
              onChange={e => setOldPassword(e.target.value)}
              className={glassInput}
              placeholder="Введите текущий пароль"
              required
            />
          </div>
          <div>
            <label htmlFor="newPassword" className="block mb-1 font-medium">Новый пароль</label> 
            <input
              id="newPassword" 
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className={glassInput}
              placeholder="Введите новый пароль"
              minLength={6} 
              required
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block mb-1 font-medium">Подтверждение пароля</label> 
            <input
              id="confirmPassword" 
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className={glassInput}
              placeholder="Повторите новый пароль"
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className={`${btnBase} ${btnChange}`}
          >
            {submitting ? 'Сохраняем…' : 'Сменить'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}