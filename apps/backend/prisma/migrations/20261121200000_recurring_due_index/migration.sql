-- Filtra ativas e vencidas e percorre os lotes sem consultar todas as recorrências.
CREATE INDEX "recurring_transactions_due_idx"
ON "recurring_transactions" ("status", "next_due_date", "id");
