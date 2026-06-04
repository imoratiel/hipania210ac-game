<template>
  <div class="bv">
    <div class="bv-header">
      <div>
        <h1 class="bv-title">Bots / IA</h1>
        <p class="bv-sub">{{ agents.length }} agentes activos</p>
      </div>
      <button class="bv-refresh" @click="loadAll">↻ Actualizar</button>
    </div>

    <div class="bv-layout">

      <!-- Lista de bots -->
      <section class="bv-section">
        <h2 class="sec-title">Agentes activos</h2>
        <div v-if="loadingAgents" class="bv-loading">Cargando…</div>
        <div v-else-if="agents.length === 0" class="bv-empty">No hay agentes IA activos.</div>
        <table v-else class="bv-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Perfil</th>
              <th>Oro</th>
              <th>Territorios</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="a in agents" :key="a.player_id" class="bv-row">
              <td class="td-name">
                <span class="color-dot" :style="{ background: a.color || '#888' }"></span>
                {{ a.display_name }}
              </td>
              <td><span class="profile-badge" :class="profileCls(a.ai_profile)">{{ a.ai_profile || '—' }}</span></td>
              <td class="td-gold">{{ fmt(a.gold) }}</td>
              <td class="td-terr">{{ a.territory_count }}</td>
              <td>
                <button class="del-btn" @click="deleteBot(a)" :disabled="acting" title="Eliminar bot">✕</button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- Spawn -->
      <section class="bv-section">
        <h2 class="sec-title">Crear nuevo bot</h2>
        <div class="spawn-form">
          <div class="field-group">
            <label class="field-label">Tipo de IA</label>
            <div class="type-selector">
              <button
                v-for="t in BOT_TYPES" :key="t.id"
                class="type-btn"
                :class="{ active: spawnType === t.id }"
                @click="spawnType = t.id"
              >
                {{ t.icon }} {{ t.label }}
              </button>
            </div>
            <p class="type-desc">{{ currentTypeDesc }}</p>
          </div>
          <div class="field-group" v-if="spawnType !== 'dummy'">
            <label class="field-label">Cantidad (1–10)</label>
            <input v-model.number="spawnCount" type="number" min="1" max="10" class="bv-input" style="width:80px" />
          </div>
        </div>
        <button class="spawn-btn" @click="spawnBot" :disabled="acting">
          {{ acting ? 'Creando…' : `⚡ Crear ${spawnType !== 'dummy' && spawnCount > 1 ? spawnCount + ' bots' : 'bot'}` }}
        </button>
        <p v-if="spawnMsg" class="action-msg" :class="spawnMsgCls">{{ spawnMsg }}</p>
      </section>

      <!-- Config IA -->
      <section class="bv-section" v-if="settings">
        <h2 class="sec-title">Configuración de IA</h2>
        <div class="config-grid">
          <div class="config-row">
            <span class="config-label">IA activada</span>
            <button
              class="toggle-btn"
              :class="settings.ai_enabled === 'true' || settings.ai_enabled === true ? 'toggle--on' : 'toggle--off'"
              @click="toggleAI"
              :disabled="acting"
            >
              {{ (settings.ai_enabled === 'true' || settings.ai_enabled === true) ? '● ON' : '○ OFF' }}
            </button>
          </div>
          <div class="config-row">
            <span class="config-label">Proveedor</span>
            <select v-model="selectedProvider" class="bv-select" @change="saveProvider">
              <option value="procedural">procedural</option>
              <option value="gemini">gemini</option>
              <option value="openai">openai</option>
            </select>
          </div>
          <div class="config-row">
            <span class="config-label">Budget máx. tokens</span>
            <div style="display:flex;gap:8px;align-items:center">
              <input v-model.number="tokenBudget" type="number" min="1000" step="1000" class="bv-input" style="width:110px" />
              <button class="save-sm-btn" @click="saveBudget" :disabled="acting">Guardar</button>
            </div>
          </div>
        </div>
        <div v-if="settings.lastError" class="last-error">
          ⚠ Último error IA: <span>{{ settings.lastError }}</span>
        </div>
        <div class="test-row">
          <button class="test-btn" @click="testConnection" :disabled="acting">🔌 Probar conexión</button>
          <button class="test-btn test-btn--force" @click="forceAITurn" :disabled="acting">⚡ Forzar turno IA</button>
        </div>
        <p v-if="configMsg" class="action-msg" :class="configMsgCls">{{ configMsg }}</p>
      </section>

      <!-- Uso de tokens -->
      <section class="bv-section" v-if="usageStats">
        <h2 class="sec-title">
          Uso de tokens
          <button class="reset-usage-btn" @click="resetUsage" :disabled="acting" title="Reiniciar contadores">↺ Reiniciar</button>
        </h2>
        <div class="usage-summary">
          <div class="usage-stat">
            <span class="usage-val">{{ fmt(usageStats.total_tokens || 0) }}</span>
            <span class="usage-label">Tokens totales</span>
          </div>
          <div class="usage-stat">
            <span class="usage-val">{{ usageStats.total_calls || 0 }}</span>
            <span class="usage-label">Llamadas</span>
          </div>
          <div class="usage-stat">
            <span class="usage-val">${{ (usageStats.total_cost_usd || 0).toFixed(4) }}</span>
            <span class="usage-label">Coste est.</span>
          </div>
        </div>
        <table v-if="usageStats.by_bot?.length" class="bv-table bv-table--sm">
          <thead><tr><th>Bot</th><th>Tokens</th><th>Llamadas</th><th>Coste</th></tr></thead>
          <tbody>
            <tr v-for="b in usageStats.by_bot" :key="b.player_id">
              <td class="td-name">{{ b.display_name || b.player_id }}</td>
              <td>{{ fmt(b.tokens) }}</td>
              <td>{{ b.calls }}</td>
              <td>${{ (b.cost_usd || 0).toFixed(4) }}</td>
            </tr>
          </tbody>
        </table>
      </section>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const BOT_TYPES = [
  { id: 'farmer',       icon: '🌾', label: 'Farmer',       desc: 'Prioriza la producción agrícola y el crecimiento económico estable.' },
  { id: 'balanced',     icon: '⚖️', label: 'Balanced',     desc: 'Equilibra expansión, economía y milicia. IA de uso general.' },
  { id: 'expansionist', icon: '⚔️', label: 'Expansionist', desc: 'Agresivo. Prioriza conquista y expansión territorial.' },
  { id: 'dummy',        icon: '🎯', label: 'Dummy',        desc: 'Bot de prueba básico. Spawn adyacente al admin.' },
]

