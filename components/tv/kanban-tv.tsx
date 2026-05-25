'use client'

import { useEffect, useState } from 'react'
import { usePedidos } from '@/lib/hooks/use-pedidos'
import { useAlertas } from '@/lib/hooks/use-alertas'
import { useSomNovoPedido } from '@/lib/hooks/use-som-novo-pedido'
import { toast } from 'sonner'
import { ChevronRight, Clock, User, X } from 'lucide-react'
import { NovoPedidoDialog } from '@/components/shared/novo-pedido-dialog'
import type { Pedido, PedidoStatus } from '@/lib/types'

const COLUNAS: {
  status: PedidoStatus
  label: string
  bg: string
  badge: string
  btn: string
  dot: string
}[] = [
  { status: 'pendente',   label: 'Pendente',   bg: 'bg-gray-100 dark:bg-gray-800/60',   badge: 'bg-gray-300 text-gray-800 dark:bg-gray-600 dark:text-gray-100',       btn: 'bg-gray-700 hover:bg-gray-600 text-white',   dot: 'bg-gray-400' },
  { status: 'confirmado', label: 'Confirmado', bg: 'bg-blue-50 dark:bg-blue-950/40',    badge: 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-100',         btn: 'bg-blue-600 hover:bg-blue-500 text-white',   dot: 'bg-blue-500' },
  { status: 'em_preparo', label: 'Em Preparo', bg: 'bg-amber-50 dark:bg-amber-950/40', badge: 'bg-amber-200 text-amber-800 dark:bg-amber-700 dark:text-amber-100',     btn: 'bg-amber-500 hover:bg-amber-400 text-white', dot: 'bg-amber-400' },
  { status: 'pronto',     label: 'Pronto',     bg: 'bg-green-50 dark:bg-green-950/40', badge: 'bg-green-200 text-green-800 dark:bg-green-700 dark:text-green-100',     btn: 'bg-green-600 hover:bg-green-500 text-white', dot: 'bg-green-500' },
  { status: 'entregue',   label: 'Entregue',   bg: 'bg-muted/30',                       badge: 'bg-muted text-muted-foreground',                                         btn: '',                                            dot: 'bg-muted-foreground' },
]

const PROXIMO: Partial<Record<PedidoStatus, PedidoStatus>> = {
  pendente: 'confirmado',
  confirmado: 'em_preparo',
  em_preparo: 'pronto',
  pronto: 'entregue',
}

const PROXIMO_LABEL: Partial<Record<PedidoStatus, string>> = {
  pendente: 'Confirmar',
  confirmado: 'Preparar',
  em_preparo: 'Pronto',
  pronto: 'Entregar',
}

const TIPO_COLOR = {
  local:    'bg-blue-100 text-blue-700',
  delivery: 'bg-purple-100 text-purple-700',
  retirada: 'bg-teal-100 text-teal-700',
}

const TIPO_LABEL = { local: 'Local', delivery: 'Delivery', retirada: 'Retirada' }

function CardTv({
  pedido,
  col,
  onAvancar,
  onCancelar,
  isAlerting,
}: {
  pedido: Pedido
  col: (typeof COLUNAS)[number]
  onAvancar: (id: string, status: PedidoStatus) => Promise<void>
  onCancelar: (id: string) => Promise<void>
  isAlerting: boolean
}) {
  const [loading, setLoading] = useState(false)
  const proximo = PROXIMO[pedido.status]
  const hora = new Date(pedido.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  async function avancar() {
    if (!proximo) return
    setLoading(true)
    try { await onAvancar(pedido.id, proximo) } finally { setLoading(false) }
  }

  async function cancelar() {
    setLoading(true)
    try { await onCancelar(pedido.id) } finally { setLoading(false) }
  }

  return (
    <div className={`rounded-2xl border bg-card shadow-sm ${isAlerting ? 'card-alerta' : ''}`}>
      <div className="flex items-start justify-between gap-2 px-3 pt-3 pb-2 sm:px-4 sm:pt-4">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-sm font-bold text-muted-foreground">
              #{pedido.id.slice(0, 6).toUpperCase()}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${TIPO_COLOR[pedido.tipo]}`}>
              {TIPO_LABEL[pedido.tipo]}
            </span>
          </div>
          {pedido.clientes && (
            <div className="flex items-center gap-1.5 font-semibold leading-tight sm:text-base">
              <User className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{pedido.clientes.nome}</span>
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
          <Clock className="size-3.5" />
          {hora}
        </div>
      </div>

      {pedido.pedido_itens && pedido.pedido_itens.length > 0 && (
        <div className="space-y-0.5 px-3 pb-2 sm:px-4">
          {pedido.pedido_itens.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="font-medium">{item.quantidade}× {item.produtos?.nome ?? '—'}</span>
              <span className="shrink-0 text-muted-foreground">
                R$ {Number(item.subtotal).toFixed(2).replace('.', ',')}
              </span>
            </div>
          ))}
        </div>
      )}

      {pedido.observacao && (
        <p className="mx-3 mb-2 rounded-lg bg-muted/60 px-3 py-1.5 text-sm italic text-muted-foreground sm:mx-4">
          {pedido.observacao}
        </p>
      )}

      <div className="flex items-center justify-between border-t px-3 py-2 sm:px-4">
        <span className="text-sm text-muted-foreground">Total</span>
        <span className="text-base font-bold sm:text-lg">
          R$ {Number(pedido.total).toFixed(2).replace('.', ',')}
        </span>
      </div>

      {pedido.status !== 'entregue' && pedido.status !== 'cancelado' && (
        <div className="flex gap-2 px-3 pb-3 sm:px-4 sm:pb-4">
          {proximo && (
            <button
              onClick={avancar}
              disabled={loading}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 sm:gap-2 sm:py-3 sm:text-base ${col.btn}`}
            >
              {PROXIMO_LABEL[pedido.status]}
              <ChevronRight className="size-4 sm:size-5" />
            </button>
          )}
          <button
            onClick={cancelar}
            disabled={loading}
            className="flex items-center justify-center rounded-xl border px-3 py-2.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
            title="Cancelar pedido"
          >
            <X className="size-4 sm:size-5" />
          </button>
        </div>
      )}
    </div>
  )
}

function Relogio() {
  const [hora, setHora] = useState('')
  useEffect(() => {
    const atualizar = () =>
      setHora(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
    atualizar()
    const id = setInterval(atualizar, 1000)
    return () => clearInterval(id)
  }, [])
  return <span className="tabular-nums">{hora}</span>
}

// ── Coluna individual ─────────────────────────────────────────────────────────
function Coluna({
  col,
  pedidos,
  alertando,
  onAvancar,
  onCancelar,
}: {
  col: (typeof COLUNAS)[number]
  pedidos: Pedido[]
  alertando: Set<string>
  onAvancar: (id: string, status: PedidoStatus) => Promise<void>
  onCancelar: (id: string) => Promise<void>
}) {
  return (
    <div className={`flex min-w-0 flex-1 flex-col rounded-2xl ${col.bg}`}>
      <div className="flex items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3">
        <span className="text-sm font-bold sm:text-base">{col.label}</span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold sm:text-sm ${col.badge}`}>
          {pedidos.length}
        </span>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto px-2 pb-2 sm:px-3 sm:pb-3">
        {pedidos.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nenhum pedido</p>
        ) : (
          pedidos.map((p) => (
            <CardTv
              key={p.id}
              pedido={p}
              col={col}
              onAvancar={onAvancar}
              onCancelar={onCancelar}
              isAlerting={alertando.has(p.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export function KanbanTv() {
  const { pedidos, loading, atualizarStatus } = usePedidos()
  const alertando = useAlertas(pedidos)
  useSomNovoPedido(pedidos)
  const [colunaAtiva, setColunaAtiva] = useState<PedidoStatus>('pendente')

  const colunasAtivas = COLUNAS.filter((c) => c.status !== 'entregue')
  const entregues     = pedidos.filter((p) => p.status === 'entregue')

  async function handleAvancar(id: string, status: PedidoStatus) {
    try { await atualizarStatus(id, status); toast.success('Pedido atualizado') }
    catch { toast.error('Erro ao atualizar') }
  }

  async function handleCancelar(id: string) {
    try { await atualizarStatus(id, 'cancelado'); toast.info('Pedido cancelado') }
    catch { toast.error('Erro ao cancelar') }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">

      {/* ── Topo ─────────────────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b bg-card px-3 py-2 sm:px-6 sm:py-3">
        <div className="flex items-center gap-2">
          <span className="text-xl sm:text-2xl">🍱</span>
          <span className="hidden font-bold tracking-tight sm:block sm:text-lg">MarmitaSystem</span>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary sm:px-3 sm:py-1 sm:text-sm">
            TV
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {alertando.size > 0 && (
            <span className="card-alerta hidden rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-300 sm:block">
              ⚠ {alertando.size} aguardando
            </span>
          )}
          <NovoPedidoDialog />
          <span className="text-base font-bold tabular-nums text-muted-foreground sm:text-xl">
            <Relogio />
          </span>
          <a
            href="/pedidos"
            className="rounded-xl border px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted sm:px-4 sm:py-2 sm:text-sm"
          >
            ← Sair
          </a>
        </div>
      </div>

      {/* ── Tabs (visíveis quando < lg) ──────────────────────────────────── */}
      <div className="flex shrink-0 gap-1.5 overflow-x-auto border-b bg-card px-3 py-2 lg:hidden">
        {COLUNAS.map((col) => {
          const count = pedidos.filter((p) => p.status === col.status).length
          const ativa = col.status === colunaAtiva
          const temAlerta = pedidos.filter((p) => p.status === col.status).some((p) => alertando.has(p.id))
          return (
            <button
              key={col.status}
              onClick={() => setColunaAtiva(col.status)}
              className={`relative flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors sm:px-4 sm:text-base ${
                ativa ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {temAlerta && !ativa && (
                <span className="absolute right-1 top-1 size-2 rounded-full bg-red-500" />
              )}
              <span className={`size-2 rounded-full ${col.dot}`} />
              {col.label}
              <span className={`rounded-full px-1.5 py-0.5 text-xs ${
                ativa ? 'bg-white/20 text-inherit' : col.badge
              }`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Corpo ────────────────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 gap-3 overflow-hidden p-3 sm:p-4">

        {/* Mobile/tablet: coluna única com tab selecionada */}
        <div className="flex min-w-0 flex-1 flex-col lg:hidden">
          {(() => {
            const col = COLUNAS.find((c) => c.status === colunaAtiva)!
            const pedidosCol = pedidos.filter((p) => p.status === colunaAtiva)
            return (
              <div className={`flex flex-1 flex-col overflow-hidden rounded-2xl ${col.bg}`}>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-base font-bold sm:text-lg">{col.label}</span>
                  <span className={`rounded-full px-3 py-0.5 text-sm font-semibold ${col.badge}`}>
                    {pedidosCol.length}
                  </span>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto px-3 pb-3">
                  {loading && [1, 2].map((i) => (
                    <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />
                  ))}
                  {!loading && pedidosCol.length === 0 && (
                    <p className="py-12 text-center text-muted-foreground">Nenhum pedido</p>
                  )}
                  {pedidosCol.map((p) => (
                    <CardTv
                      key={p.id}
                      pedido={p}
                      col={col}
                      onAvancar={handleAvancar}
                      onCancelar={handleCancelar}
                      isAlerting={alertando.has(p.id)}
                    />
                  ))}
                </div>
              </div>
            )
          })()}
        </div>

        {/* Desktop: todas as colunas lado a lado */}
        <div className="hidden min-w-0 flex-1 gap-3 lg:flex">
          {colunasAtivas.map((col) => (
            <Coluna
              key={col.status}
              col={col}
              pedidos={pedidos.filter((p) => p.status === col.status)}
              alertando={alertando}
              onAvancar={handleAvancar}
              onCancelar={handleCancelar}
            />
          ))}

          {/* Entregues — coluna compacta */}
          <div className="flex w-36 shrink-0 flex-col rounded-2xl bg-muted/30 xl:w-44">
            <div className="flex items-center justify-between px-3 py-3">
              <span className="text-sm font-bold">Entregue</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                {entregues.length}
              </span>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto px-2 pb-2">
              {entregues.slice(0, 8).map((p) => (
                <div key={p.id} className="rounded-xl border bg-card px-3 py-2 text-sm opacity-60">
                  <p className="font-mono font-semibold">#{p.id.slice(0, 6).toUpperCase()}</p>
                  {p.clientes && <p className="truncate text-xs text-muted-foreground">{p.clientes.nome}</p>}
                  <p className="font-medium">R$ {Number(p.total).toFixed(2).replace('.', ',')}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
