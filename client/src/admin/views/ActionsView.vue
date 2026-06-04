<template>
  <div class="av">
    <div class="av-header">
      <h1 class="av-title">Acciones de administración</h1>
      <p class="av-sub">Operaciones irreversibles — confirma antes de ejecutar</p>
    </div>

    <div class="av-layout">

      <!-- Reset exploraciones -->
      <section class="av-section">
        <div class="action-card">
          <div class="action-info">
            <div class="action-icon">🗺️</div>
            <div>
              <h3 class="action-title">Resetear exploraciones</h3>
              <p class="action-desc">
                Marca todos los territorios como "sin explorar". Los recursos físicos permanecen en la base de datos
                pero se ocultan hasta que cada territorio sea explorado de nuevo.
              </p>
              <p class="action-impact impact--low">⚠ Impacto bajo — no borra datos permanentes</p>
            </div>
          </div>
          <div class="action-ctrl">
            <button class="exec-btn exec-btn--yellow" @click="run('explorations')" :disabled="acting">
              Resetear exploraciones
            </button>
          </div>
        </div>
        <p v-if="msgs.explorations" class="result-msg" :class="cls.explorations">{{ msgs.explorations }}</p>
      </section>

      <!-- Reset mundo -->
      <section class="av-section">
        <div class="action-card">
          <div class="action-info">
            <div class="action-icon">🌍</div>
            <div>
              <h3 class="action-title">Resetear mundo</h3>
              <p class="action-desc">
                Resetea el turno a 0 y la fecha del juego al inicio de la partida.
                No elimina jugadores, territorios ni recursos — solo reinicia el tiempo.
              </p>
              <p class="action-impact impact--mid">⚠ Impacto medio — reinicia la línea de tiempo del juego</p>
            </div>
          </div>
          <div class="action-ctrl">
            <button class="exec-btn exec-btn--orange" @click="run('world')" :disabled="acting">
              Resetear mundo
            </button>
          </div>
        </div>
        <p v-if="msgs.world" class="result-msg" :class="cls.world">{{ msgs.world }}</p>
      </section>

      <!-- Reset partida completa -->
      <section class="av-section av-section--danger">
        <div class="action-card">
          <div class="action-info">
            <div class="action-icon">💀</div>
            <div>
              <h3 class="action-title">Resetear partida completa</h3>
              <p class="action-desc">
                Elimina todos los bots, libera todos los territorios y reinicia el estado de todos los jugadores.
                Los jugadores podrán empezar una nueva partida desde cero.
                <strong>Esta acción no se puede deshacer.</strong>
              </p>
              <p class="action-impact impact--high">💀 Impacto crítico — destruye el estado completo de la partida</p>
            </div>
          </div>
          <div class="action-ctrl">
            <button class="exec-btn exec-btn--red" @click="run('game')" :disabled="acting">
              Resetear partida
            </button>
          </div>
        </div>
        <p v-if="msgs.game" class="result-msg" :class="cls.game">{{ msgs.game }}</p>
      </section>

    </div>

    <!-- Confirm dialog -->
    <div v-if="confirm" class="confirm-overlay" @click.self="confirm = null">
      <div class="confirm-box">
        <div class="confirm-icon">{{ confirm.icon }}</div>
        <h3 class="confirm-title">{{ confirm.title }}</h3>
        <p class="confirm-msg">{{ confirm.message }}</p>
        <div class="confirm-actions">
          <button class="conf-cancel" @click="confirm = null">Cancelar</button>
          <button class="conf-ok" :class="confirm.cls" @click="execConfirmed" :disabled="acting">
            {{ acting ? 'Ejecutando…' : confirm.label }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'

const acting  = ref(false)
const confirm = ref(null)
const msgs = ref({ explorations: '', world: '', game: '' })
const cls  = ref({ explorations: '', world: '', game: '' })

const ACTIONS = {
  explorations: {
    icon: '🗺️',
    title: '¿Resetear exploraciones?',
    message: 'Todos los territorios volverán al estado "sin explorar". Los recursos físicos se conservan.',
    label: 'Sí, resetear exploraciones',
    cls: 'conf-ok--yellow',
    endpoint: '/api/admin/reset-explorations',
    method: 'post',
  },
  world: {
    icon: '🌍',
    title: '¿Resetear el mundo?',
    message: 'El turno volverá a 0 y la fecha del juego se reiniciará. Los jugadores y territorios no se eliminan.',
    label: 'Sí, resetear mundo',
    cls: 'conf-ok--orange',
    endpoint: '/api/admin/reset',
    method: 'post',
  },
  game: {
    icon: '💀',
    title: '¿Resetear la partida completa?',
    message: 'Se eliminarán los bots, se liberarán todos los territorios y los jugadores empezarán de cero. ACCIÓN IRREVERSIBLE.',
    label: 'Sí, RESETEAR PARTIDA',
    cls: 'conf-ok--red',
    endpoint: '/api/admin/reset-game',
    method: 'post',
  },
}

function run(key) {
  confirm.value = { ...ACTIONS[key], key }
}

async function execConfirmed() {
  const key = confirm.value.key
  const action = ACTIONS[key]
  acting.value = true
  try {
    const { data } = await axios[action.method](action.endpoint, {}, { withCredentials: true })
    msgs.value[key] = data.success ? `✅ ${data.message}` : `❌ ${data.message}`
    cls.value[key]  = data.success ? 'msg--ok' : 'msg--err'
    confirm.value = null
  } catch (e) {
    msgs.value[key] = `❌ Error: ${e.response?.data?.message || e.message}`
    cls.value[key]  = 'msg--err'
  } finally {
    acting.value = false
    setTimeout(() => { msgs.value[key] = '' }, 8000)
  }
}
</script>

<style scoped>
.av { padding: 32px 36px; }
.av-header { margin-bottom: 32px; }
.av-title { font-family: 'Cinzel', serif; font-size: 1.5rem; color: #c9a84c; letter-spacing: 1px; font-weight: 400; }
.av-sub { font-size: 0.82rem; color: #5a4a30; font-family: sans-serif; margin-top: 6px; }

.av-layout { display: flex; flex-direction: column; gap: 16px; max-width: 860px; }

.av-section {
  background: rgba(255,255,255,0.025);
  border: 1px solid rgba(201,168,76,0.12);
  border-radius: 8px;
  padding: 22px 24px;
}
.av-section--danger {
  border-color: rgba(248,113,113,0.25);
  background: rgba(248,113,113,0.03);
}

.action-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
}
.action-info { display: flex; gap: 16px; align-items: flex-start; flex: 1; }
.action-icon { font-size: 1.8rem; line-height: 1; flex-shrink: 0; margin-top: 2px; opacity: 0.7; }
.action-title { font-family: 'Cinzel', serif; font-size: 0.9rem; color: #c9a84c; letter-spacing: 0.5px; margin-bottom: 8px; }
.action-desc { font-family: 'EB Garamond', serif; font-size: 0.9rem; color: #7a6a40; line-height: 1.6; margin-bottom: 8px; }
.action-desc strong { color: #f87171; }

.action-impact { font-family: sans-serif; font-size: 0.72rem; letter-spacing: 0.5px; }
.impact--low  { color: #6fcf97; }
.impact--mid  { color: #fbbf24; }
.impact--high { color: #f87171; font-weight: 600; }

.action-ctrl { flex-shrink: 0; }

.exec-btn {
  padding: 10px 20px;
  border-radius: 5px;
  border: 1px solid;
  font-family: 'Cinzel', serif;
  font-size: 0.75rem;
  letter-spacing: 0.5px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.12s;
  background: transparent;
}
.exec-btn:disabled { opacity: 0.35; cursor: not-allowed; }

.exec-btn--yellow { color: #fbbf24; border-color: rgba(251,191,36,0.35); }
.exec-btn--yellow:hover:not(:disabled) { background: rgba(251,191,36,0.1); }
.exec-btn--orange { color: #fb923c; border-color: rgba(251,146,60,0.35); }
.exec-btn--orange:hover:not(:disabled) { background: rgba(251,146,60,0.1); }
.exec-btn--red    { color: #f87171; border-color: rgba(248,113,113,0.4); }
.exec-btn--red:hover:not(:disabled)    { background: rgba(248,113,113,0.12); }

.result-msg { margin-top: 12px; font-family: sans-serif; font-size: 0.82rem; }
.msg--ok  { color: #6fcf97; }
.msg--err { color: #f87171; }

/* Confirm */
.confirm-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(0,0,0,0.7);
  display: flex; align-items: center; justify-content: center;
}
.confirm-box {
  background: #16120a;
  border: 1px solid rgba(201,168,76,0.3);
  border-radius: 8px;
  padding: 32px 36px;
  max-width: 460px;
  width: 100%;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0,0,0,0.8);
}
.confirm-icon { font-size: 2.5rem; margin-bottom: 14px; }
.confirm-title { font-family: 'Cinzel', serif; font-size: 1rem; color: #c9a84c; letter-spacing: 0.5px; margin-bottom: 12px; }
.confirm-msg { font-family: 'EB Garamond', serif; font-size: 0.92rem; color: #7a6a40; line-height: 1.6; margin-bottom: 24px; }
.confirm-actions { display: flex; gap: 12px; justify-content: center; }
.conf-cancel {
  padding: 9px 20px; border-radius: 5px; border: 1px solid rgba(201,168,76,0.2);
  background: transparent; color: #7a6a40; font-family: 'Cinzel', serif; font-size: 0.75rem; cursor: pointer;
}
.conf-cancel:hover { color: #c9a84c; }
.conf-ok {
  padding: 9px 22px; border-radius: 5px; border: 1px solid;
  font-family: 'Cinzel', serif; font-size: 0.75rem; cursor: pointer;
  background: transparent; letter-spacing: 0.5px;
}
.conf-ok:disabled { opacity: 0.4; cursor: not-allowed; }
.conf-ok--yellow { color: #fbbf24; border-color: rgba(251,191,36,0.5); }
.conf-ok--yellow:hover:not(:disabled) { background: rgba(251,191,36,0.1); }
.conf-ok--orange { color: #fb923c; border-color: rgba(251,146,60,0.5); }
.conf-ok--orange:hover:not(:disabled) { background: rgba(251,146,60,0.1); }
.conf-ok--red    { color: #f87171; border-color: rgba(248,113,113,0.5); }
.conf-ok--red:hover:not(:disabled)    { background: rgba(248,113,113,0.12); }
</style>
