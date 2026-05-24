import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star, Gift, TrendingUp } from 'lucide-react'
import type { Cliente, TransacaoPontos } from '@/lib/types'

type TransacaoComCliente = TransacaoPontos & { clientes: Pick<Cliente, 'nome'> | null }

export default async function FidelizacaoPage() {
  const supabase = await createClient()

  const [clientesRes, transacoesRes] = await Promise.all([
    supabase.from('clientes').select('id, nome, pontos').order('pontos', { ascending: false }).limit(20),
    supabase.from('transacoes_pontos').select('*, clientes(nome)').order('created_at', { ascending: false }).limit(30),
  ])

  const clientes    = (clientesRes.data ?? []) as Pick<Cliente, 'id' | 'nome' | 'pontos'>[]
  const transacoes  = (transacoesRes.data ?? []) as TransacaoComCliente[]
  const totalPontos = clientes.reduce((a, c) => a + c.pontos, 0)
  const clientesComDesconto = clientes.filter((c) => c.pontos >= 100).length

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Fidelização</h1>
        <p className="text-sm text-muted-foreground">
          1 ponto por R$1,00 · 100 pts = R$5,00 de desconto
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de pontos ativos</CardTitle>
            <Star className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{totalPontos.toLocaleString('pt-BR')}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Com desconto disponível</CardTitle>
            <Gift className="size-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{clientesComDesconto}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">(≥ 100 pontos)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Desconto total disponível</CardTitle>
            <TrendingUp className="size-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              R$ {clientes.reduce((a, c) => a + Math.floor(c.pontos / 100) * 5, 0).toFixed(2).replace('.', ',')}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Ranking */}
        <div>
          <h2 className="mb-3 text-sm font-semibold">Ranking de clientes</h2>

          {/* Mobile */}
          <div className="space-y-2 sm:hidden">
            {clientes.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Nenhum cliente ainda</p>
            ) : clientes.map((c, idx) => {
              const desconto = Math.floor(c.pontos / 100) * 5
              return (
                <div key={c.id} className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
                  <span className="w-6 shrink-0 text-sm text-muted-foreground">{idx + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{c.nome}</p>
                    <span className="inline-flex items-center gap-1 text-sm">
                      <Star className="size-3 text-amber-500" />
                      {c.pontos.toLocaleString('pt-BR')} pts
                    </span>
                  </div>
                  {desconto > 0 && (
                    <Badge className="shrink-0 bg-green-100 text-green-700">
                      R$ {desconto.toFixed(2).replace('.', ',')}
                    </Badge>
                  )}
                </div>
              )
            })}
          </div>

          {/* Desktop */}
          <div className="hidden overflow-x-auto rounded-xl border bg-card sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium">#</th>
                  <th className="px-4 py-3 text-left font-medium">Cliente</th>
                  <th className="px-4 py-3 text-right font-medium">Pontos</th>
                  <th className="px-4 py-3 text-right font-medium">Desconto</th>
                </tr>
              </thead>
              <tbody>
                {clientes.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Nenhum cliente ainda</td></tr>
                ) : clientes.map((c, idx) => {
                  const desconto = Math.floor(c.pontos / 100) * 5
                  return (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium">{c.nome}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center gap-1">
                          <Star className="size-3 text-amber-500" />
                          {c.pontos.toLocaleString('pt-BR')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {desconto > 0 ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-200">R$ {desconto.toFixed(2).replace('.', ',')}</Badge>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Transações */}
        <div>
          <h2 className="mb-3 text-sm font-semibold">Últimas transações</h2>

          {/* Mobile */}
          <div className="space-y-2 sm:hidden">
            {transacoes.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma transação ainda</p>
            ) : transacoes.map((t) => (
              <div key={t.id} className="rounded-xl border bg-card px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{t.clientes?.nome ?? '—'}</p>
                    <p className="text-sm text-muted-foreground">{t.descricao}</p>
                  </div>
                  <span className={`shrink-0 inline-flex items-center gap-1 font-semibold ${t.pontos > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    <Star className="size-3" />
                    {t.pontos > 0 ? '+' : ''}{t.pontos}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop */}
          <div className="hidden overflow-x-auto rounded-xl border bg-card sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium">Cliente</th>
                  <th className="px-4 py-3 text-left font-medium">Descrição</th>
                  <th className="px-4 py-3 text-right font-medium">Pontos</th>
                </tr>
              </thead>
              <tbody>
                {transacoes.length === 0 ? (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">Nenhuma transação ainda</td></tr>
                ) : transacoes.map((t) => (
                  <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{t.clientes?.nome ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.descricao}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-flex items-center gap-1 font-medium ${t.pontos > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        <Star className="size-3" />
                        {t.pontos > 0 ? '+' : ''}{t.pontos}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
