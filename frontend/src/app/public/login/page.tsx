'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { motion } from 'framer-motion'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  type LoginResponse = { token: string }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { token } = await apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      })
      localStorage.setItem('token', token)
      window.dispatchEvent(new Event('token-changed'))

      const payload = JSON.parse(atob(token.split('.')[1]))
      const roleId: number = payload.role_id
      if (roleId > 2) {
        router.push('/dashboard/doctors')
      } else {
        router.push('/public/doctors')
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const glassCard    = "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl"
  const glassInput   = "w-full bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
  const btnGradient  = "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-purple-500 hover:to-indigo-500"
  const btnBase      = "w-full py-2 rounded-lg font-medium transition-colors"

  return (
    <div className="h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4 !-mt-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className={`max-w-sm w-full ${glassCard} p-8 space-y-6`}
      >
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300 text-center">
          Вход в систему
        </h1>

        {error && (
          <div className="text-red-400 bg-red-900/30 border border-red-600 rounded-lg px-4 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-gray-200">Имя пользователя</label>
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
            className={`${btnBase} ${btnGradient}`}
          >
            Войти
          </button>
          <button
  type="button"
  onClick={() => router.push('/public/register')}
  className={`
    ${btnBase}
    border border-white/30
    text-white
    hover:bg-white/20
    transition-colors duration-200
  `}
>
  Регистрация
</button>

        </form>
      </motion.div>
    </div>
  )
}
