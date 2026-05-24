'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Plus, Pencil, Package, AlertTriangle } from 'lucide-react'
import type { Ingrediente } from '@/lib/types'

const UNIDADES = ['kg', 'g', 'L', 'ml', 'un', 'cx', 'pct']

function IngredienteDialog({
  ingrediente,
  onSaved,
}: {
  ingrediente?: Ingrediente
  onSaved: () => void
}) {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [nome, setNome] = useState(ingrediente?.nome ?? '')
  const [unidade, setUnidade] = useState(ingrediente?.unidade ?? 'kg')
  const [qtdAtual, setQtdAtual] = useState(ingrediente ? String(ingrediente.quantidade_atual) : '')
  const [qtdMin, setQtdMin] = useState(ingrediente ? String(ingrediente.quantidade_minima) : '')
  const [custo, setCusto] = useState(ingrediente ? String(ingrediente.custo_unitario) : '')

  useEffect(() => {
    if (open && ingrediente) {
      setNome(ingrediente.nome)
      setUnidade(ingrediente.unidade)
      setQtdAtual(String(ingrediente.quantidade_atual))
      setQtdMin(String(ingrediente.quantidade_minima))
      setCusto(String(ingrediente.custo_unitario))
    }
  }, [open, ingrediente])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        nome: nome.trim(),
        unidade,
        quantidade_atual: parseFloat(qtdAtual),
        quantidade_minima: parseFloat(qtdMin),
        custo_unitario: parseFloat(custo || '0'),
      }
      const { error } = ingrediente
        ? await supabase.from('ingredientes').update(payload).eq('id', ingrediente.id)
        : await supabase.from('ingredientes').insert(payload)

      if (error) throw error
      toast.success(ingrediente ? 'Ingrediente atualizado!' : 'Ingrediente criado!')
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
        {ingrediente ? (
          <Button variant="ghost" size="icon" className="size-7 shrink-0">
            <Pencil className="size-3.5" />
          </Button>
        ) : (
          <Button className="gap-2">
            <Plus className="size-4" />
            Novo Ingrediente
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {ingrediente ? 'Editar Ingrediente' : 'Novo Ingrediente'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Arroz"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Unidade</Label>
              <Select value={unidade} onValueChange={setUnidade}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIDADES.map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Custo/unidade (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={custo}
                onChange={(e) => setCusto(e.target.value)}
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Qtd. atual</Label>
              <Input
                type="number"
                step="0.001"
                min="0"
                value={qtdAtual}
                onChange={(e) => setQtdAtual(e.target.value)}
                placeholder="0"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Qtd. mínima</Label>
              <Input
                type="number"
                step="0.001"
                min="0"
                value={qtdMin}
                onChange={(e) => setQtdMin(e.target.value)}
                placeholder="0"
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Salvando…' : 'Salvar'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function EstoqueManager() {
  const supabase = createClient()
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([])
  const [loading, setLoading] = useState(true)

  const fetchIngredientes = useCallback(async () => {
    const { data } = await supabase.from('ingredientes').select('*').order('nome')
    setIngredientes((data ?? []) as Ingrediente[])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchIngredientes() }, [fetchIngredientes])

  const comAlerta = ingredientes.filter(
    (i) => Number(i.quantidade_atual) < Number(i.quantidade_minima),
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Estoque</h1>
          <p className="text-sm text-muted-foreground">Controle de ingredientes e insumos</p>
        </div>
        <IngredienteDialog onSaved={fetchIngredientes} />
      </div>

      {comAlerta.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400">
              <AlertTriangle className="size-4" />
              {comAlerta.length} ingrediente(s) abaixo do mínimo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {comAlerta.map((i) => (
                <Badge
                  key={i.id}
                  variant="outline"
                  className="border-amber-300 bg-amber-100 text-amber-800"
                >
                  {i.nome}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />)}
        </div>
      ) : ingredientes.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-16 text-center text-muted-foreground">
          <Package className="size-8 opacity-40" />
          <p className="text-sm">Nenhum ingrediente cadastrado</p>
        </div>
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="space-y-2 sm:hidden">
            {ingredientes.map((i) => {
              const abaixo = Number(i.quantidade_atual) < Number(i.quantidade_minima)
              return (
                <div key={i.id} className={`rounded-xl border bg-card px-4 py-3 ${abaixo ? 'border-amber-300' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{i.nome}</p>
                      <p className={`text-sm ${abaixo ? 'font-semibold text-amber-600' : 'text-muted-foreground'}`}>
                        {Number(i.quantidade_atual).toFixed(2)} {i.unidade}
                        <span className="ml-1 font-normal text-muted-foreground">
                          / mín {Number(i.quantidade_minima).toFixed(2)}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        R$ {Number(i.custo_unitario).toFixed(2).replace('.', ',')} / {i.unidade}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={abaixo ? 'border-amber-300 bg-amber-100 text-amber-800' : 'border-green-300 bg-green-100 text-green-800'}
                      >
                        {abaixo ? 'Baixo' : 'OK'}
                      </Badge>
                      <IngredienteDialog ingrediente={i} onSaved={fetchIngredientes} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop: table */}
          <div className="hidden overflow-x-auto rounded-xl border bg-card sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium">Ingrediente</th>
                  <th className="px-4 py-3 text-right font-medium">Atual</th>
                  <th className="px-4 py-3 text-right font-medium">Mínimo</th>
                  <th className="px-4 py-3 text-right font-medium">Custo/unit</th>
                  <th className="px-4 py-3 text-center font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {ingredientes.map((i) => {
                  const abaixo = Number(i.quantidade_atual) < Number(i.quantidade_minima)
                  return (
                    <tr key={i.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{i.nome}</td>
                      <td className={`px-4 py-3 text-right ${abaixo ? 'font-semibold text-amber-600' : ''}`}>
                        {Number(i.quantidade_atual).toFixed(2)} {i.unidade}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {Number(i.quantidade_minima).toFixed(2)} {i.unidade}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        R$ {Number(i.custo_unitario).toFixed(2).replace('.', ',')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant="outline"
                          className={abaixo ? 'border-amber-300 bg-amber-100 text-amber-800' : 'border-green-300 bg-green-100 text-green-800'}
                        >
                          {abaixo ? 'Baixo' : 'OK'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <IngredienteDialog ingrediente={i} onSaved={fetchIngredientes} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
