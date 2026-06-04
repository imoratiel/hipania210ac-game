<template>
  <div class="pv">
    <div class="pv-header">
      <div>
        <h1 class="pv-title">Jugadores</h1>
        <p class="pv-sub">{{ total }} jugadores registrados</p>
      </div>
      <div class="pv-controls">
        <input
          v-model="search"
          class="pv-search"
          placeholder="Buscar nombre o usuario…"
          @input="debouncedLoad"
        />
        <button class="pv-refresh" @click="load">↻</button>
      </div>
    </div>

    <!-- Tabla -->
    <div v-if="loading" class="pv-loading">Cargando…</div>
    <div v-else-if="players.length === 0" class="pv-empty">No hay jugadores con ese filtro.</div>

    <table v-else class="pv-table">
      <thead>
        <tr>
          <th></th>
          <th>Nombre</th>
          <th>Cultura</th>
          <th>Oro</th>
          <th>Territorios</th>
          <th>Rol</th>
          <th>Estado</th>
          <th>Registro</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="p in players"
          :key="p.player_id"
          class="pv-row"
          :class="{ 'row--blocked': p.is_blocked }"
        >
          <td><span class="color-dot" :style="{ background: p.color || '#666' }"></span></td>
          <td class="td-name">
            <div>{{ p.display_name || p.username }}</div>
            <div class="td-username">@{{ p.username }}</div>
          </td>
          <td class="td-culture">{{ p.culture_name || '—' }}</td>
          <td class="td-gold">{{ fmt(p.gold) }}</td>
          <td class="td-terr">{{ p.territory_count }}</td>
          <td>
            <span class="role-badge" :class="p.role === 'admin' ? 'role--admin' : 'role--player'">
              {{ p.role }}
            </span>
          </td>
          <td>
            <span v-if="p.is_blocked" class="status-badge status--blocked">🚫 Bloqueado</span>
            <span v-else-if="!p.is_initialized" class="status-badge status--pending">⏳ Sin iniciar</span>
            <span v-else class="status-badge status--active">● Activo</span>
          </td>
          <td class="td-date">{{ fmtDate(p.created_at) }}</td>
          <td>
            <button class="details-btn" @click="openDetail(p)">Ver →</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Paginación -->
    <div v-if="totalPages > 1" class="pv-pagination">
      <button :disabled="page === 1" @click="changePage(page - 1)">‹</button>
      <span>{{ page }} / {{ totalPages }}</span>
      <button :disabled="page === totalPages" @click="changePage(page + 1)">›</button>
    </div>

    <!-- Panel de detalle -->
    <div v-if="selected" class="detail-overlay" @click.self="selected = null">
      <div class="detail-panel">

        <div class="detail-header">
          <div class="detail-player-info">
            <span class="detail-color" :style="{ background: selected.color || '#666' }"></span>
            <div>
              <div class="detail-name">{{ selected.display_name || selected.username }}</div>
              <div class="detail-meta">@{{ selected.username }} · {{ selected.culture_name || 'Sin cultura' }}</div>
            </div>
          </div>
          <button class="detail-close" @click="selected = null">✕</button>
        </div>

        <!-- Stats -->
        <div class="detail-stats">
          <div class="d-stat">
            <span class="d-val">{{ fmt(selected.gold) }}</span>
            <span class="d-label">Oro</span>
          </div>
          <div class="d-stat">
            <span class="d-val">{{ selected.territory_count }}</span>
            <span class="d-label">Territorios</span>
          </div>
          <div class="d-stat">
            <span class="d-val">
              <span class="role-badge" :class="selected.role === 'admin' ? 'role--admin' : 'role--player'">{{ selected.role }}</span>
            </span>
            <span class="d-label">Rol</span>
          </div>
          <div class="d-stat">
            <span class="d-val">
              <span v-if="selected.is_blocked" class="status-badge status--blocked">Bloqueado</span>
              <span v-else class="status-badge status--active">Activo</span>
            </span>
            <span class="d-label">Estado</span>
          </div>
        </div>

        <div v-if="selected.is_blocked && selected.blocked_reason" class="block-reason">
          <strong>Motivo del bloqueo:</strong> {{ selected.blocked_reason }}
        </div>

        <!-- Acciones -->
        <div class="detail-actions">

          <!-- Bloquear / desbloquear -->
          <div class="action-group">
            <h4 class="action-group-title">{{ selected.is_blocked ? 'Desbloquear' : 'Bloquear cuenta' }}</h4>
            <template v-if="!selected.is_blocked">
              <input
                v-model="blockReason"
                class="pv-input"
                placeholder="Motivo del bloqueo (opcional)"
              />
            </template>
            <button
              class="act-btn"
              :class="selected.is_blocked ? 'act-btn--green' : 'act-btn--red'"
              @click="toggleBlock"
              :disabled="acting"
            >
              {{ selected.is_blocked ? '✅ Desbloquear cuenta' : '🚫 Bloquear cuenta' }}
            </button>
          </div>

          <!-- Cambiar rol -->
          <div class="action-group">
            <h4 class="action-group-title">Cambiar rol</h4>
            <div class="role-btns">
              <button
                class="act-btn"
                :class="selected.role === 'player' ? 'act-btn--active' : 'act-btn--muted'"
                @click="changeRole('player')"
                :disabled="acting || selected.role === 'player'"
              >
                👤 Player
              </button>
              <button
                class="act-btn"
                :class="selected.role === 'admin' ? 'act-btn--active' : 'act-btn--muted'"
                @click="changeRole('admin')"
                :disabled="acting || selected.role === 'admin'"
              >
                👑 Admin
              </button>
            </div>
          </div>

          <!-- Enviar mensaje -->
          <div class="action-group">
            <h4 class="action-group-title">Enviar aviso</h4>
            <input v-model="msgSubject" class="pv-input" placeholder="Asunto" />
            <textarea v-model="msgBody" class="pv-textarea" placeholder="Mensaje…" rows="3"></textarea>
            <button class="act-btn act-btn--blue" @click="sendMessage" :disabled="acting || !msgSubject.trim() || !msgBody.trim()">
              💬 Enviar mensaje
            </button>
          </div>

          <!-- Eliminar -->
          <div class="action-group action-group--danger">
            <h4 class="action-group-title">Zona peligrosa</h4>
            <button class="act-btn act-btn--danger" @click="deletePlayer" :disabled="acting">
              🗑️ Eliminar cuenta
            </button>
          </div>
        </div>

        <p v-if="actionMsg" class="action-msg" :class="actionMsgCls">{{ actionMsg }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const players   = ref([])
const total     = ref(0)
const page      = ref(1)
const loading   = ref(false)
const acting    = ref(false)
const search    = ref('')
const selected  = ref(null)
const blockReason = ref('')
const msgSubject  = ref('')
const msgBody     = ref('')
const actionMsg   = ref('')
const actionMsgCls = ref('')

const PER_PAGE   = 30
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / PER_PAGE)))

