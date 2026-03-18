<template>
  <div class="eco-overlay">
    <div class="eco-container">

      <!-- Header -->
      <div class="eco-header">
        <h1 class="eco-title">💰 Panel de Economía</h1>
        <button class="eco-close" @click="$emit('close')" title="Cerrar">✕</button>
      </div>

      <!-- Content -->
      <div class="eco-content">

        <!-- Left Sidebar -->
        <div class="eco-sidebar">

          <!-- Resource Summary -->
          <div class="eco-card">
            <h4 class="eco-card-title">📦 Recursos Totales</h4>
            <div v-if="loadingSummary" class="eco-loading">Cargando...</div>
            <div v-else-if="summaryError" class="eco-error">{{ summaryError }}</div>
            <template v-else>
              <div class="res-list">
                <div class="res-row"><span>🌾 Comida</span><strong>{{ fmt(summary.total_food) }}</strong></div>
                <!-- DISABLED: wood/stone/iron hidden
                <div class="res-row"><span>🌲 Madera</span><strong>{{ fmt(summary.total_wood) }}</strong></div>
                <div class="res-row"><span>⛰️ Piedra</span><strong>{{ fmt(summary.total_stone) }}</strong></div>
                <div class="res-row"><span>⛏️ Hierro</span><strong>{{ fmt(summary.total_iron) }}</strong></div>
                -->
                <div class="res-row eco-gold-row"><span>💰 Oro (feudos)</span><strong class="gold">{{ fmt(summary.total_gold) }}</strong></div>
                <div class="res-row"><span>👥 Población</span><strong>{{ fmt(summary.total_population) }}</strong></div>
              </div>
              <p class="eco-fiefs-note">{{ summary.fief_count }} feudo{{ summary.fief_count !== 1 ? 's' : '' }} bajo tu dominio</p>
            </template>
          </div>

          <!-- Tax Settings -->
          <div class="eco-card">
            <h4 class="eco-card-title">💰 Impuesto Fiscal</h4>
            <p class="eco-hint">
              Cada turno, el <strong>{{ localTaxRate }}%</strong> del oro almacenado
              en cada feudo pasa al tesoro real.
            </p>
            <div class="eco-slider-row">
              <span class="eco-slider-label">1%</span>
              <input
                type="range" min="1" max="10" step="1"
                v-model.number="localTaxRate"
                class="eco-slider"
                :style="{ '--pct': sliderPct }"
                :disabled="saving"
              />
              <span class="eco-slider-label">10%</span>
            </div>
            <div class="eco-slider-value">Tasa actual: <strong>{{ localTaxRate }}%</strong></div>
            <div v-if="!loadingSummary && !summaryError" class="eco-estimate">
              Tributo esperado:
              <strong class="gold">+{{ fmt(estimatedTax) }} 💰</strong>
            </div>
          </div>

          <!-- Tithe Settings -->
          <div class="eco-card">
            <h4 class="eco-card-title">⛪ Diezmo</h4>
            <p class="eco-hint">
              Cuando está activo, el <strong>10%</strong> de todos los recursos
              de feudos secundarios se transfiere a la capital cada turno.
            </p>
            <label class="eco-toggle-row">
              <span class="eco-toggle-label">{{ localTitheActive ? 'Diezmo activo' : 'Diezmo inactivo' }}</span>
              <div
                class="eco-toggle"
                :class="{ 'eco-toggle--on': localTitheActive }"
                @click="!saving && (localTitheActive = !localTitheActive)"
              >
                <div class="eco-toggle-thumb"></div>
              </div>
            </label>
          </div>

          <!-- Terrain Filter -->
          <div class="eco-card">
            <h4 class="eco-card-title">🗺️ Filtrar por Terreno</h4>
            <div class="terrain-filter-list">
              <button
                class="terrain-btn"
                :class="{ active: filterTerrain === null }"
                @click="filterTerrain = null"
              >Todos</button>
              <button
                v-for="terrain in terrainOptions"
                :key="terrain"
                class="terrain-btn"
                :class="{ active: filterTerrain === terrain }"
                @click="filterTerrain = filterTerrain === terrain ? null : terrain"
              >{{ terrain }}</button>
            </div>
          </div>

          <!-- Save Button -->
          <div class="eco-card eco-actions-card">
            <button
              class="eco-save-btn"
              :disabled="saving || !isDirty"
              @click="saveSettings"
            >
              <span v-if="saving">⏳ Guardando...</span>
              <span v-else-if="saveOk">✅ Guardado</span>
              <span v-else>💾 Guardar Configuración</span>
            </button>
            <div v-if="saveError" class="eco-save-error">❌ {{ saveError }}</div>
          </div>

        </div>

        <!-- Main Table Area -->
        <div class="eco-main">
          <div class="eco-table-header">
            <h3 class="eco-table-title">🌾 Gestión Agrícola de Feudos</h3>
            <p class="eco-table-hint">
              Mejora las granjas de tus feudos para aumentar la producción de alimentos en un <strong>10%</strong> por nivel.
            </p>
          </div>

          <div v-if="loadingFiefs" class="eco-loading eco-loading-center">Cargando feudos...</div>
          <div v-else-if="fiefsError" class="eco-error eco-error-center">{{ fiefsError }}</div>
          <template v-else>
            <div class="eco-table-wrap">
              <table class="eco-table">
                <colgroup>
                  <col class="col-feudo" />
                  <col class="col-terreno" />
                  <col class="col-pop" />
                  <col class="col-food" />
                  <col class="col-autonomy" />
                  <col class="col-farm" />
                  <col class="col-cost" />
                  <col class="col-action" />
                </colgroup>
                <thead>
                  <tr>
                    <th>Feudo</th>
                    <th>Terreno</th>
                    <th>👥 Pob.</th>
                    <th>🌾 Comida</th>
                    <th>⏳ Autonomía</th>
                    <th>Nivel Granja</th>
                    <th>Coste Mejora</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="fief in filteredFiefs"
                    :key="fief.h3_index"
                    :class="{ 'row-capital': fief.h3_index === fief.capital_h3 }"
                  >
                    <td class="td-feudo">
                      <span v-if="fief.h3_index === fief.capital_h3" class="capital-badge">👑</span>
                      <span class="feudo-name">{{ fief.location_name || fief.h3_index }}</span>
                    </td>
                    <td class="td-terrain">{{ fief.terrain_name }}</td>
                    <td class="td-number">{{ fmt(fief.population) }}</td>
                    <td class="td-number">{{ fmt(fief.food_stored) }}</td>
                    <td class="td-number">
                      <span class="autonomy-val"
                        :class="{
                          'autonomy-ok':  fiefAutonomy(fief) > 365,
                          'autonomy-low': fiefAutonomy(fief) < 30
                        }"
                      >{{ fiefAutonomy(fief) === Infinity ? '∞' : fiefAutonomy(fief) }}</span>
                    </td>
                    <td class="td-number">
                      <span class="farm-level" :class="{ 'level-max': (fief.farm_level || 0) >= 5 }">
                        {{ fief.farm_level || 0 }}/5
                      </span>
                    </td>
                    <td class="td-number">
                      <span v-if="(fief.farm_level || 0) >= 5" class="level-max-text">Máx</span>
                      <span v-else class="cost-val">{{ fmt(farmCost(fief.farm_level || 0)) }} 💰</span>
                    </td>
                    <td class="td-action">
                      <button
                        v-if="(fief.farm_level || 0) < 5 && fief.food_output > 0"
                        class="upgrade-btn"
                        :class="{ 'upgrade-btn--disabled': upgradingHex === fief.h3_index }"
                        :disabled="upgradingHex === fief.h3_index || playerGold < farmCost(fief.farm_level || 0)"
                        @click="upgradeFarmFief(fief)"
                        :title="playerGold < farmCost(fief.farm_level || 0) ? 'Oro insuficiente' : `Mejorar granja al nivel ${(fief.farm_level || 0) + 1}`"
                      >
                        <span v-if="upgradingHex === fief.h3_index">⏳</span>
                        <span v-else>⬆️ Mejorar</span>
                      </button>
                      <span v-else-if="fief.food_output <= 0" class="no-farm-text">Sin terreno</span>
                      <span v-else class="level-max-text">Máximo</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="eco-gold-bar">
              <span class="eco-gold-label">Tu tesoro:</span>
              <span class="eco-gold-val">{{ fmt(playerGold) }} 💰</span>
            </div>

            <div v-if="upgradeError" class="eco-upgrade-error">❌ {{ upgradeError }}</div>
            <div v-if="upgradeOk" class="eco-upgrade-ok">{{ upgradeOk }}</div>
          </template>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { getEconomySummary, updateEconomySettings, getEconomyFiefs, upgradeFarm } from '../services/mapApi.js';

