'use client'
import { ReactNode } from 'react'
import Protected from '@/components/Protected'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <Protected>{children}</Protected>
}
