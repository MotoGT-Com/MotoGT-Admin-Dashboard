import type { Metadata } from 'next'

import { Analytics } from '@vercel/analytics/next'
import { Geist_Mono, Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/context/auth-context'
import { Toaster } from 'sonner'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: 'MotoGT Admin Dashboard',
  description: 'Manage your automotive accessories store',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/apple-icon', type: 'image/png', sizes: '180x180' }],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased" suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster position="top-right" theme="dark" />
        <Analytics />
      </body>
    </html>
  )
}
