/**
 * contiguitySearch.js
 * Algoritmo BFS para encontrar feudos contiguos libres de un jugador,
 * y utilidad para sugerir nombres de division basados en terreno dominante.
 */

const h3 = require('h3-js');

/**
 * Encuentra todos los feudos contiguos del jugador que no tienen division asignada,
 * usando BFS desde el feudo inicial. El resultado siempre es un conjunto conexo.
 *
 * @param {Set<string>} freeFiefsSet - Set de h3_index: feudos del jugador con division_id IS NULL
 * @param {string}      startH3     - H3 index del feudo de partida (debe estar en freeFiefsSet)
 * @param {number}      maxLimit    - Limite maximo de feudos a devolver (max_fiefs_limit del rango)
 * @returns {string[]} Lista BFS de h3_index, tamanyo <= maxLimit, siempre conexa
 */
function findContiguousFiefs(freeFiefsSet, startH3, maxLimit) {
    if (!freeFiefsSet.has(startH3)) return [];

    const visited = new Set([startH3]);
    const queue   = [startH3];
    const result  = [startH3];

    while (queue.length > 0 && result.length < maxLimit) {
        const current   = queue.shift();
        const neighbors = h3.gridDisk(current, 1).filter(n => n !== current);

        for (const neighbor of neighbors) {
            if (result.length >= maxLimit) break;
            if (!visited.has(neighbor) && freeFiefsSet.has(neighbor)) {
                visited.add(neighbor);
                result.push(neighbor);
                queue.push(neighbor);
            }
        }
    }

    return result;
}

/**
 * Mapa de prioridad: terreno -> { nombre en genitivo para el titulo, prioridad }
 * Mayor prioridad = terreno mas "notable" o distintivo para dar nombre a la division.
 */
const TERRAIN_NAME_MAP = {
    'Alta Montaña':        { genitivo: 'de la Alta Montaña',    priority: 10 },
    'Espesuras':           { genitivo: 'de las Espesuras',       priority: 9  },
    'Pantanos':            { genitivo: 'de los Pantanos',        priority: 9  },
    'Oteros':              { genitivo: 'de los Oteros',          priority: 8  },
    'Colinas':             { genitivo: 'de las Colinas',         priority: 7  },
    'Bosque':              { genitivo: 'del Bosque',             priority: 7  },
    'Río':                 { genitivo: 'del Río',                priority: 6  },
    'Costa':               { genitivo: 'de la Costa',            priority: 6  },
    'Tierras de Cultivo':  { genitivo: 'de los Llanos',          priority: 4  },
    'Tierras de Secano':   { genitivo: 'del Secano',             priority: 3  },
    'Estepas':             { genitivo: 'de las Estepas',         priority: 3  },
    'Asentamiento':        { genitivo: 'del Burgo',              priority: 5  },
};

/**
 * Sugiere un nombre para una nueva division basandose en el terreno dominante
 * dentro de los feudos seleccionados.
 *
 * @param {Array<{terrain_name: string}>} fiefs      - Feudos con su terrain_name
 * @param {string}                        rankTitle  - Nombre del rango (ej: 'Senorio')
 * @returns {string} Nombre sugerido (ej: 'Senorio de los Pantanos')
 */
function suggestDivisionName(fiefs, rankTitle) {
    // Contar frecuencia de cada terreno
    const terrainCount = {};
    for (const fief of fiefs) {
        const t = fief.terrain_name;
        if (t) terrainCount[t] = (terrainCount[t] || 0) + 1;
    }

    // Seleccionar terreno con mayor score = frecuencia * prioridad
    let bestTerrain    = null;
    let bestScore      = -1;

    for (const [terrain, count] of Object.entries(terrainCount)) {
        const entry    = TERRAIN_NAME_MAP[terrain];
        if (!entry) continue;
        const score    = count * entry.priority;
        if (score > bestScore) {
            bestScore   = score;
            bestTerrain = terrain;
        }
    }

    if (bestTerrain && TERRAIN_NAME_MAP[bestTerrain]) {
        return `${rankTitle} ${TERRAIN_NAME_MAP[bestTerrain].genitivo}`;
    }

    // Fallback generico
    return `${rankTitle} de las Tierras`;
}

module.exports = { findContiguousFiefs, suggestDivisionName };
