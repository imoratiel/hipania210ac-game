<template>
  <div class="admin-shell">

    <!-- Loading / Access denied -->
    <div v-if="authState !== 'ok'" class="admin-splash">
      <div v-if="authState === 'loading'" class="splash-msg">
        <span class="splash-spinner">⌛</span> Verificando acceso…
      </div>
      <div v-else class="splash-denied">
        <div class="denied-icon">⚔</div>
        <h2>Acceso denegado</h2>
        <p>Necesitas permisos de administrador.</p>
        <a href="/" class="splash-back">← Volver al inicio</a>
      </div>
    </div>

    <template v-else>
      <!-- Sidebar -->
      <nav class="admin-sidebar">
        <div class="sidebar-brand">
          <span class="brand-emblem">⚜</span>
          <div class="brand-text">
            <span class="brand-title">Hispania 210</span>
            <span class="brand-sub">Admin</span>
          </div>
        </div>

        <div class="sidebar-nav">
          <button
            v-for="item in navItems"
            :key="item.id"
            class="nav-item"
            :class="{ active: current === item.id }"
            @click="current = item.id"
          >
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-label">{{ item.label }}</span>
          </button>
        </div>

        <div class="sidebar-footer">
          <div class="sidebar-user">
            <span class="user-icon">👤</span>
            <span class="user-name">{{ userName }}</span>
          </div>
          <a href="/map" class="sidebar-map-link">← Ir al mapa</a>
        </div>
      </nav>

      <!-- Content -->
      <main class="admin-content">
        <component :is="currentView" />
      </main>
    </template>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import DashboardView  from './views/DashboardView.vue'
import TurnConfigView from './views/TurnConfigView.vue'
import BugReportsView from './views/BugReportsView.vue'
import BotsView       from './views/BotsView.vue'
import ActionsView    from './views/ActionsView.vue'
import AuditoriaView  from './views/AuditoriaView.vue'
import PlayersView    from './views/PlayersView.vue'

const authState = ref('loading')
const userName  = ref('')
const current   = ref('dashboard')

const navItems = [
  { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
  { id: 'turns',     icon: '⚙️',  label: 'Motor de turno' },
  { id: 'bots',      icon: '🤖',  label: 'Bots / IA' },
  { id: 'players',   icon: '👥',  label: 'Jugadores' },
  { id: 'bugs',      icon: '🐛',  label: 'Reportes de error' },
  { id: 'auditoria', icon: '👁️',  label: 'Auditoría' },
  { id: 'actions',   icon: '⚠️',  label: 'Acciones' },
]

const viewMap = {
  dashboard: DashboardView,
  turns:     TurnConfigView,
  bots:      BotsView,
  players:   PlayersView,
  bugs:      BugReportsView,
  auditoria: AuditoriaView,
  actions:   ActionsView,
}
const currentView = computed(() => viewMap[current.value] ?? DashboardView)

onMounted(async () => {
  try {
    const { data } = await axios.get('/api/auth/me', { withCredentials: true })
    if (data.success && data.user?.role === 'admin') {
      authState.value = 'ok'
      userName.value  = data.user.display_name || data.user.username
    } else {
      authState.value = 'denied'
    }
  } catch {
    authState.value = 'denied'
  }
})
</script>

<style scoped>
.admin-shell {
  display: flex;
  min-height: 100vh;
  background: #0e0c07;
  font-family: 'EB Garamond', Georgia, serif;
}

/* Splash */
.admin-splash {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
.splash-msg {
  color: #5a4a30;
  font-size: 1rem;
  font-family: 'Cinzel', serif;
  letter-spacing: 1px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.splash-spinner { animation: spin 1.5s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }

.splash-denied {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}
.denied-icon { font-size: 3rem; opacity: 0.4; }
.splash-denied h2 {
  font-family: 'Cinzel', serif;
  color: #c9a84c;
  font-size: 1.2rem;
  letter-spacing: 1px;
}
.splash-denied p { color: #5a4a30; font-size: 0.9rem; }
.splash-back {
  margin-top: 8px;
  color: #c9a84c;
  font-family: 'Cinzel', serif;
  font-size: 0.8rem;
  text-decoration: none;
  letter-spacing: 0.5px;
}
.splash-back:hover { text-decoration: underline; }

/* Sidebar */
.admin-sidebar {
  width: 220px;
  flex-shrink: 0;
  background: #0a0806;
  border-right: 1px solid rgba(201,168,76,0.12);
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 22px 18px;
  border-bottom: 1px solid rgba(201,168,76,0.1);
}
.brand-emblem {
  font-size: 1.4rem;
  color: #c9a84c;
  line-height: 1;
}
.brand-text {
  display: flex;
  flex-direction: column;
}
.brand-title {
  font-family: 'Cinzel', serif;
  font-size: 0.78rem;
  color: #c9a84c;
  letter-spacing: 1px;
  line-height: 1.2;
}
.brand-sub {
  font-family: sans-serif;
  font-size: 0.65rem;
  color: #4a3a20;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.sidebar-nav {
  flex: 1;
  padding: 14px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #5a4a30;
  font-family: 'EB Garamond', serif;
  font-size: 0.92rem;
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: background 0.12s, color 0.12s;
}
.nav-item:hover { background: rgba(201,168,76,0.06); color: #a09070; }
.nav-item.active {
  background: rgba(201,168,76,0.1);
  color: #c9a84c;
}
.nav-icon { font-size: 0.9rem; width: 18px; text-align: center; }
.nav-label { flex: 1; }

.sidebar-footer {
  padding: 14px 16px;
  border-top: 1px solid rgba(201,168,76,0.1);
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.sidebar-user {
  display: flex;
  align-items: center;
  gap: 8px;
}
.user-icon { font-size: 0.8rem; opacity: 0.5; }
.user-name {
  font-family: 'Cinzel', serif;
  font-size: 0.72rem;
  color: #7a6a40;
  letter-spacing: 0.5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sidebar-map-link {
  font-family: 'Cinzel', serif;
  font-size: 0.7rem;
  color: #4a3a20;
  text-decoration: none;
  letter-spacing: 0.5px;
  transition: color 0.12s;
}
.sidebar-map-link:hover { color: #c9a84c; }

/* Content */
.admin-content {
  flex: 1;
  overflow-y: auto;
  background: #0e0c07;
}
</style>
