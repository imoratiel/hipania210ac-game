--
-- PostgreSQL database dump
--

\restrict a0LC1BCfFHEz4VWBgwsQRL6J0vsFtoYcRrZacZl2cqsfCRs1RsuLKACfM5lzLNr

-- Dumped from database version 18.3 (Debian 18.3-1.pgdg13+1)
-- Dumped by pg_dump version 18.3 (Debian 18.3-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: active_constructions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.active_constructions (
    h3_index character varying(15) NOT NULL,
    type character varying(20) DEFAULT 'BRIDGE'::character varying,
    progress_turns integer DEFAULT 0,
    total_turns integer DEFAULT 365,
    player_id integer
);


ALTER TABLE public.active_constructions OWNER TO postgres;

--
-- Name: ai_usage_stats; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_usage_stats (
    stat_id integer NOT NULL,
    bot_id integer NOT NULL,
    model_name character varying(100) NOT NULL,
    calls_count integer DEFAULT 0 NOT NULL,
    total_tokens integer DEFAULT 0 NOT NULL,
    estimated_cost numeric(10,6) DEFAULT 0 NOT NULL,
    last_call_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.ai_usage_stats OWNER TO postgres;

--
-- Name: ai_usage_stats_stat_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ai_usage_stats_stat_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ai_usage_stats_stat_id_seq OWNER TO postgres;

--
-- Name: ai_usage_stats_stat_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ai_usage_stats_stat_id_seq OWNED BY public.ai_usage_stats.stat_id;


--
-- Name: armies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.armies (
    army_id integer NOT NULL,
    name character varying(100) NOT NULL,
    player_id integer NOT NULL,
    h3_index character varying(15) NOT NULL,
    gold_provisions numeric(12,2) DEFAULT 0.00,
    food_provisions numeric(12,2) DEFAULT 0.00,
    wood_provisions numeric(12,2) DEFAULT 0.00,
    stone_provisions numeric(12,2) DEFAULT 0.00,
    iron_provisions numeric(12,2) DEFAULT 0.00,
    speed_penalty_multiplier numeric(3,2) DEFAULT 1.00,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    detection_range integer DEFAULT 1 NOT NULL,
    destination character varying(16),
    recovering integer DEFAULT 0,
    is_garrison boolean DEFAULT false NOT NULL
);


ALTER TABLE public.armies OWNER TO postgres;

--
-- Name: armies_army_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.armies_army_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.armies_army_id_seq OWNER TO postgres;

--
-- Name: armies_army_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.armies_army_id_seq OWNED BY public.armies.army_id;


--
-- Name: army_actions_cooldowns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.army_actions_cooldowns (
    id integer NOT NULL,
    army_id integer NOT NULL,
    action_type character varying(50) NOT NULL,
    turns_remaining integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT army_actions_cooldowns_turns_remaining_check CHECK ((turns_remaining >= 0))
);


ALTER TABLE public.army_actions_cooldowns OWNER TO postgres;

--
-- Name: army_actions_cooldowns_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.army_actions_cooldowns_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.army_actions_cooldowns_id_seq OWNER TO postgres;

--
-- Name: army_actions_cooldowns_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.army_actions_cooldowns_id_seq OWNED BY public.army_actions_cooldowns.id;


--
-- Name: army_routes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.army_routes (
    army_id integer NOT NULL,
    path jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.army_routes OWNER TO postgres;

--
-- Name: TABLE army_routes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.army_routes IS 'Almacena el camino pre-calculado para cada ej??rcito en movimiento';


--
-- Name: COLUMN army_routes.path; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.army_routes.path IS 'Array JSON con los ??ndices H3 del camino completo, excluyendo la posici??n actual';


--
-- Name: bridges; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bridges (
    h3_index character varying(15) NOT NULL,
    constructed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.bridges OWNER TO postgres;

--
-- Name: building_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.building_types (
    building_type_id integer NOT NULL,
    name character varying(50) NOT NULL,
    icon_slug character varying(50)
);


ALTER TABLE public.building_types OWNER TO postgres;

--
-- Name: building_types_building_type_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.building_types_building_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.building_types_building_type_id_seq OWNER TO postgres;

--
-- Name: building_types_building_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.building_types_building_type_id_seq OWNED BY public.building_types.building_type_id;


--
-- Name: buildings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.buildings (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    type_id integer NOT NULL,
    gold_cost integer DEFAULT 0,
    construction_time_turns integer DEFAULT 1,
    required_building_id integer,
    food_bonus integer DEFAULT 0,
    description text
);


ALTER TABLE public.buildings OWNER TO postgres;

--
-- Name: buildings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.buildings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.buildings_id_seq OWNER TO postgres;

--
-- Name: buildings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.buildings_id_seq OWNED BY public.buildings.id;


--
-- Name: character_abilities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.character_abilities (
    id integer NOT NULL,
    character_id integer NOT NULL,
    ability_key character varying(50) NOT NULL,
    level integer DEFAULT 1
);


ALTER TABLE public.character_abilities OWNER TO postgres;

--
-- Name: character_abilities_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.character_abilities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.character_abilities_id_seq OWNER TO postgres;

--
-- Name: character_abilities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.character_abilities_id_seq OWNED BY public.character_abilities.id;


--
-- Name: characters; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.characters (
    id integer NOT NULL,
    player_id integer NOT NULL,
    name character varying(100) NOT NULL,
    age integer DEFAULT 20,
    health integer DEFAULT 100,
    level integer DEFAULT 1,
    personal_guard integer DEFAULT 25,
    is_heir boolean DEFAULT false,
    is_main_character boolean DEFAULT false,
    parent_character_id integer,
    army_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    h3_index character varying(15),
    destination character varying(15),
    is_captive boolean DEFAULT false,
    captured_by_army_id integer,
    ransom_amount integer,
    ransom_turns_remaining integer,
    CONSTRAINT characters_health_check CHECK (((health >= 0) AND (health <= 100)))
);


ALTER TABLE public.characters OWNER TO postgres;

--
-- Name: COLUMN characters.is_captive; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.characters.is_captive IS 'TRUE when character is held captive by an enemy army';


--
-- Name: COLUMN characters.captured_by_army_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.characters.captured_by_army_id IS 'Army currently holding this character captive';


--
-- Name: COLUMN characters.ransom_amount; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.characters.ransom_amount IS 'Gold required to ransom this character (set when capture occurs)';


--
-- Name: COLUMN characters.ransom_turns_remaining; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.characters.ransom_turns_remaining IS 'Turns remaining before ransom offer expires';


--
-- Name: characters_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.characters_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.characters_id_seq OWNER TO postgres;

--
-- Name: characters_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.characters_id_seq OWNED BY public.characters.id;


--
-- Name: fief_buildings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fief_buildings (
    h3_index text NOT NULL,
    building_id integer NOT NULL,
    remaining_construction_turns integer DEFAULT 0,
    is_under_construction boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.fief_buildings OWNER TO postgres;

--
-- Name: game_config; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.game_config (
    id integer NOT NULL,
    "group" character varying(50),
    key character varying(50),
    value character varying(255)
);


ALTER TABLE public.game_config OWNER TO postgres;

--
-- Name: game_config_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.game_config_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.game_config_id_seq OWNER TO postgres;

--
-- Name: game_config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.game_config_id_seq OWNED BY public.game_config.id;


--
-- Name: global_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.global_settings (
    key character varying(100) NOT NULL,
    value text NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.global_settings OWNER TO postgres;

--
-- Name: h3_map; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.h3_map (
    h3_index text NOT NULL,
    terrain_type_id integer NOT NULL,
    player_id integer,
    has_road boolean DEFAULT false,
    last_update timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    coord_x integer DEFAULT 0,
    coord_y integer DEFAULT 0
);


ALTER TABLE public.h3_map OWNER TO postgres;

--
-- Name: landmarks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.landmarks (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    h3_index character varying(15) NOT NULL,
    type character varying(50)
);


ALTER TABLE public.landmarks OWNER TO postgres;

--
-- Name: landmarks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.landmarks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.landmarks_id_seq OWNER TO postgres;

--
-- Name: landmarks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.landmarks_id_seq OWNED BY public.landmarks.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    sender_id integer,
    receiver_id integer,
    subject character varying(255),
    body text,
    h3_index text,
    is_read boolean DEFAULT false,
    sent_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.messages OWNER TO postgres;

--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.messages_id_seq OWNER TO postgres;

--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: noble_ranks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.noble_ranks (
    id integer NOT NULL,
    title_male character varying(50) NOT NULL,
    title_female character varying(50) NOT NULL,
    territory_name character varying(100) NOT NULL,
    min_fiefs_required integer DEFAULT 0 NOT NULL,
    level_order integer NOT NULL,
    required_parent_rank_id integer,
    required_count integer DEFAULT 0,
    max_fiefs_limit integer DEFAULT 999
);


ALTER TABLE public.noble_ranks OWNER TO postgres;

--
-- Name: noble_ranks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.noble_ranks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.noble_ranks_id_seq OWNER TO postgres;

--
-- Name: noble_ranks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.noble_ranks_id_seq OWNED BY public.noble_ranks.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    player_id integer NOT NULL,
    turn_number integer NOT NULL,
    type character varying(50) DEFAULT 'General'::character varying,
    content text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_notification_type CHECK (((type)::text = ANY ((ARRAY['Militar'::character varying, 'Econ??mico'::character varying, 'Impuestos'::character varying, 'General'::character varying, 'Hambre'::character varying])::text[])))
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: players; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.players (
    player_id integer NOT NULL,
    username character varying(50) NOT NULL,
    color character varying(7) DEFAULT '#cccccc'::character varying NOT NULL,
    gold integer DEFAULT 100000,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    role character varying(20) DEFAULT 'player'::character varying,
    password character varying(255),
    capital_h3 character varying(20),
    display_name character varying(50) NOT NULL,
    is_exiled boolean DEFAULT false NOT NULL,
    is_ai boolean DEFAULT false NOT NULL,
    ai_profile character varying(50),
    deleted boolean DEFAULT false NOT NULL,
    tax_percentage numeric(5,2) DEFAULT 10.00,
    tithe_active boolean DEFAULT false,
    is_initialized boolean DEFAULT false NOT NULL,
    first_name character varying(100) DEFAULT 'Desconocido'::character varying,
    last_name character varying(100) DEFAULT 'Desconocido'::character varying,
    gender character(1) DEFAULT 'M'::bpchar,
    noble_rank_id integer DEFAULT 1,
    CONSTRAINT players_gender_check CHECK ((gender = ANY (ARRAY['M'::bpchar, 'F'::bpchar])))
);


ALTER TABLE public.players OWNER TO postgres;

--
-- Name: COLUMN players.is_exiled; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.players.is_exiled IS 'TRUE cuando el jugador ha perdido todos sus feudos. Le permite colonizar cualquier hex libre ignorando la adyacencia.';


--
-- Name: players_player_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.players_player_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.players_player_id_seq OWNER TO postgres;

--
-- Name: players_player_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.players_player_id_seq OWNED BY public.players.player_id;


--
-- Name: political_divisions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.political_divisions (
    id integer NOT NULL,
    player_id integer NOT NULL,
    name character varying(100) NOT NULL,
    noble_rank_id integer NOT NULL,
    capital_territory_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    capital_h3 character varying(15),
    boundary_geojson jsonb,
    tax_rate numeric(5,2) DEFAULT 10.00 NOT NULL,
    CONSTRAINT chk_division_tax_rate CHECK (((tax_rate >= (1)::numeric) AND (tax_rate <= (15)::numeric)))
);


ALTER TABLE public.political_divisions OWNER TO postgres;

--
-- Name: political_divisions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.political_divisions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.political_divisions_id_seq OWNER TO postgres;

--
-- Name: political_divisions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.political_divisions_id_seq OWNED BY public.political_divisions.id;


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.schema_migrations (
    id integer NOT NULL,
    script_name character varying(255) NOT NULL,
    applied_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.schema_migrations OWNER TO postgres;

--
-- Name: schema_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.schema_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.schema_migrations_id_seq OWNER TO postgres;

--
-- Name: schema_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.schema_migrations_id_seq OWNED BY public.schema_migrations.id;


--
-- Name: settlements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.settlements (
    settlement_id integer NOT NULL,
    h3_index text NOT NULL,
    name text NOT NULL,
    type text,
    population_rank integer
);


ALTER TABLE public.settlements OWNER TO postgres;

--
-- Name: settlements_settlement_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.settlements_settlement_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.settlements_settlement_id_seq OWNER TO postgres;

--
-- Name: settlements_settlement_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.settlements_settlement_id_seq OWNED BY public.settlements.settlement_id;


--
-- Name: terrain_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.terrain_types (
    terrain_type_id integer NOT NULL,
    name character varying(50) NOT NULL,
    color character varying(7) NOT NULL,
    food_output integer DEFAULT 0,
    wood_output integer DEFAULT 0,
    stone_output integer DEFAULT 0,
    iron_output integer DEFAULT 0,
    fishing_output integer DEFAULT 0,
    defense_bonus integer DEFAULT 0,
    movement_cost numeric(5,2) DEFAULT 1.0,
    is_colonizable boolean DEFAULT true NOT NULL
);


ALTER TABLE public.terrain_types OWNER TO postgres;

--
-- Name: terrain_types_terrain_type_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.terrain_types_terrain_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.terrain_types_terrain_type_id_seq OWNER TO postgres;

--
-- Name: terrain_types_terrain_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.terrain_types_terrain_type_id_seq OWNED BY public.terrain_types.terrain_type_id;


--
-- Name: territory_details; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.territory_details (
    territory_id integer NOT NULL,
    h3_index text NOT NULL,
    custom_name character varying(100),
    population integer DEFAULT 200,
    happiness integer DEFAULT 50,
    food_stored numeric(10,2) DEFAULT 0,
    wood_stored numeric(10,2) DEFAULT 0,
    stone_stored numeric(10,2) DEFAULT 0,
    iron_stored numeric(10,2) DEFAULT 0,
    farm_level integer DEFAULT 0,
    mine_level integer DEFAULT 0,
    lumber_level integer DEFAULT 0,
    port_level integer DEFAULT 0,
    defense_level integer DEFAULT 0,
    gold_stored numeric(10,2) DEFAULT 0.0,
    exploration_end_turn integer,
    discovered_resource character varying(20) DEFAULT NULL::character varying,
    grace_turns integer DEFAULT 0,
    division_id integer
);


ALTER TABLE public.territory_details OWNER TO postgres;

--
-- Name: COLUMN territory_details.grace_turns; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.territory_details.grace_turns IS 'Indica los turnos restantes en los que el feudo no bloquea la conquista de adyacentes';


--
-- Name: territory_details_territory_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.territory_details_territory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.territory_details_territory_id_seq OWNER TO postgres;

--
-- Name: territory_details_territory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.territory_details_territory_id_seq OWNED BY public.territory_details.territory_id;


--
-- Name: troops; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.troops (
    troop_id integer NOT NULL,
    army_id integer,
    unit_type_id integer,
    quantity integer DEFAULT 1 NOT NULL,
    experience numeric(5,2) DEFAULT 0.00,
    morale numeric(5,2) DEFAULT 100.00,
    last_fed_turn integer,
    stamina numeric(5,2) DEFAULT 100.0,
    force_rest boolean DEFAULT false
);


ALTER TABLE public.troops OWNER TO postgres;

--
-- Name: COLUMN troops.stamina; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.troops.stamina IS 'Nivel de fatiga de este grupo espec??fico de unidades dentro del ej??rcito (0-100)';


--
-- Name: COLUMN troops.force_rest; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.troops.force_rest IS 'Si es TRUE, la unidad est?? colapsada y no puede moverse hasta recuperar el 25% de stamina';


--
-- Name: troops_troop_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.troops_troop_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.troops_troop_id_seq OWNER TO postgres;

--
-- Name: troops_troop_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.troops_troop_id_seq OWNED BY public.troops.troop_id;


--
-- Name: unit_combat_counters; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.unit_combat_counters (
    id integer NOT NULL,
    attacker_type_id integer,
    defender_type_id integer,
    damage_multiplier numeric(3,2) DEFAULT 1.00
);


ALTER TABLE public.unit_combat_counters OWNER TO postgres;

--
-- Name: unit_combat_counters_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.unit_combat_counters_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.unit_combat_counters_id_seq OWNER TO postgres;

--
-- Name: unit_combat_counters_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.unit_combat_counters_id_seq OWNED BY public.unit_combat_counters.id;


--
-- Name: unit_requirements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.unit_requirements (
    id integer NOT NULL,
    unit_type_id integer,
    resource_type character varying(20),
    amount integer NOT NULL
);


ALTER TABLE public.unit_requirements OWNER TO postgres;

--
-- Name: unit_requirements_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.unit_requirements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.unit_requirements_id_seq OWNER TO postgres;

--
-- Name: unit_requirements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.unit_requirements_id_seq OWNED BY public.unit_requirements.id;


--
-- Name: unit_terrain_modifiers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.unit_terrain_modifiers (
    id integer NOT NULL,
    unit_type_id integer,
    terrain_type character varying(30),
    attack_modificator numeric(3,2) DEFAULT 1.00,
    defense_modificator numeric(3,2) DEFAULT 1.00,
    speed_modificator integer DEFAULT 0,
    stamina_drain_modificator numeric(3,2) DEFAULT 1.00
);


ALTER TABLE public.unit_terrain_modifiers OWNER TO postgres;

--
-- Name: unit_terrain_modifiers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.unit_terrain_modifiers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.unit_terrain_modifiers_id_seq OWNER TO postgres;

--
-- Name: unit_terrain_modifiers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.unit_terrain_modifiers_id_seq OWNED BY public.unit_terrain_modifiers.id;


--
-- Name: unit_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.unit_types (
    unit_type_id integer NOT NULL,
    name character varying(50) NOT NULL,
    attack integer DEFAULT 10,
    health_points integer DEFAULT 100,
    speed integer DEFAULT 1,
    detection_range integer DEFAULT 1,
    gold_upkeep numeric(10,2) DEFAULT 5.00,
    food_consumption numeric(10,2) DEFAULT 2.00,
    is_siege boolean DEFAULT false,
    descrip text
);


ALTER TABLE public.unit_types OWNER TO postgres;

--
-- Name: unit_types_unit_type_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.unit_types_unit_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.unit_types_unit_type_id_seq OWNER TO postgres;

--
-- Name: unit_types_unit_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.unit_types_unit_type_id_seq OWNED BY public.unit_types.unit_type_id;


--
-- Name: v_map_display; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_map_display AS
 SELECT m.h3_index,
    m.terrain_type_id,
    t.name AS terrain_name,
    t.color AS terrain_color,
    m.has_road,
        CASE
            WHEN ((m.player_id IS NOT NULL) AND ((p.capital_h3)::text = m.h3_index)) THEN true
            ELSE false
        END AS is_capital,
    m.player_id,
    p.color AS player_color,
    p.display_name AS owner_name,
    COALESCE(td.custom_name, (s.name)::character varying) AS location_name,
    s.type AS settlement_type,
    s.population_rank,
    m.coord_x,
    m.coord_y
   FROM ((((public.h3_map m
     JOIN public.terrain_types t ON ((m.terrain_type_id = t.terrain_type_id)))
     LEFT JOIN public.players p ON ((m.player_id = p.player_id)))
     LEFT JOIN public.settlements s ON ((m.h3_index = s.h3_index)))
     LEFT JOIN public.territory_details td ON ((m.h3_index = td.h3_index)));


ALTER VIEW public.v_map_display OWNER TO postgres;

--
-- Name: workers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.workers (
    id integer NOT NULL,
    player_id integer NOT NULL,
    h3_index character varying(20) NOT NULL,
    type_id integer NOT NULL,
    hp integer NOT NULL,
    speed integer NOT NULL,
    detection_range integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    destination_h3 character varying(20)
);


ALTER TABLE public.workers OWNER TO postgres;

--
-- Name: workers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.workers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.workers_id_seq OWNER TO postgres;

--
-- Name: workers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.workers_id_seq OWNED BY public.workers.id;


--
-- Name: workers_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.workers_types (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    hp integer DEFAULT 1 NOT NULL,
    speed integer DEFAULT 1 NOT NULL,
    detection_range integer DEFAULT 1 NOT NULL,
    cost integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.workers_types OWNER TO postgres;

--
-- Name: workers_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.workers_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.workers_types_id_seq OWNER TO postgres;

--
-- Name: workers_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.workers_types_id_seq OWNED BY public.workers_types.id;


--
-- Name: world_state; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.world_state (
    id integer NOT NULL,
    current_turn integer DEFAULT 1 NOT NULL,
    game_date date DEFAULT '1039-03-01'::date NOT NULL,
    is_paused boolean DEFAULT true,
    last_updated timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    days_per_year integer DEFAULT 365,
    CONSTRAINT world_state_id_check CHECK ((id = 1))
);


ALTER TABLE public.world_state OWNER TO postgres;

--
-- Name: ai_usage_stats stat_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_usage_stats ALTER COLUMN stat_id SET DEFAULT nextval('public.ai_usage_stats_stat_id_seq'::regclass);


--
-- Name: armies army_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.armies ALTER COLUMN army_id SET DEFAULT nextval('public.armies_army_id_seq'::regclass);


--
-- Name: army_actions_cooldowns id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.army_actions_cooldowns ALTER COLUMN id SET DEFAULT nextval('public.army_actions_cooldowns_id_seq'::regclass);


--
-- Name: building_types building_type_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.building_types ALTER COLUMN building_type_id SET DEFAULT nextval('public.building_types_building_type_id_seq'::regclass);


--
-- Name: buildings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buildings ALTER COLUMN id SET DEFAULT nextval('public.buildings_id_seq'::regclass);


--
-- Name: character_abilities id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.character_abilities ALTER COLUMN id SET DEFAULT nextval('public.character_abilities_id_seq'::regclass);


--
-- Name: characters id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.characters ALTER COLUMN id SET DEFAULT nextval('public.characters_id_seq'::regclass);


--
-- Name: game_config id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.game_config ALTER COLUMN id SET DEFAULT nextval('public.game_config_id_seq'::regclass);


--
-- Name: landmarks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.landmarks ALTER COLUMN id SET DEFAULT nextval('public.landmarks_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: noble_ranks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.noble_ranks ALTER COLUMN id SET DEFAULT nextval('public.noble_ranks_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: players player_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.players ALTER COLUMN player_id SET DEFAULT nextval('public.players_player_id_seq'::regclass);


--
-- Name: political_divisions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.political_divisions ALTER COLUMN id SET DEFAULT nextval('public.political_divisions_id_seq'::regclass);


--
-- Name: schema_migrations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schema_migrations ALTER COLUMN id SET DEFAULT nextval('public.schema_migrations_id_seq'::regclass);


--
-- Name: settlements settlement_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settlements ALTER COLUMN settlement_id SET DEFAULT nextval('public.settlements_settlement_id_seq'::regclass);


--
-- Name: terrain_types terrain_type_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.terrain_types ALTER COLUMN terrain_type_id SET DEFAULT nextval('public.terrain_types_terrain_type_id_seq'::regclass);


--
-- Name: territory_details territory_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.territory_details ALTER COLUMN territory_id SET DEFAULT nextval('public.territory_details_territory_id_seq'::regclass);


--
-- Name: troops troop_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.troops ALTER COLUMN troop_id SET DEFAULT nextval('public.troops_troop_id_seq'::regclass);


--
-- Name: unit_combat_counters id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unit_combat_counters ALTER COLUMN id SET DEFAULT nextval('public.unit_combat_counters_id_seq'::regclass);


--
-- Name: unit_requirements id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unit_requirements ALTER COLUMN id SET DEFAULT nextval('public.unit_requirements_id_seq'::regclass);


--
-- Name: unit_terrain_modifiers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unit_terrain_modifiers ALTER COLUMN id SET DEFAULT nextval('public.unit_terrain_modifiers_id_seq'::regclass);


--
-- Name: unit_types unit_type_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unit_types ALTER COLUMN unit_type_id SET DEFAULT nextval('public.unit_types_unit_type_id_seq'::regclass);


--
-- Name: workers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workers ALTER COLUMN id SET DEFAULT nextval('public.workers_id_seq'::regclass);


--
-- Name: workers_types id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workers_types ALTER COLUMN id SET DEFAULT nextval('public.workers_types_id_seq'::regclass);


--
-- Name: active_constructions active_constructions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.active_constructions
    ADD CONSTRAINT active_constructions_pkey PRIMARY KEY (h3_index);


--
-- Name: ai_usage_stats ai_usage_stats_bot_id_model_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_usage_stats
    ADD CONSTRAINT ai_usage_stats_bot_id_model_name_key UNIQUE (bot_id, model_name);


--
-- Name: ai_usage_stats ai_usage_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_usage_stats
    ADD CONSTRAINT ai_usage_stats_pkey PRIMARY KEY (stat_id);


--
-- Name: armies armies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.armies
    ADD CONSTRAINT armies_pkey PRIMARY KEY (army_id);


--
-- Name: army_actions_cooldowns army_actions_cooldowns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.army_actions_cooldowns
    ADD CONSTRAINT army_actions_cooldowns_pkey PRIMARY KEY (id);


--
-- Name: army_routes army_routes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.army_routes
    ADD CONSTRAINT army_routes_pkey PRIMARY KEY (army_id);


--
-- Name: bridges bridges_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bridges
    ADD CONSTRAINT bridges_pkey PRIMARY KEY (h3_index);


--
-- Name: building_types building_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.building_types
    ADD CONSTRAINT building_types_pkey PRIMARY KEY (building_type_id);


--
-- Name: buildings buildings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buildings
    ADD CONSTRAINT buildings_pkey PRIMARY KEY (id);


--
-- Name: character_abilities character_abilities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.character_abilities
    ADD CONSTRAINT character_abilities_pkey PRIMARY KEY (id);


--
-- Name: characters characters_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.characters
    ADD CONSTRAINT characters_pkey PRIMARY KEY (id);


--
-- Name: fief_buildings fief_buildings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fief_buildings
    ADD CONSTRAINT fief_buildings_pkey PRIMARY KEY (h3_index);


--
-- Name: game_config game_config_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.game_config
    ADD CONSTRAINT game_config_key_key UNIQUE (key);


--
-- Name: game_config game_config_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.game_config
    ADD CONSTRAINT game_config_pkey PRIMARY KEY (id);


--
-- Name: global_settings global_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.global_settings
    ADD CONSTRAINT global_settings_pkey PRIMARY KEY (key);


--
-- Name: h3_map h3_map_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h3_map
    ADD CONSTRAINT h3_map_pkey PRIMARY KEY (h3_index);


--
-- Name: landmarks landmarks_h3_index_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.landmarks
    ADD CONSTRAINT landmarks_h3_index_unique UNIQUE (h3_index);


--
-- Name: landmarks landmarks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.landmarks
    ADD CONSTRAINT landmarks_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: noble_ranks noble_ranks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.noble_ranks
    ADD CONSTRAINT noble_ranks_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: players players_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.players
    ADD CONSTRAINT players_pkey PRIMARY KEY (player_id);


--
-- Name: players players_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.players
    ADD CONSTRAINT players_username_key UNIQUE (username);


--
-- Name: political_divisions political_divisions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.political_divisions
    ADD CONSTRAINT political_divisions_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_script_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_script_name_key UNIQUE (script_name);


--
-- Name: settlements settlements_h3_index_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settlements
    ADD CONSTRAINT settlements_h3_index_key UNIQUE (h3_index);


--
-- Name: settlements settlements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settlements
    ADD CONSTRAINT settlements_pkey PRIMARY KEY (settlement_id);


--
-- Name: terrain_types terrain_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.terrain_types
    ADD CONSTRAINT terrain_types_pkey PRIMARY KEY (terrain_type_id);


--
-- Name: territory_details territory_details_h3_index_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.territory_details
    ADD CONSTRAINT territory_details_h3_index_key UNIQUE (h3_index);


--
-- Name: territory_details territory_details_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.territory_details
    ADD CONSTRAINT territory_details_pkey PRIMARY KEY (territory_id);


--
-- Name: troops troops_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.troops
    ADD CONSTRAINT troops_pkey PRIMARY KEY (troop_id);


--
-- Name: game_config unique_group_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.game_config
    ADD CONSTRAINT unique_group_key UNIQUE ("group", key);


--
-- Name: unit_combat_counters unit_combat_counters_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unit_combat_counters
    ADD CONSTRAINT unit_combat_counters_pkey PRIMARY KEY (id);


--
-- Name: unit_requirements unit_requirements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unit_requirements
    ADD CONSTRAINT unit_requirements_pkey PRIMARY KEY (id);


--
-- Name: unit_terrain_modifiers unit_terrain_modifiers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unit_terrain_modifiers
    ADD CONSTRAINT unit_terrain_modifiers_pkey PRIMARY KEY (id);


--
-- Name: unit_types unit_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unit_types
    ADD CONSTRAINT unit_types_pkey PRIMARY KEY (unit_type_id);


--
-- Name: character_abilities uq_character_ability; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.character_abilities
    ADD CONSTRAINT uq_character_ability UNIQUE (character_id, ability_key);


--
-- Name: political_divisions uq_division_player_name; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.political_divisions
    ADD CONSTRAINT uq_division_player_name UNIQUE (player_id, name);


--
-- Name: workers workers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workers
    ADD CONSTRAINT workers_pkey PRIMARY KEY (id);


--
-- Name: workers_types workers_types_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workers_types
    ADD CONSTRAINT workers_types_name_key UNIQUE (name);


--
-- Name: workers_types workers_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workers_types
    ADD CONSTRAINT workers_types_pkey PRIMARY KEY (id);


--
-- Name: world_state world_state_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.world_state
    ADD CONSTRAINT world_state_pkey PRIMARY KEY (id);


--
-- Name: idx_army_action_cooldown; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_army_action_cooldown ON public.army_actions_cooldowns USING btree (army_id, action_type);


--
-- Name: idx_army_h3_main; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_army_h3_main ON public.armies USING btree (h3_index);


--
-- Name: idx_characters_army; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_characters_army ON public.characters USING btree (army_id);


--
-- Name: idx_characters_h3; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_characters_h3 ON public.characters USING btree (h3_index) WHERE (h3_index IS NOT NULL);


--
-- Name: idx_characters_heir; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_characters_heir ON public.characters USING btree (is_heir) WHERE (is_heir = true);


--
-- Name: idx_characters_player; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_characters_player ON public.characters USING btree (player_id);


--
-- Name: idx_h3_map_coords; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_h3_map_coords ON public.h3_map USING btree (coord_x, coord_y);


--
-- Name: idx_landmarks_h3; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_landmarks_h3 ON public.landmarks USING btree (h3_index);


--
-- Name: idx_messages_receiver_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_receiver_id ON public.messages USING btree (receiver_id);


--
-- Name: idx_messages_sender_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_sender_id ON public.messages USING btree (sender_id);


--
-- Name: idx_notifications_player_turn; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_player_turn ON public.notifications USING btree (player_id, turn_number);


--
-- Name: idx_players_display_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_players_display_name ON public.players USING btree (display_name);


--
-- Name: idx_players_is_ai; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_players_is_ai ON public.players USING btree (is_ai) WHERE (is_ai = true);


--
-- Name: idx_players_noble_rank; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_players_noble_rank ON public.players USING btree (noble_rank_id);


--
-- Name: idx_political_divisions_capital; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_political_divisions_capital ON public.political_divisions USING btree (capital_h3);


--
-- Name: idx_political_divisions_geojson; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_political_divisions_geojson ON public.political_divisions USING gin (boundary_geojson);


--
-- Name: idx_political_divisions_player; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_political_divisions_player ON public.political_divisions USING btree (player_id);


--
-- Name: idx_territory_details_oro; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_territory_details_oro ON public.territory_details USING btree (gold_stored);


--
-- Name: idx_territory_division; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_territory_division ON public.territory_details USING btree (division_id);


--
-- Name: idx_workers_destination; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_workers_destination ON public.workers USING btree (destination_h3) WHERE (destination_h3 IS NOT NULL);


--
-- Name: idx_workers_h3_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_workers_h3_index ON public.workers USING btree (h3_index);


--
-- Name: idx_workers_player; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_workers_player ON public.workers USING btree (player_id);


--
-- Name: idx_workers_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_workers_type ON public.workers USING btree (type_id);


--
-- Name: active_constructions active_constructions_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.active_constructions
    ADD CONSTRAINT active_constructions_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(player_id);


--
-- Name: ai_usage_stats ai_usage_stats_bot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_usage_stats
    ADD CONSTRAINT ai_usage_stats_bot_id_fkey FOREIGN KEY (bot_id) REFERENCES public.players(player_id) ON DELETE CASCADE;


--
-- Name: army_actions_cooldowns army_actions_cooldowns_army_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.army_actions_cooldowns
    ADD CONSTRAINT army_actions_cooldowns_army_id_fkey FOREIGN KEY (army_id) REFERENCES public.armies(army_id) ON DELETE CASCADE;


--
-- Name: army_routes army_routes_army_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.army_routes
    ADD CONSTRAINT army_routes_army_id_fkey FOREIGN KEY (army_id) REFERENCES public.armies(army_id) ON DELETE CASCADE;


--
-- Name: buildings buildings_required_building_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buildings
    ADD CONSTRAINT buildings_required_building_id_fkey FOREIGN KEY (required_building_id) REFERENCES public.buildings(id);


--
-- Name: buildings buildings_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buildings
    ADD CONSTRAINT buildings_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.building_types(building_type_id);


--
-- Name: characters characters_captured_by_army_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.characters
    ADD CONSTRAINT characters_captured_by_army_id_fkey FOREIGN KEY (captured_by_army_id) REFERENCES public.armies(army_id) ON DELETE SET NULL;


--
-- Name: characters characters_destination_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.characters
    ADD CONSTRAINT characters_destination_fkey FOREIGN KEY (destination) REFERENCES public.h3_map(h3_index) ON DELETE SET NULL;


--
-- Name: characters characters_h3_index_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.characters
    ADD CONSTRAINT characters_h3_index_fkey FOREIGN KEY (h3_index) REFERENCES public.h3_map(h3_index) ON DELETE SET NULL;


--
-- Name: characters characters_parent_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.characters
    ADD CONSTRAINT characters_parent_character_id_fkey FOREIGN KEY (parent_character_id) REFERENCES public.characters(id) ON DELETE SET NULL;


--
-- Name: fief_buildings fief_buildings_building_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fief_buildings
    ADD CONSTRAINT fief_buildings_building_id_fkey FOREIGN KEY (building_id) REFERENCES public.buildings(id);


--
-- Name: fief_buildings fief_buildings_h3_index_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fief_buildings
    ADD CONSTRAINT fief_buildings_h3_index_fkey FOREIGN KEY (h3_index) REFERENCES public.h3_map(h3_index);


--
-- Name: character_abilities fk_character; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.character_abilities
    ADD CONSTRAINT fk_character FOREIGN KEY (character_id) REFERENCES public.characters(id) ON DELETE CASCADE;


--
-- Name: territory_details fk_division; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.territory_details
    ADD CONSTRAINT fk_division FOREIGN KEY (division_id) REFERENCES public.political_divisions(id) ON DELETE SET NULL;


--
-- Name: players fk_noble_rank; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.players
    ADD CONSTRAINT fk_noble_rank FOREIGN KEY (noble_rank_id) REFERENCES public.noble_ranks(id);


--
-- Name: political_divisions fk_noble_rank; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.political_divisions
    ADD CONSTRAINT fk_noble_rank FOREIGN KEY (noble_rank_id) REFERENCES public.noble_ranks(id);


--
-- Name: characters fk_player; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.characters
    ADD CONSTRAINT fk_player FOREIGN KEY (player_id) REFERENCES public.players(player_id);


--
-- Name: political_divisions fk_player; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.political_divisions
    ADD CONSTRAINT fk_player FOREIGN KEY (player_id) REFERENCES public.players(player_id);


--
-- Name: h3_map h3_map_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h3_map
    ADD CONSTRAINT h3_map_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(player_id) ON DELETE SET NULL;


--
-- Name: h3_map h3_map_terrain_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h3_map
    ADD CONSTRAINT h3_map_terrain_type_id_fkey FOREIGN KEY (terrain_type_id) REFERENCES public.terrain_types(terrain_type_id);


--
-- Name: messages messages_receiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.players(player_id);


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.players(player_id);


--
-- Name: notifications notifications_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(player_id) ON DELETE CASCADE;


--
-- Name: settlements settlements_h3_index_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settlements
    ADD CONSTRAINT settlements_h3_index_fkey FOREIGN KEY (h3_index) REFERENCES public.h3_map(h3_index) ON DELETE CASCADE;


--
-- Name: territory_details territory_details_h3_index_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.territory_details
    ADD CONSTRAINT territory_details_h3_index_fkey FOREIGN KEY (h3_index) REFERENCES public.h3_map(h3_index) ON DELETE CASCADE;


--
-- Name: troops troops_army_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.troops
    ADD CONSTRAINT troops_army_id_fkey FOREIGN KEY (army_id) REFERENCES public.armies(army_id) ON DELETE CASCADE;


--
-- Name: troops troops_unit_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.troops
    ADD CONSTRAINT troops_unit_type_id_fkey FOREIGN KEY (unit_type_id) REFERENCES public.unit_types(unit_type_id);


--
-- Name: unit_combat_counters unit_combat_counters_attacker_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unit_combat_counters
    ADD CONSTRAINT unit_combat_counters_attacker_type_id_fkey FOREIGN KEY (attacker_type_id) REFERENCES public.unit_types(unit_type_id) ON DELETE CASCADE;


--
-- Name: unit_combat_counters unit_combat_counters_defender_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unit_combat_counters
    ADD CONSTRAINT unit_combat_counters_defender_type_id_fkey FOREIGN KEY (defender_type_id) REFERENCES public.unit_types(unit_type_id) ON DELETE CASCADE;


--
-- Name: unit_requirements unit_requirements_unit_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unit_requirements
    ADD CONSTRAINT unit_requirements_unit_type_id_fkey FOREIGN KEY (unit_type_id) REFERENCES public.unit_types(unit_type_id) ON DELETE CASCADE;


--
-- Name: unit_terrain_modifiers unit_terrain_modifiers_unit_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unit_terrain_modifiers
    ADD CONSTRAINT unit_terrain_modifiers_unit_type_id_fkey FOREIGN KEY (unit_type_id) REFERENCES public.unit_types(unit_type_id) ON DELETE CASCADE;


--
-- Name: workers workers_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workers
    ADD CONSTRAINT workers_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(player_id) ON DELETE CASCADE;


--
-- Name: workers workers_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workers
    ADD CONSTRAINT workers_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.workers_types(id);


--
-- PostgreSQL database dump complete
--

\unrestrict a0LC1BCfFHEz4VWBgwsQRL6J0vsFtoYcRrZacZl2cqsfCRs1RsuLKACfM5lzLNr

