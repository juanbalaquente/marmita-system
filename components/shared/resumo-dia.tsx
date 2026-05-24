import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShoppingBag, DollarSign, Users, AlertTriangle } from 'lucide-react'
import type { Ingrediente } from '@/lib/types'

type PedidoResumo = { id: string; total: number; status: string }

export async function ResumoDia() {
  const supabase = await createClient()

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const [pedidosRes, clientesRes, ingredientesRes] = await Promise.all([
    supabase
      .from('pedidos')
      .select('id, total, status')
      .gte('created_at', hoje.toISOString()),
    supabase.from('clientes').select('id', { count: 'exact', head: true }),
    supabase
      .from('ingredientes')
      .select('id, nome, quantidade_atual, quantidade_minima'),
  ])

  const pedidosHoje = (pedidosRes.data ?? []) as PedidoResumo[]
  const totalClientes = clientesRes.count ?? 0
  const todosIngredientes = (ingredientesRes.data ?? []) as Pick<
    Ingrediente,
    'id' | 'nome' | 'quantidade_atual' | 'quantidade_minima'
  >[]

  const totalVendas = pedidosHoje
    .filter((p) => p.status !== 'cancelado')
    .reduce((acc, p) => acc + Number(p.total), 0)

  const pedidosAtivos = pedidosHoje.filter(
    (p) => !['entregue', 'cancelado'].includes(p.status),
  ).length

  const alertas = todosIngredientes.filter(
    (i) => Number(i.quantidade_atual) < Number(i.quantidade_minima),
  )

  const cards = [
    {
      title: 'Pedidos hoje',
      value: String(pedidosHoje.length),
      sub: `${pedidosAtivos} em andamento`,
      icon: ShoppingBag,
      color: 'text-blue-600',
    },
    {
      title: 'Vendas hoje',
      value: `R$ ${totalVendas.toFixed(2).replace('.', ',')}`,
      sub: `${pedidosHoje.filter((p) => p.status === 'entregue').length} entregues`,
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      title: 'Total de clientes',
      value: String(totalClientes),
      sub: 'cadastrados',
      icon: Users,
      color: 'text-purple-600',
    },
    {
      title: 'Alertas de estoque',
      value: String(alertas.length),
      sub: alertas.length > 0 ? 'ingredientes abaixo do mínimo' : 'estoque OK',
      icon: AlertTriangle,
      color: alertas.length > 0 ? 'text-amber-500' : 'text-muted-foreground',
    },
  ]

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ title, value, sub, icon: Icon, color }) => (
          <Card key={title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {title}
              </CardTitle>
              <Icon className={`size-4 ${color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{value}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {alertas.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400">
              <AlertTriangle className="size-4" />
              Ingredientes abaixo do mínimo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {alertas.map((i) => (
                <Badge
                  key={i.id}
                  variant="outline"
                  className="border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                >
                  {i.nome}: {Number(i.quantidade_atual).toFixed(1)} /{' '}
                  {Number(i.quantidade_minima).toFixed(1)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
