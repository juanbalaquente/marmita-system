import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MarmitaSystem — Modo TV',
}

export default function TvLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full min-h-screen bg-background text-foreground">
      {children}
    </div>
  )
}
