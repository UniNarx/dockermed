'use client'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'

type Doctor = { id: number, first_name: string, last_name: string, specialty: string }

export default function PublicDoctorsPage() {
  const [docs, setDocs] = useState<Doctor[]>([])
  useEffect(() => {
    apiFetch<Doctor[]>('/doctors').then(setDocs)
  }, [])
  return (
    <div className="max-w-3xl mx-auto p-4 text-black">
      <h1 className="text-2xl mb-4">Врачи (публично)</h1>
      <ul>
        {docs.map(d => (
          <li key={d.id}>{d.first_name} {d.last_name} — {d.specialty}</li>
        ))}
      </ul>
    </div>
  )
}
