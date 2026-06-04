<template>
  <div class="bra-overlay" @click.self="$emit('close')">
    <div class="bra-panel">

      <!-- Header -->
      <div class="bra-header">
        <span class="bra-title">🐛 Reportes de error</span>
        <div class="bra-header-right">
          <span class="bra-count">{{ total }} reportes</span>
          <button class="bra-close" @click="$emit('close')">✕</button>
        </div>
      </div>

      <!-- Filtros -->
      <div class="bra-filters">
        <div class="bra-filter-group">
          <span class="bra-filter-label">Estado:</span>
          <button
            v-for="s in STATUSES"
            :key="s.value"
            class="bra-filter-btn"
            :class="[s.cls, { active: activeStatuses.includes(s.value) }]"
            @click="toggleStatus(s.value)"
          >
            {{ s.icon }} {{ s.value }}
          </button>
        </div>
        <button class="bra-refresh-btn" @click="load" title="Actualizar">↻</button>
      </div>

      <!-- Lista -->
      <div class="bra-body" v-if="!selectedReport">
        <div v-if="loading" class="bra-loading">Cargando…</div>
        <div v-else-if="reports.length === 0" class="bra-empty">No hay reportes con estos filtros.</div>
        <table v-else class="bra-table">
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
            <tr
              v-for="r in reports"
              :key="r.id"
              class="bra-row"
              @click="selectedReport = r"
            >
              <td class="bra-date">{{ fmtDate(r.created_at) }}</td>
              <td class="bra-player">{{ r.display_name || r.username || '—' }}</td>
              <td class="bra-msg">{{ r.message.slice(0, 80) }}{{ r.message.length > 80 ? '…' : '' }}</td>
              <td class="bra-img-cell">
                <span v-if="r.image_path" class="bra-has-img" title="Tiene imagen">📎</span>
              </td>
              <td>
                <span class="bra-status-badge" :class="statusCls(r.status)">{{ r.status }}</span>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Paginación -->
        <div v-if="totalPages > 1" class="bra-pagination">
          <button :disabled="page === 1" @click="changePage(page - 1)">‹</button>
          <span>{{ page }} / {{ totalPages }}</span>
          <button :disabled="page === totalPages" @click="changePage(page + 1)">›</button>
        </div>
      </div>

      <!-- Detalle -->
      <div class="bra-detail" v-else>
        <button class="bra-back" @click="selectedReport = null">← Volver</button>

        <div class="bra-detail-meta">
          <span class="bra-date">{{ fmtDate(selectedReport.created_at) }}</span>
          <span class="bra-player">{{ selectedReport.display_name || selectedReport.username || 'Anónimo' }}</span>
          <span class="bra-status-badge" :class="statusCls(selectedReport.status)">{{ selectedReport.status }}</span>
        </div>

        <div class="bra-detail-message">{{ selectedReport.message }}</div>

        <img
          v-if="selectedReport.image_path"
          :src="`/uploads${selectedReport.image_path}`"
          class="bra-detail-img"
          alt="Captura del error"
        />

        <div class="bra-status-actions">
          <span class="bra-filter-label">Cambiar estado:</span>
          <button
            v-for="s in STATUSES"
            :key="s.value"
            class="bra-filter-btn"
            :class="[s.cls, { active: selectedReport.status === s.value }]"
            :disabled="saving"
            @click="setStatus(selectedReport, s.value)"
          >
            {{ s.icon }} {{ s.value }}
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import axios from 'axios';

defineEmits(['close']);

const STATUSES = [
  { value: 'Nuevo',                icon: '🆕', cls: 'st-nuevo' },
  { value: 'Pendiente de arreglo', icon: '🔧', cls: 'st-pendiente' },
  { value: 'Corregido',            icon: '✅', cls: 'st-corregido' },
  { value: 'Descartado',           icon: '🗑️', cls: 'st-descartado' },
];

const activeStatuses = ref(['Nuevo', 'Pendiente de arreglo', 'Corregido']);
const reports        = ref([]);
const total          = ref(0);
const page           = ref(1);
const loading        = ref(false);
const saving         = ref(false);
const selectedReport = ref(null);

const PER_PAGE   = 20;
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / PER_PAGE)));

async function load() {
  loading.value = true;
  try {
    const { data } = await axios.get('/api/admin/bug-reports', {
      params: { status: activeStatuses.value.join(','), page: page.value },
      withCredentials: true,
    });
    if (data.success) {
      reports.value = data.reports;
      total.value   = data.total;
    }
  } finally {
    loading.value = false;
  }
}

function toggleStatus(s) {
  const idx = activeStatuses.value.indexOf(s);
  if (idx >= 0) {
    if (activeStatuses.value.length > 1) activeStatuses.value.splice(idx, 1);
  } else {
    activeStatuses.value.push(s);
  }
  page.value = 1;
  load();
}

function changePage(p) {
  page.value = p;
  load();
}

async function setStatus(report, status) {
  if (report.status === status) return;
  saving.value = true;
  try {
    const { data } = await axios.patch(
      `/api/admin/bug-reports/${report.id}/status`,
      { status },
      { withCredentials: true }
    );
    if (data.success) {
      report.status = status;
      // actualizar en la lista también
      const inList = reports.value.find(r => r.id === report.id);
      if (inList) inList.status = status;
    }
  } finally {
    saving.value = false;
  }
}

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })
    + ' ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function statusCls(s) {
  return STATUSES.find(x => x.value === s)?.cls ?? '';
}

watch(activeStatuses, () => {}, { deep: true });
onMounted(load);
</script>