const agents        = ref([])
const settings      = ref(null)
const usageStats    = ref(null)
const loadingAgents = ref(false)
const acting        = ref(false)
const spawnType     = ref('farmer')
const spawnCount    = ref(1)
const selectedProvider = ref('procedural')
const tokenBudget   = ref(10000)

const spawnMsg     = ref(''); const spawnMsgCls  = ref('')
const configMsg    = ref(''); const configMsgCls = ref('')

const currentTypeDesc = computed(() => BOT_TYPES.find(t => t.id === spawnType.value)?.desc ?? '')

async function loadAll() {
  loadingAgents.value = true
  const [agentsRes, settingsRes, usageRes] = await Promise.allSettled([
    axios.get('/api/admin/ai/agents',     { withCredentials: true }),
    axios.get('/api/admin/ai/settings',   { withCredentials: true }),
    axios.get('/api/admin/ai/usage-stats',{ withCredentials: true }),
  ])
  loadingAgents.value = false

  if (agentsRes.status === 'fulfilled' && agentsRes.value.data.success)
    agents.value = agentsRes.value.data.agents

  if (settingsRes.status === 'fulfilled' && settingsRes.value.data.success) {
    settings.value = settingsRes.value.data
    selectedProvider.value = settingsRes.value.data.settings?.ai_provider || 'procedural'
    tokenBudget.value = parseInt(settingsRes.value.data.settings?.max_token_budget) || 10000
  }

  if (usageRes.status === 'fulfilled' && usageRes.value.data.success)
    usageStats.value = usageRes.value.data
}

