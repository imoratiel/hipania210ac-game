<template>
  <div class="help-overlay" @click.self="$emit('close')">
    <div class="help-panel">

      <!-- Header -->
      <div class="help-header">
        <span class="help-title">📖 Manual del Imperium</span>
        <button class="help-close" @click="$emit('close')" title="Cerrar">✕</button>
      </div>

      <div class="help-body">

        <!-- Sidebar de navegación -->
        <nav class="help-nav">
          <button
            v-for="page in pages"
            :key="page.id"
            class="help-nav-item"
            :class="{ active: currentPage === page.id }"
            @click="currentPage = page.id"
          >
            <span class="help-nav-icon">{{ page.icon }}</span>
            <span class="help-nav-label">{{ page.title }}</span>
          </button>
        </nav>

        <!-- Contenido -->
        <div class="help-content" ref="contentEl">
          <div
            v-for="page in pages"
            :key="page.id"
            v-show="currentPage === page.id"
            class="help-page"
            v-html="page.content"
          />
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

defineEmits(['close']);

const currentPage = ref('intro');
const contentEl   = ref(null);

watch(currentPage, () => {
  if (contentEl.value) contentEl.value.scrollTop = 0;
});

const pages = [
  {
    id: 'intro',
    icon: '🏛️',
    title: 'Introducción',
    content: `
      <h2>Bienvenido a Hispania 210</h2>
      <p>Es el año 210 a.C. La Península Ibérica es un tablero de guerra en el que cuatro culturas pugnan por la supremacía: <strong>Roma</strong>, <strong>Cartago</strong>, <strong>los Íberos</strong> y <strong>los Celtas</strong>.</p>
      <p>Tu objetivo es expandir tu territorio, construir un imperio próspero y superar a los demás jugadores mediante la diplomacia, la guerra o la gestión superior de tus recursos.</p>

      <h3>Conceptos clave</h3>
      <div class="help-cards">
        <div class="help-card">
          <span class="hc-icon">🗺️</span>
          <div><strong>Mapa hexagonal</strong><br>El mundo está dividido en hexágonos. Cada uno tiene un tipo de terreno con propiedades únicas.</div>
        </div>
        <div class="help-card">
          <span class="hc-icon">⏱️</span>
          <div><strong>Turnos de 10 min</strong><br>El juego avanza automáticamente. No es necesario estar conectado todo el tiempo.</div>
        </div>
        <div class="help-card">
          <span class="hc-icon">⚔️</span>
          <div><strong>Temporadas</strong><br>Solo se puede combatir entre las 12:00 y las 00:00 (España). El invierno es tiempo de construcción.</div>
        </div>
        <div class="help-card">
          <span class="hc-icon">👑</span>
          <div><strong>Tu capital</strong><br>El primer territorio que colonices será tu capital. No puede ser conquistada directamente.</div>
        </div>
      </div>

      <h3>Primeros pasos</h3>
      <ol>
        <li>Coloniza tu primer hexágono — se convierte en tu capital automáticamente.</li>
        <li>Expande a los hexágonos adyacentes para ganar población y recursos.</li>
        <li>Recluta tu primer ejército desde la capital.</li>
        <li>Crea una comarca (señorío) para organizar tu territorio.</li>
        <li>Gestiona los impuestos para financiar tu expansión.</li>
      </ol>
    `
  },
  {
    id: 'mapa',
    icon: '🗺️',
    title: 'El mapa',
    content: `
      <h2>El mapa hexagonal</h2>
      <p>El mundo de Hispania 210 está dividido en hexágonos. Cada hexágono tiene un tipo de terreno que afecta al movimiento, la producción y el combate.</p>

      <h3>Tipos de terreno</h3>
      <table class="help-table">
        <thead><tr><th>Terreno</th><th>Movimiento</th><th>Stamina/hex</th><th>Notas</th></tr></thead>
        <tbody>
          <tr><td>🟨 Llanura / Cultivo / Costa</td><td>Normal</td><td>2</td><td>Ideal para colonizar</td></tr>
          <tr><td>🟫 Cerros / Bosque / Colinas</td><td>Lento (×3)</td><td>6</td><td>Buen terreno defensivo</td></tr>
          <tr><td>🟦 Pantano</td><td>Muy lento (×5)</td><td>10</td><td>Difícil de atravesar</td></tr>
          <tr><td>⛰️ Alta Montaña</td><td>Extremo (×10)</td><td>20</td><td>Casi infranqueable</td></tr>
          <tr><td>🔵 Río / Mar</td><td>Bloqueado</td><td>—</td><td>Solo cruzable por puentes o flotas</td></tr>
        </tbody>
      </table>

      <h3>Navegación</h3>
      <ul>
        <li><strong>Rueda del ratón</strong> — zoom</li>
        <li><strong>Clic izquierdo + arrastrar</strong> — mover el mapa</li>
        <li><strong>Clic en un hexágono</strong> — ver detalles del territorio</li>
        <li><strong>Barra de búsqueda</strong> — ir a un hexágono por coordenadas H3</li>
      </ul>

      <h3>Iconos en el mapa</h3>
      <div class="help-cards">
        <div class="help-card"><span class="hc-icon">👑</span><div><strong>Corona</strong> — Capital de un jugador</div></div>
        <div class="help-card"><span class="hc-icon">🔵</span><div><strong>Círculo redondo</strong> — Ejército en campo</div></div>
        <div class="help-card"><span class="hc-icon">🟦</span><div><strong>Cuadrado</strong> — Guarnición acuartelada</div></div>
        <div class="help-card"><span class="hc-icon">🔨</span><div><strong>Martillo</strong> — Edificio en construcción</div></div>
        <div class="help-card"><span class="hc-icon">👁️</span><div><strong>Ojo</strong> — Trabajador explorador</div></div>
      </div>
    `
  },
  {
    id: 'territorios',
    icon: '🏰',
    title: 'Territorios',
    content: `
      <h2>Territorios y colonización</h2>

      <h3>Colonizar un hexágono</h3>
      <p>Para reclamar un territorio haz clic en un hexágono adyacente a tu dominio y selecciona <em>Colonizar</em>. El coste depende del tipo de terreno y la distancia a tu capital.</p>
      <ul>
        <li>El <strong>primer feudo</strong> siempre es colonizable sin adyacencia (es tu capital).</li>
        <li>Los siguientes requieren adyacencia a territorio ya controlado.</li>
        <li>Los hexágonos con otro propietario deben ser <strong>conquistados</strong> militarmente.</li>
      </ul>

      <h3>Edificios</h3>
      <table class="help-table">
        <thead><tr><th>Edificio</th><th>Efecto</th></tr></thead>
        <tbody>
          <tr><td>🌾 Granja</td><td>Aumenta producción de comida</td></tr>
          <tr><td>⚒️ Cuartel</td><td>Permite reclutar tropas fuera de la capital</td></tr>
          <tr><td>🏪 Mercado</td><td>Aumenta ingresos de oro</td></tr>
          <tr><td>🏛️ Templo</td><td>Aumenta la felicidad de la comarca</td></tr>
          <tr><td>🏰 Muralla</td><td>Bonus defensivo a ejércitos guarnicionados</td></tr>
        </tbody>
      </table>

      <h3>Población y felicidad</h3>
      <p>Cada feudo tiene una <strong>población</strong> que crece lentamente y produce recursos. La <strong>felicidad</strong> (0-100) determina cuánto rinde ese feudo y el riesgo de rebelión.</p>
      <div class="help-tip">💡 Mantén los impuestos bajos y las reservas de comida altas para tener una población feliz.</div>
    `
  },
  {
    id: 'ejercitos',
    icon: '⚔️',
    title: 'Ejércitos',
    content: `
      <h2>Ejércitos y movimiento</h2>

      <h3>Reclutamiento</h3>
      <p>Solo puedes reclutar tropas en tu <strong>capital</strong> o en feudos con <strong>cuartel completado</strong>. La cantidad de reclutas disponibles depende de la población cercana.</p>

      <h3>Velocidad de movimiento</h3>
      <p>Un ejército se mueve tantos hexágonos por turno como la <strong>velocidad mínima</strong> de todas sus unidades. Si mezclas caballería con artillería de asedio, el ejército irá al ritmo del más lento.</p>

      <table class="help-table">
        <thead><tr><th>Clase</th><th>Velocidad</th><th>Ejemplos</th></tr></thead>
        <tbody>
          <tr><td>Caballería ligera</td><td>6–7 hex/turno</td><td>Caballería Numida, Jinetes con Lanza</td></tr>
          <tr><td>Caballería pesada</td><td>4 hex/turno</td><td>Jinetes de Élite, Caballería Hispana</td></tr>
          <tr><td>Infantería ligera</td><td>3–5 hex/turno</td><td>Caetrati, Hastati</td></tr>
          <tr><td>Infantería pesada</td><td>2–4 hex/turno</td><td>Triarii, Lanceros del Norte</td></tr>
          <tr><td>Asedio</td><td>1 hex/turno</td><td>Ariete, Onagro</td></tr>
        </tbody>
      </table>

      <h3>Stamina y fatiga</h3>
      <p>Cada unidad tiene <strong>100 puntos de stamina</strong>. Moverse consume stamina según el terreno. Si llega a 0, la unidad entra en <em>force_rest</em> y el ejército no puede moverse hasta recuperar al menos 25.</p>
      <ul>
        <li>Recuperación: <strong>+4 stamina/turno</strong> cuando el ejército no se mueve.</li>
        <li>La <strong>caballería</strong> consume la mitad de stamina en terreno abierto (llanura, costa).</li>
        <li>En bosque, montaña y pantano, todos pagan el coste completo.</li>
      </ul>

      <h3>Guarniciones</h3>
      <p>Un ejército <em>acuartelado</em> en un feudo propio actúa como guarnición: defiende el territorio y reduce la resistencia de la comarca. No cuenta para el límite de ejércitos en campo.</p>
    `
  },
  {
    id: 'combate',
    icon: '🛡️',
    title: 'Combate',
    content: `
      <h2>Sistema de combate</h2>

      <h3>Cómo atacar</h3>
      <p>Mueve tu ejército al mismo hexágono que un ejército enemigo. Aparecerá el botón <em>Atacar</em> en el panel de tropas. El combate es <strong>manual</strong> — solo ocurre cuando tú pulsas atacar.</p>

      <div class="help-tip">⚔️ Solo puedes atacar durante la <strong>Temporada de Campaña</strong> (12:00–00:00 hora española).</div>

      <h3>Resolución de batalla</h3>
      <ol>
        <li>Se calcula el <strong>Poder de Combate (PC)</strong> de cada ejército:<br>
          <code>PC = Σ (cantidad × ataque × terreno × contador × moral × stamina)</code></li>
        <li>El defensor recibe un <strong>+10% de bonus defensivo</strong>.</li>
        <li>Se calcula el ratio R = PC_mayor / PC_menor:<br>
          — R &lt; 1.1 → <strong>Empate</strong>: ambos pierden 5–10%, nadie retrocede.<br>
          — R ≥ 1.1 → <strong>Victoria</strong>: ganador pierde 0–10%, perdedor 5–20% y huye.</li>
        <li>El perdedor huye al hex adyacente más cercano sin enemigos. Si no hay salida, el ejército es destruido.</li>
        <li>El ganador saquea entre 25% y 75% de las provisiones del perdedor.</li>
      </ol>

      <h3>Counters de unidades</h3>
      <p>Algunas unidades tienen ventaja contra otras. Un buen counter puede multiplicar tu poder de combate efectivo. Revisa las estadísticas de cada unidad en el panel de reclutamiento.</p>

      <h3>Conquista de territorio</h3>
      <p>Al vencer en combate en un hexágono enemigo, el territorio pasa a ser tuyo. La comarca del propietario anterior acumula <strong>resistencia</strong> — cuanta más resistencia, mayor riesgo de rebelión futura.</p>
    `
  },
  {
    id: 'economia',
    icon: '💰',
    title: 'Economía',
    content: `
      <h2>Economía e impuestos</h2>

      <h3>Recursos</h3>
      <div class="help-cards">
        <div class="help-card"><span class="hc-icon">💰</span><div><strong>Oro</strong> — Moneda principal. Se usa para reclutar, construir y pagar soldadas.</div></div>
        <div class="help-card"><span class="hc-icon">🌾</span><div><strong>Comida</strong> — Alimenta a tu población y ejércitos. Sin comida hay hambruna y desertores.</div></div>
        <div class="help-card"><span class="hc-icon">👥</span><div><strong>Población</strong> — Determina cuántos reclutas tienes y cuánto produce cada feudo.</div></div>
      </div>

      <h3>Impuestos</h3>
      <p>Puedes ajustar el impuesto de cada <strong>comarca</strong> de forma independiente (1%–15%) o aplicar un impuesto global.</p>
      <table class="help-table">
        <thead><tr><th>Tasa</th><th>Efecto en felicidad</th></tr></thead>
        <tbody>
          <tr><td>Exenta (0%)</td><td class="positive">+8/turno ✦</td></tr>
          <tr><td>1%–5%</td><td class="positive">+4/turno</td></tr>
          <tr><td>6%–10%</td><td>Neutral</td></tr>
          <tr><td>11%–15%</td><td class="negative">−4/turno</td></tr>
        </tbody>
      </table>

      <h3>Soldadas</h3>
      <p>Cada turno, todos tus ejércitos cobran una <strong>soldada</strong> automática. Si no tienes oro suficiente, recibirás avisos de reservas bajas y los ejércitos pueden desintegrarse.</p>

      <h3>Cosecha</h3>
      <p>Dos veces al año (primavera y verano) se procesa la cosecha global. La producción depende del número de granjas y la población de cada feudo.</p>
    `
  },
  {
    id: 'comarcas',
    icon: '🏘️',
    title: 'Comarcas',
    content: `
      <h2>Comarcas y señoríos</h2>

      <h3>¿Qué es una comarca?</h3>
      <p>Una comarca (señorío) agrupa varios feudos bajo una misma administración. Tiene su propia <strong>capital de comarca</strong>, su <strong>tasa impositiva</strong> y su nivel de <strong>resistencia</strong>.</p>

      <h3>Resistencia</h3>
      <p>Cada vez que conquistas un territorio, la comarca anterior acumula <strong>resistencia</strong> (0–100). Cuanto mayor sea, más cerca está de rebelarse.</p>
      <ul>
        <li>La resistencia sube con cada conquista y disminuye de forma natural cada turno.</li>
        <li>Tener ejércitos estacionados en la comarca reduce la resistencia más rápido.</li>
        <li>El <strong>desajuste cultural</strong> mantiene la resistencia alta aunque conquistes poco.</li>
      </ul>

      <h3>Rebeliones</h3>
      <p>Si la resistencia de una comarca alcanza 100, o si la felicidad cae por debajo de 10, puede producirse una rebelión durante la <strong>temporada de campaña</strong>:</p>
      <ol>
        <li>Algunos feudos se liberan del control del jugador.</li>
        <li>Aparece un ejército rebelde ("Rebeldes") que intentará recuperar el territorio.</li>
        <li>Si derrota a los rebeldes, puede generar hasta 2 ejércitos por ciclo.</li>
      </ol>
      <div class="help-tip">💡 Las rebeliones <strong>no ocurren en invierno</strong>. Úsalo para asentar conquistas recientes.</div>

      <h3>Exención fiscal</h3>
      <p>Puedes eximir una comarca de impuestos. Los habitantes pagan 0% y reciben el doble de bonus de felicidad. Útil para calmar comarcas con resistencia alta.</p>
    `
  },
  {
    id: 'temporadas',
    icon: '🌡️',
    title: 'Temporadas',
    content: `
      <h2>Sistema de temporadas</h2>
      <p>El calendario del juego sigue el reloj real de España. Un día real equivale a un año de juego.</p>

      <div class="season-blocks">
        <div class="season-block campaign">
          <div class="sb-header">⚔️ Campaña — Abril a Septiembre</div>
          <div class="sb-time">12:00 – 00:00 hora española</div>
          <ul>
            <li class="ok">✅ Atacar ejércitos enemigos</li>
            <li class="ok">✅ Conquistar territorios</li>
            <li class="ok">✅ Construir y reclutar</li>
            <li class="warn">⚠️ Riesgo de rebeliones</li>
          </ul>
        </div>
        <div class="season-block winter">
          <div class="sb-header">❄️ Invierno — Octubre a Marzo</div>
          <div class="sb-time">00:00 – 12:00 hora española</div>
          <ul>
            <li class="no">❌ Sin combate</li>
            <li class="no">❌ Sin rebeliones</li>
            <li class="ok">✅ Construir y reclutar</li>
            <li class="ok">✅ Mover ejércitos</li>
          </ul>
        </div>
      </div>

      <h3>El mes actual</h3>
      <p>El mes de juego se muestra en el panel lateral izquierdo. Cada mes real dura <strong>2 horas</strong>. Los meses de campaña van de abril a septiembre y coinciden con las horas activas del día.</p>

      <h3>Los turnos</h3>
      <p>El juego procesa un turno cada <strong>10 minutos</strong>, alineado exactamente a los minutos :00, :10, :20, :30, :40 y :50 de cada hora. No hay deriva — siempre es predecible cuándo ocurrirá el siguiente turno.</p>

      <h3>Estrategia estacional</h3>
      <ul>
        <li>Usa el <strong>invierno</strong> para construir cuarteles, consolidar conquistas y asentar comarcas recién tomadas.</li>
        <li>La resistencia sigue acumulándose en invierno, pero la rebelión se congela hasta abril.</li>
        <li>Planifica tus campañas militares para tener ejércitos bien descansados al inicio de abril.</li>
      </ul>
    `
  }
];
</script>

