import { ReactNode } from 'react'

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <div className="pt-4">{children}</div>
}
