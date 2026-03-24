/**
 * Diccionario de etiquetas fiscales por cultura.
 * Cada cultura define su terminología para los dos tipos de recaudación:
 *   - tax:   Impuesto General (aplicado sobre el oro almacenado)
 *   - tithe: Tributo Agrícola / Diezmo (transferencia de recursos a la capital)
 *
 * culture_id:
 *   1 = Romanos
 *   2 = Cartagineses
 *   3 = Íberos
 *   4 = Celtas
 */
export const CULTURAL_LABELS = {
  1: { tax: 'Tributum', tithe: 'Decuma'  },  // Romanos
  2: { tax: 'Minda',    tithe: 'Korbán'  },  // Cartagineses
  3: { tax: 'Kais',     tithe: 'Teuta'   },  // Íberos
  4: { tax: 'Cain',     tithe: 'Edert'   },  // Celtas
};

/**
 * Devuelve el label de impuesto general para una cultura dada.
 * @param {number|null} cultureId
 * @returns {string}
 */
export function getTaxLabel(cultureId) {
  return CULTURAL_LABELS[cultureId]?.tax ?? 'Impuesto';
}

/**
 * Devuelve el label de tributo agrícola (diezmo) para una cultura dada.
 * @param {number|null} cultureId
 * @returns {string}
 */
export function getTitheLabel(cultureId) {
  return CULTURAL_LABELS[cultureId]?.tithe ?? 'Diezmo';
}
