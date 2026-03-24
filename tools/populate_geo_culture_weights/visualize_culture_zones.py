"""
visualize_culture_zones.py

Genera una imagen PNG mostrando las zonas de cultura en el mapa
basándose en geo_culture_weights (cultura dominante por hex).

Uso:
    cd tools
    python visualize_culture_zones.py

Requiere: pip install matplotlib psycopg2-binary h3
Genera: culture_zones.png en la carpeta tools/
"""

import sys
import os
import math

try:
    import psycopg2
except ImportError:
    print("❌ pip install psycopg2-binary"); sys.exit(1)
try:
    import h3
except ImportError:
    print("❌ pip install h3"); sys.exit(1)
try:
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    import matplotlib.patches as mpatches
    from matplotlib.collections import PatchCollection
    import matplotlib.colors as mcolors
except ImportError:
    print("❌ pip install matplotlib"); sys.exit(1)

sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'terrain_extractor'))
try:
    from config import DB_CONFIG
except ImportError:
    DB_CONFIG = {'host':'localhost','port':'5444','database':'marca_hispanica','user':'postgres','password':'','client_encoding':'utf8'}

# ── Colores por cultura ──────────────────────────────────────────────────────
CULTURE_COLORS = {
    1: '#c04040',   # Roma — rojo
    2: '#8040c0',   # Cartago — púrpura
    3: '#3070c0',   # Íberos — azul
    4: '#3a8a3a',   # Celtas — verde
}
CULTURE_NAMES = {
    1: 'Roma',
    2: 'Cartago',
    3: 'Íberos',
    4: 'Celtas',
}
# Alpha por intensidad del peso dominante
def weight_to_alpha(w):
    return 0.25 + (w / 100.0) * 0.70  # 0.25 (peso bajo) → 0.95 (peso alto)

def main():
    print("🔌 Conectando a la BD…")
    conn = psycopg2.connect(**DB_CONFIG)
    cur  = conn.cursor()

    # ── 1. Obtener cultura dominante por hex ─────────────────────────────────
    print("📦 Leyendo geo_culture_weights…")
    cur.execute("""
        SELECT DISTINCT ON (h3_index)
               h3_index, culture_id, weight
        FROM   geo_culture_weights
        ORDER  BY h3_index, weight DESC
    """)
    rows = cur.fetchall()
    print(f"   → {len(rows):,} hexes con datos de cultura")

    # ── 2. Obtener hexes colonizables para saber qué existe en el mapa ───────
    print("🗺️  Leyendo hexes colonizables del mapa…")
    cur.execute("""
        SELECT m.h3_index
        FROM   h3_map m
        JOIN   terrain_types t ON t.terrain_type_id = m.terrain_type_id
        WHERE  t.is_colonizable = TRUE
    """)
    colonizable = {r[0] for r in cur.fetchall()}
    print(f"   → {len(colonizable):,} hexes colonizables")

    cur.close()
    conn.close()

    # ── 3. Filtrar solo hexes colonizables y preparar puntos ─────────────────
    print("⚙️  Convirtiendo H3 → lat/lng…")
    points = []  # (lat, lng, culture_id, weight)
    for h3_index, culture_id, weight in rows:
        if h3_index not in colonizable:
            continue
        if culture_id not in CULTURE_COLORS:
            continue
        lat, lng = h3.cell_to_latlng(h3_index)
        points.append((lat, lng, culture_id, int(weight)))

    print(f"   → {len(points):,} puntos a renderizar")

    # ── 4. Renderizar ─────────────────────────────────────────────────────────
    print("🎨 Generando imagen…")
    fig, ax = plt.subplots(figsize=(18, 14))
    fig.patch.set_facecolor('#0d0d18')
    ax.set_facecolor('#0d0d18')

    # Agrupar por cultura para scatter eficiente
    from collections import defaultdict
    by_culture = defaultdict(lambda: {'lats':[], 'lngs':[], 'weights':[]})
    for lat, lng, cid, w in points:
        by_culture[cid]['lats'].append(lat)
        by_culture[cid]['lngs'].append(lng)
        by_culture[cid]['weights'].append(w)

    for cid, data in sorted(by_culture.items()):
        color = CULTURE_COLORS[cid]
        # Escalar alpha según peso (hexes de borde más transparentes)
        alphas = [weight_to_alpha(w) for w in data['weights']]
        # matplotlib scatter no acepta alpha por punto directamente,
        # agrupamos por tramos de peso para simular gradiente
        buckets = [(0,30,'low'), (30,60,'mid'), (60,80,'high'), (80,101,'core')]
        for lo, hi, _ in buckets:
            idxs = [i for i,w in enumerate(data['weights']) if lo <= w < hi]
            if not idxs:
                continue
            lngs_b = [data['lngs'][i] for i in idxs]
            lats_b = [data['lats'][i] for i in idxs]
            a = weight_to_alpha((lo + hi) / 2)
            ax.scatter(lngs_b, lats_b, c=color, s=1.2, alpha=a,
                       linewidths=0, rasterized=True)

    # ── Leyenda ───────────────────────────────────────────────────────────────
    legend_patches = [
        mpatches.Patch(color=CULTURE_COLORS[cid], label=f"{CULTURE_NAMES[cid]}  ({len(by_culture[cid]['lats']):,} hexes)")
        for cid in sorted(CULTURE_COLORS.keys()) if cid in by_culture
    ]
    legend = ax.legend(handles=legend_patches, loc='upper right',
                       framealpha=0.85, facecolor='#1a1a2e',
                       edgecolor='#555577', labelcolor='white',
                       fontsize=11, title='Culturas', title_fontsize=12)
    legend.get_title().set_color('#ccccee')

    ax.set_title('Zonas de Cultura — Península Ibérica',
                 color='#ccccdd', fontsize=16, pad=14, fontweight='bold')
    ax.set_xlabel('Longitud', color='#888899', fontsize=9)
    ax.set_ylabel('Latitud',  color='#888899', fontsize=9)
    ax.tick_params(colors='#666677', labelsize=8)
    for spine in ax.spines.values():
        spine.set_edgecolor('#333344')

    # Ajustar límites al mapa
    ax.set_xlim(-10, 5)
    ax.set_ylim(34.5, 44.5)
    ax.set_aspect('equal', adjustable='box')

    # Añadir nota sobre zonas de mezcla
    ax.text(0.01, 0.02,
            'Zonas de borde (transparentes) permiten aparición de múltiples culturas',
            transform=ax.transAxes, color='#777788', fontsize=8, style='italic')

    out_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'culture_zones.png')
    plt.tight_layout()
    plt.savefig(out_path, dpi=130, bbox_inches='tight', facecolor=fig.get_facecolor())
    plt.close()

    print(f"\n✅ Imagen guardada en: {out_path}")
    print("   Abre culture_zones.png para validar las zonas.")

if __name__ == '__main__':
    main()
