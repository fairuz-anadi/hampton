import type { Metadata } from 'next'
import './styles.css'

export const metadata: Metadata = {
  title: 'NORM | Marking, explained',
  description: 'An evidence-led marking audit.'
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>
}
