// ============================================================
// features/experience/lib/buildings.ts
//
// Chakwal Guest House — parametric building assets.
//
// Faithful port of the approved Claude Design source
// (chakwal-buildings.js) — same real-world metre dimensions,
// same 13 materials, same detailing and signage.
//
// One deliberate change: the approved source builds each mass as a
// single full-height box, which cannot be pulled apart. Here the
// massing is emitted per storey into `floor_0…n` groups so the
// exploded floor-selection view can separate them. Every dimension,
// colour and material is unchanged — a floor is a slice of the same
// wall, not a redesign.
//
// y-up, real-world metres, pivot at the centre of the site plate,
// base at y = 0.
// ============================================================

import type * as THREE_NS from "three";

type THREE = typeof THREE_NS;
type Group = THREE_NS.Group;
type Material = THREE_NS.MeshStandardMaterial;

export type BranchKey = "main" | "madina";
export type Detail = "high" | "optimized";

/** Deterministic PRNG — keeps the lit-window pattern identical every load. */
function makeRnd(seed = 20260809) {
  let s = seed;
  return () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
}

// ─── Materials (verbatim from the approved design) ────────────
export function makeMaterials(THREE: THREE) {
  const m = (name: string, params: Record<string, unknown>) =>
    Object.assign(new THREE.MeshStandardMaterial(params), { name }) as Material;
  return {
    travertine: m("stone_travertine", { color: 0xd7ccbb, roughness: 0.88, metalness: 0.0 }),
    limestone:  m("stone_limestone",  { color: 0xbfb3a0, roughness: 0.92, metalness: 0.0 }),
    charcoal:   m("stone_charcoal",   { color: 0x3a3b3d, roughness: 0.72, metalness: 0.05 }),
    bronze:     m("metal_bronze_anodised", { color: 0x9a7549, roughness: 0.34, metalness: 0.35 }),
    glass:      m("glass_vision", {
      color: 0x53656f, roughness: 0.05, metalness: 0.22, transparent: true, opacity: 0.55,
    }),
    glassLit:   m("glass_lit_interior", {
      color: 0x4a3a25, roughness: 0.16, metalness: 0.0,
      emissive: 0xffb464, emissiveIntensity: 0.85,
    }),
    paving:     m("paving_stone",     { color: 0xb5aea3, roughness: 0.95 }),
    drive:      m("driveway_asphalt", { color: 0x4a4947, roughness: 0.98 }),
    lawn:       m("landscape_turf",   { color: 0x516b41, roughness: 1.0 }),
    foliage:    m("landscape_foliage",{ color: 0x445f3b, roughness: 1.0 }),
    timber:     m("timber_screen",    { color: 0x7d5734, roughness: 0.7 }),
    terracotta: m("brick_terracotta", { color: 0xa3634a, roughness: 0.88 }),
    lightWarm:  m("light_emitter_warm", {
      color: 0x2a2620, roughness: 0.4, emissive: 0xffc27a, emissiveIntensity: 1.4,
    }),
  };
}
export type Materials = ReturnType<typeof makeMaterials>;

// ─── Signage (canvas texture, verbatim) ───────────────────────
function signTexture(THREE: THREE, line1: string, line2: string, tint = "#f4ead8") {
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#16181a"; g.fillRect(0, 0, 1024, 256);
  g.fillStyle = tint;
  g.textAlign = "center";

  /**
   * Shrink until the line fits the plate.
   * The design assumes "Barlow Condensed"; if that font has not loaded the
   * fallback is wider and the name would run off the sign, so measure and
   * step down rather than trusting a fixed size.
   */
  const fitFont = (text: string, weight: number, startPx: number, spacing: number, maxW: number) => {
    let px = startPx;
    for (let i = 0; i < 24; i++) {
      g.font = `${weight} ${px}px "Barlow Condensed", "Arial Narrow", sans-serif`;
      (g as unknown as { letterSpacing: string }).letterSpacing = `${spacing}px`;
      // letterSpacing is not reflected by measureText in every engine — add it back.
      const w = g.measureText(text).width + spacing * Math.max(0, text.length - 1);
      if (w <= maxW) return;
      px -= 4;
      if (px < 24) return;
    }
  };

  const l1 = line1.toUpperCase();
  const l2 = line2.toUpperCase();

  fitFont(l1, 600, 104, 14, 900);
  g.fillText(l1, 512, 118);

  g.fillStyle = "rgba(244,234,216,0.72)";
  fitFont(l2, 500, 46, 22, 860);
  g.fillText(l2, 512, 190);
  g.fillStyle = tint;
  g.strokeStyle = "rgba(244,234,216,0.35)"; g.lineWidth = 3;
  g.beginPath(); g.moveTo(300, 146); g.lineTo(724, 146); g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function signMaterial(THREE: THREE, l1: string, l2: string, tint?: string) {
  const tex = signTexture(THREE, l1, l2, tint);
  const mat = new THREE.MeshStandardMaterial({
    map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.55,
    roughness: 0.55, metalness: 0.0,
  });
  mat.name = "signage_lit";
  return mat;
}

// ─── Primitive kit ────────────────────────────────────────────
function kit(THREE: THREE, root: Group) {
  const add = (mesh: THREE_NS.Object3D, parent?: Group) => { (parent || root).add(mesh); return mesh; };
  const box = (
    name: string, mat: Material, w: number, h: number, d: number,
    x: number, y: number, z: number, parent?: Group, ry?: number,
  ) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    if (ry) mesh.rotation.y = ry;
    mesh.castShadow = true; mesh.receiveShadow = true;
    add(mesh, parent);
    return mesh;
  };
  const plate = (name: string, mat: Material, w: number, d: number, x: number, y: number, z: number, parent?: Group) => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
    mesh.name = name;
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    add(mesh, parent);
    return mesh;
  };
  const cyl = (name: string, mat: Material, r: number, h: number, x: number, y: number, z: number, seg: number, parent?: Group) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg || 16), mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    add(mesh, parent);
    return mesh;
  };
  const group = (name: string, parent?: Group) => {
    const g = new THREE.Group(); g.name = name; add(g, parent); return g;
  };
  return { add, box, plate, cyl, group };
}
type Kit = ReturnType<typeof kit>;

