import { Sidebar } from '@/components/shared/sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen flex-col lg:flex-row">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-muted/30">
        {children}
      </main>
    </div>
  )
}
