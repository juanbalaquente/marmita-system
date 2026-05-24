-- ============================================================
-- MarmitaSystem – Schema inicial
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Produtos
CREATE TABLE IF NOT EXISTS produtos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome         TEXT NOT NULL,
  categoria    TEXT NOT NULL,
  preco        NUMERIC(10,2) NOT NULL CHECK (preco >= 0),
  disponivel   BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ingredientes
CREATE TABLE IF NOT EXISTS ingredientes (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome               TEXT NOT NULL,
  unidade            TEXT NOT NULL,
  quantidade_atual   NUMERIC(10,3) NOT NULL DEFAULT 0 CHECK (quantidade_atual >= 0),
  quantidade_minima  NUMERIC(10,3) NOT NULL DEFAULT 0 CHECK (quantidade_minima >= 0),
  custo_unitario     NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (custo_unitario >= 0),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Produto_Ingredientes
CREATE TABLE IF NOT EXISTS produto_ingredientes (
  produto_id      UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  ingrediente_id  UUID NOT NULL REFERENCES ingredientes(id) ON DELETE CASCADE,
  quantidade      NUMERIC(10,3) NOT NULL CHECK (quantidade > 0),
  PRIMARY KEY (produto_id, ingrediente_id)
);

-- Clientes
CREATE TABLE IF NOT EXISTS clientes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        TEXT NOT NULL,
  telefone    TEXT,
  email       TEXT,
  pontos      INTEGER NOT NULL DEFAULT 0 CHECK (pontos >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id  UUID REFERENCES clientes(id) ON DELETE SET NULL,
  status      TEXT NOT NULL DEFAULT 'pendente'
              CHECK (status IN ('pendente','confirmado','em_preparo','pronto','entregue','cancelado')),
  total       NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  observacao  TEXT,
  tipo        TEXT NOT NULL DEFAULT 'local'
              CHECK (tipo IN ('local','delivery','retirada')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pedido_Itens
CREATE TABLE IF NOT EXISTS pedido_itens (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id       UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  produto_id      UUID NOT NULL REFERENCES produtos(id) ON DELETE RESTRICT,
  quantidade      INTEGER NOT NULL CHECK (quantidade > 0),
  preco_unitario  NUMERIC(10,2) NOT NULL CHECK (preco_unitario >= 0),
  subtotal        NUMERIC(10,2) GENERATED ALWAYS AS (quantidade * preco_unitario) STORED
);

-- Transacoes_Pontos
CREATE TABLE IF NOT EXISTS transacoes_pontos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id  UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  pedido_id   UUID REFERENCES pedidos(id) ON DELETE SET NULL,
  pontos      INTEGER NOT NULL,
  descricao   TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_pedidos_status      ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_created_at  ON pedidos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pedido_itens_pedido ON pedido_itens(pedido_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_cliente  ON transacoes_pontos(cliente_id);

-- Habilitar Realtime nas tabelas que precisam de atualização ao vivo
ALTER PUBLICATION supabase_realtime ADD TABLE pedidos;
ALTER PUBLICATION supabase_realtime ADD TABLE pedido_itens;
ALTER PUBLICATION supabase_realtime ADD TABLE ingredientes;
