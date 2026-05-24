'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Pedido, PedidoStatus } from '@/lib/types'

export function usePedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchPedidos = useCallback(async () => {
    const { data } = await supabase
      .from('pedidos')
      .select(`
        *,
        clientes ( id, nome, telefone ),
        pedido_itens (
          *,
          produtos ( id, nome, preco )
        )
      `)
      .order('created_at', { ascending: false })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (data) setPedidos(data as any as Pedido[])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchPedidos()

    const channel = supabase
      .channel('pedidos-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos' },
        () => fetchPedidos(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchPedidos, supabase])

  const atualizarStatus = useCallback(
    async (pedidoId: string, novoStatus: PedidoStatus) => {
      // Atualiza localmente já (sem esperar o Realtime)
      setPedidos((prev) =>
        prev.map((p) => (p.id === pedidoId ? { ...p, status: novoStatus } : p)),
      )

      const { error } = await supabase
        .from('pedidos')
        .update({ status: novoStatus })
        .eq('id', pedidoId)

      if (error) {
        // Reverte se der erro
        fetchPedidos()
        throw error
      }
    },
    [supabase, fetchPedidos],
  )

  return { pedidos, loading, atualizarStatus, refetch: fetchPedidos }
}
