-- ============================================================
-- MarmitaSystem – Row Level Security
-- ============================================================
-- Por enquanto as políticas permitem acesso a usuários autenticados.
-- Ajuste conforme sua estrutura de times/roles.

ALTER TABLE produtos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredientes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE produto_ingredientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_itens       ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes_pontos  ENABLE ROW LEVEL SECURITY;

-- Políticas: acesso total para usuários autenticados
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'produtos','ingredientes','produto_ingredientes',
    'clientes','pedidos','pedido_itens','transacoes_pontos'
  ]
  LOOP
    EXECUTE format(
      'CREATE POLICY "%s_auth_all" ON %I
       FOR ALL TO authenticated
       USING (true) WITH CHECK (true);',
      t, t
    );
  END LOOP;
END;
$$;
