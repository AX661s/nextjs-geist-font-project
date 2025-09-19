import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

export const metadata = {
  title: 'Next.js File Upload Demo',
  description: 'File upload functionality with Next.js and Geist fonts',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans">
        <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          {children}
        </main>
      </body>
    </html>
  )
}