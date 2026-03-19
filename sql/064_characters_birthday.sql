-- 064_characters_birthday.sql
-- Añade birth_month (1-12) para que cada personaje envejezca en su propio mes
-- en lugar de todos el mismo día.
-- El motor procesa los cumpleaños el día 15 de cada mes.

ALTER TABLE characters
    ADD COLUMN IF NOT EXISTS birth_month SMALLINT NOT NULL DEFAULT 1;

-- Aleatorizar el mes de nacimiento de los personajes existentes (1-12)
UPDATE characters
SET birth_month = floor(random() * 12 + 1)::smallint;

INSERT INTO schema_migrations (script_name)
VALUES ('064_characters_birthday.sql')
ON CONFLICT DO NOTHING;
