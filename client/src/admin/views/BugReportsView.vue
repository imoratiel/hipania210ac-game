<template>
  <div class="br">
    <div class="br-header">
      <div>
        <h1 class="br-title">Reportes de error</h1>
        <p class="br-sub">{{ total }} reportes con los filtros actuales</p>
      </div>
      <button class="br-refresh" @click="load">↻ Actualizar</button>
    </div>

    <!-- Filtros -->
    <div class="br-filters">
      <span class="filter-label">Estado:</span>
      <button
        v-for="s in STATUSES" :key="s.value"
        class="filter-btn" :class="[s.cls, { active: activeStatuses.includes(s.value) }]"
        @click="toggleStatus(s.value)"
      >
        {{ s.icon }} {{ s.value }}
      </button>
    </div>

    <!-- Vista detalle -->
    <div v-if="selected" class="br-detail">
      <button class="back-btn" @click="selected = null">← Volver a la lista</button>

      <div class="detail-meta">
        <span class="meta-date">{{ fmtDate(selected.created_at) }}</span>
        <span class="meta-player">{{ selected.display_name || selected.username || 'Anónimo' }}</span>
        <span class="status-badge" :class="statusCls(selected.status)">{{ selected.status }}</span>
      </div>

      <div class="detail-message">{{ selected.message || '(sin mensaje)' }}</div>

      <img
        v-if="selected.image_path"
        :src="`/uploads${selected.image_path}`"
        class="detail-img"
        alt="Captura del error"
      />

      <div class="detail-actions">
        <span class="filter-label">Cambiar estado:</span>
        <button
          v-for="s in STATUSES" :key="s.value"
          class="filter-btn" :class="[s.cls, { active: selected.status === s.value }]"
          :disabled="saving"
          @click="setStatus(selected, s.value)"
        >
          {{ s.icon }} {{ s.value }}
        </button>
      </div>
    </div>

    <!-- Tabla -->
    <template v-else>
      <div v-if="loading" class="br-loading">Cargando…</div>
      <div v-else-if="reports.length === 0" class="br-empty">No hay reportes con estos filtros.</div>

      <table v-else class="br-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Jugador</th>
            <th>Mensaje</th>
            <th>Img</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in reports" :key="r.id" class="br-row" @click="selected = r">
            <td class="td-date">{{ fmtDate(r.created_at) }}</td>
            <td class="td-player">{{ r.display_name || r.username || '—' }}</td>
            <td class="td-msg">{{ r.message ? r.message.slice(0, 80) + (r.message.length > 80 ? '…' : '') : '(sin texto)' }}</td>
            <td class="td-img">
              <span v-if="r.image_path" title="Tiene imagen">📎</span>
            </td>
            <td><span class="status-badge" :class="statusCls(r.status)">{{ r.status }}</span></td>
          </tr>
        </tbody>
      </table>

      <div v-if="totalPages > 1" class="br-pagination">
        <button :disabled="page === 1" @click="changePage(page - 1)">‹</button>
        <span>{{ page }} / {{ totalPages }}</span>
        <button :disabled="page === totalPages" @click="changePage(page + 1)">›</button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const STATUSES = [
  { value: 'Nuevo',                icon: '🆕', cls: 'st-nuevo' },
  { value: 'Pendiente de arreglo', icon: '🔧', cls: 'st-pendiente' },
  { value: 'Corregido',            icon: '✅', cls: 'st-corregido' },
  { value: 'Descartado',           icon: '🗑️', cls: 'st-descartado' },
]

const activeStatuses = ref(['Nuevo', 'Pendiente de arreglo', 'Corregido'])
const reports  = ref([])
const total    = ref(0)
const page     = ref(1)
const loading  = ref(false)
const saving   = ref(false)
const selected = ref(null)

const PER_PAGE   = 20
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / PER_PAGE)))

async function load() {
  loading.value = true
  try {
    const { data } = await axios.get('/api/admin/bug-reports', {
      params: { status: activeStatuses.value.join(','), page: page.value },
      withCredentials: true,
    })
    if (data.success) {
      reports.value = data.reports
      total.value   = data.total
    }
  } finally {
    loading.value = false
  }
}

function toggleStatus(s) {
  const idx = activeStatuses.value.indexOf(s)
  if (idx >= 0) {
    if (activeStatuses.value.length > 1) activeStatuses.value.splice(idx, 1)
  } else {
    activeStatuses.value.push(s)
  }
  page.value = 1
  load()
}

function changePage(p) { page.value = p; load() }

async function setStatus(report, status) {
  if (report.status === status) return
  saving.value = true
  try {
    const { data } = await axios.patch(
      `/api/admin/bug-reports/${report.id}/status`,
      { status },
      { withCredentials: true }
    )
    if (data.success) {
      report.status = status
      const inList = reports.value.find(r => r.id === report.id)
      if (inList) inList.status = status
    }
  } finally {
    saving.value = false
  }
}

function fmtDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })
    + ' ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

function statusCls(s) { return STATUSES.find(x => x.value === s)?.cls ?? '' }

