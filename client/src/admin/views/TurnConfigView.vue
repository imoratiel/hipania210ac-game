<template>
  <div class="tc">
    <div class="tc-header">
      <h1 class="tc-title">Motor de turno</h1>
      <p class="tc-sub">Configuración del ritmo y estado del motor de juego</p>
    </div>

    <div v-if="loading" class="tc-loading">Cargando…</div>

    <template v-else-if="status">
      <div class="tc-layout">

        <!-- Estado del motor -->
        <section class="tc-section">
          <h2 class="sec-title">Estado actual</h2>
          <div class="status-grid">
            <div class="status-item">
              <span class="status-dot" :class="status.engine.isRunning ? 'dot--green' : 'dot--red'"></span>
              <div>
                <div class="status-val">{{ status.engine.isRunning ? 'Motor activo' : 'Motor detenido' }}</div>
                <div class="status-sub" v-if="status.engine.isRunning && status.engine.uptimeMs">{{ uptime(status.engine.uptimeMs) }}</div>
              </div>
            </div>
            <div class="status-item">
              <span class="status-dot" :class="status.game.isPaused ? 'dot--yellow' : 'dot--green'"></span>
              <div>
                <div class="status-val">{{ status.game.isPaused ? 'Partida pausada' : 'Partida activa' }}</div>
                <div class="status-sub">Turno {{ status.game.currentTurn }}</div>
              </div>
            </div>
            <div class="status-item">
              <span class="status-dot dot--blue"></span>
              <div>
                <div class="status-val">{{ status.config.turnDurationSeconds }}s por turno</div>
                <div class="status-sub">{{ Math.round(status.config.turnDurationSeconds / 60) }} min</div>
              </div>
            </div>
          </div>

          <div class="ctrl-row">
            <button class="ctrl-btn ctrl-btn--green"  v-if="!status.engine.isRunning" @click="startEngine"  :disabled="acting">▶ Iniciar motor</button>
            <button class="ctrl-btn ctrl-btn--red"    v-else                          @click="stopEngine"   :disabled="acting">⏹ Detener motor</button>
            <button class="ctrl-btn ctrl-btn--yellow" v-if="!status.game.isPaused"   @click="pauseGame"    :disabled="acting">⏸ Pausar partida</button>
            <button class="ctrl-btn ctrl-btn--green"  v-else                          @click="resumeGame"   :disabled="acting">▶ Reanudar partida</button>
          </div>
        </section>

        <!-- Duración del turno -->
        <section class="tc-section">
          <h2 class="sec-title">Duración del turno</h2>
          <p class="sec-desc">
            Los turnos se alinean automáticamente al reloj. Con 10 min: :00, :10, :20…
            Cambiar este valor reinicia el contador de época y recalcula el próximo turno.
          </p>

          <div class="input-row">
            <div class="input-group">
              <label class="input-label">Duración (minutos)</label>
              <input
                v-model.number="newDuration"
                type="number"
                min="1"
                max="60"
                step="1"
                class="tc-input"
                :disabled="saving"
              />
            </div>
            <div class="input-preview">
              <span class="preview-label">Turnos alineados en:</span>
              <span class="preview-val">{{ alignmentPreview }}</span>
            </div>
          </div>

          <button class="save-btn" @click="saveDuration" :disabled="saving || newDuration === currentDurationMin">
            {{ saving ? 'Guardando…' : '💾 Guardar duración' }}
          </button>

          <p v-if="saveMsg" class="save-msg" :class="saveMsgCls">{{ saveMsg }}</p>
        </section>

        <!-- Acciones manuales -->
        <section class="tc-section">
          <h2 class="sec-title">Acciones manuales</h2>
          <p class="sec-desc">Ejecuta procesos del motor sin esperar al turno automático.</p>

          <div class="action-grid">
            <button class="action-btn" @click="forceAction('force-turn')"    :disabled="acting">⚡ Forzar turno</button>
            <button class="action-btn" @click="forceAction('force-harvest')" :disabled="acting">🌾 Forzar cosecha</button>
          </div>

          <p v-if="actionMsg" class="save-msg" :class="actionMsgCls">{{ actionMsg }}</p>
        </section>

      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const status           = ref(null)
