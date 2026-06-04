<template>
  <div class="dash">
    <div class="dash-header">
      <div>
        <h1 class="dash-title">Dashboard</h1>
        <p class="dash-sub">Actualizado {{ lastRefreshed }}</p>
      </div>
      <button class="dash-refresh" @click="load" :disabled="loading">
        <span :class="{ spinning: loading }">↻</span> Actualizar
      </button>
    </div>

    <div v-if="loading && !data" class="dash-loading">Cargando…</div>

    <template v-else-if="data">
      <!-- Fila 1: Métricas principales -->
      <div class="dash-grid">
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-value">{{ data.players.total }}</div>
          <div class="stat-label">Jugadores</div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">🗺️</div>
          <div class="stat-value">{{ fmt(data.territories.total) }}</div>
          <div class="stat-label">Territorios colonizados</div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">🔄</div>
          <div class="stat-value">{{ data.world.current_turn }}</div>
          <div class="stat-label">Turno actual</div>
        </div>

        <div class="stat-card" :class="engineCardCls">
          <div class="stat-icon">{{ data.engine.running ? '🟢' : '🔴' }}</div>
          <div class="stat-value stat-value--sm">{{ data.engine.running ? 'Online' : 'Offline' }}</div>
          <div class="stat-label">Motor</div>
          <div class="stat-sub" v-if="data.engine.running">{{ uptime(data.engine.uptime_ms) }}</div>
          <div class="stat-sub stat-sub--warn" v-else>Detenido</div>
        </div>

        <div class="stat-card" :class="{ 'card--warn': data.world.is_paused }">
          <div class="stat-icon">📅</div>
          <div class="stat-value stat-value--sm">{{ fmtGameDate(data.world.game_date) }}</div>
          <div class="stat-label">Fecha del juego</div>
          <div class="stat-sub stat-sub--warn" v-if="data.world.is_paused">⏸ En pausa</div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">{{ data.season.is_campaign ? '🌿' : '❄️' }}</div>
          <div class="stat-value stat-value--sm">{{ data.season.label }}</div>
          <div class="stat-label">Temporada</div>
          <div class="stat-sub">{{ data.season.spain_hour }}h España</div>
        </div>

        <div class="stat-card" :class="{ 'card--alert': data.bugs.nuevo > 0 }">
          <div class="stat-icon">🆕</div>
          <div class="stat-value" :class="{ 'val--alert': data.bugs.nuevo > 0 }">{{ data.bugs.nuevo }}</div>
          <div class="stat-label">Bugs nuevos</div>
        </div>

        <div class="stat-card" :class="{ 'card--warn': data.bugs.pendiente > 0 }">
          <div class="stat-icon">🔧</div>
          <div class="stat-value" :class="{ 'val--warn': data.bugs.pendiente > 0 }">{{ data.bugs.pendiente }}</div>
          <div class="stat-label">Bugs pendientes</div>
        </div>

        <div class="stat-card stat-card--countdown">
          <div class="stat-icon">⏱️</div>
          <div class="stat-value stat-value--mono">{{ countdown }}</div>
          <div class="stat-label">Próximo turno</div>
          <div class="stat-sub">cada {{ Math.round(data.turn.duration_seconds / 60) }} min</div>
        </div>
      </div>

      <!-- Acciones rápidas -->
      <div class="dash-actions-section">
        <h2 class="section-title">Acciones rápidas</h2>
        <div class="dash-actions">
          <button class="act-btn act-btn--primary" @click="forceTurn" :disabled="acting">
            ⚡ Forzar turno
          </button>
          <button class="act-btn" @click="togglePause" :disabled="acting">
            {{ data.world.is_paused ? '▶ Reanudar partida' : '⏸ Pausar partida' }}
          </button>
          <button class="act-btn act-btn--muted" @click="$emit('navigate', 'turns')">
            ⚙️ Configurar motor →
          </button>
        </div>
        <p v-if="actionMsg" class="action-msg" :class="actionMsgCls">{{ actionMsg }}</p>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import axios from 'axios'

const emit = defineEmits(['navigate'])

const data        = ref(null)
const loading     = ref(false)
const acting      = ref(false)
const actionMsg   = ref('')
const actionMsgCls = ref('')
const lastRefreshed = ref('—')

let countdownMs  = ref(0)
let countdownTimer = null
let refreshTimer   = null

const countdown = computed(() => {
  const s = Math.ceil(countdownMs.value / 1000)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
})

const engineCardCls = computed(() => data.value?.engine.running ? 'card--ok' : 'card--danger')

async function load() {
  loading.value = true
  try {
    const { data: d } = await axios.get('/api/admin/dashboard', { withCredentials: true })
    if (d.success) {
      data.value = d
      countdownMs.value = d.turn.next_turn_ms
      lastRefreshed.value = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }
  } finally {
    loading.value = false
  }
}

async function forceTurn() {
  acting.value = true
  actionMsg.value = ''
  try {
    const { data: d } = await axios.post('/api/admin/engine/force-turn', {}, { withCredentials: true })
    showAction(d.success ? '✅ Turno forzado correctamente.' : `❌ ${d.message}`, d.success)
    if (d.success) load()
  } catch (e) {
    showAction('❌ Error al forzar turno.', false)
  } finally {
    acting.value = false
  }
}

