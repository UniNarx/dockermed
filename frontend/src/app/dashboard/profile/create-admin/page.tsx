'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { motion } from 'framer-motion'

type CreateAdminForm = {
  username: string;
  password: string;
  role: 'Patient' | 'Doctor' | 'Admin' | 'SuperAdmin'; 
};

type CreateAdminResponse = {
  id?: string; 
  userId?: string; 
  username?: string;
  message?: string;
};

export default function CreateAdminPage() {
  const router = useRouter();
  const [form, setForm] = useState<CreateAdminForm>({
    username: '',
    password: '',
    role: 'Admin', 
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const glassCard   = "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg";
  const glassInput  = "w-full bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400";
  const btnBase     = "w-full py-2 rounded-lg font-medium transition-colors";
  const btnCreate   = "bg-gradient-to-r from-green-400 to-teal-400 text-white hover:from-teal-400 hover:to-green-400 disabled:opacity-50";
  const errorBox    = "text-red-400 bg-red-900/30 border border-red-600 rounded-lg px-4 py-2";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value as CreateAdminForm['role'] })); 
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim() || !form.password.trim()) {
        setError("Имя пользователя и пароль обязательны.");
        return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await apiFetch<CreateAdminResponse>('/auth/register-admin', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      console.log("Admin creation response:", response); 
      alert(response?.message || 'Администратор успешно создан!');
      router.push('/dashboard/profile'); 
    } catch (err: any) {
      console.error("Ошибка создания администратора:", err);
      setError(err.message || "Не удалось создать администратора.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4 !-mt-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className={`max-w-md w-full ${glassCard} p-6 space-y-6 text-white`}
      >
        <h1 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">
          Создать пользователя с ролью
        </h1>

        {error && <div className={errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1">
            <span className="font-medium">Username</span>
            <input
              name="username"
              type="text"
              value={form.username}
              onChange={handleChange}
              className={glassInput}
              placeholder="Логин нового пользователя"
              required
            />
          </label>

          <label className="block space-y-1">
            <span className="font-medium">Password</span>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className={glassInput}
              placeholder="Пароль (мин. 6 символов)"
              minLength={6}
              required
            />
          </label>

          <label className="block space-y-1">
            <span className="font-medium">Role</span>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className={glassInput}
            >
             
              <option value="Admin">Admin</option>
              <option value="SuperAdmin">SuperAdmin</option>
            </select>
          </label>

          <button
            type="submit"
            disabled={saving}
            className={`${btnBase} ${btnCreate}`}
          >
            {saving ? 'Создаём…' : 'Создать пользователя'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}