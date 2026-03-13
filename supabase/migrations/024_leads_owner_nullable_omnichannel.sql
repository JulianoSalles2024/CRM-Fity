-- Permite owner_id NULL em leads criados via omnichannel (lead ainda não atribuído)
ALTER TABLE leads ALTER COLUMN owner_id DROP NOT NULL;
