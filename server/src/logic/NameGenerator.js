class NameGenerator {
    static #nouns = [
        'Cuervo', 'Lobo', 'Aguila', 'Leon', 'Oso', 'Toro', 'Halcon', 'Serpiente',
        'Dragon', 'Tigre', 'Jabali', 'Ciervo', 'Zorro', 'Pantera', 'Buitre',
        'Espada', 'Lanza', 'Escudo', 'Hacha', 'Ballesta', 'Maza', 'Flecha',
        'Hierro', 'Acero', 'Bronce', 'Piedra', 'Fuego', 'Rayo', 'Trueno', 'Niebla',
        'Sangre', 'Ceniza', 'Sombra', 'Llama', 'Tormenta', 'Marea', 'Ventisca',
        'Honor', 'Gloria', 'Venganza', 'Victoria', 'Conquista', 'Furia', 'Valor'
    ];

    static #adjectives = [
        'Invicto', 'Feroz', 'Implacable', 'Eterno', 'Sagrado', 'Maldito', 'Glorioso',
        'Temible', 'Valiente', 'Brutal', 'Salvaje', 'Oscuro', 'Radiante', 'Furioso',
        'Imparable', 'Legendario', 'Inmortal', 'Sanguinario', 'Incansable', 'Devastador',
        'Inquebrantable', 'Despiadado', 'Incorruptible', 'Indomable', 'Victorioso',
        'Sombrío', 'Ardiente', 'Helado', 'Veloz', 'Silencioso', 'Rugiente'
    ];

    static generate() {
        const noun = this.#nouns[Math.floor(Math.random() * this.#nouns.length)];
        const adj = this.#adjectives[Math.floor(Math.random() * this.#adjectives.length)];
        return `${noun} ${adj}`.trim();
    }
}

module.exports = NameGenerator;
