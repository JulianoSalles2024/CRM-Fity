-- Recarrega o cache de schema do PostgREST
-- Necessário após migrations que adicionaram colunas novas (ex: notifications.message)
NOTIFY pgrst, 'reload schema';
