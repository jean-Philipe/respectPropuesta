import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Respect Intern - Plataforma Interna',
  description: 'Plataforma interna para gestión de eventos y sostenibilidad',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}

