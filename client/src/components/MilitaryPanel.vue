<template>
  <div class="military-panel">
    <div class="recruitment-header">
      <h3>⚔️ Reclutamiento de Tropas</h3>
      <p v-if="fief" class="recruitment-subtitle">
        Reclutando en <strong>{{ fief.name }}</strong>
      </p>
      <p v-else class="recruitment-subtitle">Selecciona un feudo desde la tabla para reclutar</p>
    </div>

    <div class="recruitment-content" v-if="fief">
      <!-- Resources Recap -->
      <div class="recruitment-section current-fief-mini">
        <div class="fief-resources-compact">
          <div class="resource-pill">💰 Oro: {{ formatNumber(playerGold) }}</div>
          <div class="resource-pill">🌲 Madera: {{ formatNumber(fief.wood) }}</div>
          <div class="resource-pill">⛰️ Piedra: {{ formatNumber(fief.stone) }}</div>
          <div class="resource-pill">⛏️ Hierro: {{ formatNumber(fief.iron) }}</div>
        </div>
        <button class="btn-back-to-fiefs" @click="$emit('back')">
          ← Volver a la lista de feudos
        </button>
      </div>

      <!-- Unit Type Selection -->
      <div class="recruitment-section">
        <h4>1. Selecciona Tipo de Unidad</h4>
        <div v-if="loading" class="loading-text">Cargando unidades...</div>
        <div v-else class="unit-types-grid">
          <div
            v-for="unit in unitTypes"
            :key="unit.unit_type_id"
            :class="[
              'unit-card',
              {
                selected: selectedUnit?.unit_type_id === unit.unit_type_id,
                'unit-affordable': canAffordAtLeastOne(unit),
                'unit-unaffordable': !canAffordAtLeastOne(unit)
              }
            ]"
            @click="selectUnit(unit)"
          >
            <div class="unit-card-header">
              <h5>{{ unit.name }}</h5>
              <span class="unit-stats">
                ⚔️{{ unit.attack }} ❤️{{ unit.health_points }} 🏃{{ unit.speed }}
              </span>
            </div>
            <p class="unit-flavor">{{ unit.descrip }}</p>
            <div class="unit-requirements">
              <strong>Costo por unidad:</strong>
              <div class="req-list">
                <span
                  v-for="req in unit.requirements"
                  :key="req.resource_type"
                  :class="[
                    'req-item',
                    {
                      'req-insufficient': isInsufficient(req)
                    }
                  ]"
                >
                  {{ getResourceIcon(req.resource_type) }} {{ req.amount }}
                </span>
              </div>
            </div>
            <div v-if="!canAffordAtLeastOne(unit)" class="insufficient-fief-resources">
              Recursos locales insuficientes
            </div>
            <div class="unit-upkeep">
              <small>Manutención: 💰{{ unit.gold_upkeep }}/turno 🌾{{ unit.food_consumption }}/turno</small>
            </div>
          </div>
        </div>
      </div>

      <!-- Recruitment Form -->
      <div v-if="selectedUnit" class="recruitment-section recruitment-form">
        <h4>2. Configurar Reclutamiento</h4>
        <div class="form-grid">
          <div class="form-group">
            <label>Cantidad:</label>
            <input
              v-model.number="quantity"
              type="number"
              min="1"
              max="1000"
              class="recruitment-input"
              @input="enforcePositiveQuantity"
            />
          </div>
          <div class="form-group">
            <label>Nombre del Ejército:</label>
            <input
              v-model="armyName"
              type="text"
              placeholder="Ej: Guardia Real"
              maxlength="100"
              class="recruitment-input"
            />
          </div>
        </div>

        <div class="total-cost">
          <h5>Costo Total:</h5>
          <div class="cost-breakdown">
            <span
              v-for="req in selectedUnit.requirements"
              :key="req.resource_type"
              :class="[
                'cost-item',
                { 'cost-insufficient': isInsufficientTotal(req) }
              ]"
            >
              {{ getResourceIcon(req.resource_type) }} {{ req.amount * quantity }}
            </span>
          </div>
        </div>

        <div class="total-upkeep">
          <h5>⚠️ Mantenimiento por Turno:</h5>
          <div class="upkeep-breakdown">
            <span class="upkeep-item">💰 Oro: {{ totalUpkeep.gold }}/turno</span>
            <span class="upkeep-item">🌾 Comida: {{ totalUpkeep.food }}/turno</span>
          </div>
          <p class="upkeep-warning">Estas tropas consumirán estos recursos cada turno. Asegúrate de tener producción suficiente.</p>
        </div>

        <button
          class="btn-recruit"
          :disabled="!isValid || isRecruiting"
          @click="handleRecruit"
        >
          {{ isRecruiting ? 'Reclutando...' : `⚔️ Reclutar ${quantity} ${selectedUnit.name}` }}
        </button>
      </div>
    </div>
    
    <div v-else class="empty-state">
      <p>Debes seleccionar un feudo desde la tabla del reino para reclutar tropas.</p>
      <button class="btn-back-to-fiefs" @click="$emit('back')">Ver Lista de Feudos</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  fief: Object,
  unitTypes: Array,
  loading: Boolean,
  playerGold: Number,
  isRecruiting: Boolean
});

