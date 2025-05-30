'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { motion } from 'framer-motion'

export default function RegisterPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      const { id } = await apiFetch<{ id: number }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      })
      console.log('New user id =', id)
      setSuccess(true)
      setTimeout(() => router.push('/public/login'), 1500)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const glassCard   = "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl !-mt-20"
  const glassInput  = "w-full bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
  const btnBase     = "w-full py-2 rounded-lg font-medium transition-colors"
  const btnRegister = "bg-gradient-to-r from-green-400 to-teal-400 text-white hover:from-teal-400 hover:to-green-400"

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className={`max-w-sm w-full ${glassCard} p-8 space-y-6`}
      >
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300 text-center">
          Регистрация
        </h1>

        {error && (
          <div className="text-red-400 bg-red-900/30 border border-red-600 rounded-lg px-4 py-2">
            Ошибка: {error}
          </div>
        )}

        {success ? (
          <div className="text-green-400 bg-green-900/30 border border-green-600 rounded-lg px-4 py-2 text-center">
            Успешно зарегистрированы!<br />Переадресация…
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 text-gray-200">Логин</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className={glassInput}
                placeholder="Ваш логин"
                required
              />
            </div>
            <div>
              <label className="block mb-1 text-gray-200">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={glassInput}
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              className={`${btnBase} ${btnRegister}`}
            >
              Зарегистрироваться
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-gray-300">
          Уже есть аккаунт?{' '}
          <button
            type="button"
            onClick={() => router.push('/public/login')}
            className="text-indigo-300 hover:underline"
          >
            Войти
          </button>
        </p>
      </motion.div>
    </div>
  )
}
