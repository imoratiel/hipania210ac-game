<template>
  <div class="aud">
    <div class="aud-header">
      <h1 class="aud-title">Auditoría</h1>
      <p class="aud-sub">Monitorización de actividad sospechosa de jugadores</p>
    </div>

    <div class="aud-layout">

      <!-- Estado auditoría -->
      <section class="aud-section">
        <h2 class="sec-title">Estado</h2>
        <div v-if="auditStatus" class="status-row">
          <div class="status-item">
            <span class="status-dot" :class="auditStatus.enabled ? 'dot--green' : 'dot--red'"></span>
            <div>
              <div class="status-val">Auditoría de jugadores: <strong>{{ auditStatus.enabled ? 'ACTIVA' : 'INACTIVA' }}</strong></div>
              <div class="status-sub" v-if="auditStatus.rules">{{ auditStatus.rules }} reglas de detección</div>
            </div>
          </div>
          <div class="toggle-group">
            <button class="ctrl-btn ctrl-btn--green"  v-if="!auditStatus.enabled" @click="enableAudit"  :disabled="acting">▶ Activar</button>
            <button class="ctrl-btn ctrl-btn--red"    v-else                       @click="disableAudit" :disabled="acting">⏹ Desactivar</button>
          </div>
        </div>
      </section>

      <!-- Alertas -->
      <section class="aud-section">
        <h2 class="sec-title">
          Alertas sospechosas
          <span v-if="alerts.length" class="alert-count">{{ alerts.filter(a => !a.reviewed_at).length }} sin revisar</span>
          <button class="refresh-sm" @click="loadAlerts">↻</button>
        </h2>
        <div class="filter-row">
          <label class="filter-label">
            <input type="checkbox" v-model="showReviewed" @change="loadAlerts" />
            Mostrar revisadas
          </label>
        </div>

        <div v-if="loadingAlerts" class="aud-loading">Cargando…</div>
        <div v-else-if="alerts.length === 0" class="aud-empty">No hay alertas{{ showReviewed ? '' : ' sin revisar' }}.</div>

        <table v-else class="aud-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Jugador</th>
              <th>Regla</th>
              <th>Severidad</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="a in alerts" :key="a.id" class="aud-row" :class="{ 'row--reviewed': a.reviewed_at }">
              <td class="td-date">{{ fmtDate(a.created_at) }}</td>
              <td class="td-player">{{ a.display_name || a.username || a.player_id }}</td>
              <td class="td-rule">{{ a.rule }}</td>
              <td><span class="sev-badge" :class="sevCls(a.severity)">{{ a.severity }}</span></td>
              <td>
                <span v-if="a.reviewed_at" class="reviewed-tag">✓ Revisada</span>
                <span v-else class="pending-tag">Pendiente</span>
              </td>
              <td>
                <button v-if="!a.reviewed_at" class="review-btn" @click="reviewAlert(a)" :disabled="acting">
                  Revisar
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Detail expandido al pasar el ratón sobre details -->
        <div v-if="expandedAlert" class="alert-detail">
          <strong>Detalles:</strong>
          <pre>{{ JSON.stringify(expandedAlert.details, null, 2) }}</pre>
        </div>
      </section>

      <!-- Actividad reciente -->
      <section class="aud-section">
        <h2 class="sec-title">
          Actividad por jugador
          <button class="refresh-sm" @click="loadStats">↻</button>
        </h2>
        <div class="stats-controls">
          <label class="field-label">Últimos</label>
          <select v-model.number="statsMinutes" class="aud-select" @change="loadStats">
            <option :value="5">5 min</option>
            <option :value="10">10 min</option>
            <option :value="30">30 min</option>
            <option :value="60">60 min</option>
          </select>
          <span class="stats-total" v-if="statsData">{{ statsData.total_entries }} acciones registradas</span>
        </div>

        <div v-if="loadingStats" class="aud-loading">Cargando…</div>
        <div v-else-if="!statsData?.top_players?.length" class="aud-empty">Sin actividad en este periodo.</div>

        <table v-else class="aud-table">
          <thead>
            <tr>
              <th>Jugador</th>
              <th>Acciones totales</th>
              <th>Top acción</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in statsData.top_players" :key="p.pid" class="aud-row">
              <td class="td-player">{{ p.un || p.pid }}</td>
              <td class="td-count">{{ p.total }}</td>
              <td class="td-rule">{{ topAction(p.by_action) }}</td>
            </tr>
          </tbody>
        </table>
      </section>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const auditStatus   = ref(null)
