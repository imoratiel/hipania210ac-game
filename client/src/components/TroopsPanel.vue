<template>
  <div class="troops-panel">
    <div class="troops-header">
      <h3>⚔️ Panel de Tropas</h3>
      <p class="troops-subtitle">Visión global de todas las fuerzas militares activas</p>
    </div>

    <div v-if="loading" class="loading-text">Cargando tropas...</div>

    <div v-else-if="troops.length === 0" class="empty-state">
      <p>No tienes tropas reclutadas.</p>
      <p class="empty-hint">Ve a la lista de feudos para reclutar tu primera unidad.</p>
    </div>

    <div v-else class="troops-content">
      <div class="troops-summary">
        <div class="summary-stat">
          <span class="stat-label">Total de Ejércitos:</span>
          <span class="stat-value">{{ totalArmies }}</span>
        </div>
        <div class="summary-stat">
          <span class="stat-label">Total de Tropas:</span>
          <span class="stat-value">{{ totalUnits }}</span>
        </div>
        <div class="summary-stat">
          <span class="stat-label">Moral Promedio:</span>
          <span class="stat-value">{{ averageMorale }}%</span>
        </div>
      </div>

      <div class="troops-table-container">
        <table class="troops-table">
          <thead>
            <tr>
              <th>Unidad</th>
              <th>Cantidad</th>
              <th>Stats</th>
              <th>Estado</th>
              <th>Ubicación</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="troop in troops" :key="troop.troop_id" class="troop-row">
              <td class="unit-cell">
                <div class="unit-name">{{ troop.unit_name }}</div>
              </td>
              <td class="quantity-cell">
                <span class="quantity-badge">{{ troop.quantity }}</span>
              </td>
              <td class="stats-cell">
                <div class="stats-icons">
                  <span class="stat-item" title="Ataque">⚔️ {{ troop.attack }}</span>
                  <span class="stat-item" title="Puntos de Vida">❤️ {{ troop.health_points }}</span>
                  <span class="stat-item" title="Velocidad">🏃 {{ troop.speed }}</span>
                </div>
              </td>
              <td class="status-cell">
                <div class="status-bars">
                  <div class="status-item">
                    <span class="status-label">Moral:</span>
                    <div class="progress-bar">
                      <div
                        class="progress-fill morale"
                        :style="{ width: troop.morale + '%' }"
                        :class="getMoraleClass(troop.morale)"
                      ></div>
                      <span class="progress-text">{{ Math.round(troop.morale) }}%</span>
                    </div>
                  </div>
                  <div class="status-item">
                    <span class="status-label">Exp:</span>
                    <div class="progress-bar">
                      <div
                        class="progress-fill experience"
                        :style="{ width: troop.experience + '%' }"
                      ></div>
                      <span class="progress-text">{{ Math.round(troop.experience) }}%</span>
                    </div>
                  </div>
                </div>
              </td>
              <td class="location-cell">
                <div class="location-info">
                  <div class="army-name">{{ troop.army_name }}</div>
                  <div class="h3-index">{{ troop.h3_index }}</div>
                  <div class="rest-level" :class="getRestClass(troop.rest_level)">
                    🛡️ Descanso: {{ Math.round(troop.rest_level) }}%
                  </div>
                </div>
              </td>
              <td class="actions-cell">
                <button
                  class="btn-locate"
                  @click="handleLocate(troop)"
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
  troops: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['locate']);

const totalArmies = computed(() => {
  const uniqueArmies = new Set(props.troops.map(t => t.army_id));
  return uniqueArmies.size;
});

const totalUnits = computed(() => {
  return props.troops.reduce((sum, troop) => sum + troop.quantity, 0);
});

const averageMorale = computed(() => {
  if (props.troops.length === 0) return 0;
  const totalMorale = props.troops.reduce((sum, troop) => sum + troop.morale, 0);
  return Math.round(totalMorale / props.troops.length);
});

const getMoraleClass = (morale) => {
  if (morale >= 70) return 'high';
  if (morale >= 40) return 'medium';
  return 'low';
};

