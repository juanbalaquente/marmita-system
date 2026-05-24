-- ============================================================
-- MarmitaSystem – Triggers de negócio
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. Baixar estoque ao mudar status para 'em_preparo'
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_baixar_estoque()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Só age quando status muda PARA 'em_preparo'
  IF NEW.status = 'em_preparo' AND OLD.status <> 'em_preparo' THEN
    UPDATE ingredientes i
    SET quantidade_atual = i.quantidade_atual - (pi2.quantidade * oi.quantidade)
    FROM pedido_itens oi
    JOIN produto_ingredientes pi2 ON pi2.produto_id = oi.produto_id
    WHERE oi.pedido_id = NEW.id
      AND pi2.ingrediente_id = i.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_baixar_estoque
AFTER UPDATE OF status ON pedidos
FOR EACH ROW
EXECUTE FUNCTION fn_baixar_estoque();

-- ──────────────────────────────────────────────────────────────
-- 2. Creditar pontos ao marcar pedido como 'entregue'
--    Regra: 1 ponto por R$1 gasto
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_creditar_pontos()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_pontos INTEGER;
BEGIN
  IF NEW.status = 'entregue' AND OLD.status <> 'entregue' AND NEW.cliente_id IS NOT NULL THEN
    v_pontos := FLOOR(NEW.total)::INTEGER;

    UPDATE clientes
    SET pontos = pontos + v_pontos
    WHERE id = NEW.cliente_id;

    INSERT INTO transacoes_pontos (cliente_id, pedido_id, pontos, descricao)
    VALUES (
      NEW.cliente_id,
      NEW.id,
      v_pontos,
      'Compra - Pedido #' || LEFT(NEW.id::TEXT, 8)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_creditar_pontos
AFTER UPDATE OF status ON pedidos
FOR EACH ROW
EXECUTE FUNCTION fn_creditar_pontos();

-- ──────────────────────────────────────────────────────────────
-- 3. Atualizar total do pedido ao inserir / atualizar itens
-- ──────────────────────────────────────────────────────────────
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
  )
  WHERE id = v_pedido_id;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_total_on_insert
AFTER INSERT ON pedido_itens
FOR EACH ROW
EXECUTE FUNCTION fn_atualizar_total_pedido();

CREATE OR REPLACE TRIGGER trg_total_on_update
AFTER UPDATE ON pedido_itens
FOR EACH ROW
EXECUTE FUNCTION fn_atualizar_total_pedido();

CREATE OR REPLACE TRIGGER trg_total_on_delete
AFTER DELETE ON pedido_itens
FOR EACH ROW
EXECUTE FUNCTION fn_atualizar_total_pedido();
