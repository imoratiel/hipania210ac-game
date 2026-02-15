<template>
  <div class="troops-panel">
    <div v-if="loading" class="loading-text">Cargando ejércitos...</div>

    <div v-else-if="armies.length === 0" class="empty-state">
      <p>No tienes ejércitos activos.</p>
      <p class="empty-hint">Ve a la lista de feudos para reclutar tu primera unidad.</p>
    </div>

    <div v-else class="troops-content">
      <!-- Summary Row -->
      <div class="troops-summary" style="grid-template-columns: repeat(5, 1fr)">
        <div class="summary-card">
          <div class="card-icon">🏰</div>
          <div class="card-content">
            <span class="card-label">Ejércitos</span>
            <span class="card-value">{{ armies.length }}</span>
          </div>
        </div>
        <div class="summary-card">
          <div class="card-icon">⚔️</div>
          <div class="card-content">
            <span class="card-label">Tropas Totales</span>
            <span class="card-value">{{ totalUnits }}</span>
          </div>
        </div>
        <div class="summary-card">
          <div class="card-icon">💪</div>
          <div class="card-content">
            <span class="card-label">Poder de Combate</span>
            <span class="card-value">{{ totalCombatPower }}</span>
          </div>
        </div>
        <div class="summary-card">
          <div class="card-icon">😊</div>
          <div class="card-content">
            <span class="card-label">Moral Promedio</span>
            <span class="card-value">{{ averageMorale }}%</span>
          </div>
        </div>
        <div class="summary-card">
          <div class="card-icon">🎖️</div>
          <div class="card-content">
            <span class="card-label">Experiencia Promedio</span>
            <span class="card-value">{{ averageExperience }}%</span>
          </div>
        </div>
      </div>

      <!-- Armies Table -->
      <div class="troops-table-container">
        <table class="troops-table">
          <thead>
            <tr>
              <th class="th-unit">Nombre</th>
              <th class="th-quantity">Tropas</th>
              <th class="th-quantity">Fuerza</th>
              <th class="th-status">Estado</th>
              <th class="th-location">Ubicación</th>
              <th class="th-actions">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="army in armies" :key="army.army_id" class="troop-row">
              <td class="unit-cell">
                <div class="unit-name">{{ army.name }}</div>
              </td>
              <td class="quantity-cell">
                <span class="quantity-badge">{{ army.total_troops }}</span>
              </td>
              <td class="quantity-cell">
                <span class="quantity-badge">{{ army.total_combat_power }}</span>
              </td>
              <td class="status-cell">
                <div class="status-bars">
                  <div class="status-item">
                    <span class="status-label">Moral</span>
                    <div class="progress-bar">
                      <div
                        class="progress-fill morale"
                        :style="{ width: army.average_moral + '%' }"
                        :class="getMoraleClass(army.average_moral)"
                      ></div>
                      <span class="progress-text">{{ army.average_moral }}%</span>
                    </div>
                  </div>
                  <div class="status-item">
                    <span class="status-label">Exp</span>
                    <div class="progress-bar">
                      <div
                        class="progress-fill experience"
                        :style="{ width: army.average_experience + '%' }"
                      ></div>
                      <span class="progress-text">{{ army.average_experience }}%</span>
                    </div>
                  </div>
                </div>
              </td>
              <td class="location-cell">
                <div class="location-info">
                  <div v-if="army.location_name" class="army-name">{{ army.location_name }}</div>
                  <div class="h3-index">{{ army.h3_index }}</div>
                  <div class="h3-index">X: {{ army.coord_x }}, Y: {{ army.coord_y }}</div>
                </div>
              </td>
              <td class="actions-cell">
                <button
                  class="btn-locate"
                  @click="handleLocate(army)"
                  title="Centrar mapa en esta ubicación"
                >
                  🔍 Localizar
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  armies: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['locate']);

const totalUnits = computed(() => {
  return props.armies.reduce((sum, a) => sum + (a.total_troops || 0), 0);
});

const totalCombatPower = computed(() => {
  return props.armies.reduce((sum, a) => sum + (a.total_combat_power || 0), 0);
});

const averageMorale = computed(() => {
  if (props.armies.length === 0) return 0;
  const total = props.armies.reduce((sum, a) => sum + (a.average_moral || 0), 0);
  return Math.round(total / props.armies.length);
});

const averageExperience = computed(() => {
  if (props.armies.length === 0) return 0;
  const total = props.armies.reduce((sum, a) => sum + (a.average_experience || 0), 0);
  return Math.round(total / props.armies.length);
});

const getMoraleClass = (morale) => {
  if (morale >= 70) return 'high';
  if (morale >= 40) return 'medium';
  return 'low';
};

const handleLocate = (army) => {
  emit('locate', {
    h3_index: army.h3_index,
    army_name: army.name,
    army_id: army.army_id
  });
};
</script>

<style scoped>
.troops-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  color: #e8d5b5;
  gap: 25px;
  padding: 0;
}

.loading-text {
  text-align: center;
  padding: 60px;
  font-size: 1.5rem;
  color: #a89875;
}

.empty-state {
  text-align: center;
  padding: 80px 40px;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(197, 160, 89, 0.3);
  border-radius: 12px;
  margin: 40px;
}