let debounceTimer = null
function debouncedLoad() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { page.value = 1; load() }, 300)
}

async function load() {
  loading.value = true
  try {
    const { data } = await axios.get('/api/admin/players', {
      params: { search: search.value, page: page.value, per_page: PER_PAGE },
      withCredentials: true,
    })
    if (data.success) { players.value = data.players; total.value = data.total }
  } finally { loading.value = false }
}

function changePage(p) { page.value = p; load() }

function openDetail(p) {
  selected.value  = { ...p }
  blockReason.value = ''
  msgSubject.value  = ''
  msgBody.value     = ''
  actionMsg.value   = ''
}

async function toggleBlock() {
  const newBlock = !selected.value.is_blocked
  acting.value = true
  try {
    const { data } = await axios.patch(
      `/api/admin/players/${selected.value.player_id}/block`,
      { block: newBlock, reason: blockReason.value },
      { withCredentials: true }
    )
    if (data.success) {
      selected.value.is_blocked = newBlock
      selected.value.blocked_reason = newBlock ? blockReason.value : ''
      syncList(selected.value)
      showMsg(newBlock ? '✅ Cuenta bloqueada.' : '✅ Cuenta desbloqueada.', true)
      blockReason.value = ''
    } else showMsg(`❌ ${data.message}`, false)
  } catch { showMsg('❌ Error.', false) }
  finally { acting.value = false }
}

