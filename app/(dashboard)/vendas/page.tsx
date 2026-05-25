import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart2, TrendingUp, Trophy } from 'lucide-react'

type PedidoRow = {
  id: string
  total: number
  status: string
  tipo: string
  created_at: string
}

const STATUS_COLOR: Record<string, string> = {
  pendente:   'bg-gray-100 text-gray-700',
  confirmado: 'bg-blue-100 text-blue-700',
  em_preparo: 'bg-amber-100 text-amber-700',
  pronto:     'bg-green-100 text-green-700',
  entregue:   'bg-muted text-muted-foreground',
  cancelado:  'bg-red-100 text-red-700',
}

const MEDAL = ['🥇', '🥈', '🥉']

export default async function VendasPage() {
  const supabase = await createClient()

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)

  // Fetch orders for summaries
  const [diaRes, mesRes, todosPedidosRes] = await Promise.all([
    supabase.from('pedidos').select('total, status').gte('created_at', hoje.toISOString()).neq('status', 'cancelado'),
    supabase.from('pedidos').select('total, status').gte('created_at', inicioMes.toISOString()).neq('status', 'cancelado'),
    supabase.from('pedidos').select('id, total, status, tipo, created_at').order('created_at', { ascending: false }).limit(50),
  ])

  // Top products: two-step query (PostgREST can't filter by joined table column)
  const hojeOrdersRes = await supabase
    .from('pedidos')
    .select('id')
    .gte('created_at', inicioMes.toISOString())
    .neq('status', 'cancelado')

  const hojeIds = (hojeOrdersRes.data ?? []).map((p: { id: string }) => p.id)

  const rankingRes = hojeIds.length > 0
    ? await supabase
        .from('pedido_itens')
        .select('produto_id, quantidade, produtos(nome)')
        .in('pedido_id', hojeIds)
    : { data: [] }

  // Aggregate ranking
  const rankMap = new Map<string, { nome: string; quantidade: number }>()
  for (const item of rankingRes.data ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const it = item as any
    const id: string = it.produto_id
    const nome: string = it.produtos?.nome ?? '?'
    const qty = Number(it.quantidade)
    const existing = rankMap.get(id)
    if (existing) existing.quantidade += qty
    else rankMap.set(id, { nome, quantidade: qty })
  }
  const topProdutos = [...rankMap.values()]
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 10)

  const pedidosDia = (diaRes.data ?? []) as Pick<PedidoRow, 'total' | 'status'>[]
  const pedidosMes = (mesRes.data ?? []) as Pick<PedidoRow, 'total' | 'status'>[]
  const recentes   = (todosPedidosRes.data ?? []) as PedidoRow[]

  const totalDia       = pedidosDia.reduce((a, p) => a + Number(p.total), 0)
  const totalMes       = pedidosMes.reduce((a, p) => a + Number(p.total), 0)
  const ticketMedioDia = pedidosDia.length > 0 ? totalDia / pedidosDia.length : 0

  const resumo = [
    { title: 'Vendas hoje',         value: `R$ ${totalDia.toFixed(2).replace('.', ',')}`,        sub: `${pedidosDia.length} pedidos`,  icon: TrendingUp },
    { title: 'Vendas no mês',       value: `R$ ${totalMes.toFixed(2).replace('.', ',')}`,        sub: `${pedidosMes.length} pedidos`,  icon: BarChart2  },
    { title: 'Ticket médio (hoje)', value: `R$ ${ticketMedioDia.toFixed(2).replace('.', ',')}`, sub: 'por pedido',                    icon: BarChart2  },
  ]

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Vendas</h1>
        <p className="text-sm text-muted-foreground">Resumo financeiro e histórico de vendas</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {resumo.map(({ title, value, sub, icon: Icon }) => (
          <Card key={title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
              <Icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{value}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Ranking de produtos */}
      {topProdutos.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Trophy className="size-4 text-amber-500" />
            Produtos mais vendidos (mês)
          </h2>
          <div className="overflow-hidden rounded-xl border bg-card">
            {topProdutos.map((p, i) => {
              const max = topProdutos[0].quantidade
              const pct = Math.round((p.quantidade / max) * 100)
              return (
                <div
                  key={p.nome + i}
                  className="flex items-center gap-3 border-b px-4 py-2.5 last:border-0 hover:bg-muted/30"
                >
                  <span className="w-6 text-center text-base">{MEDAL[i] ?? `${i + 1}.`}</span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{p.nome}</p>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums">
                    {p.quantidade} un.
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold">Pedidos recentes</h2>

        {/* Mobile: cards */}
        <div className="space-y-2 sm:hidden">
          {recentes.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhum pedido encontrado</p>
          ) : recentes.map((p) => (
            <div key={p.id} className="rounded-xl border bg-card px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-muted-foreground">#{p.id.slice(0, 6).toUpperCase()}</span>
                <span className="font-semibold">R$ {Number(p.total).toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={STATUS_COLOR[p.status] ?? ''}>
                  {p.status.replace('_', ' ')}
                </Badge>
                <span className="text-xs capitalize text-muted-foreground">{p.tipo}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(p.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: table */}
        <div className="hidden overflow-x-auto rounded-xl border bg-card sm:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-3 text-left font-medium">ID</th>
                <th className="px-4 py-3 text-left font-medium">Data</th>
                <th className="px-4 py-3 text-left font-medium">Tipo</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {recentes.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Nenhum pedido encontrado</td></tr>
              ) : recentes.map((p) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">#{p.id.slice(0, 6).toUpperCase()}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(p.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 capitalize">{p.tipo}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={STATUS_COLOR[p.status] ?? ''}>
                      {p.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">R$ {Number(p.total).toFixed(2).replace('.', ',')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