async function spawnBot() {
  acting.value = true; spawnMsg.value = ''
  try {
    const { data } = await axios.post('/api/admin/ai/spawn', {
      type: spawnType.value,
      count: spawnCount.value,
    }, { withCredentials: true })
    spawnMsg.value   = data.success ? `✅ ${data.message || 'Bot creado correctamente.'}` : `❌ ${data.message}`
    spawnMsgCls.value = data.success ? 'msg--ok' : 'msg--err'
    if (data.success) loadAll()
  } catch { spawnMsg.value = '❌ Error al crear bot.'; spawnMsgCls.value = 'msg--err' }
  finally { acting.value = false; setTimeout(() => spawnMsg.value = '', 5000) }
}

async function deleteBot(a) {
  if (!confirm(`¿Eliminar el bot "${a.display_name}"?`)) return
  acting.value = true
  try {
    const { data } = await axios.delete(`/api/admin/bots/${a.player_id}`, { withCredentials: true })
    if (data.success) loadAll()
  } finally { acting.value = false }
}

async function toggleAI() {
  if (!settings.value) return
  const current = settings.value.settings?.ai_enabled === 'true' || settings.value.settings?.ai_enabled === true
  await saveSetting('ai_enabled', String(!current))
  await loadAll()
}

async function saveProvider() {
  await saveSetting('ai_provider', selectedProvider.value)
}

async function saveBudget() {
  await saveSetting('max_token_budget', String(tokenBudget.value))
}

async function saveSetting(key, value) {
  acting.value = true; configMsg.value = ''
  try {
    const { data } = await axios.post('/api/admin/ai/settings', { key, value }, { withCredentials: true })
    configMsg.value   = data.success ? `✅ ${key} actualizado.` : `❌ ${data.message}`
    configMsgCls.value = data.success ? 'msg--ok' : 'msg--err'
    if (data.success) await loadAll()
  } catch { configMsg.value = '❌ Error.'; configMsgCls.value = 'msg--err' }
  finally { acting.value = false; setTimeout(() => configMsg.value = '', 4000) }
}

async function testConnection() {
  acting.value = true; configMsg.value = ''
  try {
    const { data } = await axios.post('/api/admin/ai/test', {}, { withCredentials: true })
    configMsg.value   = data.success ? `✅ Conexión OK (${data.provider})` : `❌ ${data.message}`
    configMsgCls.value = data.success ? 'msg--ok' : 'msg--err'
  } finally { acting.value = false; setTimeout(() => configMsg.value = '', 6000) }
}

async function forceAITurn() {
  acting.value = true; configMsg.value = ''
  try {
    const { data } = await axios.post('/api/admin/ai/force-turn', {}, { withCredentials: true })
    configMsg.value   = data.success ? `✅ ${data.message}` : `❌ ${data.message}`
    configMsgCls.value = data.success ? 'msg--ok' : 'msg--err'
  } finally { acting.value = false; setTimeout(() => configMsg.value = '', 5000) }
}

async function resetUsage() {
  if (!confirm('¿Reiniciar todos los contadores de tokens?')) return
  acting.value = true
  try {
    await axios.delete('/api/admin/ai/usage-stats', { withCredentials: true })
    await loadAll()
  } finally { acting.value = false }
}

function fmt(n) { return Number(n).toLocaleString('es-ES') }

function profileCls(p) {
  return { farmer: 'pr-farmer', balanced: 'pr-balanced', expansionist: 'pr-exp', dummy: 'pr-dummy' }[p] ?? ''
}

onMounted(loadAll)
</script>

<style scoped>
.bv { padding: 32px 36px; }

