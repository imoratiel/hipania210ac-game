'use strict';

/**
 * Lista de palabras bloqueadas para nombres de linaje.
 * Cubre español vulgar, insultos comunes y variantes con sustituciones típicas.
 */
const BLOCKED = [
    // Español — insultos y términos ofensivos
    'puta', 'puto', 'mierda', 'coño', 'cojon', 'cojones', 'gilipollas', 'imbecil',
    'idiota', 'estupido', 'estupida', 'pendejo', 'pendeja', 'cabron', 'cabrona',
    'joder', 'hostia', 'hijo de puta', 'hdp', 'polla', 'culo', 'follar', 'maricón',
    'maricon', 'marica', 'zorra', 'putero', 'hijoputa', 'capullo', 'mamón', 'mamon',
    'subnormal', 'retrasado', 'retrasada', 'mongolo', 'mongola', 'tonto', 'tonta',
    'chingar', 'chingada', 'verga', 'culero', 'pinche', 'carajo', 'mierdero',
    'pedo', 'caca', 'cagar', 'putada', 'jodido', 'jodida', 'nazi', 'hitler',
    'pederasta', 'violador', 'violadora',
    // Variantes con números/símbolos comunes
    'put4', 'p0lla', 'c0ño', 'c0jon', 'm13rda',
    // Inglés básico
    'fuck', 'shit', 'asshole', 'bitch', 'cunt', 'nigger', 'faggot', 'whore',
    'bastard', 'dick', 'cock', 'pussy',
];

/**
 * Devuelve true si el texto contiene alguna palabra bloqueada.
 * Usa substring match (insensible a mayúsculas/tildes simplificadas).
 */
function isProfane(text) {
    const normalized = text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // elimina tildes
        .replace(/\s+/g, ' ')
        .trim();

    return BLOCKED.some(word => normalized.includes(word));
}

module.exports = { isProfane };
