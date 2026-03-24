'use strict';

/**
 * kafkaFacade.js
 *
 * Fachada de auditoría de eventos de juego hacia Kafka.
 * La lógica del juego solo conoce auditEvent(). Kafka es un detalle de infraestructura.
 *
 * Feature flag: KAFKA_AUDIT_ENABLED=true  →  activa el envío de eventos
 *               (false o ausente)          →  no-op silencioso
 *
 * Variables de entorno:
 *   KAFKA_AUDIT_ENABLED=true
 *   KAFKA_BROKERS=localhost:9092          (coma-separado)
 *   KAFKA_CLIENT_ID=mediev-h3-game
 *
 * Topics por dominio (cada consumer escucha el suyo):
 *   KAFKA_TAX_TOPIC=tax.collection        (recaudación fiscal)
 *   KAFKA_MILITARY_TOPIC=army.movement    (movimiento de tropas)
 */

const { Logger } = require('../utils/logger');

// Carga diferida: el servidor arranca aunque kafkajs no esté instalado.
let Kafka;
try {
    ({ Kafka } = require('kafkajs'));
} catch {
    // kafkajs no instalado — funciona en modo no-op
}

// ── Configuración ────────────────────────────────────────────────────────────
const BROKERS = (process.env.KAFKA_BROKERS  || 'localhost:9092').split(',');
const CLIENT  = process.env.KAFKA_CLIENT_ID || 'mediev-h3-game';

// Topics por dominio — también exportados para que los callers los usen como constantes.
const TOPICS = {
    TAX:      process.env.KAFKA_TAX_TOPIC      || 'tax.collection',
    MILITARY: process.env.KAFKA_MILITARY_TOPIC || 'army.movement',
    HARVEST:  process.env.KAFKA_HARVEST_TOPIC  || 'harvest.events',
    SALARY:   process.env.KAFKA_SALARY_TOPIC   || 'salary.payments',
};

// ── Estado del singleton ─────────────────────────────────────────────────────
let _producer    = null;
let _connected   = false;
let _errorLogged = false; // loguear el error de conexión solo una vez

// ── Conexión lazy ────────────────────────────────────────────────────────────
async function _ensureConnected() {
    if (_connected) return true;
    if (!Kafka)     return false;

    try {
        const kafka = new Kafka({
            clientId: CLIENT,
            brokers:  BROKERS,
            retry: { initialRetryTime: 300, retries: 2 },
        });

        _producer = kafka.producer({ acks: 1, timeout: 5_000 });
        await _producer.connect();
        _connected   = true;
        _errorLogged = false;
        Logger.action('[KAFKA FACADE] Productor conectado', { brokers: BROKERS });
        return true;

    } catch (err) {
        if (!_errorLogged) {
            Logger.error(err, { context: 'kafkaFacade._ensureConnected' });
            _errorLogged = true;
        }
        _producer  = null;
        _connected = false;
        return false;
    }
}

// ── API pública ───────────────────────────────────────────────────────────────

/**
 * Envía un evento de auditoría a Kafka.
 * Fire-and-forget: no bloquea la lógica del juego.
 * Si Kafka no está disponible, el error se loguea una sola vez y el juego continúa.
 *
 * @param {string} eventType  - Identificador del evento (ej. 'TAX_COLLECTION', 'ARMY_MOVED')
 * @param {Object} payload    - Datos adicionales del evento
 * @param {string} [topic]    - Topic destino. Por defecto TOPICS.TAX. Usar TOPICS.MILITARY para tropas.
 */
async function auditEvent(eventType, payload, topic = TOPICS.TAX) {
    if (process.env.KAFKA_AUDIT_ENABLED !== 'true') return;

    const connected = await _ensureConnected();
    if (!connected) return;

    const message = {
        eventType,
        timestamp: new Date().toISOString(),
        ...payload,
    };

    try {
        await _producer.send({
            topic,
            messages: [{ key: eventType, value: JSON.stringify(message) }],
        });
    } catch (err) {
        Logger.error(err, { context: 'kafkaFacade.auditEvent', eventType, topic });
        _connected = false; // fuerza reconexión en el próximo evento
    }
}

// ── Shutdown graceful ─────────────────────────────────────────────────────────
async function _disconnect() {
    if (!_producer || !_connected) return;
    try {
        await _producer.disconnect();
        _connected = false;
    } catch { /* silencioso en shutdown */ }
}

process.once('SIGTERM', _disconnect);
process.once('SIGINT',  _disconnect);

module.exports = { auditEvent, TOPICS };
