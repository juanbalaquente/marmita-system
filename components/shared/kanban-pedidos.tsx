'use client'

import { useState } from 'react'
import { usePedidos } from '@/lib/hooks/use-pedidos'
import { useAlertas } from '@/lib/hooks/use-alertas'
import { useSomNovoPedido } from '@/lib/hooks/use-som-novo-pedido'
import { PedidoCard } from '@/components/shared/pedido-card'
import { Skeleton } from '@/components/ui/skeleton'
import type { PedidoStatus } from '@/lib/types'

const COLUNAS: { status: PedidoStatus; label: string; color: string; badge: string }[] = [
  { status: 'pendente',   label: 'Pendente',   color: 'bg-gray-100 dark:bg-gray-800/60',       badge: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200' },
  { status: 'confirmado', label: 'Confirmado', color: 'bg-blue-50 dark:bg-blue-950/40',         badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' },
  { status: 'em_preparo', label: 'Em Preparo', color: 'bg-amber-50 dark:bg-amber-950/40',       badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' },
  { status: 'pronto',     label: 'Pronto',     color: 'bg-green-50 dark:bg-green-950/40',       badge: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' },
  { status: 'entregue',   label: 'Entregue',   color: 'bg-muted/30',                            badge: 'bg-muted text-muted-foreground' },
]

export function KanbanPedidos() {
  const { pedidos, loading, atualizarStatus } = usePedidos()
  const alertando = useAlertas(pedidos)
  useSomNovoPedido(pedidos)
  const [colunaAtiva, setColunaAtiva] = useState<PedidoStatus>('pendente')

  if (loading) {
    return (
      <div className="space-y-3 lg:flex lg:gap-4 lg:space-y-0">
        {COLUNAS.map((col) => (
          <div key={col.status} className="lg:w-64 lg:shrink-0 space-y-3">
            <Skeleton className="h-8 w-full rounded-xl" />
            {[1, 2].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
          </div>
        ))}
      </div>
    )
  }

  const colAtual = COLUNAS.find((c) => c.status === colunaAtiva)!

  return (
    <>
      {/* ── Mobile: tab bar ── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 lg:hidden">
        {COLUNAS.map((col) => {
          const count = pedidos.filter((p) => p.status === col.status).length
          const ativa = col.status === colunaAtiva
          return (
            <button
              key={col.status}
              onClick={() => setColunaAtiva(col.status)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                ativa
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {col.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${ativa ? 'bg-primary-foreground/20 text-primary-foreground' : col.badge}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Mobile: coluna ativa ── */}
      <div className={`rounded-xl p-2 lg:hidden ${colAtual.color}`}>
        <div className="space-y-2">
          {pedidos.filter((p) => p.status === colunaAtiva).length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Nenhum pedido</p>
          ) : (
            pedidos
              .filter((p) => p.status === colunaAtiva)
              .map((pedido) => (
                <PedidoCard
                  key={pedido.id}
                  pedido={pedido}
                  onAtualizarStatus={atualizarStatus}
                  isAlerting={alertando.has(pedido.id)}
                />
              ))
          )}
        </div>
      </div>

      {/* ── Desktop: todas as colunas ── */}
      <div className="hidden gap-4 overflow-x-auto pb-4 lg:flex">
        {COLUNAS.map((col) => {
          const pedidosColuna = pedidos.filter((p) => p.status === col.status)
          return (
            <div key={col.status} className={`flex w-64 shrink-0 flex-col rounded-xl p-2 ${col.color}`}>
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-sm font-semibold">{col.label}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${col.badge}`}>
                  {pedidosColuna.length}
                </span>
              </div>
              <div className="space-y-2">
                {pedidosColuna.length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">Nenhum pedido</p>
                ) : (
                  pedidosColuna.map((pedido) => (
                    <PedidoCard
                      key={pedido.id}
                      pedido={pedido}
                      onAtualizarStatus={atualizarStatus}
                      isAlerting={alertando.has(pedido.id)}
                    />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
