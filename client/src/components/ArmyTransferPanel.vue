<template>
  <Teleport to="body">
    <Transition name="atp-fade">
      <div v-if="show" class="atp-backdrop" @click.self="$emit('close')">
        <div class="atp-box" role="dialog" aria-modal="true">

          <!-- Header -->
          <div class="atp-header">
            <div class="atp-header-left">
              <span class="atp-icon">↔️</span>
              <div>
                <h2 class="atp-title">Gestión de Ejércitos</h2>
                <span class="atp-subtitle">{{ fiefName || h3_index }}</span>
              </div>
            </div>
            <button class="atp-close" @click="$emit('close')">✕</button>
          </div>

          <!-- Army B selector (when >2 armies at hex) -->
          <div v-if="coLocated.length > 1" class="atp-selector-row">
            <label class="atp-selector-label">Ejército B:</label>
            <select class="atp-selector" v-model="selectedBId" @change="onSelectB">
              <option v-for="a in coLocated" :key="a.army_id" :value="a.army_id">
                {{ a.is_garrison ? '🏰' : '⚔️' }} {{ a.name }}
              </option>
            </select>
          </div>

          <!-- Loading -->
          <div v-if="loading" class="atp-loading">Cargando ejércitos...</div>
          <div v-else-if="errorMsg" class="atp-error">❌ {{ errorMsg }}</div>

          <template v-else-if="armyA && armyB">
            <!-- Army column headers -->
            <div class="atp-army-headers">
              <div class="atp-army-name army-a">
                {{ armyA.army.is_garrison ? '🏰' : '⚔️' }} {{ armyA.army.name }}
                <span v-if="armyA.army.is_garrison" class="atp-garrison-tag">GUARNICIÓN</span>
              </div>
              <div class="atp-center-col"></div>
              <div class="atp-army-name army-b">
                {{ armyB.army.is_garrison ? '🏰' : '⚔️' }} {{ armyB.army.name }}
                <span v-if="armyB.army.is_garrison" class="atp-garrison-tag">GUARNICIÓN</span>
              </div>
            </div>

            <!-- Troops section -->
            <div class="atp-section-label">🗡 TROPAS</div>
            <div v-if="allUnitTypes.length === 0" class="atp-empty">Ningún ejército tiene tropas.</div>
            <div v-else class="atp-troops-table">
              <div class="atp-troops-header">
                <span>Ejército A</span>
                <span class="atp-unit-col">Unidad</span>
                <span class="atp-transfer-col">Transferir</span>
                <span>Ejército B</span>
              </div>
              <div
                v-for="ut in allUnitTypes"
                :key="ut.unit_type_id"
                class="atp-troop-row"
              >
                <!-- Army A qty (with preview) -->
                <div class="atp-qty-cell army-a-cell">
                  <span class="atp-qty-current">{{ qtyA(ut.unit_type_id) }}</span>
                  <span v-if="pendingA(ut.unit_type_id) !== qtyA(ut.unit_type_id)" class="atp-qty-preview">
                    → {{ pendingA(ut.unit_type_id) }}
                  </span>
                </div>

                <!-- Unit name -->
                <div class="atp-unit-name">{{ ut.unit_name }}</div>

                <!-- Transfer controls -->
                <div class="atp-transfer-controls">
                  <button
                    class="atp-dir-btn"
                    :disabled="qtyA(ut.unit_type_id) === 0"
                    @click="setTransferDir(ut.unit_type_id, 1)"
                    title="Enviar A → B"
                  >→</button>
                  <input
                    type="number"
                    class="atp-qty-input"
                    :value="Math.abs(troopTransfer(ut.unit_type_id))"
                    min="0"
                    @change="onTroopInput(ut.unit_type_id, $event)"
                  />
                  <button
                    class="atp-dir-btn"
                    :disabled="qtyB(ut.unit_type_id) === 0"
                    @click="setTransferDir(ut.unit_type_id, -1)"
                    title="Enviar B → A"
                  >←</button>
                </div>

                <!-- Army B qty (with preview) -->
                <div class="atp-qty-cell army-b-cell">
                  <span class="atp-qty-current">{{ qtyB(ut.unit_type_id) }}</span>
                  <span v-if="pendingB(ut.unit_type_id) !== qtyB(ut.unit_type_id)" class="atp-qty-preview">
                    → {{ pendingB(ut.unit_type_id) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Provisions section -->
            <div class="atp-section-label">📦 SUMINISTROS</div>
            <div class="atp-prov-table">
              <div class="atp-prov-row" v-for="p in PROVISIONS" :key="p.key">
                <div class="atp-prov-qty army-a-cell">
                  <span class="atp-qty-current">{{ provA(p.key) }}</span>
                  <span v-if="pendingProvA(p.key) !== provA(p.key)" class="atp-qty-preview">
                    → {{ pendingProvA(p.key) }}
                  </span>
                </div>
                <div class="atp-prov-label">{{ p.icon }} {{ p.label }}</div>
                <div class="atp-transfer-controls">
                  <button
                    class="atp-dir-btn"
                    :disabled="provA(p.key) <= 0"
                    @click="setProvDir(p.key, 1)"
                    title="Enviar A → B"
                  >→</button>
                  <input
                    type="number"
                    class="atp-qty-input"
                    :value="Math.abs(provTransfer(p.key))"
                    min="0"
                    step="any"
                    @change="onProvInput(p.key, $event)"
                  />
                  <button
                    class="atp-dir-btn"
                    :disabled="provB(p.key) <= 0"
                    @click="setProvDir(p.key, -1)"
                    title="Enviar B → A"
                  >←</button>
                </div>
                <div class="atp-prov-qty army-b-cell">
                  <span class="atp-qty-current">{{ provB(p.key) }}</span>
                  <span v-if="pendingProvB(p.key) !== provB(p.key)" class="atp-qty-preview">
                    → {{ pendingProvB(p.key) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Error display -->
            <div v-if="applyError" class="atp-apply-error">❌ {{ applyError }}</div>

            <!-- Footer actions -->
            <div class="atp-footer">
              <button class="atp-btn atp-btn-reset" @click="resetTransfers" :disabled="applying">
                🔄 Resetear
              </button>
              <button class="atp-btn atp-btn-merge" @click="mergeAll" :disabled="applying || merging">
                {{ merging ? 'Fusionando...' : '⚔️ Fusionar B → A' }}
              </button>
              <button
                class="atp-btn atp-btn-apply"
                @click="applyTransfers"
                :disabled="applying || !hasTransfers"
              >
                {{ applying ? 'Aplicando...' : '↔️ Aplicar Transferencias' }}
              </button>
            </div>
          </template>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import * as mapApi from '@/services/mapApi.js';

const props = defineProps({
  show:      { type: Boolean, default: false },
  armyAId:   { type: Number, required: true },
  armyBId:   { type: Number, default: null },
  h3_index:  { type: String, required: true },
  fiefName:  { type: String, default: '' },
});

const emit = defineEmits(['close', 'done']);

// ── State ──────────────────────────────────────────────────────────────────
const loading    = ref(false);
const applying   = ref(false);
const merging    = ref(false);
const errorMsg   = ref('');
const applyError = ref('');

const armyA     = ref(null);   // { army: {}, troops: [] }
const armyB     = ref(null);
const coLocated = ref([]);     // Other armies at same hex (excluding armyA)
const selectedBId = ref(null);

// transfers: Map<unit_type_id, signed_qty>  positive = A→B, negative = B→A
const troopTransfers = ref({});  // { [unit_type_id]: signedQty }
const provTransfers  = ref({});  // { [key]: signedAmount }

const PROVISIONS = [
  { key: 'gold',  icon: '🥇', label: 'Oro'     },
  { key: 'food',  icon: '🍖', label: 'Comida'  },
  { key: 'wood',  icon: '🌲', label: 'Madera'  },
  { key: 'stone', icon: '⛰️', label: 'Piedra'  },
  { key: 'iron',  icon: '⛏️', label: 'Hierro'  },
];

// ── Computed ───────────────────────────────────────────────────────────────
const allUnitTypes = computed(() => {
  const map = {};
  for (const t of (armyA.value?.troops || [])) {
    map[t.unit_type_id] = { unit_type_id: t.unit_type_id, unit_name: t.unit_name };
  }
  for (const t of (armyB.value?.troops || [])) {
    map[t.unit_type_id] = { unit_type_id: t.unit_type_id, unit_name: t.unit_name };
  }
  return Object.values(map).sort((a, b) => a.unit_name.localeCompare(b.unit_name));
});

const hasTransfers = computed(() => {
  return Object.values(troopTransfers.value).some(v => v !== 0) ||
         Object.values(provTransfers.value).some(v => v !== 0);
});

// ── Helpers ────────────────────────────────────────────────────────────────
function troopQty(army, unit_type_id) {
  if (!army) return 0;
  const row = army.troops.find(t => t.unit_type_id === unit_type_id);
  return row ? parseInt(row.quantity) : 0;
}

function qtyA(uid) { return troopQty(armyA.value, uid); }
function qtyB(uid) { return troopQty(armyB.value, uid); }
function troopTransfer(uid) { return troopTransfers.value[uid] || 0; }

function pendingA(uid) {
  const delta = troopTransfer(uid);
  return qtyA(uid) - delta;
}
function pendingB(uid) {
  const delta = troopTransfer(uid);
  return qtyB(uid) + delta;
}

function provVal(army, key) {
  if (!army) return 0;
  const val = parseFloat(army.army[`${key}_provisions`] || 0);
  return Math.round(val * 100) / 100;
}
function provA(key) { return provVal(armyA.value, key); }
function provB(key) { return provVal(armyB.value, key); }
function provTransfer(key) { return provTransfers.value[key] || 0; }
function pendingProvA(key) { return Math.round((provA(key) - provTransfer(key)) * 100) / 100; }
function pendingProvB(key) { return Math.round((provB(key) + provTransfer(key)) * 100) / 100; }

// ── Transfer controls ──────────────────────────────────────────────────────
function setTransferDir(uid, dir) {
  // dir: 1 = A→B, -1 = B→A
  const current = troopTransfers.value[uid] || 0;
  const absVal  = Math.abs(current) || 0;
  // If already going in same direction keep magnitude, else flip and keep magnitude
  troopTransfers.value = { ...troopTransfers.value, [uid]: dir * absVal };
}

function onTroopInput(uid, event) {
  const raw = parseInt(event.target.value) || 0;
  const dir = (troopTransfers.value[uid] || 0) >= 0 ? 1 : -1;
  // Clamp to available source
  const maxA = qtyA(uid);
  const maxB = qtyB(uid);
  const clamped = dir === 1
    ? Math.min(raw, maxA)
    : Math.min(raw, maxB);
  troopTransfers.value = { ...troopTransfers.value, [uid]: dir * clamped };
  event.target.value = clamped;
}

function setProvDir(key, dir) {
  const current = provTransfers.value[key] || 0;
  const absVal  = Math.abs(current) || 0;
  provTransfers.value = { ...provTransfers.value, [key]: dir * absVal };
}

function onProvInput(key, event) {
  const raw = parseFloat(event.target.value) || 0;
  const dir = (provTransfers.value[key] || 0) >= 0 ? 1 : -1;
  const maxA = provA(key);
  const maxB = provB(key);
  const clamped = dir === 1
    ? Math.min(raw, maxA)
    : Math.min(raw, maxB);
  const rounded = Math.round(clamped * 100) / 100;
  provTransfers.value = { ...provTransfers.value, [key]: dir * rounded };
  event.target.value = rounded;
}

function resetTransfers() {
  troopTransfers.value = {};
  provTransfers.value  = {};
  applyError.value     = '';
}

// ── Data loading ───────────────────────────────────────────────────────────
async function loadData() {
  if (!props.show) return;
  loading.value  = true;
  errorMsg.value = '';
  applyError.value = '';
  try {
    const targetBId = selectedBId.value;

    const [detailA, detailB, hexRes] = await Promise.all([
      mapApi.getArmyDetail(props.armyAId),
      targetBId ? mapApi.getArmyDetail(targetBId) : Promise.resolve(null),
      mapApi.getArmiesAtHex(props.h3_index),
    ]);

    armyA.value = detailA?.success ? { army: detailA.army, troops: detailA.troops } : null;
    armyB.value = detailB?.success ? { army: detailB.army, troops: detailB.troops } : null;

    // Co-located: other armies at same hex, excluding armyA
    coLocated.value = (hexRes?.armies || []).filter(a => a.army_id !== props.armyAId);

    // Auto-select armyB if not yet set
    if (!selectedBId.value && coLocated.value.length > 0) {
      const preferred = props.armyBId
        ? coLocated.value.find(a => a.army_id === props.armyBId)
        : null;
      selectedBId.value = preferred?.army_id ?? coLocated.value[0].army_id;

      if (!armyB.value) {
        const detailB2 = await mapApi.getArmyDetail(selectedBId.value);
        armyB.value = detailB2?.success ? { army: detailB2.army, troops: detailB2.troops } : null;
      }
    }

    if (!armyA.value) errorMsg.value = 'No se pudo cargar el Ejército A.';
    if (!armyB.value) errorMsg.value = (errorMsg.value ? errorMsg.value + ' ' : '') + 'No se pudo cargar el Ejército B.';
  } catch (e) {
    errorMsg.value = 'Error al cargar los ejércitos.';
  } finally {
    loading.value = false;
  }
}

async function onSelectB() {
  armyB.value = null;
  resetTransfers();
  loading.value = true;
  try {
    const detail = await mapApi.getArmyDetail(selectedBId.value);
    armyB.value = detail?.success ? { army: detail.army, troops: detail.troops } : null;
  } finally {
    loading.value = false;
  }
}

// ── Actions ────────────────────────────────────────────────────────────────
async function applyTransfers() {
  applyError.value = '';
  applying.value   = true;
  try {
    // Build troops payload (A→B): positive sign → from A to B
    const troops = [];
    for (const [uid, signed] of Object.entries(troopTransfers.value)) {
      if (signed === 0) continue;
      if (signed > 0) {
        troops.push({ unit_type_id: parseInt(uid), quantity: signed });
      } else {
        // negative = B→A, swap direction
        troops.push({ unit_type_id: parseInt(uid), quantity: -signed });
      }
    }

    // Split into A→B and B→A calls as needed
    const troopsAtoB = Object.entries(troopTransfers.value)
      .filter(([, v]) => v > 0)
      .map(([uid, v]) => ({ unit_type_id: parseInt(uid), quantity: v }));
    const troopsBtoA = Object.entries(troopTransfers.value)
      .filter(([, v]) => v < 0)
      .map(([uid, v]) => ({ unit_type_id: parseInt(uid), quantity: -v }));

    const provAtoBFields = {};
    const provBtoAFields = {};
    for (const { key } of PROVISIONS) {
      const v = provTransfers.value[key] || 0;
      if (v > 0) provAtoBFields[key] = v;
      else if (v < 0) provBtoAFields[key] = -v;
    }

    const hasAtoB = troopsAtoB.length > 0 || Object.keys(provAtoBFields).length > 0;
    const hasBtoA = troopsBtoA.length > 0 || Object.keys(provBtoAFields).length > 0;

    if (!hasAtoB && !hasBtoA) {
      applyError.value = 'No hay transferencias pendientes.';
      return;
    }

    const bId = parseInt(selectedBId.value || props.armyBId);

    if (hasAtoB) {
      const res = await mapApi.transferArmy(props.armyAId, bId, troopsAtoB, provAtoBFields);
      if (!res.success) { applyError.value = res.message; return; }
    }
    if (hasBtoA) {
      const res = await mapApi.transferArmy(bId, props.armyAId, troopsBtoA, provBtoAFields);
      if (!res.success) { applyError.value = res.message; return; }
    }

    resetTransfers();
    await loadData();  // Reload fresh data
    emit('done');
  } catch (e) {
    applyError.value = e?.response?.data?.message || 'Error al aplicar la transferencia.';
  } finally {
    applying.value = false;
  }
}

async function mergeAll() {
  merging.value = true;
  applyError.value = '';
  try {
    const res = await mapApi.mergeArmies(props.armyAId, props.h3_index);
    if (!res.success) {
      applyError.value = res.message;
    } else {
      emit('done');
      emit('close');
    }
  } catch (e) {
    applyError.value = e?.response?.data?.message || 'Error al fusionar ejércitos.';
  } finally {
    merging.value = false;
  }
}

// ── Lifecycle ──────────────────────────────────────────────────────────────
watch(() => props.show, (val) => {
  if (val) {
    selectedBId.value = props.armyBId || null;
    resetTransfers();
    loadData();
  }
}, { immediate: true });

function onKeydown(e) {
  if (e.key === 'Escape' && props.show) emit('close');
}
onMounted(() => document.addEventListener('keydown', onKeydown));
onUnmounted(() => document.removeEventListener('keydown', onKeydown));
</script>

<style scoped>
.atp-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.atp-box {
  background: #1a1a2e;
  border: 1.5px solid #4a3f6b;
  border-radius: 8px;
  width: min(900px, 95vw);
  max-height: 85vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  color: #e0d9f0;
  font-size: 13px;
}

/* Header */
.atp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px 10px;
  border-bottom: 1px solid #2e2550;
  background: #16122a;
  flex-shrink: 0;
}
.atp-header-left { display: flex; align-items: center; gap: 10px; }
.atp-icon { font-size: 20px; }
.atp-title { font-size: 16px; font-weight: 700; color: #c8b8f0; margin: 0; }
.atp-subtitle { font-size: 11px; color: #888; }
.atp-close {
  background: none; border: none; color: #888; font-size: 18px;
  cursor: pointer; padding: 4px 8px; border-radius: 4px;
}
.atp-close:hover { background: rgba(255,255,255,0.1); color: #fff; }

/* Army B selector */
.atp-selector-row {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 18px; background: rgba(255,255,255,0.03);
  border-bottom: 1px solid #2e2550;
}
.atp-selector-label { font-size: 12px; color: #aaa; }
.atp-selector {
  background: #0d0b1e; border: 1px solid #4a3f6b; color: #e0d9f0;
  border-radius: 4px; padding: 4px 8px; font-size: 12px;
}

/* Loading/error */
.atp-loading, .atp-error { padding: 20px; text-align: center; color: #aaa; }
.atp-error { color: #ef9a9a; }
.atp-empty { padding: 10px 18px; color: #888; font-style: italic; }

/* Army headers */
.atp-army-headers {
  display: grid;
  grid-template-columns: 1fr 80px 1fr;
  gap: 0;
  padding: 10px 18px 6px;
  border-bottom: 1px solid #2e2550;
}
.atp-army-name {
  font-weight: 700; font-size: 13px; color: #c8b8f0;
  display: flex; align-items: center; gap: 6px;
}
.atp-army-name.army-a { justify-content: flex-start; color: #7eb8f7; }
.atp-army-name.army-b { justify-content: flex-end;  color: #f78787; }
.atp-garrison-tag {
  font-size: 9px; background: #2a3f5f; border: 1px solid #607d9e;
  color: #9ecaff; border-radius: 3px; padding: 1px 4px; letter-spacing: 0.5px;
}

/* Section label */
.atp-section-label {
  font-size: 10px; font-weight: 700; letter-spacing: 1px;
  color: #666; padding: 8px 18px 4px;
  text-transform: uppercase;
}

/* Troops table */
.atp-troops-table { padding: 0 18px 8px; }
.atp-troops-header {
  display: grid;
  grid-template-columns: 1fr 100px 120px 1fr;
  gap: 4px;
  padding: 4px 0;
  border-bottom: 1px solid #2e2550;
  font-size: 10px; color: #666; text-transform: uppercase;
  text-align: center;
}
.atp-troops-header span:first-child { text-align: left; color: #7eb8f7; }
.atp-troops-header span:last-child  { text-align: right; color: #f78787; }

.atp-troop-row {
  display: grid;
  grid-template-columns: 1fr 100px 120px 1fr;
  gap: 4px;
  align-items: center;
  padding: 5px 0;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.atp-troop-row:hover { background: rgba(255,255,255,0.03); }

.atp-qty-cell {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 600;
}
.atp-qty-cell.army-a-cell { color: #7eb8f7; justify-content: flex-start; }
.atp-qty-cell.army-b-cell { color: #f78787; justify-content: flex-end; }

.atp-qty-current { min-width: 28px; text-align: center; }
.atp-qty-preview { font-size: 11px; color: #aaa; font-weight: 400; }

.atp-unit-name { text-align: center; font-size: 12px; color: #ccc; }

/* Transfer controls */
.atp-transfer-controls {
  display: flex; align-items: center; justify-content: center; gap: 3px;
}
.atp-dir-btn {
  background: #2d2450; border: 1px solid #5040a0; color: #c8b8f0;
  border-radius: 3px; width: 22px; height: 22px;
  cursor: pointer; font-size: 11px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  padding: 0; flex-shrink: 0;
  transition: background 0.15s;
}
.atp-dir-btn:hover:not(:disabled) { background: #3d3460; }
.atp-dir-btn:disabled { opacity: 0.3; cursor: not-allowed; }

.atp-qty-input {
  width: 46px; background: #0d0b1e; border: 1px solid #4a3f6b;
  color: #e0d9f0; border-radius: 3px; padding: 2px 4px;
  font-size: 11px; text-align: center;
}
.atp-qty-input::-webkit-inner-spin-button { opacity: 0.5; }

/* Provisions table */
.atp-prov-table { padding: 0 18px 8px; }
.atp-prov-row {
  display: grid;
  grid-template-columns: 1fr 80px 120px 1fr;
  gap: 4px;
  align-items: center;
  padding: 4px 0;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.atp-prov-label { text-align: center; font-size: 12px; color: #ccc; }
.atp-prov-qty {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; font-weight: 600;
}
.atp-prov-qty.army-a-cell { color: #7eb8f7; justify-content: flex-start; }
.atp-prov-qty.army-b-cell { color: #f78787; justify-content: flex-end; }

/* Footer */
.atp-footer {
  display: flex; align-items: center; justify-content: flex-end;
  gap: 10px;
  padding: 12px 18px;
  border-top: 1px solid #2e2550;
  background: #16122a;
  flex-shrink: 0;
}
.atp-btn {
  padding: 7px 14px; border: none; border-radius: 5px;
  font-size: 12px; font-weight: 600; cursor: pointer;
  transition: opacity 0.15s;
}
.atp-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.atp-btn-reset  { background: #2d2450; color: #c8b8f0; border: 1px solid #5040a0; }
.atp-btn-reset:hover:not(:disabled) { background: #3d3460; }
.atp-btn-merge  { background: #5a2a2a; color: #ffb3b3; border: 1px solid #8b3a3a; }
.atp-btn-merge:hover:not(:disabled) { background: #6e3333; }
.atp-btn-apply  { background: #1e4d2e; color: #a5d6b3; border: 1px solid #2e7d50; }
.atp-btn-apply:hover:not(:disabled) { background: #265d38; }

.atp-apply-error { margin: 0 18px 8px; padding: 6px 10px; background: rgba(183,28,28,0.2); border: 1px solid #b71c1c; border-radius: 4px; color: #ef9a9a; font-size: 12px; }

/* Transitions */
.atp-fade-enter-active, .atp-fade-leave-active { transition: opacity 0.2s; }
.atp-fade-enter-from, .atp-fade-leave-to { opacity: 0; }
</style>