.empty-state p {
  font-size: 1.3rem;
  color: #a89875;
  margin: 15px 0;
}

.empty-hint {
  font-size: 1.1rem;
  font-style: italic;
  opacity: 0.7;
}

.troops-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 25px;
}

/* Summary Grid */
.troops-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  padding: 0 25px;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 20px;
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid rgba(255, 215, 0, 0.3);
  border-radius: 12px;
  padding: 25px;
  transition: all 0.3s;
}

.summary-card:hover {
  border-color: rgba(255, 215, 0, 0.6);
  background: rgba(0, 0, 0, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
}

.card-icon {
  font-size: 3rem;
  line-height: 1;
  opacity: 0.8;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: 1;
}

.card-label {
  font-size: 0.9rem;
  color: #a89875;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  font-weight: 500;
}

.card-value {
  font-size: 2.5rem;
  font-weight: bold;
  color: #ffd700;
  font-family: 'Cinzel', serif;
  line-height: 1;
}

/* Table Container */
.troops-table-container {
  flex: 1;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(197, 160, 89, 0.3);
  border-radius: 12px;
  margin: 0 25px 25px 25px;
  padding: 20px;
  overflow: auto;
  min-height: 0;
}

.troops-table {
  width: 100%;
  border-collapse: collapse;
}

.troops-table thead th {
  position: sticky;
  top: 0;
  background: rgba(0, 0, 0, 0.8);
  color: #ffd700;
  padding: 18px 15px;
  text-align: left;
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  border-bottom: 3px solid #c5a059;
  font-family: 'Cinzel', serif;
  font-weight: 600;
  z-index: 10;
}

.troop-row {
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  transition: background 0.2s;
}

.troop-row:hover {
  background: rgba(197, 160, 89, 0.15);
}

.troops-table td {
  padding: 18px 15px;
  font-size: 1rem;
  vertical-align: middle;
}

/* Unit Column */
.unit-cell {
  font-weight: 600;
  color: #ffd700;
}

.unit-name {
  font-size: 1.2rem;
  font-family: 'Cinzel', serif;
}

/* Quantity Column */
.quantity-cell {
  text-align: center;
}

.quantity-badge {
  background: rgba(255, 215, 0, 0.2);
  border: 2px solid #ffd700;
  padding: 8px 20px;
  border-radius: 16px;
  font-weight: bold;
  color: #ffd700;
  font-size: 1.1rem;
  display: inline-block;
}

/* Stats Column */
.stats-cell {
  white-space: nowrap;
}

.stats-grid {
  display: flex;
  gap: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 8px 12px;
}

.stat-icon {
  font-size: 1.1rem;
}

.stat-value {
  font-size: 1rem;
  font-weight: 600;
  color: #e8d5b5;
}

/* Status Column */
.status-cell {
  min-width: 250px;
}

.status-bars {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-label {
  font-size: 0.85rem;
  color: #a89875;
  min-width: 45px;
  font-weight: 600;
  text-transform: uppercase;
}

.progress-bar {
  position: relative;
  flex: 1;
  height: 24px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  overflow: hidden;
}

.progress-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  transition: width 0.3s;
}

.progress-fill.morale {
  background: linear-gradient(90deg, #4caf50, #8bc34a);
}

.progress-fill.morale.low {
  background: linear-gradient(90deg, #f44336, #ff5722);
}

.progress-fill.morale.medium {
  background: linear-gradient(90deg, #ff9800, #ffc107);
}

.progress-fill.morale.high {
  background: linear-gradient(90deg, #4caf50, #8bc34a);
}

.progress-fill.experience {
  background: linear-gradient(90deg, #2196f3, #03a9f4);
}

.progress-text {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.8rem;
  font-weight: bold;
  color: white;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.9);
}

/* Location Column */
.location-cell {
  min-width: 220px;
}

.location-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.army-name {
  font-weight: 600;
  color: #ffd700;
  font-size: 1.1rem;
  font-family: 'Cinzel', serif;
}

.h3-index {
  font-size: 0.85rem;
  color: #a89875;
  font-family: monospace;
  opacity: 0.8;
}

.rest-level {
  font-size: 0.85rem;
  padding: 4px 10px;
  border-radius: 4px;
  display: inline-block;
  font-weight: 600;
}

.rest-level.rested {
  color: #4caf50;
  background: rgba(76, 175, 80, 0.2);
  border: 1px solid rgba(76, 175, 80, 0.4);
}

.rest-level.tired {
  color: #ff9800;
  background: rgba(255, 152, 0, 0.2);
  border: 1px solid rgba(255, 152, 0, 0.4);
}

.rest-level.exhausted {
  color: #f44336;
  background: rgba(244, 67, 54, 0.2);
  border: 1px solid rgba(244, 67, 54, 0.4);
}

/* Actions Column */
.actions-cell {
  text-align: center;
}

.btn-locate {
  background: #c5a059;
  border: none;
  color: #111;
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 700;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.2s;
  font-family: 'Cinzel', serif;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.btn-locate:hover {
  background: #ffd700;
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
}

.btn-locate:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}
</style>
