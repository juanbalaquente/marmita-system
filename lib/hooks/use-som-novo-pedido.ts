'use client'

import { useEffect, useRef } from 'react'
import type { Pedido } from '@/lib/types'

function tocarNovoPedido() {
  try {
    const ctx = new AudioContext()
    // Dois "dings" ascendentes — diferente do alerta de atraso
    const notas = [880, 1100]
    notas.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      const t0 = ctx.currentTime + i * 0.18
      gain.gain.setValueAtTime(0, t0)
      gain.gain.linearRampToValueAtTime(0.35, t0 + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.25)
      osc.start(t0)
      osc.stop(t0 + 0.28)
    })
  } catch {}
}

export function useSomNovoPedido(pedidos: Pedido[]) {
  const idsAnterioresRef = useRef<Set<string> | null>(null)

  useEffect(() => {
    const idsAtuais = new Set(pedidos.map((p) => p.id))

    if (idsAnterioresRef.current === null) {
      // Primeira carga — só registra, não toca
      idsAnterioresRef.current = idsAtuais
      return
    }

    const novos = pedidos.filter(
      (p) => !idsAnterioresRef.current!.has(p.id) && p.status === 'pendente',
    )

    if (novos.length > 0) tocarNovoPedido()

    idsAnterioresRef.current = idsAtuais
  }, [pedidos])
}
