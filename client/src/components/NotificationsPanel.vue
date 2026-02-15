<template>
  <div class="notifications-panel">
    <div v-if="loading" class="notif-loading">Cargando notificaciones...</div>

    <div v-else-if="notifications.length === 0" class="notif-empty">
      <p>No tienes notificaciones.</p>
    </div>

    <div v-else class="notif-list">
      <div
        v-for="notif in notifications"
        :key="notif.id"
        class="notif-card"
        :class="{ 'notif-unread': !notif.is_read, [`notif-type-${notif.type?.toLowerCase()}`]: true }"
        @click="handleRead(notif)"
      >
        <div class="notif-header">
          <span class="notif-type-badge">{{ typeLabel(notif.type) }}</span>
          <span class="notif-turn">Turno {{ notif.turn_number }}</span>
        </div>
        <div class="notif-content">{{ notif.content }}</div>
        <div v-if="!notif.is_read" class="notif-unread-dot"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  notifications: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
});

const emit = defineEmits(['read']);

const TYPE_LABELS = {
  HARVEST: '🌾 Cosecha',
  PRODUCTION: '🏭 Producción',
  EXPLORATION: '🔍 Exploración',
  COMBAT: '⚔️ Combate',
  MOVEMENT: '🚶 Movimiento',
};

const typeLabel = (type) => TYPE_LABELS[type] || `📢 ${type || 'Sistema'}`;

const handleRead = (notif) => {
  emit('read', notif);
};
</script>

<style scoped>
.notifications-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  padding: 12px 16px;
  gap: 10px;
  color: #e8d5b5;
}

.notif-loading,
.notif-empty {
  text-align: center;
  padding: 40px 20px;
  color: #a89875;
  font-size: 1rem;
}

.notif-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.notif-card {
  position: relative;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(197, 160, 89, 0.25);
  border-radius: 8px;
  padding: 12px 14px;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}

.notif-card:hover {
  background: rgba(197, 160, 89, 0.12);
  border-color: rgba(197, 160, 89, 0.5);
}

.notif-unread {
  border-left: 3px solid #ffd700;
  background: rgba(255, 215, 0, 0.06);
}

.notif-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.notif-type-badge {
  font-size: 0.78rem;
  font-weight: 700;
  color: #ffd700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.notif-turn {
  font-size: 0.75rem;
  color: #a89875;
  font-family: monospace;
}

.notif-content {
  font-size: 0.88rem;
  color: #d4c4a0;
  white-space: pre-line;
  line-height: 1.5;
}

.notif-unread-dot {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ffd700;
}
</style>