function tree(THREE: THREE, K: Kit, mats: Materials, x: number, z: number, scale: number, parent: Group, i: number, detail: Detail) {
  const g = K.group("tree_" + i, parent);
  g.position.set(x, 0, z);
  g.scale.setScalar(scale);
  K.cyl("tree_trunk_" + i, mats.timber, 0.11, 2.4, 0, 1.2, 0, detail === "high" ? 10 : 6, g);
  const seg = detail === "high" ? 14 : 7;
  const crown = new THREE.Mesh(new THREE.SphereGeometry(1.15, seg, seg - 4), mats.foliage);
  crown.name = "tree_crown_" + i; crown.position.y = 3.0; crown.scale.set(1, 1.25, 1);
  crown.castShadow = true;
  g.add(crown);
  if (detail === "high") {
    const c2 = new THREE.Mesh(new THREE.SphereGeometry(0.75, seg, seg - 4), mats.foliage);
    c2.name = "tree_crown_b_" + i; c2.position.set(0.5, 2.3, 0.3);
    c2.castShadow = true;
    g.add(c2);
  }
  return g;
}

function bollards(THREE: THREE, K: Kit, mats: Materials, positions: number[][], parent: Group, detail: Detail) {
  if (detail !== "high") return;
  positions.forEach((p, i) => {
    K.cyl("bollard_post_" + i, mats.charcoal, 0.07, 0.85, p[0], 0.45, p[1], 8, parent);
    K.cyl("bollard_lamp_" + i, mats.lightWarm, 0.085, 0.1, p[0], 0.9, p[1], 8, parent);
  });
}

// ─── Result shape ─────────────────────────────────────────────
export interface BuiltBranch {
  root: Group;
  /** Storey groups, index 0 = ground. Explodable. */
  floors: Group[];
  /** Roof assembly — lifts above the top storey. */
  roof: Group;
  /** Site plate, landscaping, boundary — never explodes. */
  ground: Group;
  /** y of the underside of each storey, and the storey height. */
  floorLevels: { base: number; height: number }[];
  topY: number;
}

/* =========================================================
   MAIN BRANCH — flagship, three storeys, stone + curtain wall
   ========================================================= */