const emit = defineEmits(['recruit', 'back']);

const selectedUnit = ref(null);
const quantity = ref(1);
const armyName = ref('');

const selectUnit = (unit) => {
  selectedUnit.value = unit;
  if (!armyName.value) armyName.value = 'Guarnición Local';
};

const enforcePositiveQuantity = () => {
  if (quantity.value < 1 || isNaN(quantity.value)) {
    quantity.value = 1;
  }
};

const formatNumber = (val) => {
  if (val === null || val === undefined || isNaN(val)) return '0';
  return Math.round(val).toLocaleString();
};

const getResourceIcon = (type) => {
  const icons = {
    'gold': '💰',
    'wood_stored': '🌲',
    'stone_stored': '⛰️',
    'iron_stored': '⛏️'
  };
  return icons[type] || '📦';
};

const isInsufficient = (req) => {
  if (!props.fief) return false;
  const type = req.resource_type;
  if (type === 'gold') return props.playerGold < req.amount;
  if (type === 'wood_stored') return (props.fief.wood || 0) < req.amount;
  if (type === 'stone_stored') return (props.fief.stone || 0) < req.amount;
  if (type === 'iron_stored') return (props.fief.iron || 0) < req.amount;
  return false;
};

const isInsufficientTotal = (req) => {
  if (!props.fief) return false;
  const total = req.amount * quantity.value;
  const type = req.resource_type;
  if (type === 'gold') return props.playerGold < total;
  if (type === 'wood_stored') return (props.fief.wood || 0) < total;
  if (type === 'stone_stored') return (props.fief.stone || 0) < total;
  if (type === 'iron_stored') return (props.fief.iron || 0) < total;
  return false;
};

const canAffordAtLeastOne = (unit) => {
  return unit.requirements.every(req => !isInsufficient(req));
};

const isValid = computed(() => {
  if (!selectedUnit.value || quantity.value <= 0 || !armyName.value.trim()) return false;
  return selectedUnit.value.requirements.every(req => !isInsufficientTotal(req));
});

const totalUpkeep = computed(() => {
  if (!selectedUnit.value || quantity.value <= 0) {
    return { gold: 0, food: 0 };
  }
  return {
    gold: (selectedUnit.value.gold_upkeep || 0) * quantity.value,
    food: (selectedUnit.value.food_consumption || 0) * quantity.value
  };
});

const handleRecruit = () => {
  emit('recruit', {
    fief: props.fief,
    unit: selectedUnit.value,
    unit_type_id: selectedUnit.value.unit_type_id,
    quantity: quantity.value,
    armyName: armyName.value.trim()
  });
};
</script>

