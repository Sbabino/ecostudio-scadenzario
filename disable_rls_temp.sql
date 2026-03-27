-- ============================================
-- DISABILITA RLS TEMPORANEAMENTE PER TEST
-- (Riabilitare quando si aggiunge l'autenticazione)
-- ============================================

alter table clienti disable row level security;
alter table lavoratori disable row level security;
alter table scadenze disable row level security;
alter table alert_log disable row level security;
alter table archivio disable row level security;
alter table consulenza disable row level security;
alter table documenti disable row level security;
alter table profili disable row level security;
