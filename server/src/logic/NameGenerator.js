class NameGenerator {

    // ── Íberos (culture_id = 3) ───────────────────────────────────────────────
    static #iberNouns = [
        'Cuervo', 'Lobo', 'Aguila', 'Leon', 'Oso', 'Toro', 'Halcon', 'Jabali',
        'Ciervo', 'Zorro', 'Buitre', 'Serpiente', 'Espada', 'Lanza', 'Escudo',
        'Hacha', 'Flecha', 'Hierro', 'Bronce', 'Piedra', 'Fuego', 'Rayo',
        'Trueno', 'Niebla', 'Sangre', 'Ceniza', 'Sombra', 'Tormenta', 'Marea',
        'Honor', 'Gloria', 'Venganza', 'Victoria', 'Conquista', 'Valor'
    ];

    static #iberAdjectives = [
        'Invicto', 'Feroz', 'Implacable', 'Sagrado', 'Glorioso', 'Temible',
        'Valiente', 'Brutal', 'Salvaje', 'Oscuro', 'Furioso', 'Imparable',
        'Legendario', 'Sanguinario', 'Incansable', 'Devastador', 'Inquebrantable',
        'Despiadado', 'Indomable', 'Victorioso', 'Ardiente', 'Veloz', 'Rugiente'
    ];

    // ── Celtas (culture_id = 4) ───────────────────────────────────────────────
    static #celtNouns = [
        'Cuervo', 'Lobo', 'Oso', 'Toro', 'Jabali', 'Ciervo', 'Aguila', 'Hidra',
        'Roble', 'Niebla', 'Tormenta', 'Ventisca', 'Rayo', 'Trueno', 'Llama',
        'Hacha', 'Lanza', 'Espada', 'Escudo', 'Bronce', 'Hierro', 'Ceniza',
        'Sombra', 'Sangre', 'Valor', 'Furia', 'Gloria', 'Conquista', 'Fortaleza'
    ];

    static #celtAdjectives = [
        'Salvaje', 'Indomable', 'Feroz', 'Imparable', 'Rugiente', 'Temible',
        'Inquebrantable', 'Invicto', 'Legendario', 'Eterno', 'Oscuro', 'Ardiente',
        'Helado', 'Sanguinario', 'Brutal', 'Valiente', 'Furioso', 'Sombrío',
        'Incansable', 'Veloz', 'Silencioso', 'Despiadado'
    ];

    // ── Romanos (culture_id = 1) ──────────────────────────────────────────────
    // Formato latino: [Cognomen/epíteto] + sustantivo o número de legión
    static #romanPrefixes = [
        'Legio', 'Cohors', 'Turma', 'Ala', 'Manipulus', 'Vexillatio'
    ];

    static #romanEpithets = [
        'Invicta', 'Ferrata', 'Fulminata', 'Victrix', 'Augusta', 'Pia Fidelis',
        'Gemina', 'Primigenia', 'Italica', 'Hispana', 'Macedonica', 'Gallica',
        'Valeria', 'Martia', 'Claudia', 'Flavia', 'Adiutrix', 'Rapax',
        'Tonans', 'Parthica', 'Minervia', 'Apollinaris', 'Sabiniana', 'Cyrenaica'
    ];

    static #romanNumerals = [
        'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
        'XI', 'XII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'
    ];

    // ── Cartagineses (culture_id = 2) ─────────────────────────────────────────
    // Mezcla de términos púnicos/semíticos con sustantivos de poder
    static #carthNouns = [
        'Baal', 'Tanit', 'Melqart', 'Eshmun', 'Astarte', 'Mot',
        'Elefante', 'Serpiente', 'Leon', 'Aguila', 'Pantera', 'Escorpion',
        'Fuego', 'Mar', 'Tormenta', 'Abismo', 'Sombra', 'Hierro', 'Sangre',
        'Flota', 'Mercenario', 'Espada', 'Lanza', 'Escudo', 'Gloria', 'Venganza'
    ];

    static #carthAdjectives = [
        'Sagrado', 'Inmortal', 'Eterno', 'Invicto', 'Glorioso', 'Feroz',
        'Implacable', 'Oscuro', 'Temible', 'Sanguinario', 'Brutal', 'Maldito',
        'Devastador', 'Victorioso', 'Incorruptible', 'Ardiente', 'Rugiente',
        'Despiadado', 'Furioso', 'Veloz', 'Silencioso', 'Imparable'
    ];

    // ── Generadores por cultura ───────────────────────────────────────────────

    static #pick(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    static #generateRoman() {
        // e.g. "Legio X Victrix" or "Cohors Ferrata" (without numeral sometimes)
        const useNumeral = Math.random() < 0.7;
        const prefix = this.#pick(this.#romanPrefixes);
        const epithet = this.#pick(this.#romanEpithets);
        if (useNumeral) {
            const num = this.#pick(this.#romanNumerals);
            return `${prefix} ${num} ${epithet}`;
        }
        return `${prefix} ${epithet}`;
    }

    static #generateCarthaginian() {
        return `${this.#pick(this.#carthNouns)} ${this.#pick(this.#carthAdjectives)}`;
    }

    static #generateIberian() {
        return `${this.#pick(this.#iberNouns)} ${this.#pick(this.#iberAdjectives)}`;
    }

    static #generateCeltic() {
        return `${this.#pick(this.#celtNouns)} ${this.#pick(this.#celtAdjectives)}`;
    }

    /**
     * Genera un nombre de ejército según la cultura del jugador.
     * culture_id: 1=Romano, 2=Cartaginés, 3=Íbero, 4=Celta
     * Si culture_id es null/undefined usa el pool ibérico por defecto.
     */
    static generate(culture_id = null) {
        switch (culture_id) {
            case 1: return this.#generateRoman();
            case 2: return this.#generateCarthaginian();
            case 4: return this.#generateCeltic();
            case 3:
            default: return this.#generateIberian();
        }
    }
}

module.exports = NameGenerator;
