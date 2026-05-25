-- ============================================================
-- MarmitaSystem – Pagamento, entrega e cancelamento
-- ============================================================

ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS forma_pagamento TEXT
    CHECK (forma_pagamento IN ('pix','dinheiro','cartao','fiado')),
  ADD COLUMN IF NOT EXISTS taxa_entrega    NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS endereco_entrega TEXT,
  ADD COLUMN IF NOT EXISTS motivo_cancelamento TEXT;

-- Atualizar trigger de total para incluir taxa_entrega
CREATE OR REPLACE FUNCTION fn_atualizar_total_pedido()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_pedido_id UUID;
BEGIN
  v_pedido_id := COALESCE(NEW.pedido_id, OLD.pedido_id);

  UPDATE pedidos
  SET total = (
    SELECT COALESCE(SUM(subtotal), 0)
    FROM pedido_itens
    WHERE pedido_id = v_pedido_id
  ) + COALESCE((SELECT taxa_entrega FROM pedidos WHERE id = v_pedido_id), 0)
  WHERE id = v_pedido_id;

  RETURN NEW;
END;
$$;