export function buildMainBranch(THREE: THREE, { detail = "high" as Detail } = {}): BuiltBranch {
  const rnd = makeRnd();
  const mats = makeMaterials(THREE);
  const root = new THREE.Group();
  root.name = "ChakwalGuestHouse_MainBranch";
  const K = kit(THREE, root);

  const SITE_W = 36, SITE_D = 27;
  const F0 = 0.30, H1 = 4.10, H = 3.50;
  const TOP = F0 + H1 + H * 2;          // 11.4
  const BW = 25, BD = 14;
  const FRONT = BD / 2;

  // Storey bands: ground is taller than the two typical floors.
  const levels = [
    { base: F0,           height: H1 },
    { base: F0 + H1,      height: H  },
    { base: F0 + H1 + H,  height: H  },
  ];

  const ground = K.group("ground");
  const shell  = K.group("building");
  const floors = levels.map((_, i) => K.group("floor_" + i, shell));
  const roof   = K.group("roof", shell);

  /* ---- site ---- */
  K.box("site_slab", mats.paving, SITE_W, F0, SITE_D, 0, F0 / 2, 0, ground);
  K.plate("site_lawn_left", mats.lawn, 9, 9, -12.5, F0 + 0.01, 7.5, ground);
  K.plate("site_lawn_right", mats.lawn, 9, 9, 12.5, F0 + 0.01, 7.5, ground);
  K.box("driveway", mats.drive, 15, 0.06, 12, 0, F0 + 0.02, 12.5 - 6, ground);
  K.box("driveway_apron", mats.drive, 26, 0.06, 5, 0, F0 + 0.02, 11.0, ground);
  K.box("entrance_walk", mats.paving, 9, 0.09, 6.5, 0, F0 + 0.05, FRONT + 3.4, ground);
  for (let i = 0; i < 3; i++) {
    K.box("entry_step_" + i, mats.limestone, 10 - i * 0.6, 0.16,
      2.4 - i * 0.6, 0, F0 + 0.08 + i * 0.16, FRONT + 1.6 + i * 0.3, ground);
  }

  /* ---- massing, sliced per storey ---- */
  const wingW = 6.5, wingD = BD;
  const cW = BW - wingW * 2 + 0.4;

  levels.forEach((lv, f) => {
    const g = floors[f];
    const midY = lv.base + lv.height / 2;

    [-1, 1].forEach((s) => {
      const tag = s < 0 ? "left" : "right";
      const x = s * (BW / 2 - wingW / 2);
      K.box(`wing_${tag}_stone_f${f}`, mats.travertine, wingW, lv.height, wingD, x, midY, 0, g);
      // string course expressing the floor line (top of every storey but the last)
      if (f < levels.length - 1) {
        K.box(`wing_${tag}_band_f${f}`, mats.limestone, wingW + 0.16, 0.18, wingD + 0.16,
          x, lv.base + lv.height - 0.35, 0, g);
      }
      if (f === 0) {
        K.box(`wing_${tag}_base_band`, mats.charcoal, wingW + 0.12, 1.0, wingD + 0.12, x, F0 + 0.5, 0, g);
      }
      // vertical stone fin — sliced so it travels with its storey
      K.box(`wing_${tag}_fin_f${f}`, mats.limestone, 0.5, lv.height - (f === 0 ? 1.0 : 0), 0.55,
        x - s * (wingW / 2 - 0.3), midY + (f === 0 ? 0.5 : 0), FRONT + 0.28, g);
    });

    // recessed central volume
    K.box(`centre_core_f${f}`, mats.charcoal, cW, lv.height, BD - 1.2, 0, midY, -0.6, g);

    /* ---- central curtain wall, per storey ---- */
    const cwZ = FRONT - 0.9;
    const glassH = lv.height - (f === 0 ? 0.6 : 0.1);
    const glassY = midY + (f === 0 ? 0.3 : 0);
    K.box(`curtain_glass_f${f}`, mats.glass, cW - 0.6, glassH, 0.1, 0, glassY, cwZ, g);
    const bays = detail === "high" ? 9 : 5;
    for (let i = 0; i <= bays; i++) {
      const x = -(cW - 0.6) / 2 + (i * (cW - 0.6)) / bays;
      K.box(`curtain_mullion_${f}_${i}`, mats.bronze, 0.13, glassH, 0.22, x, glassY, cwZ + 0.07, g);
    }
    if (f > 0) {
      K.box(`curtain_spandrel_f${f}`, mats.charcoal, cW - 0.6, 0.75, 0.24, 0, lv.base - 0.1, cwZ + 0.06, g);
      K.box(`curtain_transom_f${f}`, mats.bronze, cW - 0.6, 0.1, 0.26, 0, lv.base + 0.32, cwZ + 0.07, g);
    }
    if (f === 0) {
      K.box("lobby_glow", mats.glassLit, cW - 1.6, H1 - 1.1, 0.08, 0, F0 + (H1 - 1.1) / 2 + 0.3, cwZ - 0.35, g);
    }

    /* ---- punched windows in the stone wings ---- */
    let wi = 0;
    const addWindow = (x: number, y: number, z: number, w: number, h: number, faceZ: boolean, tag: string) => {
      const lit = rnd() > 0.42;
      const wg = K.group(`window_${tag}_f${f}_${wi}`, g);
      wg.position.set(x, y, z);
      wg.rotation.y = faceZ ? 0 : Math.PI / 2;
      K.box(`win_glass_${f}_${wi}`, lit ? mats.glassLit : mats.glass, w, h, 0.08, 0, 0, -0.16, wg);
      K.box(`win_reveal_${f}_${wi}`, mats.bronze, w + 0.1, h + 0.1, 0.06, 0, 0, -0.11, wg);
      K.box(`win_jamb_l_${f}_${wi}`, mats.limestone, 0.22, h + 0.5, 0.3, -w / 2 - 0.16, 0, -0.06, wg);
      K.box(`win_jamb_r_${f}_${wi}`, mats.limestone, 0.22, h + 0.5, 0.3, w / 2 + 0.16, 0, -0.06, wg);
      K.box(`win_lintel_${f}_${wi}`, mats.limestone, w + 0.54, 0.2, 0.34, 0, h / 2 + 0.15, -0.04, wg);
      if (detail === "high") {
        K.box(`win_sill_${f}_${wi}`, mats.limestone, w + 0.62, 0.14, 0.42, 0, -h / 2 - 0.15, 0.02, wg);
      }
      wi++;
    };
    [-1, 1].forEach((s) => {
      const cx = s * (BW / 2 - wingW / 2);
      const y = f === 0 ? F0 + H1 / 2 + 0.2 : lv.base + lv.height / 2;
      const h = f === 0 ? 2.5 : 2.1;
      [-1.7, 0, 1.7].forEach((ox) => addWindow(cx + ox, y, FRONT + 0.06, 1.35, h, true, "front"));
      const sx = s * (BW / 2 + 0.06);
      [-4.0, -1.3, 1.4, 4.1].forEach((oz) => addWindow(sx, y, oz, 1.35, h, false, "side"));
    });
  });

  /* ---- entrance portico + doors (belong to the ground storey) ---- */
  const g0 = floors[0];
  const canY = F0 + H1 + 0.25;
  K.box("canopy_slab", mats.travertine, 14.2, 0.42, 5.4, 0, canY, FRONT + 1.9, g0);
  K.box("canopy_soffit", mats.charcoal, 13.4, 0.1, 4.8, 0, canY - 0.24, FRONT + 1.9, g0);
  K.box("canopy_fascia", mats.charcoal, 14.4, 0.14, 5.6, 0, canY + 0.24, FRONT + 1.9, g0);
  [-6.1, -2.1, 2.1, 6.1].forEach((x, i) => {
    K.box("portico_column_" + i, mats.travertine, 0.55, canY - F0 - 0.2, 0.55, x, F0 + (canY - F0 - 0.2) / 2, FRONT + 3.9, g0);
    K.box("portico_column_trim_" + i, mats.bronze, 0.62, 0.16, 0.62, x, F0 + 0.3, FRONT + 3.9, g0);
  });
  K.box("canopy_cove_light", mats.lightWarm, 12.8, 0.07, 0.12, 0, canY - 0.3, FRONT + 4.55, g0);
  K.box("canopy_cove_light_inner", mats.lightWarm, 12.8, 0.07, 0.12, 0, canY - 0.3, FRONT - 0.7, g0);
  K.box("door_portal_frame", mats.bronze, 6.6, 3.3, 0.3, 0, F0 + 1.65, FRONT - 0.75, g0);
  K.box("door_glass_left", mats.glass, 3.0, 3.0, 0.12, -1.6, F0 + 1.5, FRONT - 0.68, g0);
  K.box("door_glass_right", mats.glass, 3.0, 3.0, 0.12, 1.6, F0 + 1.5, FRONT - 0.68, g0);
  K.box("door_mullion", mats.bronze, 0.14, 3.0, 0.16, 0, F0 + 1.5, FRONT - 0.66, g0);

  /* ---- roof assembly ---- */
  [-1, 1].forEach((s) => {
    const tag = s < 0 ? "left" : "right";
    const x = s * (BW / 2 - wingW / 2);
    K.box(`wing_${tag}_cornice`, mats.charcoal, wingW + 0.35, 0.55, wingD + 0.35, x, TOP + 0.28, 0, roof);
    K.box(`wing_${tag}_parapet`, mats.travertine, wingW, 0.9, wingD, x, TOP + 1.0, 0, roof);
  });
  K.box("centre_cornice", mats.charcoal, cW + 0.5, 0.45, BD - 0.4, 0, TOP + 0.22, -0.6, roof);
  K.box("roof_deck", mats.limestone, BW - 1.5, 0.12, BD - 1.5, 0, TOP + 0.55, -0.4, roof);
  K.box("roof_plant_enclosure", mats.charcoal, 5.4, 1.0, 3.4, -3.0, TOP + 1.05, -3.2, roof);
  K.box("roof_stair_head", mats.charcoal, 3.0, 1.4, 2.8, 5.5, TOP + 1.25, -3.6, roof);

  /* ---- signage ---- */
  const signMat = signMaterial(THREE, "Chakwal Guest House", "Main Branch");
  const sign = K.group("signage", ground);
  const fasciaSign = new THREE.Mesh(new THREE.BoxGeometry(7.6, 1.1, 0.16), signMat);
  fasciaSign.name = "sign_fascia_main";
  fasciaSign.position.set(0, canY + 0.05, FRONT + 4.72);
  sign.add(fasciaSign);
  K.box("sign_fascia_backer", mats.charcoal, 8.1, 1.5, 0.12, 0, canY + 0.05, FRONT + 4.64, sign);

  const mon = K.group("monument_sign", sign);
  mon.position.set(-11.8, 0, 11.2);
  K.box("monument_base", mats.charcoal, 3.6, 0.35, 1.0, 0, F0 + 0.17, 0, mon);
  K.box("monument_pier", mats.travertine, 3.2, 2.0, 0.55, 0, F0 + 1.2, 0, mon);
  const monPanel = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.85, 0.12), signMat);
  monPanel.name = "sign_monument_main";
  monPanel.position.set(0, F0 + 1.3, 0.3);
  mon.add(monPanel);
  K.box("monument_uplight", mats.lightWarm, 0.5, 0.07, 0.2, 0, F0 + 0.4, 0.42, mon);

  /* ---- landscaping + exterior lighting ---- */
  const land = K.group("landscape", ground);
  [-1, 1].forEach((s) => {
    const t = s < 0 ? "left" : "right";
    K.box("planter_" + t, mats.limestone, 1.5, 0.75, 5.0, s * 6.2, F0 + 0.37, FRONT + 3.2, land);
    K.box("planter_hedge_" + t, mats.foliage, 1.25, 0.5, 4.7, s * 6.2, F0 + 0.95, FRONT + 3.2, land);
    K.box("hedge_row_" + t, mats.foliage, 8.4, 0.7, 0.9, s * 12.5, F0 + 0.35, FRONT + 5.6, land);
    K.box("facade_uplight_" + t, mats.lightWarm, 5.2, 0.09, 0.25, s * 9.2, F0 + 0.12, FRONT + 0.45, land);
  });
  const treeXZ = detail === "high"
    ? [[-14.5, 6.0], [-14.5, 10.5], [14.5, 6.0], [14.5, 10.5], [-9.5, 12.2], [9.5, 12.2]]
    : [[-14.5, 7.5], [14.5, 7.5]];
  treeXZ.forEach((p, i) => tree(THREE, K, mats, p[0], p[1], 1 + (i % 3) * 0.12, land, i, detail));
  bollards(THREE, K, mats,
    [[-5.4, 12.0], [-5.4, 14.4], [5.4, 12.0], [5.4, 14.4], [-16.0, 4.0], [16.0, 4.0]], land, detail);

  return { root, floors, roof, ground, floorLevels: levels, topY: TOP };
}