const emit = defineEmits(['close', 'gold-updated']);

// ── Summary state ─────────────────────────────────────────
const loadingSummary = ref(true);
const summaryError   = ref('');
const summary = ref({
  fief_count: 0,
  total_food: 0, total_wood: 0, total_stone: 0,
  total_iron: 0, total_gold: 0, total_population: 0,
});

const serverTaxRate     = ref(10);
const serverTitheActive = ref(false);
const localTaxRate      = ref(10);
const localTitheActive  = ref(false);

const saving    = ref(false);
const saveOk    = ref(false);
const saveError = ref('');

// ── Fiefs state ───────────────────────────────────────────
const loadingFiefs  = ref(true);
const fiefsError    = ref('');
const fiefs         = ref([]);
const playerGold    = ref(0);
const filterTerrain = ref(null);

const upgradingHex  = ref(null);
const upgradeError  = ref('');
const upgradeOk     = ref('');

// ── Computed ──────────────────────────────────────────────
const estimatedTax = computed(() =>
  Math.floor(summary.value.total_gold * localTaxRate.value / 100)
);
const sliderPct = computed(() =>
  `${((localTaxRate.value - 1) / 9 * 100).toFixed(1)}%`
);
const isDirty = computed(() =>
  localTaxRate.value !== serverTaxRate.value ||
  localTitheActive.value !== serverTitheActive.value
);
const terrainOptions = computed(() => {
  const seen = new Set();
  fiefs.value.forEach(f => { if (f.terrain_name) seen.add(f.terrain_name); });
  return [...seen].sort();
});
const filteredFiefs = computed(() =>
  filterTerrain.value
    ? fiefs.value.filter(f => f.terrain_name === filterTerrain.value)
    : fiefs.value
);