<style scoped>
.military-panel {
  padding: 20px;
  color: #e8d5b5;
}

.recruitment-header {
  text-align: center;
  margin-bottom: 30px;
  border-bottom: 2px solid #c5a059;
  padding-bottom: 15px;
}

.recruitment-header h3 { font-family: 'Cinzel', serif; font-size: 1.8rem; color: #ffd700; margin: 0; }
.recruitment-subtitle { color: #a89875; margin-top: 5px; }

.fief-resources-compact {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 15px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 6px;
  border: 1px solid rgba(255, 215, 0, 0.3);
}

.resource-pill {
  padding: 6px 14px;
  background: rgba(26, 22, 18, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
}

.recruitment-section {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(197, 160, 89, 0.2);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.recruitment-section h4 { color: #ffd700; margin: 0 0 15px 0; border-bottom: 1px solid rgba(255, 215, 0, 0.1); padding-bottom: 8px; }

.unit-types-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 15px;
}

.unit-card {
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.2s;
}

.unit-card:hover { transform: translateY(-3px); border-color: #c5a059; }
.unit-card.selected { border-color: #ffd700; background: rgba(255, 215, 0, 0.05); }

.unit-card.unit-unaffordable { opacity: 0.6; filter: grayscale(0.5); cursor: not-allowed; }

.unit-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.unit-card-header h5 { margin: 0; color: #ffd700; font-size: 1.1rem; }
.unit-stats { font-size: 0.8rem; opacity: 0.8; }
.unit-flavor { font-size: 0.8rem; font-style: italic; opacity: 0.6; height: 3em; overflow: hidden; }

.req-list { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 5px; }
.req-item { font-size: 0.8rem; padding: 2px 6px; background: rgba(0, 255, 0, 0.1); border-radius: 3px; }
.req-item.req-insufficient { color: #ff6b6b; background: rgba(255, 0, 0, 0.1); text-decoration: line-through; }

.insufficient-fief-resources { color: #ff6b6b; font-size: 0.75rem; text-align: center; margin-top: 8px; font-style: italic; }

.form-grid { display: grid; gap: 15px; margin-bottom: 15px; }
.form-group label { display: block; font-size: 0.8rem; color: #a89875; margin-bottom: 5px; }
.recruitment-input { width: 100%; background: #111; border: 1px solid #444; color: white; padding: 8px; border-radius: 4px; }

.cost-breakdown { display: flex; gap: 10px; flex-wrap: wrap; }
.cost-item { background: rgba(255, 255, 255, 0.05); padding: 5px 10px; border-radius: 4px; font-weight: bold; }
.cost-item.cost-insufficient { color: #ff6b6b; border: 1px solid #ff6b6b; }

.total-upkeep {
  background: rgba(255, 165, 0, 0.1);
  border: 2px solid rgba(255, 165, 0, 0.4);
  border-radius: 8px;
  padding: 15px;
  margin-top: 15px;
  margin-bottom: 15px;
}

.total-upkeep h5 {
  color: #ffa500;
  margin: 0 0 10px 0;
  font-size: 1rem;
  border: none;
}

.upkeep-breakdown {
  display: flex;
  gap: 15px;
  margin-bottom: 10px;
}

.upkeep-item {
  background: rgba(0, 0, 0, 0.4);
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: bold;
  font-size: 1.1rem;
  border: 1px solid rgba(255, 165, 0, 0.3);
}

.upkeep-warning {
  margin: 0;
  font-size: 0.85rem;
  color: #ffa500;
  font-style: italic;
  opacity: 0.9;
}

.btn-recruit {
  width: 100%;
  padding: 12px;
  background: #c5a059;
  border: none;
  color: #111;
  font-weight: bold;
  font-family: 'Cinzel', serif;
  cursor: pointer;
  border-radius: 4px;
}

.btn-recruit:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-back-to-fiefs {
  background: transparent;
  border: 1px solid #c5a059;
  color: #c5a059;
  padding: 5px 15px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  width: 100%;
}
</style>