/* =========================================================
   MADINA TOWN BRANCH — boutique villa, two storeys, L-plan
   ========================================================= */
export function buildMadinaBranch(THREE: THREE, { detail = "high" as Detail } = {}): BuiltBranch {
  const rnd = makeRnd();
  const mats = makeMaterials(THREE);
  const root = new THREE.Group();
  root.name = "ChakwalGuestHouse_MadinaTownBranch";
  const K = kit(THREE, root);

  const SITE_W = 32, SITE_D = 26;
  const F0 = 0.30, H1 = 3.90, H2 = 3.50;
  const TOP = F0 + H1 + H2;             // 7.7
  const MW = 16, MD = 12;
  const FRONT = MD / 2;

  const levels = [
    { base: F0,      height: H1 },
    { base: F0 + H1, height: H2 },
  ];

  const ground = K.group("ground");
  const shell  = K.group("building");
  const floors = levels.map((_, i) => K.group("floor_" + i, shell));
  const roof   = K.group("roof", shell);

  /* ---- site ---- */
  K.box("site_slab", mats.paving, SITE_W, F0, SITE_D, 0, F0 / 2, 0, ground);
  K.plate("front_lawn", mats.lawn, 13, 8, -5.5, F0 + 0.01, 10.5, ground);
  K.box("driveway", mats.drive, 9, 0.06, 12, 8.0, F0 + 0.02, 8.0, ground);
  K.box("entrance_walk", mats.paving, 4.6, 0.09, 8.0, -2.0, F0 + 0.05, FRONT + 4.2, ground);
  for (let i = 0; i < 2; i++) {
    K.box("entry_step_" + i, mats.limestone, 5.6 - i * 0.5, 0.17, 1.6 - i * 0.4, -2.0, F0 + 0.09 + i * 0.17, FRONT + 1.5 + i * 0.35, ground);
  }

  /* ---- main block, sliced per storey ---- */
  levels.forEach((lv, f) => {
    const g = floors[f];
    const midY = lv.base + lv.height / 2;

    K.box(`main_block_f${f}`, mats.travertine, MW, lv.height, MD, 0, midY, 0, g);
    if (f === 0) {
      K.box("main_base_band", mats.limestone, MW + 0.14, 0.9, MD + 0.14, 0, F0 + 0.45, 0, g);
    } else {
      K.box("floor_slab_band", mats.limestone, MW + 0.7, 0.3, MD + 0.7, 0, lv.base, 0, g);
      K.box("upper_brick_panel", mats.terracotta, 7.2, H2 - 1.2, 0.25, 3.6, lv.base + (H2 - 1.2) / 2 + 0.3, FRONT + 0.06, g);
    }

    /* ---- corner glazing (front-left), per storey ---- */
    const cgH = lv.height - (f === 0 ? 0.45 : 0.45);
    const cgY = midY + (f === 0 ? 0.225 : -0.225);
    K.box(`corner_glass_front_f${f}`, mats.glass, 6.4, cgH, 0.1, -4.6, cgY, FRONT + 0.07, g);
    K.box(`corner_glass_side_f${f}`, mats.glass, 0.1, cgH, 4.8, -MW / 2 - 0.07, cgY, 3.2, g);
    const bays = detail === "high" ? 5 : 3;
    for (let i = 0; i <= bays; i++) {
      const x = -4.6 - 3.2 + (i * 6.4) / bays;
      K.box(`corner_mullion_${f}_${i}`, mats.bronze, 0.12, cgH, 0.2, x, cgY, FRONT + 0.14, g);
    }
    K.box(`corner_column_f${f}`, mats.travertine, 0.42, lv.height, 0.42, -MW / 2 + 0.21, midY, FRONT - 0.21, g);
    if (f === 0) {
      K.box("corner_glass_glow", mats.glassLit, 5.6, H1 - 1.2, 0.08, -4.6, F0 + (H1 - 1.2) / 2 + 0.45, FRONT - 0.4, g);
      K.box("corner_transom", mats.bronze, 6.5, 0.14, 0.22, -4.6, F0 + H1 - 0.05, FRONT + 0.15, g);
    }

    /* ---- punched windows ---- */
    let wi = 0;
    const addWindow = (x: number, y: number, z: number, w: number, h: number, ry?: number) => {
      const lit = rnd() > 0.45;
      const wg = K.group(`window_f${f}_${wi}`, g);
      wg.position.set(x, y, z); wg.rotation.y = ry || 0;
      K.box(`win_glass_${f}_${wi}`, lit ? mats.glassLit : mats.glass, w, h, 0.1, 0, 0, 0, wg);
      K.box(`win_reveal_${f}_${wi}`, mats.bronze, w + 0.24, h + 0.24, 0.14, 0, 0, -0.05, wg);
      if (detail === "high") K.box(`win_sill_${f}_${wi}`, mats.limestone, w + 0.44, 0.12, 0.36, 0, -h / 2 - 0.13, 0.09, wg);
      wi++;
    };
    if (f === 1) {
      [1.2, 3.6, 6.0].forEach((x) => addWindow(x, lv.base + H2 / 2 - 0.1, FRONT + 0.06, 1.3, 1.9));
      [-3.6, -0.4, 2.8].forEach((z) => addWindow(-MW / 2 - 0.06, lv.base + H2 / 2 - 0.1, z, 1.3, 1.9, Math.PI / 2));
    } else {
      [3.0, 6.2].forEach((x) => addWindow(x, F0 + H1 / 2 + 0.1, FRONT + 0.06, 1.3, 2.2));
      [-4.2, -1.0].forEach((z) => addWindow(-MW / 2 - 0.06, F0 + H1 / 2 + 0.1, z, 1.3, 2.2, Math.PI / 2));
    }
  });

  /* ---- entrance portico with timber soffit (ground) ---- */
  const g0 = floors[0];
  const pY = F0 + H1 - 0.35;
  K.box("portico_slab", mats.limestone, 7.0, 0.32, 4.6, -2.0, pY, FRONT + 2.1, g0);
  const slats = detail === "high" ? 11 : 5;
  for (let i = 0; i < slats; i++) {
    K.box("portico_slat_" + i, mats.timber, 6.4, 0.1, 0.16, -2.0, pY - 0.22,
      FRONT + 0.2 + (i * 3.9) / (slats - 1), g0);
  }
  [-4.7, 0.7].forEach((x, i) => {
    K.box("portico_column_" + i, mats.travertine, 0.4, pY - F0 - 0.16, 0.4, x, F0 + (pY - F0 - 0.16) / 2, FRONT + 3.9, g0);
  });
  K.box("portico_cove_light", mats.lightWarm, 6.0, 0.07, 0.12, -2.0, pY - 0.3, FRONT + 4.25, g0);
  K.box("door_frame", mats.bronze, 3.3, 2.9, 0.26, -2.0, F0 + 1.45, FRONT - 0.6, g0);
  K.box("door_leaf_left", mats.timber, 1.35, 2.65, 0.12, -2.7, F0 + 1.33, FRONT - 0.52, g0);
  K.box("door_leaf_right", mats.glass, 1.35, 2.65, 0.12, -1.3, F0 + 1.33, FRONT - 0.52, g0);
  K.box("door_handle", mats.bronze, 0.06, 1.1, 0.06, -2.15, F0 + 1.4, FRONT - 0.44, g0);

  /* ---- upper balcony (first floor) ---- */
  const g1 = floors[1];
  K.box("balcony_slab", mats.limestone, 7.4, 0.26, 2.2, 3.4, F0 + H1 + 0.15, FRONT + 1.0, g1);
  K.box("balcony_rail_top", mats.bronze, 7.4, 0.09, 0.09, 3.4, F0 + H1 + 1.28, FRONT + 2.05, g1);
  K.box("balcony_rail_glass", mats.glass, 7.2, 1.0, 0.06, 3.4, F0 + H1 + 0.78, FRONT + 2.05, g1);
  [-1, 1].forEach((s, i) => {
    K.box("balcony_rail_post_" + i, mats.bronze, 0.09, 1.15, 0.09, 3.4 + s * 3.6, F0 + H1 + 0.85, FRONT + 2.05, g1);
  });

  /* ---- side wing + roof terrace with pergola (ground-level annex) ---- */
  const wing = K.group("side_wing", g0);
  const WW = 7.5, WD = 9.5, WH = F0 + 3.7;
  const wx = MW / 2 + WW / 2 - 0.4, wz = -1.0;
  K.box("wing_block", mats.limestone, WW, WH - F0, WD, wx, F0 + (WH - F0) / 2, wz, wing);
  K.box("wing_roof_slab", mats.limestone, WW + 0.9, 0.28, WD + 0.9, wx, WH + 0.14, wz, wing);
  K.box("wing_terrace_deck", mats.timber, WW - 0.6, 0.08, WD - 0.6, wx, WH + 0.32, wz, wing);
  K.box("terrace_rail_glass", mats.glass, WW - 0.4, 0.95, 0.06, wx, WH + 0.85, wz + WD / 2 - 0.35, wing);
  K.box("terrace_rail_cap", mats.bronze, WW - 0.4, 0.08, 0.14, wx, WH + 1.35, wz + WD / 2 - 0.35, wing);
  const perg = K.group("pergola", wing);
  [-1, 1].forEach((s, i) => {
    K.box("pergola_post_" + i, mats.timber, 0.16, 2.5, 0.16, wx + s * (WW / 2 - 0.9), WH + 1.6, wz - 2.6, perg);
    K.box("pergola_post_b_" + i, mats.timber, 0.16, 2.5, 0.16, wx + s * (WW / 2 - 0.9), WH + 1.6, wz + 1.6, perg);
  });
  K.box("pergola_beam_l", mats.timber, 0.14, 0.28, 4.6, wx - (WW / 2 - 0.9), WH + 2.9, wz - 0.5, perg);
  K.box("pergola_beam_r", mats.timber, 0.14, 0.28, 4.6, wx + (WW / 2 - 0.9), WH + 2.9, wz - 0.5, perg);
  const batt = detail === "high" ? 9 : 5;
  for (let i = 0; i < batt; i++) {
    K.box("pergola_batten_" + i, mats.timber, WW - 1.5, 0.12, 0.14, wx, WH + 3.02, wz - 2.6 + (i * 4.2) / (batt - 1), perg);
  }
  const scr = detail === "high" ? 9 : 5;
  for (let i = 0; i < scr; i++) {
    K.box("wing_screen_fin_" + i, mats.timber, 0.14, 3.0, 0.3,
      wx - (WW / 2 - 1.0) + (i * (WW - 2.0)) / (scr - 1), F0 + 1.9, wz + WD / 2 + 0.1, wing);
  }
  K.box("wing_window_glass", mats.glassLit, WW - 1.6, 2.6, 0.1, wx, F0 + 1.9, wz + WD / 2 + 0.02, wing);

  /* ---- deep flat roof overhang — silhouette signature ---- */
  K.box("roof_slab", mats.limestone, MW + 3.0, 0.34, MD + 2.6, 0, TOP + 0.17, 0.3, roof);
  K.box("roof_shadow_reveal", mats.charcoal, MW + 2.6, 0.12, MD + 2.2, 0, TOP - 0.02, 0.3, roof);
  K.box("roof_upstand", mats.limestone, MW + 1.2, 0.5, MD + 1.0, 0, TOP + 0.55, 0.1, roof);

  /* ---- boundary wall, gate piers, signage ---- */
  const signMat = signMaterial(THREE, "Chakwal Guest House", "Madina Town Branch");
  const bnd = K.group("boundary", ground);
  const wallZ = SITE_D / 2 - 0.9;
  K.box("boundary_wall_left", mats.limestone, 11.0, 1.15, 0.35, -10.0, F0 + 0.58, wallZ, bnd);
  K.box("boundary_wall_right", mats.limestone, 6.0, 1.15, 0.35, 13.0, F0 + 0.58, wallZ, bnd);
  K.box("boundary_wall_cap_left", mats.charcoal, 11.2, 0.1, 0.45, -10.0, F0 + 1.2, wallZ, bnd);
  K.box("boundary_wall_cap_right", mats.charcoal, 6.2, 0.1, 0.45, 13.0, F0 + 1.2, wallZ, bnd);
  [-4.2, 9.6].forEach((x, i) => {
    K.box("gate_pier_" + i, mats.travertine, 1.1, 2.6, 1.1, x, F0 + 1.3, wallZ, bnd);
    K.box("gate_pier_cap_" + i, mats.charcoal, 1.3, 0.16, 1.3, x, F0 + 2.68, wallZ, bnd);
    K.box("gate_pier_light_" + i, mats.lightWarm, 0.34, 0.5, 0.1, x, F0 + 1.9, wallZ + 0.58, bnd);
  });
  const pierSign = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.86, 0.14), signMat);
  pierSign.name = "sign_gate_madina";
  pierSign.position.set(-9.6, F0 + 1.7, wallZ + 0.2);
  bnd.add(pierSign);
  K.box("sign_gate_backer", mats.charcoal, 5.0, 1.2, 0.14, -9.6, F0 + 1.7, wallZ + 0.12, bnd);
  K.box("sign_gate_uplight", mats.lightWarm, 3.2, 0.07, 0.16, -9.6, F0 + 1.02, wallZ + 0.32, bnd);

  const wallSign = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.62, 0.1), signMat);
  wallSign.name = "sign_facade_madina";
  wallSign.position.set(4.2, F0 + 2.7, FRONT + 0.12);
  g1.add(wallSign);

  /* ---- landscaping + lighting ---- */
  const land = K.group("landscape", ground);
  K.box("hedge_front", mats.foliage, 12.0, 0.65, 0.85, -5.5, F0 + 0.33, FRONT + 6.4, land);
  [-1, 1].forEach((s, i) => {
    K.box("entry_planter_" + i, mats.limestone, 1.2, 0.6, 3.2, -2.0 + s * 3.2, F0 + 0.3, FRONT + 3.0, land);
    K.box("entry_hedge_" + i, mats.foliage, 1.0, 0.45, 3.0, -2.0 + s * 3.2, F0 + 0.8, FRONT + 3.0, land);
  });
  K.box("facade_uplight_front", mats.lightWarm, 6.0, 0.09, 0.22, 3.6, F0 + 0.12, FRONT + 0.5, land);
  K.box("facade_uplight_side", mats.lightWarm, 0.22, 0.09, 5.0, -MW / 2 - 0.5, F0 + 0.12, 1.0, land);
  const treeXZ = detail === "high"
    ? [[-12.0, 7.0], [-8.0, 10.4], [12.5, 4.0], [-13.5, 1.0], [3.0, 11.5]]
    : [[-11.0, 8.0], [12.5, 4.0]];
  treeXZ.forEach((p, i) => tree(THREE, K, mats, p[0], p[1], 0.9 + (i % 3) * 0.14, land, i, detail));
  bollards(THREE, K, mats, [[-4.4, 9.0], [-4.4, 11.6], [0.4, 9.0], [0.4, 11.6]], land, detail);

  return { root, floors, roof, ground, floorLevels: levels, topY: TOP };
}

export function buildBranch(THREE: THREE, branch: BranchKey, detail: Detail = "high"): BuiltBranch {
  return branch === "madina"
    ? buildMadinaBranch(THREE, { detail })
    : buildMainBranch(THREE, { detail });
}

export function countStats(obj: THREE_NS.Object3D) {
  let tris = 0, meshes = 0;
  const mats = new Set<unknown>();
  obj.traverse((o) => {
    const mesh = o as THREE_NS.Mesh;
    if (!mesh.isMesh) return;
    meshes++;
    mats.add(mesh.material);
    const g = mesh.geometry;
    tris += g.index ? g.index.count / 3 : g.attributes.position.count / 3;
  });
  return { tris: Math.round(tris), meshes, materials: mats.size };
}
