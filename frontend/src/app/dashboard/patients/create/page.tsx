'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { motion } from 'framer-motion'

export default function PatientCreatePage() {
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dob, setDob] = useState<string>(() => {
    const d = new Date()
    return d.toISOString().slice(0, 10)
  })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const glassCard   = "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg"
  const glassInput  = "w-full bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
  const btnBase     = "w-full py-2 rounded-lg font-medium transition-colors"
  const btnSave     = "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50"
  const errorBox    = "text-red-400 bg-red-900/30 border border-red-600 rounded-lg px-4 py-2"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await apiFetch<{ id: number }>('/patients', {
        method: 'POST',
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          date_of_birth: dob,
        }),
      })
      router.push('/dashboard/patients')
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4 !-mt-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className={`max-w-md w-full ${glassCard} p-6 space-y-6 text-white`}
      >
        <h1 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">
          Добавить пациента
        </h1>

        {error && <div className={errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1">
            <span className="font-medium">Имя</span>
            <input
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              className={glassInput}
              required
            />
          </label>

          <label className="block space-y-1">
            <span className="font-medium">Фамилия</span>
            <input
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              className={glassInput}
              required
            />
          </label>

          <label className="block space-y-1">
            <span className="font-medium">Дата рождения</span>
            <input
              type="date"
              value={dob}
              onChange={e => setDob(e.target.value)}
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
  )
}
