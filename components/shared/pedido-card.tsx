'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { MoreVertical, User, Clock, ChevronRight, Printer } from 'lucide-react'
import { toast } from 'sonner'
import type { Pedido, PedidoStatus } from '@/lib/types'

const STATUS_LABEL: Record<PedidoStatus, string> = {
  pendente:   'Pendente',
  confirmado: 'Confirmado',
  em_preparo: 'Em Preparo',
  pronto:     'Pronto',
  entregue:   'Entregue',
  cancelado:  'Cancelado',
}

const TIPO_LABEL = {
  local:    'Local',
  delivery: 'Delivery',
  retirada: 'Retirada',
}

const TIPO_COLOR = {
  local:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  delivery: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  retirada: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
}

const PROXIMOS_STATUS: Partial<Record<PedidoStatus, PedidoStatus>> = {
  pendente:   'confirmado',
  confirmado: 'em_preparo',
  em_preparo: 'pronto',
  pronto:     'entregue',
}

interface Props {
  pedido: Pedido
  onAtualizarStatus: (id: string, status: PedidoStatus) => Promise<void>
  isAlerting?: boolean
}

export function PedidoCard({ pedido, onAtualizarStatus, isAlerting = false }: Props) {
  const [detalhesOpen, setDetalhesOpen] = useState(false)
  const [loadingStatus, setLoadingStatus] = useState(false)

  const proximoStatus = PROXIMOS_STATUS[pedido.status]
  const hora = new Date(pedido.created_at).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  function imprimirPedido() {
    const linhas = [
      `MARMITASYSTEM`,
      `Pedido #${pedido.id.slice(0, 6).toUpperCase()}`,
      `${new Date(pedido.created_at).toLocaleString('pt-BR')}`,
      `Tipo: ${TIPO_LABEL[pedido.tipo]}`,
      pedido.clientes ? `Cliente: ${pedido.clientes.nome}` : '',
      `---`,
      ...(pedido.pedido_itens ?? []).map(
        (i) =>
          `${i.quantidade}x ${i.produtos?.nome ?? '?'} R$ ${Number(i.subtotal).toFixed(2).replace('.', ',')}`,
      ),
      `---`,
      `TOTAL: R$ ${Number(pedido.total).toFixed(2).replace('.', ',')}`,
      pedido.observacao ? `Obs: ${pedido.observacao}` : '',
    ]
      .filter(Boolean)
      .join('\n')

    const w = window.open('', '_blank', 'width=400,height=600')
    if (!w) return
    w.document.write(`<pre style="font-family:monospace;font-size:14px;padding:16px">${linhas}</pre>`)
    w.document.close()
    w.print()
  }

  async function avancarStatus() {
    if (!proximoStatus) return
    setLoadingStatus(true)
    try {
      await onAtualizarStatus(pedido.id, proximoStatus)
      toast.success(`Pedido movido para ${STATUS_LABEL[proximoStatus]}`)
    } catch {
      toast.error('Erro ao atualizar status')
    } finally {
      setLoadingStatus(false)
    }
  }

  async function cancelarPedido() {
    setLoadingStatus(true)
    try {
      await onAtualizarStatus(pedido.id, 'cancelado')
      toast.info('Pedido cancelado')
    } catch {
      toast.error('Erro ao cancelar pedido')
    } finally {
      setLoadingStatus(false)
    }
  }

  return (
    <>
      <Card className={`cursor-pointer transition-shadow hover:shadow-md ${isAlerting ? 'card-alerta' : ''}`}>
        <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2 pt-3 px-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono text-muted-foreground">
                #{pedido.id.slice(0, 6).toUpperCase()}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${TIPO_COLOR[pedido.tipo]}`}
              >
                {TIPO_LABEL[pedido.tipo]}
              </span>
            </div>

            {pedido.clientes && (
              <div className="flex items-center gap-1 text-sm font-medium">
                <User className="size-3 text-muted-foreground" />
                {pedido.clientes.nome}
              </div>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Ações">
                <MoreVertical className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setDetalhesOpen(true)}>
                Ver detalhes
              </DropdownMenuItem>
              {proximoStatus && (
                <DropdownMenuItem onClick={avancarStatus}>
                  Mover para {STATUS_LABEL[proximoStatus]}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {pedido.status !== 'cancelado' && pedido.status !== 'entregue' && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={cancelarPedido}
                >
                  Cancelar pedido
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>

        <CardContent className="px-3 pb-3">
          {pedido.pedido_itens && pedido.pedido_itens.length > 0 && (
            <ul className="mb-2 space-y-0.5">
              {pedido.pedido_itens.map((item) => (
                <li key={item.id} className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {item.quantidade}× {item.produtos?.nome ?? '—'}
                  </span>
                  <span>
                    R$ {Number(item.subtotal).toFixed(2).replace('.', ',')}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3" />
              {hora}
            </div>
            <span className="text-sm font-semibold">
              R$ {Number(pedido.total).toFixed(2).replace('.', ',')}
            </span>
          </div>

          {pedido.observacao && (
            <p className="mt-1 truncate text-xs italic text-muted-foreground">
              {pedido.observacao}
            </p>
          )}

          {proximoStatus && pedido.status !== 'entregue' && (
            <Button
              size="sm"
              className="mt-2 h-7 w-full text-xs"
              variant="outline"
              disabled={loadingStatus}
              onClick={avancarStatus}
            >
              {STATUS_LABEL[proximoStatus]}
              <ChevronRight className="ml-1 size-3" />
            </Button>
          )}
        </CardContent>
      </Card>

      <Dialog open={detalhesOpen} onOpenChange={setDetalhesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Pedido #{pedido.id.slice(0, 6).toUpperCase()}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-muted-foreground">Cliente</p>
                <p className="font-medium">{pedido.clientes?.nome ?? 'Sem identificação'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tipo</p>
                <p className="font-medium">{TIPO_LABEL[pedido.tipo]}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge variant="outline">{STATUS_LABEL[pedido.status]}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Horário</p>
                <p className="font-medium">
                  {new Date(pedido.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>

            {pedido.observacao && (
              <div>
                <p className="text-xs text-muted-foreground">Observação</p>
                <p className="italic">{pedido.observacao}</p>
              </div>
            )}

            {pedido.pedido_itens && pedido.pedido_itens.length > 0 && (
              <div>
                <p className="mb-1 text-xs text-muted-foreground">Itens</p>
                <ul className="space-y-1">
                  {pedido.pedido_itens.map((item) => (
                    <li
                      key={item.id}
                      className="flex justify-between rounded-lg bg-muted/50 px-2 py-1"
                    >
                      <span>
                        {item.quantidade}× {item.produtos?.nome ?? '—'}
                      </span>
                      <span className="font-medium">
                        R$ {Number(item.subtotal).toFixed(2).replace('.', ',')}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>Total</span>
              <span>R$ {Number(pedido.total).toFixed(2).replace('.', ',')}</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={imprimirPedido} className="gap-2">
              <Printer className="size-4" />
              Imprimir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