async function changeRole(role) {
  acting.value = true
  try {
    const { data } = await axios.patch(
      `/api/admin/players/${selected.value.player_id}/role`,
      { role },
      { withCredentials: true }
    )
    if (data.success) {
      selected.value.role = role
      syncList(selected.value)
      showMsg(`✅ Rol cambiado a "${role}".`, true)
    } else showMsg(`❌ ${data.message}`, false)
  } catch { showMsg('❌ Error.', false) }
  finally { acting.value = false }
}

async function sendMessage() {
  acting.value = true
  try {
    const { data } = await axios.post(
      `/api/admin/players/${selected.value.player_id}/message`,
      { subject: msgSubject.value, body: msgBody.value },
      { withCredentials: true }
    )
    if (data.success) {
      msgSubject.value = ''
      msgBody.value    = ''
      showMsg('✅ Mensaje enviado.', true)
    } else showMsg(`❌ ${data.message}`, false)
  } catch { showMsg('❌ Error al enviar.', false) }
  finally { acting.value = false }
}

async function deletePlayer() {
  if (!confirm(`¿Eliminar la cuenta de "${selected.value.display_name || selected.value.username}"? Esta acción no se puede deshacer.`)) return
  acting.value = true
  try {
    const { data } = await axios.delete(
      `/api/admin/players/${selected.value.player_id}`,
      { withCredentials: true }
    )
    if (data.success) {
      players.value = players.value.filter(p => p.player_id !== selected.value.player_id)
      total.value--
      selected.value = null
    } else showMsg(`❌ ${data.message}`, false)
  } catch { showMsg('❌ Error.', false) }
  finally { acting.value = false }
}

function syncList(updated) {
  const idx = players.value.findIndex(p => p.player_id === updated.player_id)
  if (idx >= 0) players.value[idx] = { ...players.value[idx], ...updated }
}

function showMsg(msg, ok) {
  actionMsg.value    = msg
  actionMsgCls.value = ok ? 'msg--ok' : 'msg--err'
  setTimeout(() => { actionMsg.value = '' }, 5000)
}

function fmt(n) { return Number(n).toLocaleString('es-ES') }

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

onMounted(load)
</script>

<style scoped>
.pv { padding: 32px 36px; }