const getRestClass = (restLevel) => {
  if (restLevel >= 70) return 'rested';
  if (restLevel >= 40) return 'tired';
  return 'exhausted';
};

const handleLocate = (troop) => {
  emit('locate', {
    h3_index: troop.h3_index,
    army_name: troop.army_name,
    army_id: troop.army_id
  });
};
</script>

<style scoped>
.troops-panel {
  padding: 20px;
  color: #e8d5b5;
  height: 100%;
  overflow-y: auto;
}

.troops-header {
  text-align: center;
  margin-bottom: 25px;
  border-bottom: 2px solid #c5a059;
  padding-bottom: 15px;
}

.troops-header h3 {
  font-family: 'Cinzel', serif;
  font-size: 1.8rem;
  color: #ffd700;
  margin: 0;
}

.troops-subtitle {
  color: #a89875;
  margin-top: 5px;
  font-size: 0.9rem;
}

.loading-text {
  text-align: center;
  padding: 40px;
  font-size: 1.1rem;
  color: #a89875;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(197, 160, 89, 0.2);
  border-radius: 8px;
  margin-top: 20px;
}

.empty-state p {
  font-size: 1.1rem;
  color: #a89875;
  margin: 10px 0;
}

.empty-hint {
  font-size: 0.9rem;
  font-style: italic;
  opacity: 0.7;
}

.troops-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.troops-summary {
  display: flex;
  justify-content: space-around;
  gap: 20px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 8px;
  padding: 20px;
}

.summary-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.stat-label {
  font-size: 0.85rem;
  color: #a89875;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: bold;
  color: #ffd700;
  font-family: 'Cinzel', serif;
}

.troops-table-container {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(197, 160, 89, 0.2);
  border-radius: 8px;
  padding: 15px;
  overflow-x: auto;
}

.troops-table {
  width: 100%;
  border-collapse: collapse;
}

.troops-table thead th {
  background: rgba(0, 0, 0, 0.4);
  color: #ffd700;
  padding: 12px 10px;
  text-align: left;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-bottom: 2px solid #c5a059;
  font-family: 'Cinzel', serif;
}

.troop-row {
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: background 0.2s;
}

.troop-row:hover {
  background: rgba(197, 160, 89, 0.1);
}

.troops-table td {
  padding: 12px 10px;
  font-size: 0.9rem;
}

.unit-cell {
  font-weight: 600;
  color: #ffd700;
}

.unit-name {
  font-size: 1rem;
}

.quantity-cell {
  text-align: center;
}

.quantity-badge {
  background: rgba(255, 215, 0, 0.2);
  border: 1px solid #ffd700;
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: bold;
  color: #ffd700;
}

.stats-cell {
  white-space: nowrap;
}

.stats-icons {
  display: flex;
  gap: 10px;
}

.stat-item {
  font-size: 0.85rem;
  padding: 3px 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

.status-cell {
  min-width: 200px;
}

.status-bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-label {
  font-size: 0.75rem;
  color: #a89875;
  min-width: 40px;
}

.progress-bar {
  position: relative;
  flex: 1;
  height: 18px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
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
  font-size: 0.7rem;
  font-weight: bold;
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

.location-cell {
  min-width: 180px;
}

.location-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.army-name {
  font-weight: 600;
  color: #ffd700;
  font-size: 0.95rem;
}

.h3-index {
  font-size: 0.75rem;
  color: #a89875;
  font-family: monospace;
}

.rest-level {
  font-size: 0.75rem;
  padding: 2px 6px;
  border-radius: 3px;
  display: inline-block;
}

.rest-level.rested {
  color: #4caf50;
  background: rgba(76, 175, 80, 0.1);
}

.rest-level.tired {
  color: #ff9800;
  background: rgba(255, 152, 0, 0.1);
}

.rest-level.exhausted {
  color: #f44336;
  background: rgba(244, 67, 54, 0.1);
}

.actions-cell {
  text-align: center;
}

.btn-locate {
  background: #c5a059;
  border: none;
  color: #111;
  padding: 6px 14px;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
  font-family: 'Cinzel', serif;
}

.btn-locate:hover {
  background: #ffd700;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}
</style>
