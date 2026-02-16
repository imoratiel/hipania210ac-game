<template>
  <Teleport to="body">
    <div v-if="show" class="bsm-backdrop" @click.self="$emit('close')">
      <div class="bsm-box" role="dialog" aria-modal="true">

        <!-- Título dinámico -->
        <div class="bsm-header" :class="headerClass">
          <span class="bsm-icon">{{ resultIcon }}</span>
          <span class="bsm-title">{{ resultLabel }}</span>
        </div>

        <!-- Nombre del feudo -->
        <p class="bsm-fief-name">{{ battle.fief_name }}</p>

        <!-- Tabla comparativa -->
        <table class="bsm-table">
          <thead>
            <tr>
              <th>Concepto</th>
              <th>Tus Tropas</th>
              <th>Milicia del Feudo</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Efectivos</td>
              <td>{{ battle.attacker_total ?? '—' }}</td>
              <td>{{ battle.militia_count ?? '—' }}</td>
            </tr>
            <tr class="bsm-losses-row">
              <td>Bajas</td>
              <td class="bsm-losses-attacker">{{ battle.attacker_losses }}</td>
              <td class="bsm-losses-defender">{{ battle.defender_losses }}</td>
            </tr>
          </tbody>
        </table>

        <!-- Pie -->
        <p class="bsm-summary-text">{{ battle.message }}</p>
        <button class="bsm-close-btn" @click="$emit('close')">Cerrar</button>

      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps({
  show: { type: Boolean, default: false },
  battle: { type: Object, default: () => ({}) }
});

const emit = defineEmits(['close']);

const headerClass = computed(() => {
  switch (props.battle?.result) {
    case 'victory': return 'bsm-victory';
    case 'defeat':  return 'bsm-defeat';
    case 'draw':    return 'bsm-draw';
    default:        return '';
  }
});

const resultIcon = computed(() => {
  switch (props.battle?.result) {
    case 'victory': return '🏆';
    case 'defeat':  return '💀';
    case 'draw':    return '⚖️';
    default:        return '⚔️';
  }
});

const resultLabel = computed(() => {
  switch (props.battle?.result) {
    case 'victory': return 'VICTORIA';
    case 'defeat':  return 'DERROTA';
    case 'draw':    return 'TABLAS';
    default:        return '—';
  }
});

const handleEsc = (e) => { if (e.key === 'Escape') emit('close'); };

watch(() => props.show, (val) => {
  if (val) {
    document.addEventListener('keydown', handleEsc);
  } else {
    document.removeEventListener('keydown', handleEsc);
  }
});

onUnmounted(() => { document.removeEventListener('keydown', handleEsc); });
</script>

<style scoped>
.bsm-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.bsm-box {
  background: #1a1a2e;
  border: 1px solid #3a3a5c;
  border-radius: 10px;
  width: 100%;
  max-width: 380px;
  padding: 0;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  font-family: inherit;
}

/* Header */
.bsm-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: 2px;
}
.bsm-icon { font-size: 1.5rem; }
.bsm-title { flex: 1; }

.bsm-victory { background: #14532d; color: #4ade80; border-bottom: 2px solid #16a34a; }
.bsm-defeat  { background: #450a0a; color: #f87171; border-bottom: 2px solid #dc2626; }
.bsm-draw    { background: #422006; color: #fbbf24; border-bottom: 2px solid #d97706; }

/* Body */
.bsm-fief-name {
  margin: 14px 20px 4px;
  font-size: 0.85rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.bsm-table {
  width: calc(100% - 40px);
  margin: 8px 20px 12px;
  border-collapse: collapse;
  font-size: 0.88rem;
}
.bsm-table th {
  color: #6b7280;
  font-weight: 600;
  padding: 6px 8px;
  text-align: center;
  border-bottom: 1px solid #2d2d4a;
  font-size: 0.78rem;
  text-transform: uppercase;
}
.bsm-table th:first-child { text-align: left; }
.bsm-table td {
  padding: 8px 8px;
  text-align: center;
  color: #e2e8f0;
  border-bottom: 1px solid #1e1e38;
}
.bsm-table td:first-child { text-align: left; color: #9ca3af; }

.bsm-losses-row td { font-weight: 700; }
.bsm-losses-attacker { color: #f87171; }
.bsm-losses-defender { color: #fb923c; }

/* Footer */
.bsm-summary-text {
  margin: 4px 20px 16px;
  font-size: 0.9rem;
  color: #d1d5db;
  font-style: italic;
}

.bsm-close-btn {
  display: block;
  width: calc(100% - 40px);
  margin: 0 20px 20px;
  padding: 10px;
  background: #2d2d4a;
  border: 1px solid #3a3a5c;
  border-radius: 6px;
  color: #e2e8f0;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.15s;
}
.bsm-close-btn:hover { background: #3a3a5c; }
</style>
