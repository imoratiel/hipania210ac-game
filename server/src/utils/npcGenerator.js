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

/**
 * Generate a medieval Hispanic name for an AI agent.
 * @param {string} profile - AI profile type ('farmer', etc.)
 * @returns {string} Generated name
 */
function generateAIName(profile = 'farmer') {
    const useMale = Math.random() < 0.6;
    const firstName = useMale
        ? FIRST_NAMES_MALE[Math.floor(Math.random() * FIRST_NAMES_MALE.length)]
        : FIRST_NAMES_FEMALE[Math.floor(Math.random() * FIRST_NAMES_FEMALE.length)];

    if (profile === 'farmer') {
        const useEpithet = Math.random() < 0.6;
        const suffix = useEpithet
            ? FARMER_EPITHETS[Math.floor(Math.random() * FARMER_EPITHETS.length)]
            : FARMER_DOMAINS[Math.floor(Math.random() * FARMER_DOMAINS.length)];
        return `${firstName} ${suffix}`;
    }

    // Default fallback
    return firstName;
}

module.exports = { generateAIName };
