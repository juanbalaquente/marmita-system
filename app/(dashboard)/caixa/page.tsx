import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Receipt, TrendingUp, Banknote, CreditCard, Smartphone, HandCoins } from 'lucide-react'

type PedidoCaixa = {
  total: number
  forma_pagamento: string | null
  status: string
  created_at: string
}

const PAGAMENTO_INFO: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  pix:      { label: 'PIX',      icon: Smartphone, color: 'text-green-600 dark:text-green-400' },
  dinheiro: { label: 'Dinheiro', icon: Banknote,   color: 'text-amber-600 dark:text-amber-400' },
  cartao:   { label: 'Cartão',   icon: CreditCard, color: 'text-blue-600 dark:text-blue-400'  },
  fiado:    { label: 'Fiado',    icon: HandCoins,  color: 'text-red-600 dark:text-red-400'    },
}

export default async function CaixaPage() {
  const supabase = await createClient()

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)

  const [diaRes, mesRes] = await Promise.all([
    supabase
      .from('pedidos')
      .select('total, forma_pagamento, status, created_at')
      .gte('created_at', hoje.toISOString())
      .neq('status', 'cancelado'),
    supabase
      .from('pedidos')
      .select('total, forma_pagamento, status, created_at')
      .gte('created_at', inicioMes.toISOString())
      .neq('status', 'cancelado'),
  ])

  const pedidosDia = (diaRes.data ?? []) as PedidoCaixa[]
  const pedidosMes = (mesRes.data ?? []) as PedidoCaixa[]

  function agruparPorPagamento(pedidos: PedidoCaixa[]) {
    const mapa = new Map<string, number>()
    let semPagamento = 0
    for (const p of pedidos) {
      if (!p.forma_pagamento) { semPagamento += Number(p.total); continue }
      mapa.set(p.forma_pagamento, (mapa.get(p.forma_pagamento) ?? 0) + Number(p.total))
    }
    return { mapa, semPagamento }
  }

  const { mapa: mapaDia, semPagamento: semPgtoDia } = agruparPorPagamento(pedidosDia)
  const { mapa: mapaMes, semPagamento: semPgtoMes } = agruparPorPagamento(pedidosMes)

  const totalDia = pedidosDia.reduce((a, p) => a + Number(p.total), 0)
  const totalMes = pedidosMes.reduce((a, p) => a + Number(p.total), 0)

  const dataFormatada = hoje.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Fechamento de Caixa</h1>
        <p className="text-sm capitalize text-muted-foreground">{dataFormatada}</p>
      </div>

      {/* Resumo do dia */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Receipt className="size-4" />
          Hoje
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="sm:col-span-2 lg:col-span-4">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total do dia</CardTitle>
              <TrendingUp className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">R$ {totalDia.toFixed(2).replace('.', ',')}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{pedidosDia.length} pedidos</p>
            </CardContent>
          </Card>

          {Array.from(mapaDia.entries()).map(([forma, valor]) => {
            const info = PAGAMENTO_INFO[forma]
            if (!info) return null
            const Icon = info.icon
            return (
              <Card key={forma}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{info.label}</CardTitle>
                  <Icon className={`size-4 ${info.color}`} />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">R$ {valor.toFixed(2).replace('.', ',')}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {((valor / totalDia) * 100).toFixed(0)}% do total
                  </p>
                </CardContent>
              </Card>
            )
          })}

          {semPgtoDia > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Não informado</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">R$ {semPgtoDia.toFixed(2).replace('.', ',')}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Pedidos do dia */}
      <div>
        <h2 className="mb-3 text-sm font-semibold">Pedidos do dia</h2>

        {pedidosDia.length === 0 ? (
          <div className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
            Nenhum pedido hoje
          </div>
        ) : (
          <>
            {/* Mobile */}
            <div className="space-y-2 sm:hidden">
              {pedidosDia.map((p, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border bg-card px-4 py-3">
                  <div className="flex items-center gap-2">
                    {p.forma_pagamento && PAGAMENTO_INFO[p.forma_pagamento] && (
                      <Badge variant="outline" className="text-xs">
                        {PAGAMENTO_INFO[p.forma_pagamento].label}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(p.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <span className="font-semibold">R$ {Number(p.total).toFixed(2).replace('.', ',')}</span>
                </div>
              ))}
            </div>

            {/* Desktop */}
            <div className="hidden overflow-x-auto rounded-xl border bg-card sm:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-3 text-left font-medium">Horário</th>
                    <th className="px-4 py-3 text-left font-medium">Pagamento</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidosDia.map((p, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(p.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3">
                        {p.forma_pagamento && PAGAMENTO_INFO[p.forma_pagamento] ? (
                          <Badge variant="outline">{PAGAMENTO_INFO[p.forma_pagamento].label}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 capitalize text-muted-foreground">
                        {p.status.replace('_', ' ')}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        R$ {Number(p.total).toFixed(2).replace('.', ',')}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t bg-muted/20">
                    <td colSpan={3} className="px-4 py-3 font-semibold">Total</td>
                    <td className="px-4 py-3 text-right font-bold">
                      R$ {totalDia.toFixed(2).replace('.', ',')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Resumo do mês */}
      <div>
        <h2 className="mb-3 text-sm font-semibold">Mês atual</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="sm:col-span-2 lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total do mês</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">R$ {totalMes.toFixed(2).replace('.', ',')}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{pedidosMes.length} pedidos</p>
            </CardContent>
          </Card>

          {Array.from(mapaMes.entries()).map(([forma, valor]) => {
            const info = PAGAMENTO_INFO[forma]
            if (!info) return null
            const Icon = info.icon
            return (
              <Card key={forma}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{info.label}</CardTitle>
                  <Icon className={`size-4 ${info.color}`} />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">R$ {valor.toFixed(2).replace('.', ',')}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {((valor / totalMes) * 100).toFixed(0)}% do mês
                  </p>
                </CardContent>
              </Card>
            )
          })}

          {semPgtoMes > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Não informado</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">R$ {semPgtoMes.toFixed(2).replace('.', ',')}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
