import { Suspense } from 'react'
import { ResumoDia } from '@/components/shared/resumo-dia'
import { KanbanPedidos } from '@/components/shared/kanban-pedidos'
import { NovoPedidoDialog } from '@/components/shared/novo-pedido-dialog'
import { Skeleton } from '@/components/ui/skeleton'

export default function PedidosPage() {
  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Pedidos</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe e gerencie os pedidos em tempo real
          </p>
        </div>
        <NovoPedidoDialog />
      </div>

      <Suspense
        fallback={
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        }
      >
        <ResumoDia />
      </Suspense>

      <KanbanPedidos />
    </div>
  )
}
