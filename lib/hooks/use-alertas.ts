'use client'

import { useEffect, useRef, useState } from 'react'
import type { Pedido, PedidoStatus } from '@/lib/types'

// Tempo máximo (minutos desde criação) antes de alertar
const LIMITES: Partial<Record<PedidoStatus, number>> = {
  pendente:   5,
  confirmado: 15,
  em_preparo: 35,
  pronto:     40,
}

function tocarAlerta() {
  try {
    const ctx = new AudioContext()
    // Três bipes curtos ascendentes
    const notas = [523, 659, 784]
    notas.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      const t0 = ctx.currentTime + i * 0.22
      gain.gain.setValueAtTime(0, t0)
      gain.gain.linearRampToValueAtTime(0.28, t0 + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.2)
      osc.start(t0)
      osc.stop(t0 + 0.22)
    })
  } catch {
    // AudioContext pode ser bloqueado antes de interação do usuário
  }
}

export function useAlertas(pedidos: Pedido[]) {
  const [alertando, setAlertando] = useState<Set<string>>(new Set())
  const ultimoSomRef = useRef<number>(0)
  const intervaloSom = 60_000 // toca no máximo uma vez por minuto

  useEffect(() => {
    function calcular() {
      const agora = Date.now()
      const novos = new Set<string>()

      for (const p of pedidos) {
        const limite = LIMITES[p.status as PedidoStatus]
        if (limite == null) continue
        const minutos = (agora - new Date(p.created_at).getTime()) / 60_000
        if (minutos >= limite) novos.add(p.id)
      }

      setAlertando(novos)

      if (novos.size > 0 && agora - ultimoSomRef.current >= intervaloSom) {
        ultimoSomRef.current = agora
        tocarAlerta()
      }
    }

    calcular()
    const id = setInterval(calcular, 15_000) // re-checa a cada 15s
    return () => clearInterval(id)
  }, [pedidos, intervaloSom])

  return alertando
}
