'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Plus, Pencil, BookOpen } from 'lucide-react'
import type { Produto } from '@/lib/types'

const CATEGORIAS = ['marmita', 'massa', 'bebida', 'sobremesa', 'outros']

function ProdutoDialog({
  produto,
  onSaved,
}: {
  produto?: Produto
  onSaved: () => void
}) {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [nome, setNome] = useState(produto?.nome ?? '')
  const [categoria, setCategoria] = useState(produto?.categoria ?? 'marmita')
  const [preco, setPreco] = useState(produto ? String(produto.preco) : '')
  const [disponivel, setDisponivel] = useState(produto?.disponivel ?? true)

  useEffect(() => {
    if (open && produto) {
      setNome(produto.nome)
      setCategoria(produto.categoria)
      setPreco(String(produto.preco))
      setDisponivel(produto.disponivel)
    }
  }, [open, produto])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim() || !preco) return
    setLoading(true)
    try {
      const payload = {
        nome: nome.trim(),
        categoria,
        preco: parseFloat(preco),
        disponivel,
      }
      const { error } = produto
        ? await supabase.from('produtos').update(payload).eq('id', produto.id)
        : await supabase.from('produtos').insert(payload)

      if (error) throw error
      toast.success(produto ? 'Produto atualizado!' : 'Produto criado!')
      setOpen(false)
      onSaved()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {produto ? (
          <Button variant="ghost" size="icon" className="size-7">
            <Pencil className="size-3.5" />
          </Button>
        ) : (
          <Button className="gap-2">
            <Plus className="size-4" />
            Novo Produto
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{produto ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Marmita Frango Grelhado"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Preço (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                placeholder="0,00"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="disponivel">Disponível no cardápio</Label>
            <Switch id="disponivel" checked={disponivel} onCheckedChange={setDisponivel} />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Salvando…' : 'Salvar'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function CardapioManager() {
  const supabase = createClient()
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProdutos = useCallback(async () => {
    const { data } = await supabase.from('produtos').select('*').order('categoria').order('nome')
    if (data) setProdutos(data as Produto[])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchProdutos() }, [fetchProdutos])

  async function toggleDisponivel(produto: Produto) {
    const { error } = await supabase
      .from('produtos')
      .update({ disponivel: !produto.disponivel })
      .eq('id', produto.id)
    if (error) { toast.error('Erro ao atualizar'); return }
    toast.success(produto.disponivel ? 'Produto desativado' : 'Produto ativado')
    fetchProdutos()
  }

  const categorias = [...new Set(produtos.map((p) => p.categoria))]

  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1,2,3,4,5,6].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Cardápio</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus produtos e preços</p>
        </div>
        <ProdutoDialog onSaved={fetchProdutos} />
      </div>

      {produtos.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-16 text-center text-muted-foreground">
          <BookOpen className="size-8 opacity-40" />
          <p className="text-sm">Nenhum produto cadastrado</p>
        </div>
      )}

      {categorias.map((cat) => (
        <div key={cat}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {cat}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {produtos
              .filter((p) => p.categoria === cat)
              .map((produto) => (
                <Card key={produto.id} className={!produto.disponivel ? 'opacity-60' : ''}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-sm leading-snug">{produto.nome}</CardTitle>
                      <div className="flex shrink-0 items-center gap-1">
                        <ProdutoDialog produto={produto} onSaved={fetchProdutos} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between">
                    <p className="text-lg font-bold">
                      R$ {Number(produto.preco).toFixed(2).replace('.', ',')}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">
                        {produto.disponivel ? 'Ativo' : 'Inativo'}
                      </span>
                      <Switch
                        checked={produto.disponivel}
                        onCheckedChange={() => toggleDisponivel(produto)}
                        className="scale-75"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}