const loading          = ref(false)
const acting           = ref(false)
const saving           = ref(false)
const newDuration      = ref(10)
const saveMsg          = ref('')
const saveMsgCls       = ref('')
const actionMsg        = ref('')
const actionMsgCls     = ref('')

const currentDurationMin = computed(() =>
  status.value ? Math.round(status.value.config.turnDurationSeconds / 60) : 10
)

const alignmentPreview = computed(() => {
  const m = newDuration.value
  if (!m || m <= 0) return '—'
  const slots = []
  for (let i = 0; i < 60; i += m) slots.push(`:${String(i).padStart(2, '0')}`)
  return slots.slice(0, 6).join('  ') + (slots.length > 6 ? '  …' : '')
})

async function loadStatus() {
  loading.value = true
  try {
    const { data } = await axios.get('/api/admin/engine/status', { withCredentials: true })
    if (data.success) {
      status.value  = data
      newDuration.value = Math.round(data.config.turnDurationSeconds / 60)
    }
  } finally {
    loading.value = false
  }
}

async function startEngine()  { await engineCmd('start')  }
async function stopEngine()   { await engineCmd('stop')   }
async function pauseGame()    { await engineCmd('pause')  }
async function resumeGame()   { await engineCmd('resume') }

async function engineCmd(cmd) {
  acting.value = true
  try {
    const { data } = await axios.post(`/api/admin/engine/${cmd}`, {}, { withCredentials: true })
    if (data.success) loadStatus()
  } finally {
    acting.value = false
  }
}

async function saveDuration() {
  if (!newDuration.value || newDuration.value < 1) return
  saving.value = true
  saveMsg.value = ''
  try {
    const { data } = await axios.post('/api/admin/config', {
      turn_interval_seconds: newDuration.value * 60,
    }, { withCredentials: true })
    saveMsg.value   = data.success ? '✅ Duración actualizada. Se reinicia el ciclo de turno.' : `❌ ${data.message}`
    saveMsgCls.value = data.success ? 'msg--ok' : 'msg--err'
    if (data.success) loadStatus()
  } catch {
    saveMsg.value    = '❌ Error al guardar.'
    saveMsgCls.value = 'msg--err'
  } finally {
    saving.value = false
    setTimeout(() => { saveMsg.value = '' }, 5000)
  }
}

async function forceAction(endpoint) {
  acting.value = true
  actionMsg.value = ''
  try {
    const { data } = await axios.post(`/api/admin/engine/${endpoint}`, {}, { withCredentials: true })
    actionMsg.value   = data.success ? '✅ Acción ejecutada.' : `❌ ${data.message}`
    actionMsgCls.value = data.success ? 'msg--ok' : 'msg--err'
  } catch {
    actionMsg.value    = '❌ Error al ejecutar.'
    actionMsgCls.value = 'msg--err'
  } finally {
    acting.value = false
    setTimeout(() => { actionMsg.value = '' }, 5000)
  }
}

