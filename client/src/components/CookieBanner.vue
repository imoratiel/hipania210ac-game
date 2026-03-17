<template>
  <Teleport to="body">
    <Transition name="cookie-slide">
      <div v-if="visible" class="cookie-banner" role="dialog" aria-modal="false" aria-label="Aviso de cookies">
        <div class="cookie-content">
          <div class="cookie-text">
            <strong>Hispania 210aC</strong> utiliza únicamente una cookie técnica estrictamente necesaria
            (<code>access_token</code>) para mantener tu sesión activa. No usamos cookies de publicidad
            ni analítica.
            <a href="/legal/privacidad" target="_blank" rel="noopener">Más información</a>
          </div>
          <div class="cookie-actions">
            <button class="cookie-btn cookie-btn--secondary" @click="showDetails = !showDetails">
              Más detalles
            </button>
            <button class="cookie-btn cookie-btn--primary" @click="accept">
              Entendido
            </button>
          </div>
        </div>

        <Transition name="fade">
          <div v-if="showDetails" class="cookie-details">
            <table class="cookie-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Duración</th>
                  <th>Finalidad</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>access_token</code></td>
                  <td>Técnica (necesaria)</td>
                  <td>24 horas</td>
                  <td>Mantener la sesión autenticada. Sin ella el servicio no funciona.</td>
                </tr>
              </tbody>
            </table>
            <p class="cookie-note">
              Al ser cookies estrictamente necesarias, no puedes rechazarlas sin dejar de usar el servicio.
              Puedes eliminarlas en cualquier momento desde la configuración de tu navegador o cerrando sesión.
            </p>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const STORAGE_KEY = 'hispania_cookie_notice';

const visible   = ref(false);
const showDetails = ref(false);

onMounted(() => {
  if (!localStorage.getItem(STORAGE_KEY)) {
    visible.value = true;
  }
});

function accept() {
  localStorage.setItem(STORAGE_KEY, '1');
  visible.value = false;
}
</script>

<style scoped>
.cookie-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  background: linear-gradient(135deg, rgba(13, 11, 9, 0.98) 0%, rgba(26, 22, 18, 0.98) 100%);
  border-top: 2px solid var(--color-accent-gold, #c5a059);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.7);
  padding: 14px 20px;
  font-family: var(--font-sans, 'Inter', sans-serif);
  font-size: 0.82rem;
  color: #a89875;
}

.cookie-content {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  max-width: 1200px;
  margin: 0 auto;
}

.cookie-text {
  flex: 1;
  min-width: 260px;
  line-height: 1.5;
}

.cookie-text strong {
  color: #e8d5b5;
}

.cookie-text code {
  background: rgba(197, 160, 89, 0.12);
  border: 1px solid rgba(197, 160, 89, 0.25);
  border-radius: 3px;
  padding: 1px 5px;
  font-size: 0.78rem;
  color: #c5a059;
}

.cookie-text a {
  color: #c5a059;
  text-decoration: underline;
  text-underline-offset: 2px;
  margin-left: 4px;
}

.cookie-text a:hover { color: #e8d5b5; }

.cookie-actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

.cookie-btn {
  padding: 8px 18px;
  border-radius: 4px;
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid;
}

.cookie-btn--primary {
  background: #c5a059;
  border-color: #c5a059;
  color: #0d0b09;
}

.cookie-btn--primary:hover {
  background: #e8d5b5;
  border-color: #e8d5b5;
}

.cookie-btn--secondary {
  background: transparent;
  border-color: rgba(197, 160, 89, 0.4);
  color: #a89875;
}

.cookie-btn--secondary:hover {
  border-color: #c5a059;
  color: #c5a059;
}

.cookie-details {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(197, 160, 89, 0.2);
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}

.cookie-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.78rem;
  margin-bottom: 10px;
}

.cookie-table th {
  text-align: left;
  padding: 6px 10px;
  color: #c5a059;
  border-bottom: 1px solid rgba(197, 160, 89, 0.3);
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  font-size: 0.72rem;
}

.cookie-table td {
  padding: 6px 10px;
  color: #a89875;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.cookie-table code {
  color: #c5a059;
  font-size: 0.75rem;
}

.cookie-note {
  font-size: 0.75rem;
  color: #6a5a40;
  line-height: 1.4;
}

/* Transitions */
.cookie-slide-enter-active,
.cookie-slide-leave-active {
  transition: transform 0.35s ease, opacity 0.35s ease;
}

.cookie-slide-enter-from,
.cookie-slide-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
