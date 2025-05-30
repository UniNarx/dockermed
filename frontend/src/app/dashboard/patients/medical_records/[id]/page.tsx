'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'

type MedicalRecord = {
  id: number
  patient_id: number
  doctor_id: number
  visit_date: string
  notes: string
  attachments: string[]
  created_at: string
}

export default function MedicalRecordPage() {
  const { id } = useParams()
  const mrId = Number(id)
  const router = useRouter()

  const [record, setRecord] = useState<MedicalRecord | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch<MedicalRecord>(`/medical-records/${mrId}`)
      .then(setRecord)
      .catch(e => setError(e.message))
  }, [mrId])

  if (error) return <div className="p-4 text-red-600">Ошибка: {error}</div>
  if (!record) return <div className="p-4">Загрузка…</div>

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow rounded text-black">
      <h1 className="text-2xl mb-4">Медкарта #{record.id}</h1>

      <p>
        <strong>Дата визита:</strong>{' '}
        {new Date(record.visit_date).toLocaleDateString('ru-RU', {
          dateStyle: 'long',
        })}
      </p>

      <div className="mt-4">
        <strong>Заметки:</strong>
        <p className="whitespace-pre-wrap mt-1">{record.notes}</p>
      </div>

     

      <button
        onClick={() => router.back()}
        className="mt-6 bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
      >
        Назад
      </button>
    </div>
  )
}