async function togglePause() {
  if (!data.value) return
  acting.value = true
  const ep = data.value.world.is_paused ? '/api/admin/engine/resume' : '/api/admin/engine/pause'
  try {
    const { data: d } = await axios.post(ep, {}, { withCredentials: true })
    showAction(d.success ? '✅ Estado actualizado.' : `❌ ${d.message}`, d.success)
    if (d.success) load()
  } catch {
    showAction('❌ Error al cambiar estado.', false)
  } finally {
    acting.value = false
  }
}

function showAction(msg, ok) {
  actionMsg.value   = msg
  actionMsgCls.value = ok ? 'msg--ok' : 'msg--err'
  setTimeout(() => { actionMsg.value = '' }, 4000)
}

function uptime(ms) {
  if (!ms) return ''
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}m activo` : `${m}m activo`
}

function fmt(n) { return Number(n).toLocaleString('es-ES') }

function fmtGameDate(iso) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch { return iso }
}

onMounted(() => {
  load()
  countdownTimer = setInterval(() => {
    if (countdownMs.value > 0) countdownMs.value -= 1000
  }, 1000)
  refreshTimer = setInterval(load, 30000)
})

onUnmounted(() => {
  clearInterval(countdownTimer)
  clearInterval(refreshTimer)
})
</script>

<style scoped>
.dash {
  padding: 32px 36px;
  max-width: 1100px;
}

.dash-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 32px;
}

.dash-title {
  font-family: 'Cinzel', serif;
  font-size: 1.5rem;
  color: #c9a84c;
  letter-spacing: 1px;
  font-weight: 400;
}

.dash-sub {
  font-size: 0.78rem;
  color: #4a3a20;
  font-family: sans-serif;
  margin-top: 4px;
}

.dash-refresh {
  background: rgba(201,168,76,0.08);
  border: 1px solid rgba(201,168,76,0.2);
  color: #7a6a40;
  border-radius: 5px;
  padding: 7px 16px;
  font-family: 'Cinzel', serif;
  font-size: 0.72rem;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: color 0.12s;
  display: flex;
  align-items: center;
  gap: 6px;
}
.dash-refresh:hover { color: #c9a84c; }
.dash-refresh:disabled { opacity: 0.4; cursor: not-allowed; }
.spinning { display: inline-block; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.dash-loading {
  color: #4a3a20;
  font-family: 'Cinzel', serif;
  font-size: 0.88rem;
  padding: 60px 0;
  text-align: center;
}

/* Grid */
.dash-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-bottom: 36px;
}

.stat-card {
  background: rgba(255,255,255,0.025);
  border: 1px solid rgba(201,168,76,0.12);
  border-radius: 8px;
  padding: 20px 18px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: border-color 0.15s;
}
.stat-card:hover { border-color: rgba(201,168,76,0.25); }

.stat-card.card--ok    { border-color: rgba(111,207,151,0.25); }
.stat-card.card--danger { border-color: rgba(248,113,113,0.25); }
.stat-card.card--warn  { border-color: rgba(251,191,36,0.25); }
.stat-card.card--alert { border-color: rgba(248,113,113,0.35); background: rgba(248,113,113,0.04); }

.stat-icon { font-size: 1.1rem; margin-bottom: 4px; }

.stat-value {
  font-family: 'Cinzel', serif;
  font-size: 2rem;
  color: #e8d4a0;
  line-height: 1;
  font-weight: 600;
}
.stat-value--sm   { font-size: 1.3rem; }
.stat-value--mono { font-family: 'Courier New', monospace; font-size: 1.8rem; color: #c9a84c; }
.val--alert { color: #f87171; }
.val--warn  { color: #fbbf24; }

.stat-label {
  font-family: sans-serif;
  font-size: 0.72rem;
  color: #5a4a30;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-top: 2px;
}

.stat-sub {
  font-family: sans-serif;
  font-size: 0.72rem;
  color: #5a4a30;
  margin-top: 2px;
}
.stat-sub--warn { color: #fbbf24; }

.stat-card--countdown { grid-column: span 1; }

/* Acciones */
.dash-actions-section {
  border-top: 1px solid rgba(201,168,76,0.1);
  padding-top: 28px;
}

.section-title {
  font-family: 'Cinzel', serif;
  font-size: 0.78rem;
  color: #5a4a30;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 16px;
}

.dash-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.act-btn {
  padding: 10px 20px;
  border-radius: 6px;
  border: 1px solid rgba(201,168,76,0.3);
  background: rgba(201,168,76,0.08);
  color: #c9a84c;
  font-family: 'Cinzel', serif;
  font-size: 0.78rem;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: background 0.12s;
}
.act-btn:hover:not(:disabled) { background: rgba(201,168,76,0.16); }
.act-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.act-btn--primary {
  background: rgba(201,168,76,0.15);
  border-color: rgba(201,168,76,0.5);
}
.act-btn--muted {
  border-color: rgba(201,168,76,0.15);
  color: #7a6a40;
}

.action-msg {
  margin-top: 14px;
  font-family: sans-serif;
  font-size: 0.82rem;
}
.msg--ok  { color: #6fcf97; }
.msg--err { color: #f87171; }
</style>
