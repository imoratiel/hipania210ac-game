-- Reset exploration status for all territories
-- All territories start as unexplored
-- The physical resources (stone, iron, gold) remain in the database but are hidden until explored

UPDATE territory_details
SET
  exploration_end_turn = NULL,
  discovered_resource = NULL;

-- This makes all territories start as "unexplored"
-- Players must spend gold to explore each territory to discover what resources it contains