const alerts        = ref([])
const statsData     = ref(null)
const loadingAlerts = ref(false)
const loadingStats  = ref(false)
const acting        = ref(false)
const showReviewed  = ref(false)
const statsMinutes  = ref(10)
const expandedAlert = ref(null)

async function loadAll() {
  await Promise.allSettled([loadStatus(), loadAlerts(), loadStats()])
}

async function loadStatus() {
  try {
    const { data } = await axios.get('/api/admin/player-audit/status', { withCredentials: true })
    if (data.success) auditStatus.value = data
  } catch {}
}

async function loadAlerts() {
  loadingAlerts.value = true
  try {
    const { data } = await axios.get('/api/admin/player-audit/alerts', {
      params: { reviewed: showReviewed.value },
      withCredentials: true,
    })
    if (data.success) alerts.value = data.alerts
  } finally { loadingAlerts.value = false }
}

async function loadStats() {
  loadingStats.value = true
  try {
    const { data } = await axios.get('/api/admin/player-audit/stats', {
      params: { minutes: statsMinutes.value },
      withCredentials: true,
    })
    if (data.success) statsData.value = data
  } finally { loadingStats.value = false }
}

async function enableAudit() {
  acting.value = true
  try {
    await axios.post('/api/admin/player-audit/enable', {}, { withCredentials: true })
    await loadStatus()
  } finally { acting.value = false }
}

async function disableAudit() {
  acting.value = true
  try {
    await axios.post('/api/admin/player-audit/disable', {}, { withCredentials: true })
    await loadStatus()
  } finally { acting.value = false }
}

async function reviewAlert(a) {
  acting.value = true
  try {
    const { data } = await axios.put(`/api/admin/player-audit/alerts/${a.id}/review`, {}, { withCredentials: true })
    if (data.success) { a.reviewed_at = new Date().toISOString() }
  } finally { acting.value = false }
}

function fmtDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
    + ' ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

function sevCls(s) {
  return { HIGH: 'sev--high', MEDIUM: 'sev--mid', LOW: 'sev--low' }[s?.toUpperCase()] ?? ''
}

function topAction(byAction) {
  if (!byAction) return '—'
  return Object.entries(byAction).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
}

onMounted(loadAll)
</script>