<style scoped>
.bra-overlay {
  position: fixed;
  inset: 0;
  z-index: 9500;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.bra-panel {
  background: #16120a;
  border: 1px solid rgba(201,168,76,0.3);
  border-radius: 8px;
  width: 100%;
  max-width: 1000px;
  height: 88vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 16px 60px rgba(0,0,0,0.7);
  overflow: hidden;
}

/* Header */
.bra-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: #1c1710;
  border-bottom: 1px solid rgba(201,168,76,0.2);
  flex-shrink: 0;
}

.bra-title {
  font-family: 'Cinzel', 'Georgia', serif;
  font-size: 0.95rem;
  color: #c9a84c;
  letter-spacing: 1px;
}

.bra-header-right { display: flex; align-items: center; gap: 14px; }

.bra-count {
  font-family: sans-serif;
  font-size: 0.78rem;
  color: #5a4a30;
}

.bra-close {
  background: none; border: none; color: #5a4a30;
  font-size: 1rem; cursor: pointer; padding: 4px 8px; border-radius: 4px;
  transition: color 0.15s;
}
.bra-close:hover { color: #c9a84c; }

/* Filtros */
.bra-filters {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 20px;
  border-bottom: 1px solid rgba(201,168,76,0.12);
  background: #130f08;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.bra-filter-group { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }

.bra-filter-label {
  font-family: sans-serif;
  font-size: 0.72rem;
  color: #5a4a30;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-right: 4px;
}

.bra-filter-btn {
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
.bra-filter-btn.active { opacity: 1; }
.bra-filter-btn:disabled { cursor: not-allowed; }

.st-nuevo      { color: #60a5fa; border-color: #60a5fa44; }
.st-pendiente  { color: #fbbf24; border-color: #fbbf2444; }
.st-corregido  { color: #6fcf97; border-color: #6fcf9744; }
.st-descartado { color: #9ca3af; border-color: #9ca3af44; }

.st-nuevo.active      { background: rgba(96,165,250,0.1); }
.st-pendiente.active  { background: rgba(251,191,36,0.1); }
.st-corregido.active  { background: rgba(111,207,151,0.1); }
.st-descartado.active { background: rgba(156,163,175,0.08); }

.bra-refresh-btn {
  background: none;
  border: 1px solid rgba(201,168,76,0.2);
  color: #8a7a58;
  border-radius: 4px;
  padding: 4px 10px;
  font-size: 1rem;
  cursor: pointer;
  transition: color 0.15s;
}
.bra-refresh-btn:hover { color: #c9a84c; }

/* Body */
.bra-body { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }
.bra-loading, .bra-empty {
  flex: 1; display: flex; align-items: center; justify-content: center;
  color: #5a4a30; font-family: 'Georgia', serif; font-size: 0.9rem;
}

/* Table */
.bra-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.83rem;
}

.bra-table thead th {
  background: #1c1710;
  color: #7a6a40;
  font-family: 'Cinzel', serif;
  font-size: 0.68rem;
  letter-spacing: 1px;
  padding: 10px 14px;
  text-align: left;
  border-bottom: 1px solid rgba(201,168,76,0.15);
  position: sticky;
  top: 0;
}

.bra-row {
  cursor: pointer;
  border-bottom: 1px solid rgba(201,168,76,0.07);
  transition: background 0.12s;
}
.bra-row:hover { background: rgba(201,168,76,0.06); }

.bra-table td { padding: 10px 14px; vertical-align: top; }

.bra-date   { color: #5a4a30; font-family: sans-serif; font-size: 0.75rem; white-space: nowrap; }
.bra-player { color: #c9a84c; font-family: 'Georgia', serif; white-space: nowrap; }
.bra-msg    { color: #a09070; font-family: 'Georgia', serif; line-height: 1.5; }
.bra-img-cell { text-align: center; font-size: 1rem; }
.bra-has-img { opacity: 0.7; }

.bra-status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-family: sans-serif;
  border: 1px solid;
  white-space: nowrap;
}

/* Paginación */
.bra-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 14px;
  border-top: 1px solid rgba(201,168,76,0.1);
  margin-top: auto;
}

.bra-pagination button {
  background: rgba(201,168,76,0.08);
  border: 1px solid rgba(201,168,76,0.2);
  color: #c9a84c;
  border-radius: 4px;
  padding: 4px 14px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.15s;
}
.bra-pagination button:disabled { opacity: 0.3; cursor: not-allowed; }
.bra-pagination button:not(:disabled):hover { background: rgba(201,168,76,0.18); }
.bra-pagination span { font-family: sans-serif; font-size: 0.8rem; color: #7a6a40; }

/* Detalle */
.bra-detail {
  flex: 1;
  overflow-y: auto;
  padding: 24px 28px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bra-back {
  background: none;
  border: none;
  color: #c9a84c;
  font-family: 'Cinzel', serif;
  font-size: 0.8rem;
  cursor: pointer;
  padding: 0;
  letter-spacing: 0.5px;
  align-self: flex-start;
}
.bra-back:hover { text-decoration: underline; }

.bra-detail-meta {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.bra-detail-message {
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(201,168,76,0.15);
  border-radius: 5px;
  padding: 16px;
  font-family: 'Georgia', serif;
  font-size: 0.92rem;
  color: #c8b87a;
  line-height: 1.7;
  white-space: pre-wrap;
}

.bra-detail-img {
  max-width: 100%;
  max-height: 400px;
  border-radius: 5px;
  border: 1px solid rgba(201,168,76,0.2);
  object-fit: contain;
  align-self: flex-start;
}

.bra-status-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding-top: 8px;
  border-top: 1px solid rgba(201,168,76,0.12);
}

/* Scrollbar */
.bra-body::-webkit-scrollbar,
.bra-detail::-webkit-scrollbar { width: 5px; }
.bra-body::-webkit-scrollbar-thumb,
.bra-detail::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.2); border-radius: 3px; }
</style>
