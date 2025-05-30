'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { motion } from 'framer-motion'

type Patient = {
  id: number
  first_name: string
  last_name: string
  date_of_birth: string
}

export default function PatientEditPage() {
  const router = useRouter()
  const { id } = useParams()
  const pid = Number(id)

  const [data,      setData]      = useState<Patient|null>(null)
  const [error,     setError]     = useState<string|null>(null)
  const [firstName, setFirstName]= useState('')
  const [lastName,  setLastName] = useState('')
  const [dob,       setDob]       = useState('')
  const [saving,    setSaving]    = useState(false)

  const glassCard   = "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg"
  const glassInput  = "w-full bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
  const btnBase     = "w-full py-2 rounded-lg font-medium transition-colors"
  const btnSave     = "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50"
  const errorBox    = "text-red-400 bg-red-900/30 border border-red-600 rounded-lg px-4 py-2"

  useEffect(() => {
    apiFetch<Patient[]>('/patients')
      .then(list => list.find(x => x.id === pid)!)
      .then(p => {
        setData(p)
        setFirstName(p.first_name)
        setLastName(p.last_name)
        setDob(p.date_of_birth.slice(0,10))
      })
      .catch(e => setError(e.message))
  }, [pid])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await apiFetch<void>('/patients', {
        method: 'PUT',
        body: JSON.stringify({
          id: pid,
          first_name: firstName,
          last_name: lastName,
          date_of_birth: `${dob}T00:00:00Z`,
        }),
      })
      router.push('/dashboard/patients')
    } catch (err: any) {
      setError(err.message)
      setSaving(false)
    }
  }

  if (error)    return <p className="p-6 text-red-400">{error}</p>
  if (!data)    return <p className="p-6 text-gray-300">Загрузка…</p>

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-8 !-mt-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`max-w-md w-full ${glassCard} p-6 space-y-6 text-white`}
      >
        <h1 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 text-center">
          Редактировать пациента #{data.id}
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
