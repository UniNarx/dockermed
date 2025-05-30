import './globals.css'
import { ReactNode } from 'react'
import NavBar from '@/components/NavBar'

export const metadata = {
  title: 'DockerMed',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body className="!bg-gradient-to-b from-gray-900 to-gray-800 min-h-screen mt-20">
        <NavBar />
        <main>{children}</main>
      </body>
    </html>
  )
}
