'use strict';

/**
 * Genera nombres de personaje histórico según cultura y género.
 * El nombre final es: [nombre de pila cultural] [linaje del jugador]
 *
 * culture_id: 1=Romano, 2=Cartaginés, 3=Íbero, 4=Celta
 */

const NAMES = {
    // ── Romano ───────────────────────────────────────────────────────────────
    1: {
        M: [
            'Marcus', 'Lucius', 'Gaius', 'Quintus', 'Titus', 'Publius', 'Gnaeus',
            'Aulus', 'Manius', 'Servius', 'Appius', 'Kaeso', 'Spurius', 'Decimus',
            'Numerius', 'Caius', 'Sextus', 'Vibius', 'Opiter', 'Volero',
        ],
        F: [
            'Claudia', 'Julia', 'Livia', 'Cornelia', 'Valeria', 'Aemilia',
            'Fulvia', 'Calpurnia', 'Sempronia', 'Porcia', 'Terentia', 'Caecilia',
            'Tullia', 'Servilia', 'Marcia', 'Fabia', 'Pompeia', 'Mucia', 'Junia',
        ],
    },

    // ── Cartaginés ────────────────────────────────────────────────────────────
    2: {
        M: [
            'Hannibal', 'Hasdrubal', 'Hamilcar', 'Mago', 'Adherbal', 'Bomilcar',
            'Gesco', 'Himilco', 'Maharbal', 'Mutines', 'Carthalo', 'Bostar',
            'Naravas', 'Imilco', 'Azrubal', 'Hiempsal', 'Barcas', 'Sapho',
        ],
        F: [
            'Sophoniba', 'Elissa', 'Dido', 'Tanit', 'Arishat', 'Baliaton',
            'Salammbo', 'Hamilcara', 'Nahar', 'Imilcat', 'Astarte',
        ],
    },

    // ── Íbero ─────────────────────────────────────────────────────────────────
    3: {
        M: [
            'Viriato', 'Indortes', 'Corocotta', 'Attenes', 'Moericanus',
            'Istolatius', 'Corbis', 'Orsua', 'Abaro', 'Leucon', 'Turmo',
            'Amusico', 'Retogenes', 'Megara', 'Lircus', 'Edesco', 'Bilistages',
            'Mandonius', 'Indibilis', 'Allucius',
        ],
        F: [
            'Himilce', 'Luscina', 'Saldubia', 'Arco', 'Nertobriga', 'Ildirta',
            'Salduba', 'Baria', 'Urso', 'Castulo', 'Obulco',
        ],
    },

    // ── Celta ─────────────────────────────────────────────────────────────────
    4: {
        M: [
            'Vercingetorix', 'Brennus', 'Dumnorix', 'Ambiorix', 'Orgetorix',
            'Diviciacus', 'Cassivellaunus', 'Caratacus', 'Togodumnus', 'Cunobelin',
            'Adminius', 'Vercassivellaunus', 'Lucterius', 'Drappes', 'Commius',
            'Epasnactus', 'Tasgetius', 'Sedulius', 'Viridovix', 'Boduognatus',
        ],
        F: [
            'Boudicca', 'Epona', 'Cartimandua', 'Veleda', 'Medb',
            'Onomaris', 'Scathach', 'Flidais', 'Brigantia', 'Andraste',
        ],
    },
};

class CharacterNameGenerator {
    static #pick(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    /**
     * Genera un nombre completo: "[nombre de pila] [linaje]"
     * @param {number|null} culture_id
     * @param {'M'|'F'} gender
     * @param {string} linaje
     */
    static generate(culture_id, gender = 'M', linaje = '') {
        const cultureNames = NAMES[culture_id] ?? NAMES[3];
        const genderPool   = cultureNames[gender] ?? cultureNames['M'];
        const firstName    = this.#pick(genderPool);
        return linaje ? `${firstName} ${linaje}` : firstName;
    }
}

module.exports = CharacterNameGenerator;
