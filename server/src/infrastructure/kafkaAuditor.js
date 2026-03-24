'use strict';

/**
 * kafkaAuditor.js
 *
 * Capa de abstracción para auditoría de eventos mediante Kafka.
 * La lógica de juego solo conoce auditEvent(). Kafka es un detalle de infraestructura.
 *
 * Configuración (.env):
 *   KAFKA_AUDIT_ENABLED=true          # Activa/desactiva el sistema
 *   KAFKA_BROKERS=localhost:9092       # Lista de brokers separada por comas
 *   KAFKA_AUDIT_TOPIC=game-audit       # Topic destino
 *   KAFKA_CLIENT_ID=mediev-h3-game     # Identificador del cliente
 */

const { Logger } = require('../utils/logger');

// ── Carga diferida de kafkajs ─────────────────────────────────────────────────
// Se importa aquí y no en el top-level para que el servidor arranque aunque
// kafkajs no esté instalado (modo KAFKA_AUDIT_ENABLED=false).
let Kafka;
try {
    ({ Kafka } = require('kafkajs'));
} catch {
    // kafkajs no instalado — el auditor funcionará en modo no-op
}

// ── Configuración ─────────────────────────────────────────────────────────────
const CONFIG = {
    brokers:  (process.env.KAFKA_BROKERS   || 'localhost:9092').split(','),
    topic:    process.env.KAFKA_AUDIT_TOPIC  || 'game-audit',
    clientId: process.env.KAFKA_CLIENT_ID   || 'mediev-h3-game',
};

// ── Estado del singleton ──────────────────────────────────────────────────────
let _enabled    = process.env.KAFKA_AUDIT_ENABLED === 'true';
let _producer   = null;
let _connected  = false;
let _connecting = false;

// Backoff exponencial para reintentos de conexión
const RETRY = { attempts: 0, maxAttempts: 5, baseDelayMs: 2_000 };

// ── Conexión (singleton, se reutiliza en todas las llamadas) ──────────────────
async function _connect() {
    if (!_enabled || !Kafka || _connected || _connecting) return;

    _connecting = true;
    const delay = RETRY.baseDelayMs * Math.pow(2, RETRY.attempts);

    try {
        const kafka = new Kafka({
            clientId: CONFIG.clientId,
            brokers:  CONFIG.brokers,
            // Reintentos internos de kafkajs (errores transitorios de red)
            retry: { initialRetryTime: 300, retries: 3 },
        });

        _producer = kafka.producer({
            // Garantía de entrega: al menos uno (balance entre rendimiento y seguridad)
            acks: 1,
            // Si Kafka no responde en 5 s, lanza error en lugar de bloquear indefinidamente
            timeout: 5_000,
        });

        await _producer.connect();
        _connected  = true;
        _connecting = false;
        RETRY.attempts = 0; // reset backoff
        Logger.action('[KAFKA] Productor conectado', { brokers: CONFIG.brokers, topic: CONFIG.topic });

    } catch (err) {
        _connecting = false;
        _connected  = false;
        RETRY.attempts = Math.min(RETRY.attempts + 1, RETRY.maxAttempts);

        Logger.error(err, { context: 'kafkaAuditor._connect', attempt: RETRY.attempts });

        if (RETRY.attempts < RETRY.maxAttempts) {
            // Reintento con backoff exponencial (no bloquea el hilo principal)
            setTimeout(_connect, delay);
        } else {
            Logger.error(
                new Error('[KAFKA] Máximo de reintentos alcanzado. Auditoría desactivada temporalmente.'),
                { context: 'kafkaAuditor._connect' }
            );
        }
    }
}

// ── Desconexión limpia (para shutdown graceful) ───────────────────────────────
async function _disconnect() {
    if (!_producer || !_connected) return;
    try {
        await _producer.disconnect();
        _connected = false;
        Logger.action('[KAFKA] Productor desconectado');
    } catch (err) {
        Logger.error(err, { context: 'kafkaAuditor._disconnect' });
    }
}

// ── API pública ───────────────────────────────────────────────────────────────

/**
 * Envía un evento de auditoría a Kafka.
 * Fire-and-forget: no bloquea la lógica del juego.
 * Si Kafka falla, el error se loguea y el juego continúa.
 *
 * @param {string} eventType  - Identificador del evento (ej. 'RECAUDACION_ORO')
 * @param {Object} payload    - Datos del evento (serializables a JSON)
 */
async function auditEvent(eventType, payload) {
    if (!_enabled || !_connected) return;

    const message = {
        eventType,
        timestamp: new Date().toISOString(),
        ...payload,
    };

    try {
        await _producer.send({
            topic:    CONFIG.topic,
            messages: [{ key: eventType, value: JSON.stringify(message) }],
        });
    } catch (err) {
        Logger.error(err, { context: 'kafkaAuditor.auditEvent', eventType });

        // Si la conexión se perdió, intentamos reconectar en background
        if (!err.message?.includes('disconnected')) return;
        _connected = false;
        _connect();
    }
}

/**
 * Activa o desactiva la auditoría en caliente (sin reiniciar el proceso).
 * Útil para el panel de administración.
 *
 * @param {boolean} value
 */
async function setAuditEnabled(value) {
    _enabled = Boolean(value);
    Logger.action(`[KAFKA] Auditoría ${_enabled ? 'activada' : 'desactivada'} en caliente`);

    if (_enabled && !_connected) await _connect();
    if (!_enabled)               await _disconnect();
}

/**
 * Estado actual del sistema (para el panel de admin).
 * @returns {{ enabled: boolean, connected: boolean, topic: string, brokers: string[] }}
 */
function getAuditStatus() {
    return { enabled: _enabled, connected: _connected, topic: CONFIG.topic, brokers: CONFIG.brokers };
}

// ── Arranque automático ───────────────────────────────────────────────────────
// La conexión se inicia al cargar el módulo (singleton cargado una sola vez por Node.js).
_connect();

// Shutdown graceful: cierra el productor cuando el proceso termina
process.once('SIGTERM', _disconnect);
process.once('SIGINT',  _disconnect);

module.exports = { auditEvent, setAuditEnabled, getAuditStatus };