// ── Helpers ───────────────────────────────────────────────
const fmt = (n) => Number(n ?? 0).toLocaleString('es-ES');

// Farm upgrade cost: 3000 * 2^currentLevel
const farmCost = (currentLevel) => 3000 * Math.pow(2, currentLevel);

// Autonomy in days: food / daily consumption (floor(pop/100) * 0.1), matches backend
const fiefAutonomy = (fief) => {
  const consumption = Math.floor(Number(fief.population || 0) / 100) * 0.1;
  if (consumption <= 0) return Infinity;
  return Math.floor(Number(fief.food_stored || 0) / consumption);
};

// ── Methods ───────────────────────────────────────────────
async function fetchSummary() {
  loadingSummary.value = true;
  summaryError.value   = '';
  try {
    const data = await getEconomySummary();
    if (data.success) {
      summary.value           = data.summary;
      playerGold.value        = data.player_gold ?? 0;
      serverTaxRate.value     = data.settings.tax_rate;
      serverTitheActive.value = data.settings.tithe_active;
      localTaxRate.value      = data.settings.tax_rate;
      localTitheActive.value  = data.settings.tithe_active;
    } else {
      summaryError.value = data.message || 'Error al cargar datos';
    }
  } catch (err) {
    summaryError.value = err?.response?.data?.message || 'Error de conexión';
  } finally {
    loadingSummary.value = false;
  }
}

async function fetchFiefs() {
  loadingFiefs.value = true;
  fiefsError.value   = '';
  try {
    const data = await getEconomyFiefs();
    if (data.fiefs) {
      fiefs.value = data.fiefs;
    } else {
      fiefsError.value = data.message || 'Error al cargar feudos';
    }
  } catch (err) {
    fiefsError.value = err?.response?.data?.message || 'Error de conexión';
  } finally {
    loadingFiefs.value = false;
  }
}

