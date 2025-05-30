'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'

export default function ProfileEditPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string>()

  useEffect(() => {
    apiFetch<{ username: string }>('/users/me')
      .then(p => setUsername(p.username))
      .catch(e => setError(e.message))
  }, [])

  const handle = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await apiFetch('/users/me', {
        method: 'PUT',
        body: JSON.stringify({ username }),
      })
      router.push('/dashboard/profile')
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow rounded text-black">
      <h1 className="text-2xl mb-4">Сменить username</h1>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <form onSubmit={handle} className="space-y-4">
        <input
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="w-full border px-3 py-2 rounded"
          required
        />
        <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          Сохранить
        </button>
      </form>
    </div>
  )
}