function uptime(ms) {
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}m activo` : `${m}m activo`
}

onMounted(loadStatus)
</script>

<style scoped>
.tc {
  padding: 32px 36px;
  max-width: 900px;
}

.tc-header { margin-bottom: 36px; }
.tc-title {
  font-family: 'Cinzel', serif;
  font-size: 1.5rem;
  color: #c9a84c;
  letter-spacing: 1px;
  font-weight: 400;
}
.tc-sub {
  font-size: 0.85rem;
  color: #4a3a20;
  margin-top: 6px;
  font-family: sans-serif;
}

.tc-loading {
  color: #4a3a20;
  font-family: 'Cinzel', serif;
  font-size: 0.88rem;
  padding: 60px 0;
  text-align: center;
}

.tc-layout { display: flex; flex-direction: column; gap: 28px; }

.tc-section {
  background: rgba(255,255,255,0.025);
  border: 1px solid rgba(201,168,76,0.12);
  border-radius: 8px;
  padding: 24px 28px;
}

.sec-title {
  font-family: 'Cinzel', serif;
  font-size: 0.82rem;
  color: #c9a84c;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  margin-bottom: 18px;
}

.sec-desc {
  font-size: 0.88rem;
  color: #5a4a30;
  line-height: 1.6;
  margin-bottom: 20px;
  font-family: sans-serif;
}

/* Status */
.status-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 22px;
}
.status-item {
  display: flex;
  align-items: center;
  gap: 12px;
}
.status-dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.dot--green  { background: #6fcf97; box-shadow: 0 0 6px rgba(111,207,151,0.6); }
.dot--red    { background: #f87171; box-shadow: 0 0 6px rgba(248,113,113,0.6); }
.dot--yellow { background: #fbbf24; box-shadow: 0 0 6px rgba(251,191,36,0.6); }
.dot--blue   { background: #60a5fa; box-shadow: 0 0 6px rgba(96,165,250,0.6); }

.status-val { font-family: 'EB Garamond', serif; font-size: 0.95rem; color: #c8b87a; }
.status-sub { font-family: sans-serif; font-size: 0.72rem; color: #5a4a30; margin-top: 1px; }

.ctrl-row { display: flex; gap: 10px; flex-wrap: wrap; }

.ctrl-btn {
  padding: 9px 18px;
  border-radius: 5px;
  border: 1px solid;
  font-family: 'Cinzel', serif;
  font-size: 0.75rem;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: opacity 0.12s;
  background: transparent;
}
.ctrl-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.ctrl-btn--green  { color: #6fcf97; border-color: rgba(111,207,151,0.3); }
.ctrl-btn--green:hover:not(:disabled)  { background: rgba(111,207,151,0.1); }
.ctrl-btn--red    { color: #f87171; border-color: rgba(248,113,113,0.3); }
.ctrl-btn--red:hover:not(:disabled)    { background: rgba(248,113,113,0.1); }
.ctrl-btn--yellow { color: #fbbf24; border-color: rgba(251,191,36,0.3); }
.ctrl-btn--yellow:hover:not(:disabled) { background: rgba(251,191,36,0.08); }

/* Input */
.input-row {
  display: flex;
  align-items: flex-end;
  gap: 24px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.input-group { display: flex; flex-direction: column; gap: 6px; }
.input-label {
  font-family: sans-serif;
  font-size: 0.7rem;
  color: #5a4a30;
  letter-spacing: 1px;
  text-transform: uppercase;
}
.tc-input {
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(201,168,76,0.25);
  border-radius: 5px;
  color: #e8d4a0;
  font-family: 'Cinzel', serif;
  font-size: 1.2rem;
  padding: 10px 14px;
  width: 120px;
  transition: border-color 0.15s;
}
.tc-input:focus { outline: none; border-color: rgba(201,168,76,0.6); }
.tc-input:disabled { opacity: 0.5; }

.input-preview {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-bottom: 10px;
}
.preview-label { font-family: sans-serif; font-size: 0.68rem; color: #4a3a20; text-transform: uppercase; letter-spacing: 1px; }
.preview-val   { font-family: monospace; font-size: 0.82rem; color: #7a6a40; }

.save-btn {
  padding: 10px 22px;
  border-radius: 5px;
  border: 1px solid rgba(201,168,76,0.4);
  background: rgba(201,168,76,0.1);
  color: #c9a84c;
  font-family: 'Cinzel', serif;
  font-size: 0.78rem;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: background 0.12s;
}
.save-btn:hover:not(:disabled) { background: rgba(201,168,76,0.2); }
.save-btn:disabled { opacity: 0.35; cursor: not-allowed; }

/* Actions */
.action-grid { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 0; }
.action-btn {
  padding: 10px 20px;
  border-radius: 5px;
  border: 1px solid rgba(201,168,76,0.2);
  background: rgba(201,168,76,0.06);
  color: #a09070;
  font-family: 'Cinzel', serif;
  font-size: 0.75rem;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
}
.action-btn:hover:not(:disabled) { background: rgba(201,168,76,0.14); color: #c9a84c; }
.action-btn:disabled { opacity: 0.35; cursor: not-allowed; }

.save-msg {
  margin-top: 14px;
  font-family: sans-serif;
  font-size: 0.82rem;
}
.msg--ok  { color: #6fcf97; }
.msg--err { color: #f87171; }
</style>
