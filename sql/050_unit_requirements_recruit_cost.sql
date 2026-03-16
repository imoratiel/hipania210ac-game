-- 050_unit_requirements_recruit_cost.sql
-- Inserta el coste de reclutamiento en oro por unidad en unit_requirements.
-- Depende de 049_unit_types_reset_data.sql (IDs secuenciales desde 1).
--
-- resource_type = 'gold'  → coste en oro para reclutar 1 unidad
--
-- IDs de unit_types tras RESTART IDENTITY en 049:
--   ROMA:    1=Hastati  2=Triarii      3=Equites     4=Auxilia(Cab)
--            5=Velites  6=Sagitarii    7=Pretorianos  8=Onagro
--   CARTAGO: 9=Inf.Libia  10=Merc.Galos  11=Cab.Numida  12=Cab.Hispana
--           13=Hond.Baleares  14=Arq.Fenicios  15=Elefantes  16=Ariete
--   ÍBEROS: 17=Caetrati  18=Scutarii   19=Jin.Lanza  20=Jin.Élite
--           21=Falarica  22=Honderos   23=Devotio    24=Ariete
--   CELTAS: 25=Celtíberos  26=Lanc.Norte  27=Cazadores  28=Lanzahachas
--           29=Cab.Exploración  30=Nobles a Caballo  31=Carros  32=Ariete

INSERT INTO unit_requirements (unit_type_id, resource_type, amount) VALUES

-- ── ROMA ────────────────────────────────────────────────────────────────────
( 1, 'gold',   120),  -- Hastati
( 2, 'gold',   300),  -- Triarii
( 3, 'gold',   100),  -- Equites
( 4, 'gold',   180),  -- Auxilia (Cab)
( 5, 'gold',    90),  -- Velites
( 6, 'gold',    80),  -- Sagitarii
( 7, 'gold',  1000),  -- Pretorianos
( 8, 'gold',  1200),  -- Onagro

-- ── CARTAGO ──────────────────────────────────────────────────────────────────
( 9, 'gold',   150),  -- Infantería Libia
(10, 'gold',   400),  -- Merc. Galos
(11, 'gold',   100),  -- Caballería Numida
(12, 'gold',   450),  -- Caballería Hispana
(13, 'gold',    90),  -- Honderos Baleares
(14, 'gold',   200),  -- Arqueros Fenicios
(15, 'gold',  1200),  -- Elefantes
(16, 'gold',  1200),  -- Ariete

-- ── ÍBEROS ───────────────────────────────────────────────────────────────────
(17, 'gold',   100),  -- Caetrati
(18, 'gold',   150),  -- Scutarii
(19, 'gold',   120),  -- Jin. Lanza
(20, 'gold',   400),  -- Jin. Élite
(21, 'gold',    80),  -- Falarica
(22, 'gold',   120),  -- Honderos
(23, 'gold',     0),  -- Devotio  ← coste 0 por lealtad (ver CSV)
(24, 'gold',  1200),  -- Ariete

-- ── CELTAS ───────────────────────────────────────────────────────────────────
(25, 'gold',   140),  -- Celtíberos
(26, 'gold',   150),  -- Lanceros del Norte
(27, 'gold',    80),  -- Cazadores
(28, 'gold',   150),  -- Lanzahachas
(29, 'gold',    70),  -- Cab. de Exploración
(30, 'gold',   550),  -- Nobles a Caballo
(31, 'gold',  1200),  -- Carros
(32, 'gold',  1200);  -- Ariete

-- ── Verificación ─────────────────────────────────────────────────────────────
SELECT ut.culture_id, ut.name, ur.resource_type, ur.amount
FROM unit_requirements ur
JOIN unit_types ut ON ut.unit_type_id = ur.unit_type_id
ORDER BY ut.culture_id, ut.unit_type_id;

INSERT INTO schema_migrations (script_name)
VALUES ('050_unit_requirements_recruit_cost.sql')
ON CONFLICT DO NOTHING;