<style scoped>
.help-overlay {
  position: fixed;
  inset: 0;
  z-index: 9000;
  background: rgba(0,0,0,0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.help-panel {
  background: #16120a;
  border: 1px solid rgba(201,168,76,0.3);
  border-radius: 8px;
  width: 100%;
  max-width: 1100px;
  height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 16px 60px rgba(0,0,0,0.7);
  overflow: hidden;
}

/* Header */
.help-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: #1c1710;
  border-bottom: 1px solid rgba(201,168,76,0.2);
  flex-shrink: 0;
}

.help-title {
  font-family: 'Cinzel', 'Georgia', serif;
  font-size: 0.95rem;
  color: #c9a84c;
  letter-spacing: 1px;
}

.help-close {
  background: none;
  border: none;
  color: #5a4a30;
  font-size: 1rem;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: color 0.15s, background 0.15s;
}
.help-close:hover { color: #c9a84c; background: rgba(201,168,76,0.08); }

/* Body */
.help-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Nav */
.help-nav {
  width: 200px;
  flex-shrink: 0;
  background: #110e07;
  border-right: 1px solid rgba(201,168,76,0.15);
  overflow-y: auto;
  padding: 8px 0;
}

.help-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 16px;
  background: none;
  border: none;
  color: #8a7a58;
  font-family: 'Georgia', serif;
  font-size: 0.88rem;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  border-left: 3px solid transparent;
}

.help-nav-item:hover {
  background: rgba(201,168,76,0.06);
  color: #c9a84c;
}

.help-nav-item.active {
  background: rgba(201,168,76,0.1);
  color: #f4e8a0;
  border-left-color: #c9a84c;
}

.help-nav-icon { font-size: 1rem; flex-shrink: 0; }
.help-nav-label { font-size: 0.8rem; }

/* Content */
.help-content {
  flex: 1;
  overflow-y: auto;
  padding: 36px 48px;
  font-family: 'Georgia', serif;
  font-size: 1rem;
  line-height: 1.8;
  color: #c8b87a;
}

/* Page content styles */
.help-content :deep(h2) {
  font-family: 'Cinzel', 'Georgia', serif;
  font-size: 1.3rem;
  color: #f4e8a0;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(201,168,76,0.2);
}

.help-content :deep(h3) {
  font-family: 'Cinzel', 'Georgia', serif;
  font-size: 0.95rem;
  color: #c9a84c;
  margin: 24px 0 10px;
  letter-spacing: 0.5px;
}

.help-content :deep(p) {
  margin-bottom: 12px;
  color: #b0a07a;
}

.help-content :deep(ul), .help-content :deep(ol) {
  padding-left: 20px;
  margin-bottom: 14px;
  color: #b0a07a;
}

.help-content :deep(li) { margin-bottom: 5px; }

.help-content :deep(strong) { color: #e8d48a; }

.help-content :deep(code) {
  background: rgba(201,168,76,0.08);
  border: 1px solid rgba(201,168,76,0.2);
  border-radius: 3px;
  padding: 1px 6px;
  font-size: 0.85rem;
  color: #f4e8a0;
  font-family: monospace;
}

/* Table */
.help-content :deep(.help-table) {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0 20px;
  font-size: 0.85rem;
}

.help-content :deep(.help-table th) {
  background: rgba(201,168,76,0.1);
  color: #c9a84c;
  padding: 8px 12px;
  text-align: left;
  font-family: 'Cinzel', serif;
  font-size: 0.75rem;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(201,168,76,0.2);
}

.help-content :deep(.help-table td) {
  padding: 8px 12px;
  color: #b0a07a;
  border-bottom: 1px solid rgba(201,168,76,0.08);
}

.help-content :deep(.help-table tr:hover td) {
  background: rgba(201,168,76,0.04);
}

.help-content :deep(.positive) { color: #6fcf97; }
.help-content :deep(.negative) { color: #f87171; }

/* Cards */
.help-content :deep(.help-cards) {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin: 12px 0 20px;
}

.help-content :deep(.help-card) {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  background: rgba(201,168,76,0.05);
  border: 1px solid rgba(201,168,76,0.15);
  border-radius: 5px;
  padding: 12px;
  font-size: 0.83rem;
  color: #a09070;
}

.help-content :deep(.hc-icon) { font-size: 1.4rem; flex-shrink: 0; }

/* Tip */
.help-content :deep(.help-tip) {
  background: rgba(201,168,76,0.07);
  border-left: 3px solid #c9a84c;
  padding: 10px 14px;
  border-radius: 0 4px 4px 0;
  font-size: 0.85rem;
  color: #c9a84c;
  margin: 12px 0;
}

/* Season blocks */
.help-content :deep(.season-blocks) {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin: 14px 0 20px;
}

.help-content :deep(.season-block) {
  border-radius: 5px;
  padding: 16px;
  font-size: 0.83rem;
}

.help-content :deep(.season-block.campaign) {
  background: rgba(180,120,20,0.1);
  border: 1px solid rgba(201,168,76,0.3);
}

.help-content :deep(.season-block.winter) {
  background: rgba(40,60,100,0.1);
  border: 1px solid rgba(80,120,180,0.3);
}

.help-content :deep(.sb-header) {
  font-family: 'Cinzel', serif;
  font-size: 0.85rem;
  font-weight: 700;
  margin-bottom: 4px;
  color: #e8d48a;
}

.help-content :deep(.season-block.winter .sb-header) { color: #90c0f0; }

.help-content :deep(.sb-time) {
  font-size: 0.75rem;
  color: #7a6a48;
  margin-bottom: 10px;
  font-family: sans-serif;
}

.help-content :deep(.season-block ul) {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.help-content :deep(.ok)   { color: #6fcf97; }
.help-content :deep(.warn) { color: #f4c430; }
.help-content :deep(.no)   { color: #f87171; }

/* Scrollbar */
.help-nav::-webkit-scrollbar,
.help-content::-webkit-scrollbar { width: 5px; }
.help-nav::-webkit-scrollbar-track,
.help-content::-webkit-scrollbar-track { background: transparent; }
.help-nav::-webkit-scrollbar-thumb,
.help-content::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.2); border-radius: 3px; }

/* Mobile */
@media (max-width: 600px) {
  .help-body { flex-direction: column; }
  .help-nav {
    width: 100%;
    display: flex;
    overflow-x: auto;
    border-right: none;
    border-bottom: 1px solid rgba(201,168,76,0.15);
    padding: 4px;
  }
  .help-nav-item { flex-direction: column; gap: 2px; padding: 8px 10px; border-left: none; border-bottom: 3px solid transparent; min-width: 60px; text-align: center; }
  .help-nav-item.active { border-bottom-color: #c9a84c; border-left: none; }
  .help-content { padding: 20px 16px; }
  .help-content :deep(.help-cards),
  .help-content :deep(.season-blocks) { grid-template-columns: 1fr; }
}
</style>
