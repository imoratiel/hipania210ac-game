/**
 * NPC Name Generator for AI agents.
 * Generates medieval Hispanic ruler names fitting the "Marca Hispana" setting.
 */

const FIRST_NAMES_MALE = [
    'Rodrigo', 'Alfonso', 'García', 'Sancho', 'Ramiro', 'Fernando', 'Pelayo',
    'Álvaro', 'Diego', 'Gonzalo', 'Bermudo', 'Ordoño', 'Froilán', 'Nuño',
    'Jimeno', 'Vela', 'Lope', 'Fortún', 'Aznar', 'Blasco', 'Íñigo', 'Galindo',
];

const FIRST_NAMES_FEMALE = [
    'Elvira', 'Urraca', 'Teresa', 'Sancha', 'Jimena', 'Aldara', 'Fronilde',
    'Ermesinda', 'Constanza', 'Munia', 'Toda', 'Velasquita', 'Gelvira', 'Adosinda',
];

const FARMER_EPITHETS = [
    'el Labrador', 'el Cosechador', 'la Próspera', 'el del Arado',
    'la Fecunda', 'el Pacífico', 'el Cultivador', 'de la Tierra',
    'el Ganadero', 'de los Campos', 'el Campesino', 'la del Trigal',
    'el de la Dehesa', 'el Hortelano', 'la del Vergel',
];

const FARMER_DOMAINS = [
    'de Villagrande', 'de Campofrío', 'del Vergel', 'de Tierralba',
    'de Pradoverde', 'del Cortijo', 'de Labranza', 'de la Dehesa',
    'de Campollano', 'del Huerto', 'de las Eras',
];

// ── Expansionist profile ────────────────────────────────────────────────────

const EXPANSIONIST_FIRST_NAMES = [
    'Ragnar', 'Varg', 'Hilda', 'Sigrid', 'Kael', 'Bjorn', 'Ivar', 'Astrid',
    'Gunnar', 'Freya', 'Ulf', 'Ragnhild', 'Leif', 'Thyra', 'Sven', 'Gorm',
];

const EXPANSIONIST_EPITHETS = [
    'el Conquistador', 'el Terrible', 'el Martillo', 'de las Cenizas',
    'el Devastador', 'la Implacable', 'el Sanguinario', 'el Temido',
    'el Arrasador', 'la Feroz', 'el Inclemente', 'el de la Espada',
    'el Despiadado', 'la de Hierro', 'el que no perdona',
];

// ── Balanced profile ────────────────────────────────────────────────────────

const BALANCED_FIRST_NAMES = [
    'Cedric', 'Aveline', 'Osric', 'Gisela', 'Baudouin', 'Aldric', 'Matilde',
    'Renaud', 'Hildegard', 'Bertrand', 'Isolde', 'Thierry', 'Adela', 'Godfrey',
];

const BALANCED_EPITHETS = [
    'el Sabio', 'el Vigilante', 'el Grande', 'de la Corona', 'el Prudente',
    'la Ecuánime', 'el Justo', 'la Magnánima', 'el Estratega', 'de la Paz',
    'el Moderado', 'el Previsor', 'la Astuta', 'el Equilibrado',
];

// ── Name generator ──────────────────────────────────────────────────────────

/**
 * Generate a medieval name for an AI agent.
 * @param {string} profile - AI profile type ('farmer' | 'expansionist')
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

    // farmer (default): Hispanic medieval names
    const useMale = Math.random() < 0.6;
    const firstName = useMale
        ? FIRST_NAMES_MALE[Math.floor(Math.random() * FIRST_NAMES_MALE.length)]
        : FIRST_NAMES_FEMALE[Math.floor(Math.random() * FIRST_NAMES_FEMALE.length)];

    const useEpithet = Math.random() < 0.6;
    const suffix = useEpithet
        ? FARMER_EPITHETS[Math.floor(Math.random() * FARMER_EPITHETS.length)]
        : FARMER_DOMAINS[Math.floor(Math.random() * FARMER_DOMAINS.length)];
    return `${firstName} ${suffix}`;
}

module.exports = { generateAIName };
