/**
 * NPC Name Generator for AI agents.
 * Generates ancient-era names fitting the Punic Wars / Republican Rome setting
 * (Romans, Carthaginians, Iberians, Celts — circa III–II century BC).
 */

// ── Farmer profile — Iberian / Hispanic names ────────────────────────────────

const FARMER_FIRST_NAMES_MALE = [
    'Indibil', 'Mandonio', 'Culcas', 'Attenes', 'Turro', 'Viriato',
    'Retogenes', 'Luxinio', 'Thurro', 'Burco', 'Olcades', 'Beles',
    'Isturgi', 'Salduie', 'Nertobis',
];

const FARMER_FIRST_NAMES_FEMALE = [
    'Ibérica', 'Salgana', 'Adora', 'Belestria', 'Urke', 'Salba',
    'Neitia', 'Letondo', 'Iltira',
];

const FARMER_EPITHETS = [
    'el Labrador', 'el del Arado', 'el Próspero', 'el Cosechador',
    'la Fecunda', 'el Ganadero', 'de los Campos', 'el Pacífico',
    'el Cultivador', 'la del Trigal', 'el Hortelano', 'el de la Vega',
    'el Campesino', 'la del Vergel',
];

const FARMER_DOMAINS = [
    'de Saguntum', 'de Carthago Nova', 'de Numantia', 'de Toletum',
    'de Caesaraugusta', 'de Ilipa', 'de Emerita', 'de Baecula',
    'de Gades', 'de Malaca', 'de Hispalis',
];

// ── Expansionist profile — Carthaginian / North African names ────────────────

const EXPANSIONIST_FIRST_NAMES = [
    'Hamilcar', 'Hasdrubal', 'Hannibal', 'Mago', 'Himilco', 'Bomilcar',
    'Adherbal', 'Gisco', 'Maharbal', 'Hanno', 'Syphax', 'Masinissa',
    'Jugurtha', 'Sofónisba', 'Azzubaal', 'Imilce',
];

const EXPANSIONIST_EPITHETS = [
    'el Conquistador', 'el Terrible', 'el Fulminante', 'el Tronador',
    'el Devastador', 'la Implacable', 'el Sanguinario', 'el Temido',
    'el Arrasador', 'la Feroz', 'el de las Cenizas', 'el de la Espada',
    'el Despiadado', 'la de Hierro', 'el que no perdona', 'el Barca',
];

// ── Balanced profile — Roman / Greco-Roman names ─────────────────────────────

const BALANCED_FIRST_NAMES = [
    'Scipio', 'Fabius', 'Flaminius', 'Marcellus', 'Aemilius', 'Gracchus',
    'Paullus', 'Crassus', 'Metellus', 'Servilius', 'Claudius', 'Varro',
    'Regulus', 'Postumius', 'Livius', 'Lucretia', 'Cornelia', 'Hortensia',
];

const BALANCED_EPITHETS = [
    'el Sabio', 'el Grande', 'el Prudente', 'el Estratega', 'el Vigilante',
    'la Ecuánime', 'el Justo', 'la Magnánima', 'de la República',
    'el Moderado', 'el Previsor', 'la Astuta', 'el Cónsul',
    'el Africano', 'el Macedónico', 'el Hispano',
];

// ── Name generator ────────────────────────────────────────────────────────────

/**
 * Generate an ancient-era name for an AI agent.
 * @param {string} profile - AI profile type ('farmer' | 'expansionist' | 'balanced')
 * @returns {string} Generated name
 */
function generateAIName(profile = 'farmer') {
    if (profile === 'expansionist') {
        const first   = EXPANSIONIST_FIRST_NAMES[Math.floor(Math.random() * EXPANSIONIST_FIRST_NAMES.length)];
        const epithet = EXPANSIONIST_EPITHETS[Math.floor(Math.random() * EXPANSIONIST_EPITHETS.length)];
        return `${first} ${epithet}`;
    }

    if (profile === 'balanced') {
        const first   = BALANCED_FIRST_NAMES[Math.floor(Math.random() * BALANCED_FIRST_NAMES.length)];
        const epithet = BALANCED_EPITHETS[Math.floor(Math.random() * BALANCED_EPITHETS.length)];
        return `${first} ${epithet}`;
    }

    // farmer (default): Iberian / Hispanic names
    const useMale = Math.random() < 0.6;
    const firstName = useMale
        ? FARMER_FIRST_NAMES_MALE[Math.floor(Math.random() * FARMER_FIRST_NAMES_MALE.length)]
        : FARMER_FIRST_NAMES_FEMALE[Math.floor(Math.random() * FARMER_FIRST_NAMES_FEMALE.length)];

    const useEpithet = Math.random() < 0.6;
    const suffix = useEpithet
        ? FARMER_EPITHETS[Math.floor(Math.random() * FARMER_EPITHETS.length)]
        : FARMER_DOMAINS[Math.floor(Math.random() * FARMER_DOMAINS.length)];
    return `${firstName} ${suffix}`;
}

module.exports = { generateAIName };
