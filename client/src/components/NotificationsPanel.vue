<template>
  <div class="notifications-panel">

    <!-- Barra superior: contador de no leídas + acción -->
    <div v-if="!loading && notifications.length > 0" class="notif-topbar">
      <span class="notif-summary">
        <template v-if="unreadCount > 0">
          <span class="unread-badge">{{ unreadCount }}</span> sin leer
        </template>
        <template v-else>✅ Todo al día</template>
      </span>
      <button
        class="mark-all-btn"
        :disabled="unreadCount === 0 || markingAll"
        @click="handleMarkAll"
      >{{ markingAll ? '⏳' : '✓ Marcar todas' }}</button>
    </div>

    <!-- Estados globales -->
    <div v-if="loading" class="notif-empty">Cargando notificaciones...</div>
    <div v-else-if="notifications.length === 0" class="notif-empty">No tienes notificaciones.</div>

    <!-- Secciones agrupadas -->
    <template v-else>
      <section
        v-for="cat in CATEGORIES"
        :key="cat.key"
        v-show="grouped[cat.key]?.length"
        class="notif-category"
        :class="{ 'cat-critical': cat.critical }"
      >
        <!-- Cabecera de sección -->
        <header class="cat-header" :style="{ '--cat-color': cat.color, '--cat-border': cat.border }">
          <span class="cat-icon">{{ cat.icon }}</span>
          <span class="cat-label">{{ cat.label }}</span>
          <span class="cat-count">{{ grouped[cat.key]?.length }}</span>
        </header>

        <!-- Tarjetas -->
        <div class="notif-list">
          <article
            v-for="notif in grouped[cat.key]"
            :key="notif.id"
            class="notif-card"
            :class="{ 'notif-unread': !notif.is_read }"
            :style="{ '--cat-color': cat.color }"
            @click="handleRead(notif)"
          >
            <div class="notif-meta">
              <span class="notif-turn">{{ turnToGameDate(notif.turn_number) }}</span>
              <span v-if="!notif.is_read" class="notif-unread-dot"></span>
            </div>
            <p class="notif-content">{{ notif.content }}</p>
          </article>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { markAllNotificationsRead } from '../services/mapApi.js';

const props = defineProps({
  notifications: { type: Array, default: () => [] },
  loading:       { type: Boolean, default: false },
  currentTurn:   { type: Number, default: 0 },
  gameDate:      { type: Date,   default: null },
});

// ── Categorías — orden fijo: críticas primero ─────────────────────────────────
const CATEGORIES = [
  { key: 'Militar',   icon: '⚔️', label: 'Militar',   color: '#e57373', border: 'rgba(229,115,115,0.55)', critical: true  },
  { key: 'Hambre',    icon: '🚨', label: 'Hambre',    color: '#ff8a65', border: 'rgba(255,138,101,0.55)', critical: true  },
  { key: 'Económico', icon: '💰', label: 'Económico', color: '#81c784', border: 'rgba(129,199,132,0.45)', critical: false },
  { key: 'Impuestos', icon: '📜', label: 'Impuestos', color: '#ffd700', border: 'rgba(255,215,0,  0.45)', critical: false },
  { key: 'General',   icon: '📢', label: 'General',   color: '#a89875', border: 'rgba(168,152,117,0.35)', critical: false },
];

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const turnToGameDate = (n) => {
  if (!props.currentTurn || !props.gameDate || !n) return n ? `Turno ${n}` : '';
  const d = new Date(props.gameDate);
  d.setDate(d.getDate() - (props.currentTurn - n));
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

const emit = defineEmits(['read', 'readAll']);
const markingAll = ref(false);

const unreadCount = computed(() => props.notifications.filter(n => !n.is_read).length);

// ── Agrupación client-side ────────────────────────────────────────────────────
const validKeys = new Set(CATEGORIES.map(c => c.key));
const grouped = computed(() =>
  props.notifications.reduce((acc, n) => {
    const key = validKeys.has(n.type) ? n.type : 'General';
    (acc[key] ??= []).push(n);
    return acc;
  }, {})
);

const handleRead = (notif) => emit('read', notif);

const handleMarkAll = async () => {
  if (unreadCount.value === 0 || markingAll.value) return;
  markingAll.value = true;
  try {
    await markAllNotificationsRead();
    emit('readAll');
  } catch (err) {
    console.error('Error al marcar notificaciones:', err);
  } finally {
    markingAll.value = false;
  }
};
</script>

<style scoped>
.notifications-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  padding: 12px 16px;
  gap: 14px;
  color: #e8d5b7;
}

/* ── Barra superior ──────────────────────────── */
.notif-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(197, 160, 89, 0.15);
  flex-shrink: 0;
}

.notif-summary {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 0.82rem;
  color: #a89875;
}

.unread-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  background: rgba(255, 215, 0, 0.2);
  color: #ffd700;
  font-size: 0.75rem;
  font-weight: 700;
}

.mark-all-btn {
  padding: 4px 12px;
  border-radius: 6px;
  border: 1px solid rgba(197, 160, 89, 0.3);
  background: rgba(197, 160, 89, 0.07);
  color: #a89875;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
  white-space: nowrap;
}
.mark-all-btn:hover:not(:disabled) {
  background: rgba(197, 160, 89, 0.18);
  border-color: rgba(197, 160, 89, 0.6);
  color: #ffd700;
}
.mark-all-btn:disabled { opacity: 0.3; cursor: not-allowed; }

/* ── Estado vacío / carga ────────────────────── */
.notif-empty {
  text-align: center;
  padding: 50px 20px;
  color: #a89875;
  font-size: 0.95rem;
}

/* ── Sección de categoría ────────────────────── */
.notif-category {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

/* Secciones críticas tienen leve glow de fondo */
.cat-critical .cat-header {
  background: rgba(0, 0, 0, 0.45);
}

.cat-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 11px;
  border-radius: 7px;
  background: rgba(0, 0, 0, 0.3);
  border-left: 3px solid var(--cat-border);
  border-top: 1px solid rgba(255, 255, 255, 0.04);
  border-right: 1px solid rgba(255, 255, 255, 0.04);
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.cat-icon { font-size: 1rem; line-height: 1; flex-shrink: 0; }

.cat-label {
  font-family: 'Cinzel', serif;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--cat-color);
  letter-spacing: 1.2px;
  text-transform: uppercase;
  flex: 1;
}

.cat-count {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--cat-color);
  min-width: 20px;
  text-align: center;
}

/* ── Tarjetas ────────────────────────────────── */
.notif-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-left: 10px;
}

.notif-card {
  background: rgba(0, 0, 0, 0.28);
  border: 1px solid rgba(197, 160, 89, 0.14);
  border-left: 2px solid transparent;
  border-radius: 5px;
  padding: 9px 13px;
  cursor: pointer;
  transition: background 0.18s, border-color 0.18s;
}
.notif-card:hover {
  background: rgba(197, 160, 89, 0.07);
  border-color: rgba(197, 160, 89, 0.3);
}

/* No leída: acento de color izquierdo más prominente */
.notif-unread {
  border-left-color: var(--cat-color);
  background: rgba(0, 0, 0, 0.42);
}

.notif-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.notif-turn {
  font-size: 0.7rem;
  color: #7a6a55;
  font-family: monospace;
  letter-spacing: 0.3px;
}

.notif-unread-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--cat-color);
  flex-shrink: 0;
}

.notif-content {
  margin: 0;
  font-size: 0.86rem;
  color: #d0c0a0;
  white-space: pre-line;
  line-height: 1.55;
}
</style>
