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
import { toast } from 'sonner'
import { Plus, Pencil, Users, Star, History } from 'lucide-react'
import type { Cliente } from '@/lib/types'

const STATUS_COLOR: Record<string, string> = {
  pendente:   'bg-gray-100 text-gray-700',
  confirmado: 'bg-blue-100 text-blue-700',
  em_preparo: 'bg-amber-100 text-amber-700',
  pronto:     'bg-green-100 text-green-700',
  entregue:   'bg-muted text-muted-foreground',
  cancelado:  'bg-red-100 text-red-700',
}

type PedidoHistorico = {
  id: string
  total: number
  status: string
  tipo: string
  created_at: string
}

function HistoricoDialog({ cliente }: { cliente: Cliente }) {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [pedidos, setPedidos] = useState<PedidoHistorico[]>([])
  const [loading, setLoading] = useState(false)

  async function loadHistorico() {
    setLoading(true)
    const { data } = await supabase
      .from('pedidos')
      .select('id, total, status, tipo, created_at')
      .eq('cliente_id', cliente.id)
      .order('created_at', { ascending: false })
      .limit(30)
    setPedidos((data ?? []) as PedidoHistorico[])
    setLoading(false)
  }

  function handleOpen(v: boolean) {
    setOpen(v)
    if (v) loadHistorico()
  }

  const totalGasto = pedidos
    .filter((p) => p.status !== 'cancelado')
    .reduce((a, p) => a + Number(p.total), 0)

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="size-7 shrink-0" title="Ver histórico">
          <History className="size-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Histórico — {cliente.nome}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-2 py-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />)}
          </div>
        ) : pedidos.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nenhum pedido encontrado</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
              <span className="text-muted-foreground">{pedidos.length} pedidos</span>
              <span className="font-semibold">
                Total gasto: R$ {totalGasto.toFixed(2).replace('.', ',')}
              </span>
            </div>
            <div className="space-y-2">
              {pedidos.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border bg-card px-3 py-2.5">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        #{p.id.slice(0, 6).toUpperCase()}
                      </span>
                      <Badge variant="outline" className={`text-[10px] ${STATUS_COLOR[p.status] ?? ''}`}>
                        {p.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(p.created_at).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {' · '}
                      <span className="capitalize">{p.tipo}</span>
                    </p>
                  </div>
                  <span className="font-semibold">
                    R$ {Number(p.total).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ClienteDialog({
  cliente,
  onSaved,
}: {
  cliente?: Cliente
  onSaved: () => void
}) {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [nome, setNome] = useState(cliente?.nome ?? '')
  const [telefone, setTelefone] = useState(cliente?.telefone ?? '')
  const [email, setEmail] = useState(cliente?.email ?? '')
  const [pontos, setPontos] = useState(cliente ? String(cliente.pontos) : '0')

  useEffect(() => {
    if (open && cliente) {
      setNome(cliente.nome)
      setTelefone(cliente.telefone ?? '')
      setEmail(cliente.email ?? '')
      setPontos(String(cliente.pontos))
    }
  }, [open, cliente])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return
    setLoading(true)
    try {
      const payload = {
        nome: nome.trim(),
        telefone: telefone.trim() || null,
        email: email.trim() || null,
        pontos: parseInt(pontos) || 0,
      }
      const { error } = cliente
        ? await supabase.from('clientes').update(payload).eq('id', cliente.id)
        : await supabase.from('clientes').insert(payload)

      if (error) throw error
      toast.success(cliente ? 'Cliente atualizado!' : 'Cliente cadastrado!')
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
        {cliente ? (
          <Button variant="ghost" size="icon" className="size-7 shrink-0">
            <Pencil className="size-3.5" />
          </Button>
        ) : (
          <Button className="gap-2">
            <Plus className="size-4" />
            Novo Cliente
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{cliente ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nome *</Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome completo"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Telefone</Label>
            <Input
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(11) 99999-9999"
            />
          </div>
          <div className="space-y-1.5">
            <Label>E-mail</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@email.com"
            />
          </div>
          {cliente && (
            <div className="space-y-1.5">
              <Label>Pontos</Label>
              <Input
                type="number"
                min="0"
                value={pontos}
                onChange={(e) => setPontos(e.target.value)}
              />
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Salvando…' : 'Salvar'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function ClientesManager() {
  const supabase = createClient()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')

  const fetchClientes = useCallback(async () => {
    const { data } = await supabase.from('clientes').select('*').order('nome')
    setClientes((data ?? []) as Cliente[])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchClientes() }, [fetchClientes])

  const filtrados = clientes.filter(
    (c) =>
      c.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (c.telefone ?? '').includes(busca) ||
      (c.email ?? '').toLowerCase().includes(busca.toLowerCase()),
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground">Base de clientes e programa de pontos</p>
        </div>
        <ClienteDialog onSaved={fetchClientes} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{clientes.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de pontos emitidos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {clientes.reduce((acc, c) => acc + c.pontos, 0).toLocaleString('pt-BR')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Com desconto disponível</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {clientes.filter((c) => c.pontos >= 100).length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Input
        placeholder="Buscar por nome, telefone ou e-mail…"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="max-w-sm"
      />

      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map((i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />)}
        </div>
      ) : filtrados.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-16 text-center text-muted-foreground">
          <Users className="size-8 opacity-40" />
          <p className="text-sm">Nenhum cliente encontrado</p>
        </div>
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="space-y-2 sm:hidden">
            {filtrados.map((c) => {
              const descontoDisp = Math.floor(c.pontos / 100) * 5
              return (
                <div key={c.id} className="rounded-xl border bg-card px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{c.nome}</p>
                      {c.telefone && <p className="text-sm text-muted-foreground">{c.telefone}</p>}
                      {c.email && <p className="text-xs text-muted-foreground">{c.email}</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      <HistoricoDialog cliente={c} />
                      <ClienteDialog cliente={c} onSaved={fetchClientes} />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="inline-flex items-center gap-1 text-sm">
                      <Star className="size-3 text-amber-500" />
                      {c.pontos.toLocaleString('pt-BR')} pts
                    </span>
                    {descontoDisp > 0 && (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-200">
                        R$ {descontoDisp.toFixed(2).replace('.', ',')}
                      </Badge>
                    )}
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
                  <th className="px-4 py-3 text-left font-medium">Nome</th>
                  <th className="px-4 py-3 text-left font-medium">Telefone</th>
                  <th className="px-4 py-3 text-left font-medium">E-mail</th>
                  <th className="px-4 py-3 text-right font-medium">Pontos</th>
                  <th className="px-4 py-3 text-right font-medium">Desconto disp.</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtrados.map((c) => {
                  const descontoDisp = Math.floor(c.pontos / 100) * 5
                  return (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{c.nome}</td>
                      <td className="px-4 py-3 text-muted-foreground">{c.telefone ?? '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{c.email ?? '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center gap-1">
                          <Star className="size-3 text-amber-500" />
                          {c.pontos.toLocaleString('pt-BR')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {descontoDisp > 0 ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-200">
                            R$ {descontoDisp.toFixed(2).replace('.', ',')}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <HistoricoDialog cliente={c} />
                          <ClienteDialog cliente={c} onSaved={fetchClientes} />
                        </div>
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
