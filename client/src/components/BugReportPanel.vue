<template>
  <div class="bug-overlay" @click.self="onClose">
    <div class="bug-panel">

      <div class="bug-header">
        <span class="bug-title">🐛 Reportar un error</span>
        <button class="bug-close" @click="onClose">✕</button>
      </div>

      <!-- Formulario -->
      <template v-if="!submitted">
        <div class="bug-body">
          <p class="bug-intro">
            Describe el problema con el mayor detalle posible. Si puedes, adjunta una captura de pantalla.
          </p>

          <div class="bug-field">
            <label class="bug-label">Descripción del error <span class="optional">(opcional)</span></label>
            <textarea
              v-model="message"
              class="bug-textarea"
              placeholder="¿Qué ocurrió? ¿Cuándo? ¿Qué esperabas que pasara?"
              rows="6"
              maxlength="2000"
              :disabled="sending"
            />
            <span class="bug-char-count">{{ message.length }} / 2000</span>
          </div>

          <div class="bug-field">
            <label class="bug-label">Captura de pantalla <span class="optional">(opcional)</span></label>
            <div
              class="bug-dropzone"
              :class="{ 'has-file': imageFile, dragging }"
              @click="fileInput.click()"
              @dragover.prevent="dragging = true"
              @dragleave="dragging = false"
              @drop.prevent="onDrop"
            >
              <template v-if="imageFile">
                <img :src="imagePreview" class="bug-preview-img" alt="preview" />
                <button class="bug-remove-img" @click.stop="clearImage">✕</button>
              </template>
              <template v-else>
                <span class="dropzone-icon">📎</span>
                <span class="dropzone-text">Haz clic o arrastra una imagen aquí</span>
                <span class="dropzone-hint">JPG, PNG, WebP — máx. 5 MB</span>
              </template>
            </div>
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              style="display:none"
              @change="onFileChange"
            />
          </div>

          <p v-if="error" class="bug-error">{{ error }}</p>
        </div>

        <div class="bug-footer">
          <button class="bug-cancel" @click="onClose" :disabled="sending">Cancelar</button>
          <button
            class="bug-submit"
            @click="submit"
            :disabled="sending || (!message.trim() && !imageFile)"
          >
            {{ sending ? 'Enviando…' : 'Enviar reporte' }}
          </button>
        </div>
      </template>

      <!-- Gracias -->
      <div v-else class="bug-thanks">
        <div class="thanks-icon">🏛️</div>
        <h3>¡Gracias por tu aportación!</h3>
        <p>Tu reporte ha sido recibido. Cada error que reportas ayuda a mejorar Hispania 210 para toda la comunidad.</p>
        <button class="bug-submit" @click="onClose" style="margin-top:24px;">Cerrar</button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';

const emit = defineEmits(['close']);

const message      = ref('');
const imageFile    = ref(null);
const imagePreview = ref('');
const fileInput    = ref(null);
const dragging     = ref(false);
const sending      = ref(false);
const submitted    = ref(false);
const error        = ref('');

function onClose() {
  if (!sending.value) emit('close');
}

function onFileChange(e) {
  const file = e.target.files[0];
  if (file) setFile(file);
}

function onDrop(e) {
  dragging.value = false;
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) setFile(file);
}

function setFile(file) {
  if (file.size > 5 * 1024 * 1024) {
    error.value = 'La imagen supera el límite de 5 MB.';
    return;
  }
  error.value = '';
  imageFile.value = file;
  imagePreview.value = URL.createObjectURL(file);
}

function clearImage() {
  imageFile.value = null;
  imagePreview.value = '';
  if (fileInput.value) fileInput.value.value = '';
}

async function submit() {
  if (!message.value.trim() && !imageFile.value) {
    error.value = 'Añade una descripción o una captura de pantalla.';
    return;
  }
  error.value = '';
  sending.value = true;

  try {
    const form = new FormData();
    if (message.value.trim()) form.append('message', message.value.trim());
    if (imageFile.value) form.append('image', imageFile.value);

    const { data } = await axios.post('/api/bug-report', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      withCredentials: true,
    });

    if (data.success) {
      submitted.value = true;
    } else {
      error.value = data.message || 'Error al enviar el reporte.';
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Error de conexión. Inténtalo de nuevo.';
  } finally {
    sending.value = false;
  }
}
</script>

<style scoped>
.bug-overlay {
  position: fixed;
  inset: 0;
  z-index: 9500;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.bug-panel {
  background: #16120a;
  border: 1px solid rgba(201,168,76,0.3);
  border-radius: 8px;
  width: 100%;
  max-width: 560px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 16px 60px rgba(0,0,0,0.7);
  overflow: hidden;
}

.bug-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: #1c1710;
  border-bottom: 1px solid rgba(201,168,76,0.2);
  flex-shrink: 0;
}

