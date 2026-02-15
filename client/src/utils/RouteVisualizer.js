/**
 * RouteVisualizer.js
 * Módulo independiente para visualizar rutas de ejércitos en el mapa.
 *
 * Responsabilidad única: dibujar/limpiar líneas de ruta sobre Leaflet.
 * No contiene lógica de cálculo A* ni de estado del juego.
 *
 * Uso:
 *   import RouteVisualizer from '@/utils/RouteVisualizer.js';
 *   RouteVisualizer.init(map);                            // una vez al montar el mapa
 *   RouteVisualizer.drawPath(armyId, h3Path, currentH3); // cuando se recibe una ruta
 *   RouteVisualizer.clear();                              // para limpiar todo
 */

import L from 'leaflet';
import { cellToLatLng } from 'h3-js';

// Estilo visual de las líneas de ruta
// pane: 'routePane' es CRÍTICO — sin esto Leaflet ignora el z-index del pane
const ROUTE_STYLE = {
  color: '#f39c12',
  weight: 3,
  opacity: 0.6,
  dashArray: '5, 10',
  pane: 'routePane'
};

class RouteVisualizer {
  constructor() {
    /** @type {L.LayerGroup|null} Capa Leaflet que contiene todas las polylines */
    this._routeLayer = null;

    /** @type {Map<number|string, L.Polyline>} armyId → polyline activa */
    this._armyPolylines = new Map();
  }

  /**
   * Inicializa el visualizador con la instancia del mapa.
   * Crea un pane dedicado y registra la capa de rutas.
   * Debe llamarse UNA VEZ después de crear el mapa.
   *
   * @param {L.Map} map - Instancia del mapa Leaflet
   */
  init(map) {
    if (this._routeLayer) {
      // Ya inicializado (hot-reload en dev)
      return;
    }

    // Crear pane dedicado con z-index entre el mapa base y las tropas
    if (!map.getPane('routePane')) {
      map.createPane('routePane');
      const pane = map.getPane('routePane');
      pane.style.zIndex = 600;          // entre starPane(650) y territoryPane(400)
      pane.style.pointerEvents = 'none'; // las líneas no deben interceptar clics en hexágonos
    }

    // L.layerGroup NO propaga pane a sus hijos — el pane va en cada L.polyline (via ROUTE_STYLE)
    this._routeLayer = L.layerGroup().addTo(map);
    console.log('[RouteVisualizer] Inicializado');
  }

  /**
   * Dibuja (o actualiza) la ruta de un ejército en el mapa.
   * Si ya existía una ruta para ese ejército, se elimina antes de dibujar la nueva.
   *
   * @param {number|string} armyId   - ID del ejército
   * @param {string[]}      h3Path   - Array de índices H3 que forman la ruta (sin la posición actual)
   * @param {string}        currentH3 - Índice H3 de la posición actual del ejército
   */
  drawPath(armyId, h3Path, currentH3) {
    if (!this._routeLayer) {
      console.warn('[RouteVisualizer] No inicializado — llama a init(map) primero');
      return;
    }

    // Eliminar línea existente para este ejército
    this._clearArmy(armyId);

    if (!h3Path || h3Path.length === 0 || !currentH3) {
      return;
    }

    // Construir coordenadas: posición actual + resto de la ruta
    // cellToLatLng devuelve [lat, lng], que es lo que espera Leaflet directamente
    const allHexes = [currentH3, ...h3Path];
    const coords = allHexes.map(hex => cellToLatLng(hex));

    console.log(`[RouteVisualizer] Dibujando ruta para ejército ${armyId}:`, coords);

    const polyline = L.polyline(coords, ROUTE_STYLE);
    this._routeLayer.addLayer(polyline);
    this._armyPolylines.set(armyId, polyline);
  }

  /**
   * Elimina la línea de ruta de un ejército específico.
   * Se usa cuando el ejército llega a su destino o cancela el movimiento.
   *
   * @param {number|string} armyId - ID del ejército
   */
  _clearArmy(armyId) {
    const existing = this._armyPolylines.get(armyId);
    if (existing && this._routeLayer) {
      this._routeLayer.removeLayer(existing);
      this._armyPolylines.delete(armyId);
    }
  }

  /**
   * Elimina la línea de ruta de un ejército específico (API pública).
   * Se usa cuando el ejército cancela su movimiento.
   *
   * @param {number|string} armyId - ID del ejército
   */
  clearArmy(armyId) {
    this._clearArmy(armyId);
  }

  /**
   * Elimina TODAS las líneas de ruta del mapa.
   * Útil antes de un re-fetch completo de rutas.
   */
  clear() {
    if (this._routeLayer) {
      this._routeLayer.clearLayers();
    }
    this._armyPolylines.clear();
  }
}

// Exportar singleton — una instancia compartida por toda la app
export default new RouteVisualizer();