async function saveSettings() {
  if (!isDirty.value || saving.value) return;
  saving.value    = true;
  saveOk.value    = false;
  saveError.value = '';
  try {
    const payload = {};
    if (localTaxRate.value !== serverTaxRate.value)
      payload.tax_rate = localTaxRate.value;
    if (localTitheActive.value !== serverTitheActive.value)
      payload.tithe_active = localTitheActive.value;

    const data = await updateEconomySettings(payload);
    if (data.success) {
      serverTaxRate.value     = localTaxRate.value;
      serverTitheActive.value = localTitheActive.value;
      saveOk.value = true;
      setTimeout(() => { saveOk.value = false; }, 2500);
    } else {
      saveError.value = data.message || 'Error al guardar';
    }
  } catch (err) {
    saveError.value = err?.response?.data?.message || 'Error de conexión';
  } finally {
    saving.value = false;
  }
}

async function upgradeFarmFief(fief) {
  if (upgradingHex.value) return;
  upgradeError.value = '';
  upgradeOk.value    = '';
  upgradingHex.value = fief.h3_index;
  try {
    const data = await upgradeFarm(fief.h3_index);
    if (data.success) {
      fief.farm_level = (fief.farm_level || 0) + 1;
      if (data.new_gold !== undefined) {
        playerGold.value = data.new_gold;
        emit('gold-updated', data.new_gold);
      } else {
        playerGold.value = Math.max(0, playerGold.value - farmCost((fief.farm_level || 1) - 1));
      }
      upgradeOk.value = data.message || `Granja mejorada al nivel ${fief.farm_level}`;
      setTimeout(() => { upgradeOk.value = ''; }, 3000);
    } else {
      upgradeError.value = data.message || 'Error al mejorar';
    }
  } catch (err) {
    upgradeError.value = err?.response?.data?.message || 'Error de conexión';
  } finally {
    upgradingHex.value = null;
  }
}

watch([localTaxRate, localTitheActive], () => { saveOk.value = false; });

onMounted(() => {
  fetchSummary();
  fetchFiefs();
});
</script>

<style scoped>
/* ── Overlay ─────────────────────────────────────────────── */
.eco-overlay {
  position: fixed;
  inset: 0;
  z-index: 9000;
  background: rgba(5, 3, 1, 0.88);
  display: flex;
  align-items: stretch;
  justify-content: center;
  padding: 20px;
}

.eco-container {
  background: radial-gradient(ellipse at top left, #1e1508 0%, #120d05 100%);
  border: 1px solid #5d4e37;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1200px;
  overflow: hidden;
  box-shadow: 0 0 60px rgba(0,0,0,0.8), 0 0 0 1px #3d2e1a;
}

/* ── Header ──────────────────────────────────────────────── */
.eco-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid #3d2e1a;
  background: rgba(0,0,0,0.3);
  flex-shrink: 0;
}

.eco-title {
  font-family: 'Georgia', serif;
  font-size: 1.3rem;
  color: #c9a84c;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin: 0;
  text-shadow: 0 0 20px rgba(201,168,76,0.3);
}

