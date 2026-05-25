'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  ClipboardList,
  BookOpen,
  Package,
  Users,
  BarChart2,
  Star,
  LogOut,
  Menu,
  X,
  Tv2,
  Receipt,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { ThemeToggle } from '@/components/shared/theme-toggle'

const navItems = [
  { href: '/pedidos',     label: 'Pedidos',     icon: ClipboardList },
  { href: '/cardapio',    label: 'Cardápio',    icon: BookOpen },
  { href: '/estoque',     label: 'Estoque',     icon: Package },
  { href: '/clientes',    label: 'Clientes',    icon: Users },
  { href: '/vendas',      label: 'Vendas',      icon: BarChart2 },
  { href: '/fidelizacao', label: 'Fidelização', icon: Star },
  { href: '/caixa',       label: 'Caixa',       icon: Receipt },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.success('Até logo!')
    router.push('/login')
    router.refresh()
  }

  const NavContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 py-5">
        <span className="text-2xl">🍱</span>
        <span className="text-lg font-semibold tracking-tight">MarmitaSystem</span>
      </div>

      <Separator />

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              pathname.startsWith(href)
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <Separator />

      <div className="p-3 space-y-1">
        <Link
          href="/tv"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Tv2 className="size-4 shrink-0" />
          Modo TV
        </Link>
        <div className="flex items-center justify-between px-3 py-1">
          <span className="text-xs text-muted-foreground">Tema</span>
          <ThemeToggle />
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground"
          onClick={handleLogout}
        >
          <LogOut className="size-4" />
          Sair
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 border-r bg-card lg:flex lg:flex-col">
        <NavContent />
      </aside>

      {/* Mobile header + drawer */}
      <div className="flex items-center gap-3 border-b bg-card px-4 py-3 lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menu"
        >
          <Menu className="size-5" />
        </Button>
        <span className="text-base font-semibold">🍱 MarmitaSystem</span>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-64 bg-card shadow-xl">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-3 top-3"
              onClick={() => setMobileOpen(false)}
              aria-label="Fechar menu"
            >
              <X className="size-5" />
            </Button>
            <NavContent />
          </aside>
        </div>
      )}
    </>
  )
}