<style scoped>
.aud { padding: 32px 36px; }
.aud-header { margin-bottom: 32px; }
.aud-title { font-family: 'Cinzel', serif; font-size: 1.5rem; color: #c9a84c; letter-spacing: 1px; font-weight: 400; }
.aud-sub   { font-size: 0.82rem; color: #5a4a30; font-family: sans-serif; margin-top: 6px; }

.aud-layout { display: flex; flex-direction: column; gap: 20px; max-width: 960px; }

.aud-section { background: rgba(255,255,255,0.025); border: 1px solid rgba(201,168,76,0.12); border-radius: 8px; padding: 22px 26px; }

.sec-title { font-family: 'Cinzel', serif; font-size: 0.78rem; color: #c9a84c; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; }
.alert-count { font-family: sans-serif; font-size: 0.7rem; background: rgba(248,113,113,0.15); color: #f87171; border: 1px solid rgba(248,113,113,0.3); border-radius: 20px; padding: 2px 8px; }
.refresh-sm { background: none; border: 1px solid rgba(201,168,76,0.15); color: #5a4a30; border-radius: 3px; padding: 2px 8px; font-size: 0.75rem; cursor: pointer; }
.refresh-sm:hover { color: #c9a84c; }

/* Status */
.status-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.status-item { display: flex; align-items: center; gap: 12px; }
.status-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.dot--green { background: #6fcf97; box-shadow: 0 0 6px rgba(111,207,151,0.6); }
.dot--red   { background: #f87171; box-shadow: 0 0 6px rgba(248,113,113,0.6); }
.status-val { font-family: 'EB Garamond', serif; font-size: 0.95rem; color: #a09070; }
.status-val strong { color: #c8b87a; }
.status-sub { font-family: sans-serif; font-size: 0.7rem; color: #4a3a20; }
.toggle-group { display: flex; gap: 8px; }
.ctrl-btn { padding: 7px 16px; border-radius: 5px; border: 1px solid; font-family: 'Cinzel', serif; font-size: 0.72rem; cursor: pointer; background: transparent; transition: background 0.12s; }
.ctrl-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.ctrl-btn--green { color: #6fcf97; border-color: rgba(111,207,151,0.35); }
.ctrl-btn--green:hover:not(:disabled) { background: rgba(111,207,151,0.1); }
.ctrl-btn--red   { color: #f87171; border-color: rgba(248,113,113,0.3); }
.ctrl-btn--red:hover:not(:disabled)   { background: rgba(248,113,113,0.08); }

/* Filters */
.filter-row { margin-bottom: 14px; }
.filter-label { display: flex; align-items: center; gap: 6px; font-family: sans-serif; font-size: 0.78rem; color: #5a4a30; cursor: pointer; }
.filter-label input { accent-color: #c9a84c; }

/* Table */
.aud-loading, .aud-empty { color: #4a3a20; font-family: 'Cinzel', serif; font-size: 0.85rem; text-align: center; padding: 24px 0; }
.aud-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
.aud-table thead th { background: rgba(0,0,0,0.2); color: #5a4a30; font-family: 'Cinzel', serif; font-size: 0.63rem; letter-spacing: 1.5px; text-transform: uppercase; padding: 8px 12px; text-align: left; border-bottom: 1px solid rgba(201,168,76,0.1); }
.aud-row { border-bottom: 1px solid rgba(201,168,76,0.05); }
.aud-row:hover { background: rgba(201,168,76,0.04); }
.row--reviewed { opacity: 0.5; }
.aud-table td { padding: 8px 12px; vertical-align: middle; }
.td-date   { color: #4a3a20; font-family: sans-serif; font-size: 0.72rem; white-space: nowrap; }
.td-player { color: #c9a84c; font-family: 'Cinzel', serif; font-size: 0.78rem; }
.td-rule   { color: #7a6a40; font-family: sans-serif; font-size: 0.75rem; }
.td-count  { color: #c8b87a; font-family: 'Cinzel', serif; }

.sev-badge { display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 0.65rem; font-family: sans-serif; border: 1px solid; text-transform: uppercase; letter-spacing: 0.5px; }
.sev--high { color: #f87171; border-color: rgba(248,113,113,0.35); background: rgba(248,113,113,0.08); }
.sev--mid  { color: #fbbf24; border-color: rgba(251,191,36,0.35); background: rgba(251,191,36,0.08); }
.sev--low  { color: #6fcf97; border-color: rgba(111,207,151,0.3); background: rgba(111,207,151,0.06); }

.reviewed-tag { font-family: sans-serif; font-size: 0.7rem; color: #5a4a30; }
.pending-tag  { font-family: sans-serif; font-size: 0.7rem; color: #fbbf24; }
.review-btn { padding: 3px 10px; border-radius: 4px; border: 1px solid rgba(201,168,76,0.25); background: transparent; color: #c9a84c; font-family: 'Cinzel', serif; font-size: 0.65rem; cursor: pointer; }
.review-btn:hover:not(:disabled) { background: rgba(201,168,76,0.1); }
.review-btn:disabled { opacity: 0.3; cursor: not-allowed; }

/* Stats */
.stats-controls { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
.field-label { font-family: sans-serif; font-size: 0.7rem; color: #5a4a30; text-transform: uppercase; letter-spacing: 1px; }
.aud-select { background: rgba(0,0,0,0.3); border: 1px solid rgba(201,168,76,0.2); border-radius: 4px; color: #e8d4a0; font-family: sans-serif; font-size: 0.8rem; padding: 4px 8px; }
.stats-total { font-family: sans-serif; font-size: 0.75rem; color: #4a3a20; margin-left: 8px; }

.alert-detail { margin-top: 12px; background: rgba(0,0,0,0.3); border-radius: 4px; padding: 10px; }
.alert-detail pre { font-size: 0.72rem; color: #7a6a40; white-space: pre-wrap; }
</style>