onMounted(load)
</script>

<style scoped>
.br { padding: 32px 36px; }

.br-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
}
.br-title {
  font-family: 'Cinzel', serif;
  font-size: 1.5rem;
  color: #c9a84c;
  letter-spacing: 1px;
  font-weight: 400;
}
.br-sub { font-size: 0.78rem; color: #4a3a20; font-family: sans-serif; margin-top: 4px; }

.br-refresh {
  background: rgba(201,168,76,0.08);
  border: 1px solid rgba(201,168,76,0.2);
  color: #7a6a40;
  border-radius: 5px;
  padding: 7px 16px;
  font-family: 'Cinzel', serif;
  font-size: 0.72rem;
  cursor: pointer;
}
.br-refresh:hover { color: #c9a84c; }

/* Filtros */
.br-filters {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 24px;
  padding: 12px 16px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(201,168,76,0.1);
  border-radius: 6px;
}

.filter-label {
  font-family: sans-serif;
  font-size: 0.7rem;
  color: #5a4a30;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-right: 4px;
}

.filter-btn {
  padding: 4px 12px;
  border-radius: 20px;
  border: 1px solid;
  font-size: 0.75rem;
  font-family: sans-serif;
  cursor: pointer;
  opacity: 0.45;
  transition: opacity 0.15s;
  background: transparent;
}
.filter-btn.active { opacity: 1; }
.filter-btn:disabled { cursor: not-allowed; }

.st-nuevo      { color: #60a5fa; border-color: #60a5fa44; }
.st-pendiente  { color: #fbbf24; border-color: #fbbf2444; }
.st-corregido  { color: #6fcf97; border-color: #6fcf9744; }
.st-descartado { color: #9ca3af; border-color: #9ca3af44; }
.st-nuevo.active      { background: rgba(96,165,250,0.1); }
.st-pendiente.active  { background: rgba(251,191,36,0.1); }
.st-corregido.active  { background: rgba(111,207,151,0.1); }
.st-descartado.active { background: rgba(156,163,175,0.08); }

/* Table */
.br-loading, .br-empty {
  color: #4a3a20;
  font-family: 'Cinzel', serif;
  font-size: 0.88rem;
  padding: 60px 0;
  text-align: center;
}

.br-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }

.br-table thead th {
  background: rgba(255,255,255,0.03);
  color: #5a4a30;
  font-family: 'Cinzel', serif;
  font-size: 0.65rem;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  padding: 10px 14px;
  text-align: left;
  border-bottom: 1px solid rgba(201,168,76,0.12);
  position: sticky;
  top: 0;
}

.br-row {
  cursor: pointer;
  border-bottom: 1px solid rgba(201,168,76,0.06);
  transition: background 0.1s;
}
.br-row:hover { background: rgba(201,168,76,0.05); }
.br-table td { padding: 10px 14px; vertical-align: middle; }

.td-date   { color: #5a4a30; font-family: sans-serif; font-size: 0.75rem; white-space: nowrap; }
.td-player { color: #c9a84c; font-family: 'EB Garamond', serif; white-space: nowrap; }
.td-msg    { color: #a09070; font-family: 'EB Garamond', serif; }
.td-img    { text-align: center; }

.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 0.68rem;
  font-family: sans-serif;
  border: 1px solid;
  white-space: nowrap;
}

/* Pagination */
.br-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 16px;
  margin-top: 8px;
}
.br-pagination button {
  background: rgba(201,168,76,0.08);
  border: 1px solid rgba(201,168,76,0.2);
  color: #c9a84c;
  border-radius: 4px;
  padding: 4px 14px;
  font-size: 1rem;
  cursor: pointer;
}
.br-pagination button:disabled { opacity: 0.3; cursor: not-allowed; }
.br-pagination span { font-family: sans-serif; font-size: 0.8rem; color: #5a4a30; }

/* Detail */
.br-detail {
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 800px;
}

.back-btn {
  background: none;
  border: none;
  color: #c9a84c;
  font-family: 'Cinzel', serif;
  font-size: 0.78rem;
  cursor: pointer;
  padding: 0;
  align-self: flex-start;
  letter-spacing: 0.5px;
}
.back-btn:hover { text-decoration: underline; }

.detail-meta {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}
.meta-date   { color: #5a4a30; font-family: sans-serif; font-size: 0.78rem; }
.meta-player { color: #c9a84c; font-family: 'Cinzel', serif; font-size: 0.85rem; }

.detail-message {
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(201,168,76,0.12);
  border-radius: 5px;
  padding: 16px;
  font-family: 'EB Garamond', serif;
  font-size: 0.95rem;
  color: #c8b87a;
  line-height: 1.7;
  white-space: pre-wrap;
}

.detail-img {
  max-width: 100%;
  max-height: 500px;
  border-radius: 5px;
  border: 1px solid rgba(201,168,76,0.2);
  object-fit: contain;
  align-self: flex-start;
}

.detail-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding-top: 10px;
  border-top: 1px solid rgba(201,168,76,0.1);
}
</style>