.bug-title {
  font-family: 'Cinzel', 'Georgia', serif;
  font-size: 0.95rem;
  color: #c9a84c;
  letter-spacing: 1px;
}

.bug-close {
  background: none;
  border: none;
  color: #5a4a30;
  font-size: 1rem;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: color 0.15s;
}
.bug-close:hover { color: #c9a84c; }

.bug-body {
  padding: 24px 28px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.bug-intro {
  font-family: 'Georgia', serif;
  font-size: 0.88rem;
  color: #8a7a58;
  line-height: 1.6;
  margin: 0;
}

.bug-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
}

.bug-label {
  font-family: 'Cinzel', sans-serif;
  font-size: 0.72rem;
  letter-spacing: 1.5px;
  color: #a09070;
  text-transform: uppercase;
}

.required { color: #f87171; }
.optional  { color: #5a4a30; font-style: italic; text-transform: none; letter-spacing: 0; font-size: 0.78rem; }

.bug-textarea {
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(201,168,76,0.2);
  border-radius: 5px;
  color: #d4c4a0;
  font-family: 'Georgia', serif;
  font-size: 0.92rem;
  line-height: 1.6;
  padding: 12px 14px;
  resize: vertical;
  transition: border-color 0.15s;
  min-height: 130px;
}
.bug-textarea:focus { outline: none; border-color: rgba(201,168,76,0.5); }
.bug-textarea:disabled { opacity: 0.5; }

.bug-char-count {
  font-size: 0.7rem;
  color: #5a4a30;
  text-align: right;
  font-family: sans-serif;
}

/* Dropzone */
.bug-dropzone {
  border: 1px dashed rgba(201,168,76,0.3);
  border-radius: 5px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-height: 90px;
  justify-content: center;
  position: relative;
}
.bug-dropzone:hover,
.bug-dropzone.dragging { border-color: rgba(201,168,76,0.6); background: rgba(201,168,76,0.04); }
.bug-dropzone.has-file { border-style: solid; padding: 8px; }

.dropzone-icon { font-size: 1.5rem; }
.dropzone-text { font-size: 0.85rem; color: #a09070; font-family: 'Georgia', serif; }
.dropzone-hint { font-size: 0.72rem; color: #5a4a30; font-family: sans-serif; }

.bug-preview-img {
  max-height: 160px;
  max-width: 100%;
  border-radius: 4px;
  object-fit: contain;
}

.bug-remove-img {
  position: absolute;
  top: 6px;
  right: 6px;
  background: rgba(0,0,0,0.7);
  border: none;
  color: #f87171;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  cursor: pointer;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bug-error {
  font-size: 0.82rem;
  color: #f87171;
  font-family: sans-serif;
  margin: 0;
}

/* Footer */
.bug-footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding: 16px 28px;
  border-top: 1px solid rgba(201,168,76,0.15);
  background: #110e07;
}

.bug-cancel {
  background: none;
  border: 1px solid rgba(201,168,76,0.2);
  border-radius: 5px;
  color: #8a7a58;
  font-family: 'Cinzel', serif;
  font-size: 0.78rem;
  letter-spacing: 1px;
  padding: 8px 20px;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}
.bug-cancel:hover:not(:disabled) { border-color: rgba(201,168,76,0.4); color: #c9a84c; }
.bug-cancel:disabled { opacity: 0.4; cursor: not-allowed; }

.bug-submit {
  background: rgba(201,168,76,0.12);
  border: 1px solid rgba(201,168,76,0.5);
  border-radius: 5px;
  color: #f4e8a0;
  font-family: 'Cinzel', serif;
  font-size: 0.78rem;
  letter-spacing: 1px;
  padding: 8px 24px;
  cursor: pointer;
  transition: background 0.15s;
}
.bug-submit:hover:not(:disabled) { background: rgba(201,168,76,0.22); }
.bug-submit:disabled { opacity: 0.4; cursor: not-allowed; }

/* Thanks */
.bug-thanks {
  padding: 48px 28px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.thanks-icon { font-size: 3rem; }

.bug-thanks h3 {
  font-family: 'Cinzel', 'Georgia', serif;
  color: #f4e8a0;
  font-size: 1.1rem;
  margin: 0;
}

.bug-thanks p {
  font-family: 'Georgia', serif;
  color: #a09070;
  font-size: 0.9rem;
  line-height: 1.7;
  max-width: 380px;
  margin: 0;
}
</style>