.eco-close {
  background: none;
  border: 1px solid #5d4e37;
  border-radius: 6px;
  color: #8b7355;
  width: 32px;
  height: 32px;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.eco-close:hover { background: rgba(255,255,255,0.05); color: #c9a84c; border-color: #c9a84c; }

/* ── Layout ──────────────────────────────────────────────── */
.eco-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* ── Sidebar ─────────────────────────────────────────────── */
.eco-sidebar {
  width: 280px;
  flex-shrink: 0;
  border-right: 1px solid #3d2e1a;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.eco-card {
  padding: 16px;
  border-bottom: 1px solid #2a1f0e;
}
.eco-card:last-child { border-bottom: none; }

.eco-card-title {
  font-family: sans-serif;
  font-size: 0.68rem;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #7c5c1e;
  font-weight: 700;
  margin: 0 0 12px;
}

/* Resources list */
.res-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.res-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.82rem;
  color: #a89070;
  font-family: sans-serif;
  padding: 4px 0;
  border-bottom: 1px solid rgba(255,255,255,0.03);
}
.res-row strong { color: #e8d5b5; font-size: 0.85rem; }
.eco-gold-row strong.gold { color: #fbbf24; }

.eco-fiefs-note {
  margin: 10px 0 0;
  font-size: 0.72rem;
  color: #5d4e37;
  font-style: italic;
  font-family: sans-serif;
}

/* Hint text */
.eco-hint {
  font-size: 0.77rem;
  color: #8b7355;
  line-height: 1.5;
  font-family: sans-serif;
  margin: 0 0 10px;
}
.eco-hint strong { color: #c9a84c; }

/* Slider */
.eco-slider-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.eco-slider-label {
  font-size: 0.72rem;
  color: #5d4e37;
  font-family: sans-serif;
  min-width: 20px;
  text-align: center;
}
.eco-slider {
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  height: 5px;
  border-radius: 3px;
  background: linear-gradient(to right, #c9a84c 0%, #c9a84c calc(var(--pct, 44%)), #3d2e1a calc(var(--pct, 44%)));
  outline: none;
  cursor: pointer;
}
.eco-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fbbf24;
  border: 2px solid #120d05;
  cursor: pointer;
}
.eco-slider:disabled { opacity: 0.5; cursor: not-allowed; }

.eco-slider-value {
  margin-top: 6px;
  font-size: 0.78rem;
  color: #8b7355;
  font-family: sans-serif;
}
.eco-estimate {
  margin-top: 6px;
  font-size: 0.78rem;
  color: #8b7355;
  font-family: sans-serif;
}
.eco-estimate .gold { color: #fbbf24; }

/* Toggle */
.eco-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
}
.eco-toggle-label {
  font-size: 0.80rem;
  color: #a89070;
  font-family: sans-serif;
}
.eco-toggle {
  width: 40px;
  height: 22px;
  border-radius: 11px;
  background: #3d2e1a;
  border: 1px solid #5d4e37;
  position: relative;
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
}
.eco-toggle--on { background: #7c5c1e; border-color: #c9a84c; }
.eco-toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #8b7355;
  transition: left 0.2s, background 0.2s;
}
.eco-toggle--on .eco-toggle-thumb { left: 21px; background: #fbbf24; }

/* Actions card */
.eco-actions-card { padding-top: 12px; }
.eco-save-btn {
  width: 100%;
  padding: 9px;
  background: #2d1f0a;
  border: 1px solid #c9a84c;
  border-radius: 6px;
  color: #fbbf24;
  font-size: 0.80rem;
  font-family: 'Georgia', serif;
  letter-spacing: 1px;
  cursor: pointer;
  transition: background 0.15s;
}
.eco-save-btn:hover:not(:disabled) { background: #3d2d10; }
.eco-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.eco-save-error {
  margin-top: 8px;
  font-size: 0.78rem;
  color: #f87171;
  font-family: sans-serif;
}

/* ── Main table area ─────────────────────────────────────── */
.eco-main {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 20px;
  gap: 12px;
}

.eco-table-header {}
.eco-table-title {
  font-family: 'Georgia', serif;
  font-size: 1rem;
  color: #c9a84c;
  margin: 0 0 4px;
  letter-spacing: 1px;
}
.eco-table-hint {
  font-family: sans-serif;
  font-size: 0.78rem;
  color: #8b7355;
  margin: 0;
}
.eco-table-hint strong { color: #c9a84c; }

.eco-table-wrap {
  flex: 1;
  overflow-y: auto;
  border: 1px solid #3d2e1a;
  border-radius: 8px;
}

.eco-table {
  width: 100%;
  border-collapse: collapse;
  font-family: sans-serif;
  table-layout: fixed;
}

/* Column widths */
.col-feudo   { width: 180px; }
.col-terreno  { width: 110px; }
.col-pop      { width: 80px; }
.col-food     { width: 90px; }
.col-autonomy { width: 90px; }
.col-farm     { width: 90px; }
.col-cost     { width: 110px; }
.col-action   { width: 110px; }

.autonomy-val      { font-weight: 600; }
.autonomy-val.autonomy-ok  { color: #4caf50; }
.autonomy-val.autonomy-low { color: #ff6b6b; }

.eco-table thead th {
  background: #1a1208;
  color: #7c5c1e;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  font-weight: 700;
  padding: 10px 12px;
  border-bottom: 1px solid #3d2e1a;
  border-right: 1px solid #2a1f0e;
  text-align: left;
  position: sticky;
  top: 0;
  z-index: 1;
}
.eco-table thead th:last-child { border-right: none; }

.eco-table tbody tr {
  border-bottom: 1px solid #2a1f0e;
  transition: background 0.1s;
}
.eco-table tbody tr:hover { background: rgba(201,168,76,0.04); }
.eco-table tbody tr.row-capital { background: rgba(201,168,76,0.06); }
.eco-table tbody tr.row-capital:hover { background: rgba(201,168,76,0.10); }

.eco-table tbody td {
  padding: 9px 12px;
  border-right: 1px solid #2a1f0e;
  color: #c8b898;
  font-size: 0.82rem;
  vertical-align: middle;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.eco-table tbody td:last-child { border-right: none; }

.td-feudo { color: #e8d5b5; }
.td-terrain { color: #a89070; font-size: 0.78rem; }
.td-number { text-align: right; color: #a89070; font-variant-numeric: tabular-nums; }

.capital-badge { margin-right: 4px; }
.feudo-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.farm-level { font-weight: 700; color: #c8b898; }
.farm-level.level-max { color: #fbbf24; }

.level-max-text { font-size: 0.75rem; color: #5d4e37; }
.no-farm-text { font-size: 0.75rem; color: #5d4e37; }
.cost-val { font-variant-numeric: tabular-nums; color: #a89070; }

/* Upgrade button */
.upgrade-btn {
  padding: 5px 10px;
  background: #2d1f0a;
  border: 1px solid #c9a84c;
  border-radius: 5px;
  color: #fbbf24;
  font-size: 0.75rem;
  font-family: sans-serif;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
}
.upgrade-btn:hover:not(:disabled) { background: #3d2d10; }
.upgrade-btn:disabled, .upgrade-btn--disabled {
  opacity: 0.5;
  cursor: not-allowed;
  border-color: #5d4e37;
  color: #8b7355;
}

/* Gold bar */
.eco-gold-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: rgba(0,0,0,0.25);
  border: 1px solid #3d2e1a;
  border-radius: 6px;
  flex-shrink: 0;
}
.eco-gold-label {
  font-family: sans-serif;
  font-size: 0.78rem;
  color: #8b7355;
}
.eco-gold-val {
  font-family: sans-serif;
  font-size: 0.95rem;
  font-weight: 700;
  color: #fbbf24;
}

/* Feedback messages */
.eco-upgrade-error {
  font-family: sans-serif;
  font-size: 0.80rem;
  color: #f87171;
  padding: 6px 10px;
  background: rgba(239,68,68,0.08);
  border: 1px solid rgba(239,68,68,0.2);
  border-radius: 5px;
  flex-shrink: 0;
}
.eco-upgrade-ok {
  font-family: sans-serif;
  font-size: 0.80rem;
  color: #86efac;
  padding: 6px 10px;
  background: rgba(134,239,172,0.08);
  border: 1px solid rgba(134,239,172,0.2);
  border-radius: 5px;
  flex-shrink: 0;
}

.eco-loading { color: #8b7355; font-style: italic; font-size: 0.82rem; font-family: sans-serif; }
.eco-error   { color: #f87171; font-size: 0.82rem; font-family: sans-serif; }
.eco-loading-center, .eco-error-center {
  text-align: center;
  padding: 40px;
  flex: 1;
}

/* Terrain filter */
.terrain-filter-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.terrain-btn {
  width: 100%;
  text-align: left;
  padding: 6px 10px;
  background: transparent;
  border: 1px solid #3d2e1a;
  border-radius: 5px;
  color: #8b7355;
  font-family: sans-serif;
  font-size: 0.80rem;
  cursor: pointer;
  transition: all 0.12s;
}
.terrain-btn:hover { background: rgba(255,255,255,0.04); color: #c8b898; }
.terrain-btn.active {
  background: rgba(201,168,76,0.12);
  border-color: #c9a84c;
  color: #fbbf24;
  font-weight: 600;
}
</style>
