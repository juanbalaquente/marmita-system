'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Plus, Minus, ShoppingBag } from 'lucide-react'
import type { Cliente, Produto } from '@/lib/types'

interface ItemPedido {
  produto: Produto
  quantidade: number
}

interface Props {
  onCriado?: () => void
}

export function NovoPedidoDialog({ onCriado }: Props) {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])

  const [clienteId, setClienteId] = useState<string>('sem-cliente')
  const [tipo, setTipo] = useState<'local' | 'delivery' | 'retirada'>('local')
  const [observacao, setObservacao] = useState('')
  const [itens, setItens] = useState<ItemPedido[]>([])
  const [usarPontos, setUsarPontos] = useState(false)

  const clienteSelecionado = clientes.find((c) => c.id === clienteId)
  const pontosDisponiveis = clienteSelecionado?.pontos ?? 0
  const descontosDisponiveis = Math.floor(pontosDisponiveis / 100)
  const valorDesconto = descontosDisponiveis * 5

  const subtotal = itens.reduce(
    (sum, item) => sum + item.quantidade * Number(item.produto.preco),
    0,
  )
  const total = Math.max(0, subtotal - (usarPontos ? valorDesconto : 0))

  useEffect(() => {
    if (!open) return
    async function load() {
      const [clientesRes, produtosRes] = await Promise.all([
        supabase.from('clientes').select('*').order('nome'),
        supabase
          .from('produtos')
          .select('*')
          .eq('disponivel', true)
          .order('categoria')
          .order('nome'),
      ])
      if (clientesRes.data) setClientes(clientesRes.data as Cliente[])
      if (produtosRes.data) setProdutos(produtosRes.data as Produto[])
    }
    load()
  }, [open, supabase])

  function alterarQtd(produto: Produto, delta: number) {
    setItens((prev) => {
      const idx = prev.findIndex((i) => i.produto.id === produto.id)
      if (idx === -1) {
        if (delta > 0) return [...prev, { produto, quantidade: 1 }]
        return prev
      }
      const novaQtd = prev[idx].quantidade + delta
      if (novaQtd <= 0) return prev.filter((_, i) => i !== idx)
      const next = [...prev]
      next[idx] = { ...next[idx], quantidade: novaQtd }
      return next
    })
  }

  function qtdDe(produtoId: string) {
    return itens.find((i) => i.produto.id === produtoId)?.quantidade ?? 0
  }

  function resetForm() {
    setClienteId('sem-cliente')
    setTipo('local')
    setObservacao('')
    setItens([])
    setUsarPontos(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (itens.length === 0) {
      toast.error('Adicione ao menos um item ao pedido')
      return
    }

    setLoading(true)
    try {
      const { data: pedido, error: pedidoErr } = await supabase
        .from('pedidos')
        .insert({
          cliente_id: clienteId === 'sem-cliente' ? null : clienteId,
          tipo,
          status: 'pendente',
          total,
          observacao: observacao.trim() || null,
        })
        .select('id')
        .single()

      if (pedidoErr || !pedido) throw pedidoErr ?? new Error('Erro ao criar pedido')

      const { error: itensErr } = await supabase.from('pedido_itens').insert(
        itens.map((item) => ({
          pedido_id: pedido.id,
          produto_id: item.produto.id,
          quantidade: item.quantidade,
          preco_unitario: Number(item.produto.preco),
        })),
      )
      if (itensErr) throw itensErr

      if (usarPontos && clienteId !== 'sem-cliente' && descontosDisponiveis > 0) {
        const pontosUsados = descontosDisponiveis * 100
        await supabase.rpc('use_pontos' as never, {
          p_cliente_id: clienteId,
          p_pontos: pontosUsados,
        }).then(async () => {
          await supabase.from('transacoes_pontos').insert({
            cliente_id: clienteId,
            pedido_id: pedido.id,
            pontos: -pontosUsados,
            descricao: `Desconto aplicado (R$ ${valorDesconto.toFixed(2)})`,
          })
          await supabase
            .from('clientes')
            .update({ pontos: pontosDisponiveis - pontosUsados })
            .eq('id', clienteId)
        })
      }

      toast.success('Pedido criado com sucesso!')
      setOpen(false)
      resetForm()
      onCriado?.()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar pedido')
    } finally {
      setLoading(false)
    }
  }

  const categorias = [...new Set(produtos.map((p) => p.categoria))]

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <ShoppingBag className="size-4" />
          Novo Pedido
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Pedido</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Cliente + Tipo */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Cliente</Label>
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sem identificação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sem-cliente">Sem identificação</SelectItem>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as typeof tipo)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">Local</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                  <SelectItem value="retirada">Retirada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Produtos por categoria */}
          <div className="space-y-3">
            <Label>Itens</Label>
            {categorias.map((cat) => (
              <div key={cat}>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {cat}
                </p>
                <div className="space-y-1">
                  {produtos
                    .filter((p) => p.categoria === cat)
                    .map((produto) => {
                      const qty = qtdDe(produto.id)
                      return (
                        <div
                          key={produto.id}
                          className="flex items-center justify-between rounded-lg border px-3 py-2"
                        >
                          <div>
                            <p className="text-sm font-medium">{produto.nome}</p>
                            <p className="text-xs text-muted-foreground">
                              R$ {Number(produto.preco).toFixed(2).replace('.', ',')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="size-7"
                              onClick={() => alterarQtd(produto, -1)}
                              disabled={qty === 0}
                            >
                              <Minus className="size-3" />
                            </Button>
                            <span className="w-5 text-center text-sm font-medium">
                              {qty || ''}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="size-7"
                              onClick={() => alterarQtd(produto, 1)}
                            >
                              <Plus className="size-3" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            ))}
          </div>

          {/* Observação */}
          <div className="space-y-1.5">
            <Label htmlFor="obs">Observação</Label>
            <Textarea
              id="obs"
              placeholder="Ex: sem cebola, prato extra…"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={2}
            />
          </div>

          {/* Desconto de pontos */}
          {clienteId !== 'sem-cliente' && descontosDisponiveis > 0 && (
            <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-800 dark:bg-amber-950/30">
              <div>
                <p className="text-sm font-medium">Usar pontos de fidelidade</p>
                <p className="text-xs text-muted-foreground">
                  {pontosDisponiveis} pts → desconto de R${' '}
                  {valorDesconto.toFixed(2).replace('.', ',')}
                </p>
              </div>
              <Switch checked={usarPontos} onCheckedChange={setUsarPontos} />
            </div>
          )}

          {/* Resumo */}
          <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
            </div>
            {usarPontos && (
              <div className="flex justify-between text-green-600 dark:text-green-400">
                <span>Desconto (pontos)</span>
                <span>- R$ {valorDesconto.toFixed(2).replace('.', ',')}</span>
              </div>
            )}
            <div className="mt-1 flex justify-between border-t pt-1 font-semibold">
              <span>Total</span>
              <span>R$ {total.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading || itens.length === 0}>
            {loading ? 'Criando…' : 'Criar Pedido'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
