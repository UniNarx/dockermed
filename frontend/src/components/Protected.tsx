'use client'
import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'

interface ProtectedProps {
  minRole?: number        
  fallback?: string       
  children: ReactNode
}

export default function Protected({
  minRole = 1,
  fallback = '/public/login',
  children
}: ProtectedProps) {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.replace(fallback)
      return
    }
    apiFetch<{ role_id: number }>('/users/me')
      .then(profile => {
        if (profile.role_id < minRole) {
          // если не дотягивает до minRole — кидаем на публичку
          router.replace('/public/doctors')
        } else {
          setChecking(false)
        }
      })
      .catch(() => {
        localStorage.removeItem('token')
        router.replace(fallback)
      })
  }, [router, minRole, fallback])

  if (checking) {
    return <div className="p-4 text-center">…Проверяем доступ</div>
  }
  return <>{children}</>
}
