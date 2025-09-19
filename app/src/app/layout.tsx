// src/app/layout.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'RBC Field App',
  description: 'RBC Facility Services field management',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, Arial, sans-serif' }}>{children}</body>
    </html>
  )
}