.pv-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 28px; gap: 16px; }
.pv-title  { font-family: 'Cinzel', serif; font-size: 1.5rem; color: #c9a84c; letter-spacing: 1px; font-weight: 400; }
.pv-sub    { font-size: 0.78rem; color: #4a3a20; font-family: sans-serif; margin-top: 4px; }

.pv-controls { display: flex; gap: 8px; align-items: center; }
.pv-search {
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(201,168,76,0.2);
  border-radius: 5px;
  color: #e8d4a0;
  font-family: sans-serif;
  font-size: 0.82rem;
  padding: 7px 12px;
  width: 220px;
}
.pv-search:focus { outline: none; border-color: rgba(201,168,76,0.5); }
.pv-refresh {
  background: rgba(201,168,76,0.08); border: 1px solid rgba(201,168,76,0.2);
  color: #7a6a40; border-radius: 5px; padding: 7px 12px;
  font-size: 0.9rem; cursor: pointer;
}
.pv-refresh:hover { color: #c9a84c; }

/* Table */
.pv-loading, .pv-empty { color: #4a3a20; font-family: 'Cinzel', serif; font-size: 0.85rem; text-align: center; padding: 60px 0; }

.pv-table { width: 100%; border-collapse: collapse; font-size: 0.83rem; }
.pv-table thead th {
  background: rgba(255,255,255,0.025);
  color: #5a4a30; font-family: 'Cinzel', serif; font-size: 0.63rem;
  letter-spacing: 1.5px; text-transform: uppercase;
  padding: 9px 12px; text-align: left;
  border-bottom: 1px solid rgba(201,168,76,0.12);
  position: sticky; top: 0;
}
.pv-row { border-bottom: 1px solid rgba(201,168,76,0.06); transition: background 0.1s; }
.pv-row:hover { background: rgba(201,168,76,0.04); }
.row--blocked { opacity: 0.55; }
.pv-table td { padding: 9px 12px; vertical-align: middle; }

.color-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; }
.td-name { color: #c8b87a; font-family: 'EB Garamond', serif; }
.td-username { font-size: 0.72rem; color: #4a3a20; font-family: sans-serif; }
.td-culture { color: #7a6a40; font-family: sans-serif; font-size: 0.78rem; }
.td-gold  { color: #c9a84c; font-family: sans-serif; font-size: 0.8rem; }
.td-terr  { color: #7a6a40; font-family: sans-serif; }
.td-date  { color: #4a3a20; font-family: sans-serif; font-size: 0.72rem; white-space: nowrap; }

.role-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-family: sans-serif; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid; }
.role--admin  { color: #c9a84c; border-color: rgba(201,168,76,0.4); background: rgba(201,168,76,0.1); }
.role--player { color: #7a6a40; border-color: rgba(122,106,64,0.3); background: transparent; }

.status-badge { display: inline-block; padding: 2px 7px; border-radius: 4px; font-family: sans-serif; font-size: 0.65rem; border: 1px solid; }
.status--active  { color: #6fcf97; border-color: rgba(111,207,151,0.3); background: rgba(111,207,151,0.06); }
.status--blocked { color: #f87171; border-color: rgba(248,113,113,0.3); background: rgba(248,113,113,0.08); }
.status--pending { color: #fbbf24; border-color: rgba(251,191,36,0.3); background: rgba(251,191,36,0.06); }

.details-btn {
  padding: 3px 10px; border-radius: 4px; border: 1px solid rgba(201,168,76,0.2);
  background: transparent; color: #7a6a40; font-family: 'Cinzel', serif; font-size: 0.65rem;
  cursor: pointer; white-space: nowrap;
}
.details-btn:hover { color: #c9a84c; border-color: rgba(201,168,76,0.4); }

/* Pagination */
.pv-pagination { display: flex; align-items: center; justify-content: center; gap: 16px; padding: 16px; margin-top: 8px; }
.pv-pagination button { background: rgba(201,168,76,0.08); border: 1px solid rgba(201,168,76,0.2); color: #c9a84c; border-radius: 4px; padding: 4px 14px; font-size: 1rem; cursor: pointer; }
.pv-pagination button:disabled { opacity: 0.3; cursor: not-allowed; }
.pv-pagination span { font-family: sans-serif; font-size: 0.8rem; color: #5a4a30; }

/* Detail panel */
.detail-overlay {
  position: fixed; inset: 0; z-index: 9500;
  background: rgba(0,0,0,0.5);
  display: flex; justify-content: flex-end;
}
.detail-panel {
  width: 420px;
  height: 100vh;
  background: #13100a;
  border-left: 1px solid rgba(201,168,76,0.2);
  display: flex; flex-direction: column; gap: 0;
  overflow-y: auto;
  box-shadow: -20px 0 60px rgba(0,0,0,0.6);
}

.detail-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 22px; border-bottom: 1px solid rgba(201,168,76,0.12);
  background: #0e0c07; flex-shrink: 0;
}
.detail-player-info { display: flex; align-items: center; gap: 12px; }
.detail-color { display: inline-block; width: 14px; height: 14px; border-radius: 50%; flex-shrink: 0; }
.detail-name { font-family: 'Cinzel', serif; font-size: 0.95rem; color: #c9a84c; }
.detail-meta { font-family: sans-serif; font-size: 0.72rem; color: #5a4a30; margin-top: 2px; }
.detail-close { background: none; border: none; color: #5a4a30; font-size: 1rem; cursor: pointer; padding: 4px 8px; }
.detail-close:hover { color: #c9a84c; }

.detail-stats {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 1px; background: rgba(201,168,76,0.08);
  border-bottom: 1px solid rgba(201,168,76,0.1);
  flex-shrink: 0;
}
.d-stat { background: #13100a; padding: 14px 12px; display: flex; flex-direction: column; gap: 3px; align-items: center; }
.d-val   { font-family: 'Cinzel', serif; font-size: 1rem; color: #e8d4a0; }
.d-label { font-family: sans-serif; font-size: 0.65rem; color: #4a3a20; text-transform: uppercase; letter-spacing: 1px; }

.block-reason {
  margin: 12px 22px 0;
  background: rgba(248,113,113,0.06);
  border: 1px solid rgba(248,113,113,0.15);
  border-radius: 4px;
  padding: 8px 12px;
  font-family: sans-serif;
  font-size: 0.75rem;
  color: #fca5a5;
}

.detail-actions { display: flex; flex-direction: column; gap: 0; flex: 1; }

.action-group {
  padding: 18px 22px;
  border-bottom: 1px solid rgba(201,168,76,0.07);
  display: flex; flex-direction: column; gap: 8px;
}
.action-group--danger { border-top: 1px solid rgba(248,113,113,0.15); margin-top: auto; }

.action-group-title { font-family: 'Cinzel', serif; font-size: 0.68rem; color: #5a4a30; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px; }

.pv-input {
  background: rgba(0,0,0,0.3); border: 1px solid rgba(201,168,76,0.18);
  border-radius: 4px; color: #e8d4a0; font-family: sans-serif; font-size: 0.82rem;
  padding: 7px 10px; width: 100%;
}
.pv-input:focus { outline: none; border-color: rgba(201,168,76,0.4); }
.pv-textarea { @extend .pv-input; resize: vertical; min-height: 70px; }
.pv-textarea {
  background: rgba(0,0,0,0.3); border: 1px solid rgba(201,168,76,0.18);
  border-radius: 4px; color: #e8d4a0; font-family: sans-serif; font-size: 0.82rem;
  padding: 7px 10px; width: 100%; resize: vertical; min-height: 70px;
}

.role-btns { display: flex; gap: 8px; }

.act-btn {
  padding: 8px 16px; border-radius: 5px; border: 1px solid;
  font-family: 'Cinzel', serif; font-size: 0.72rem; letter-spacing: 0.5px;
  cursor: pointer; transition: background 0.12s; background: transparent;
  width: 100%; text-align: center;
}
.act-btn:disabled { opacity: 0.35; cursor: not-allowed; }

.act-btn--red    { color: #f87171; border-color: rgba(248,113,113,0.35); }
.act-btn--red:hover:not(:disabled)    { background: rgba(248,113,113,0.1); }
.act-btn--green  { color: #6fcf97; border-color: rgba(111,207,151,0.35); }
.act-btn--green:hover:not(:disabled)  { background: rgba(111,207,151,0.1); }
.act-btn--blue   { color: #60a5fa; border-color: rgba(96,165,250,0.35); }
.act-btn--blue:hover:not(:disabled)   { background: rgba(96,165,250,0.1); }
.act-btn--active { color: #c9a84c; border-color: rgba(201,168,76,0.5); background: rgba(201,168,76,0.1); }
.act-btn--muted  { color: #5a4a30; border-color: rgba(90,74,48,0.3); }
.act-btn--muted:hover:not(:disabled)  { color: #a09070; }
.act-btn--danger { color: #f87171; border-color: rgba(248,113,113,0.25); font-size: 0.72rem; }
.act-btn--danger:hover:not(:disabled) { background: rgba(248,113,113,0.08); }

.action-msg { padding: 12px 22px; font-family: sans-serif; font-size: 0.82rem; flex-shrink: 0; }
.msg--ok  { color: #6fcf97; }
.msg--err { color: #f87171; }
</style>