.bv-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 32px; }
.bv-title { font-family: 'Cinzel', serif; font-size: 1.5rem; color: #c9a84c; letter-spacing: 1px; font-weight: 400; }
.bv-sub   { font-size: 0.78rem; color: #4a3a20; font-family: sans-serif; margin-top: 4px; }
.bv-refresh { background: rgba(201,168,76,0.08); border: 1px solid rgba(201,168,76,0.2); color: #7a6a40; border-radius: 5px; padding: 7px 16px; font-family: 'Cinzel', serif; font-size: 0.72rem; cursor: pointer; }
.bv-refresh:hover { color: #c9a84c; }

.bv-layout { display: flex; flex-direction: column; gap: 24px; max-width: 900px; }

.bv-section { background: rgba(255,255,255,0.025); border: 1px solid rgba(201,168,76,0.12); border-radius: 8px; padding: 22px 26px; }

.sec-title { font-family: 'Cinzel', serif; font-size: 0.78rem; color: #c9a84c; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 16px; display: flex; align-items: center; gap: 12px; }

.bv-loading, .bv-empty { color: #4a3a20; font-family: 'Cinzel', serif; font-size: 0.85rem; text-align: center; padding: 24px 0; }

/* Table */
.bv-table { width: 100%; border-collapse: collapse; font-size: 0.84rem; }
.bv-table--sm { font-size: 0.78rem; margin-top: 12px; }
.bv-table thead th { background: rgba(0,0,0,0.2); color: #5a4a30; font-family: 'Cinzel', serif; font-size: 0.65rem; letter-spacing: 1.5px; text-transform: uppercase; padding: 8px 12px; text-align: left; border-bottom: 1px solid rgba(201,168,76,0.1); }
.bv-row { border-bottom: 1px solid rgba(201,168,76,0.06); }
.bv-row:hover { background: rgba(201,168,76,0.04); }
.bv-table td { padding: 9px 12px; vertical-align: middle; }
.td-name { color: #c8b87a; font-family: 'EB Garamond', serif; display: flex; align-items: center; gap: 8px; }
.td-gold { color: #c9a84c; font-family: sans-serif; font-size: 0.8rem; }
.td-terr { color: #7a6a40; font-family: sans-serif; }
.color-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }

.profile-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-family: sans-serif; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.5px; }
.pr-farmer  { color: #6fcf97; background: rgba(111,207,151,0.1); border: 1px solid rgba(111,207,151,0.3); }
.pr-balanced { color: #60a5fa; background: rgba(96,165,250,0.1); border: 1px solid rgba(96,165,250,0.3); }
.pr-exp     { color: #f87171; background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.3); }
.pr-dummy   { color: #9ca3af; background: rgba(156,163,175,0.08); border: 1px solid rgba(156,163,175,0.2); }

.del-btn { background: none; border: 1px solid rgba(248,113,113,0.2); color: #f87171; border-radius: 4px; padding: 3px 8px; font-size: 0.72rem; cursor: pointer; opacity: 0.6; transition: opacity 0.12s; }
.del-btn:hover { opacity: 1; }
.del-btn:disabled { cursor: not-allowed; opacity: 0.2; }

/* Spawn */
.spawn-form { display: flex; flex-direction: column; gap: 16px; margin-bottom: 16px; }
.field-group { display: flex; flex-direction: column; gap: 6px; }
.field-label { font-family: sans-serif; font-size: 0.68rem; color: #5a4a30; text-transform: uppercase; letter-spacing: 1px; }
.type-selector { display: flex; gap: 6px; flex-wrap: wrap; }
.type-btn { padding: 6px 14px; border-radius: 5px; border: 1px solid rgba(201,168,76,0.15); background: transparent; color: #7a6a40; font-family: 'EB Garamond', serif; font-size: 0.88rem; cursor: pointer; transition: all 0.12s; }
.type-btn:hover { border-color: rgba(201,168,76,0.35); color: #a09070; }
.type-btn.active { border-color: rgba(201,168,76,0.5); background: rgba(201,168,76,0.1); color: #c9a84c; }
.type-desc { font-family: sans-serif; font-size: 0.75rem; color: #4a3a20; line-height: 1.5; }

.bv-input { background: rgba(0,0,0,0.3); border: 1px solid rgba(201,168,76,0.2); border-radius: 4px; color: #e8d4a0; font-family: 'Cinzel', serif; font-size: 1rem; padding: 7px 10px; }
.bv-input:focus { outline: none; border-color: rgba(201,168,76,0.5); }

.spawn-btn { padding: 9px 22px; border-radius: 5px; border: 1px solid rgba(201,168,76,0.4); background: rgba(201,168,76,0.1); color: #c9a84c; font-family: 'Cinzel', serif; font-size: 0.78rem; letter-spacing: 0.5px; cursor: pointer; }
.spawn-btn:hover:not(:disabled) { background: rgba(201,168,76,0.2); }
.spawn-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* Config */
.config-grid { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; }
.config-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(201,168,76,0.07); }
.config-label { font-family: sans-serif; font-size: 0.8rem; color: #7a6a40; }
.toggle-btn { padding: 5px 14px; border-radius: 20px; border: 1px solid; font-family: 'Cinzel', serif; font-size: 0.72rem; cursor: pointer; transition: all 0.15s; }
.toggle--on  { color: #6fcf97; border-color: rgba(111,207,151,0.4); background: rgba(111,207,151,0.1); }
.toggle--off { color: #9ca3af; border-color: rgba(156,163,175,0.3); background: transparent; }
.bv-select { background: rgba(0,0,0,0.3); border: 1px solid rgba(201,168,76,0.2); border-radius: 4px; color: #e8d4a0; font-family: sans-serif; font-size: 0.82rem; padding: 5px 10px; }
.save-sm-btn { padding: 5px 12px; border-radius: 4px; border: 1px solid rgba(201,168,76,0.3); background: rgba(201,168,76,0.08); color: #c9a84c; font-family: 'Cinzel', serif; font-size: 0.68rem; cursor: pointer; }
.save-sm-btn:hover { background: rgba(201,168,76,0.16); }
.last-error { font-family: sans-serif; font-size: 0.75rem; color: #f87171; background: rgba(248,113,113,0.06); border: 1px solid rgba(248,113,113,0.15); border-radius: 4px; padding: 8px 12px; margin-bottom: 14px; }
.last-error span { color: #fca5a5; }
.test-row { display: flex; gap: 10px; flex-wrap: wrap; }
.test-btn { padding: 8px 16px; border-radius: 5px; border: 1px solid rgba(201,168,76,0.2); background: transparent; color: #7a6a40; font-family: 'Cinzel', serif; font-size: 0.72rem; cursor: pointer; }
.test-btn:hover:not(:disabled) { color: #c9a84c; border-color: rgba(201,168,76,0.4); }
.test-btn--force { color: #c9a84c; border-color: rgba(201,168,76,0.35); }
.test-btn:disabled { opacity: 0.3; cursor: not-allowed; }

/* Usage */
.usage-summary { display: flex; gap: 24px; margin-bottom: 12px; }
.usage-stat { display: flex; flex-direction: column; gap: 2px; }
.usage-val { font-family: 'Cinzel', serif; font-size: 1.3rem; color: #e8d4a0; }
.usage-label { font-family: sans-serif; font-size: 0.68rem; color: #4a3a20; text-transform: uppercase; letter-spacing: 1px; }
.reset-usage-btn { margin-left: auto; background: none; border: 1px solid rgba(201,168,76,0.15); color: #5a4a30; border-radius: 4px; padding: 3px 10px; font-family: sans-serif; font-size: 0.72rem; cursor: pointer; }
.reset-usage-btn:hover { color: #c9a84c; }

.action-msg { margin-top: 12px; font-family: sans-serif; font-size: 0.82rem; }
.msg--ok  { color: #6fcf97; }
.msg--err { color: #f87171; }
</style>
