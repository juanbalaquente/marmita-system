// ============================================================
// MarmitaSystem – Tipos centrais
// ============================================================

export type PedidoStatus =
  | 'pendente'
  | 'confirmado'
  | 'em_preparo'
  | 'pronto'
  | 'entregue'
  | 'cancelado'

export type PedidoTipo = 'local' | 'delivery' | 'retirada'
export type FormaPagamento = 'pix' | 'dinheiro' | 'cartao' | 'fiado'

export interface Produto {
  id: string
  nome: string
  categoria: string
  preco: number
  disponivel: boolean
  created_at: string
}

export interface Ingrediente {
  id: string
  nome: string
  unidade: string
  quantidade_atual: number
  quantidade_minima: number
  custo_unitario: number
  created_at: string
}

export interface Cliente {
  id: string
  nome: string
  telefone: string | null
  email: string | null
  pontos: number
  created_at: string
}

export interface Pedido {
  id: string
  cliente_id: string | null
  status: PedidoStatus
  total: number
  observacao: string | null
  tipo: PedidoTipo
  forma_pagamento: FormaPagamento | null
  taxa_entrega: number
  endereco_entrega: string | null
  motivo_cancelamento: string | null
  created_at: string
  clientes?: Cliente | null
  pedido_itens?: PedidoItem[]
}

export interface PedidoItem {
  id: string
  pedido_id: string
  produto_id: string
  quantidade: number
  preco_unitario: number
  subtotal: number
  produtos?: Produto
}

export interface TransacaoPontos {
  id: string
  cliente_id: string
  pedido_id: string | null
  pontos: number
  descricao: string
  created_at: string
}

// ──────────────────────────────────────────────────────────────
// Database type compatível com GenericDatabase do supabase-js v2
// ──────────────────────────────────────────────────────────────
type ProdutoRow = {
  id: string
  nome: string
  categoria: string
  preco: number
  disponivel: boolean
  created_at: string
}

type IngredienteRow = {
  id: string
  nome: string
  unidade: string
  quantidade_atual: number
  quantidade_minima: number
  custo_unitario: number
  created_at: string
}

type ProdutoIngredienteRow = {
  produto_id: string
  ingrediente_id: string
  quantidade: number
}

type ClienteRow = {
  id: string
  nome: string
  telefone: string | null
  email: string | null
  pontos: number
  created_at: string
}

type PedidoRow = {
  id: string
  cliente_id: string | null
  status: string
  total: number
  observacao: string | null
  tipo: string
  created_at: string
}

type PedidoItemRow = {
  id: string
  pedido_id: string
  produto_id: string
  quantidade: number
  preco_unitario: number
  subtotal: number
}

type TransacaoPontosRow = {
  id: string
  cliente_id: string
  pedido_id: string | null
  pontos: number
  descricao: string
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      produtos: {
        Row: ProdutoRow
        Insert: Omit<ProdutoRow, 'id' | 'created_at'>
        Update: Partial<Omit<ProdutoRow, 'id' | 'created_at'>>
        Relationships: []
      }
      ingredientes: {
        Row: IngredienteRow
        Insert: Omit<IngredienteRow, 'id' | 'created_at'>
        Update: Partial<Omit<IngredienteRow, 'id' | 'created_at'>>
        Relationships: []
      }
      produto_ingredientes: {
        Row: ProdutoIngredienteRow
        Insert: ProdutoIngredienteRow
        Update: Partial<ProdutoIngredienteRow>
        Relationships: []
      }
      clientes: {
        Row: ClienteRow
        Insert: Omit<ClienteRow, 'id' | 'created_at'>
        Update: Partial<Omit<ClienteRow, 'id' | 'created_at'>>
        Relationships: []
      }
      pedidos: {
        Row: PedidoRow
        Insert: Omit<PedidoRow, 'id' | 'created_at'>
        Update: Partial<Omit<PedidoRow, 'id' | 'created_at'>>
        Relationships: []
      }
      pedido_itens: {
        Row: PedidoItemRow
        Insert: Omit<PedidoItemRow, 'id' | 'subtotal'>
        Update: Partial<Omit<PedidoItemRow, 'id' | 'subtotal'>>
        Relationships: []
      }
      transacoes_pontos: {
        Row: TransacaoPontosRow
        Insert: Omit<TransacaoPontosRow, 'id' | 'created_at'>
        Update: Partial<Omit<TransacaoPontosRow, 'id' | 'created_at'>>
        Relationships: []
      }
    }
    Views: Record<string, unknown>
    Functions: Record<string, unknown>
    Enums: Record<string, unknown>
    CompositeTypes: Record<string, unknown>
  }
}
