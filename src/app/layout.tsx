import './globals.css'
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
export const metadata = { title: 'tailorCV — Tailor your resume to any job', description: 'AI-tailored resume bullets for any job.' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
