"use client";

// ============================================================
// features/experience/components/Scene.tsx
// The 3D half of the experience: buildings, lighting, camera rig
// and room hotspots. All UI chrome lives in the overlay.
// ============================================================

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, AdaptiveDpr, AdaptiveEvents, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import {
  buildBranch, type BranchKey, type Detail, type BuiltBranch,
} from "../lib/buildings";
import {
  BRANCH_LAYOUT, BRANCH_ANCHOR, roomHotspot, explodeOffset, roofExplodeOffset,
} from "../lib/layout";
import type { ExperienceBranch, ExperienceRoom } from "@/server/actions/experience";
import type { Stage } from "./types";

const DAMP = 2.6;

// ─── Building ─────────────────────────────────────────────────
function Building({
  branchKey, detail, exploded, dimmed, focusFloor, onSelectBranch, interactive,
}: {
  branchKey: BranchKey;
  detail: Detail;
  exploded: boolean;
  dimmed: boolean;
  focusFloor: number | null;
  onSelectBranch?: () => void;
  interactive: boolean;
}) {
  const built = useMemo<BuiltBranch>(() => buildBranch(THREE, branchKey, detail), [branchKey, detail]);
  const [hovered, setHovered] = useState(false);

  // Dispose geometry/materials when the model is swapped (LOD change).
  useEffect(() => () => {
    built.root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.geometry?.dispose();
      const mat = m.material as THREE.Material | THREE.Material[];
      Array.isArray(mat) ? mat.forEach((x) => x.dispose()) : mat?.dispose();
    });
  }, [built]);

  useFrame((_, dt) => {
    const k = 1 - Math.exp(-DAMP * dt);

    built.floors.forEach((f, i) => {
      const targetY = explodeOffset(branchKey, i, exploded);
      f.position.y += (targetY - f.position.y) * k;

      // While a floor is focused the others recede rather than vanish,
      // so the customer keeps their sense of the whole building.
      const isFocus = focusFloor === null || focusFloor === i;
      const targetOpacity = isFocus ? 1 : 0.16;
      f.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh) return;
        const mat = m.material as THREE.MeshStandardMaterial;
        if (!mat || Array.isArray(mat)) return;
        if (mat.userData.baseOpacity === undefined) {
          mat.userData.baseOpacity = mat.opacity ?? 1;
        }
        const want = mat.userData.baseOpacity * targetOpacity;
        if (Math.abs(mat.opacity - want) > 0.005) {
          mat.opacity += (want - mat.opacity) * k;
          mat.transparent = mat.opacity < 0.99;
          mat.depthWrite = mat.opacity > 0.7;
        }
      });
    });

    const roofY = roofExplodeOffset(branchKey, exploded);
    built.roof.position.y += (roofY - built.roof.position.y) * k;

    // Hover / dim response on the whole model.
    const targetScale = hovered && interactive && !exploded ? 1.012 : 1;
    const s = built.root.scale.x + (targetScale - built.root.scale.x) * k;
    built.root.scale.setScalar(s);
  });

  const anchor = BRANCH_ANCHOR[branchKey];

  return (
    <group
      position={anchor}
      onPointerOver={interactive ? (e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; } : undefined}
      onPointerOut={interactive ? () => { setHovered(false); document.body.style.cursor = "auto"; } : undefined}
      onClick={interactive && onSelectBranch ? (e) => { e.stopPropagation(); onSelectBranch(); } : undefined}
    >
      <primitive object={built.root} />
      {/* Grounding shadow keeps the building sitting on the plate. */}
      <ContactShadows
        position={[0, 0.32, 0]}
        scale={BRANCH_LAYOUT[branchKey].siteWidth}
        opacity={dimmed ? 0.18 : 0.42}
        blur={2.4}
        far={14}
        resolution={detail === "high" ? 512 : 256}
        frames={1}
      />
    </group>
  );
}

// ─── Room hotspots ────────────────────────────────────────────
const STATUS_TONE: Record<string, { dot: string; label: string }> = {
  AVAILABLE:   { dot: "#4ade80", label: "Available" },
  BOOKED:      { dot: "#f87171", label: "Not available for your dates" },
  OCCUPIED:    { dot: "#fb923c", label: "Occupied" },
  MAINTENANCE: { dot: "#94a3b8", label: "Under maintenance" },
  UNAVAILABLE: { dot: "#94a3b8", label: "Unavailable" },
};

function RoomHotspots({
  branchKey, rooms, floorIndex, exploded, selectedRoomId, onSelect,
}: {
  branchKey: BranchKey;
  rooms: ExperienceRoom[];
  floorIndex: number;
  exploded: boolean;
  selectedRoomId: string | null;
  onSelect: (r: ExperienceRoom) => void;
}) {
  const anchor = BRANCH_ANCHOR[branchKey];
  const lift = explodeOffset(branchKey, floorIndex, exploded);

  return (
    <group position={[anchor[0], anchor[1] + lift, anchor[2]]}>
      {rooms.map((room, i) => {
        const p = roomHotspot(branchKey, floorIndex, i, rooms.length);
        const tone = STATUS_TONE[room.availability] ?? STATUS_TONE.UNAVAILABLE;
        const free = room.availability === "AVAILABLE";
        const active = selectedRoomId === room.id;
        return (
          <Html
            key={room.id}
            position={p}
            center
            distanceFactor={16}
            zIndexRange={[40, 0]}
            style={{ pointerEvents: "auto" }}
          >
            <button
              onClick={(e) => { e.stopPropagation(); onSelect(room); }}
              aria-label={`Room ${room.number}, ${room.name}, ${tone.label}, PKR ${room.pricePerNight} per night`}
              className={[
                "group flex items-center gap-2 rounded-full border px-3 py-1.5 text-left",
                "backdrop-blur-md transition-all duration-200 whitespace-nowrap",
                active
                  ? "border-gold-400 bg-gold-500/25 shadow-[0_0_0_3px_rgba(212,168,83,0.25)]"
                  : free
                    ? "border-white/25 bg-black/55 hover:border-gold-400/70 hover:bg-black/75"
                    : "border-white/10 bg-black/40 opacity-70 hover:opacity-95",
              ].join(" ")}
            >
              <span
                className="h-2 w-2 flex-shrink-0 rounded-full"
                style={{ background: tone.dot, boxShadow: `0 0 8px ${tone.dot}` }}
                aria-hidden="true"
              />
              <span className="text-[11px] font-semibold leading-tight text-white">
                {room.number}
                <span className="ml-1.5 font-normal text-white/60">
                  ₨{room.pricePerNight.toLocaleString("en-PK")}
                </span>
              </span>
            </button>
          </Html>
        );
      })}
    </group>
  );
}

// ─── Branch label (selection stage) ───────────────────────────
function BranchLabel({
  branch, onSelect,
}: {
  branch: ExperienceBranch;
  onSelect: () => void;
}) {
  const anchor = BRANCH_ANCHOR[branch.key];
  const L = BRANCH_LAYOUT[branch.key];
  const top = L.levels[L.levels.length - 1];
  // Clear of the parapet so the card never sits on the façade.
  const labelY = top.base + top.height + 7.5;
  return (
    <Html
      position={[anchor[0], labelY, anchor[2] + L.depth / 2]}
      center
      distanceFactor={26}
      zIndexRange={[30, 0]}
    >
      <div className="w-[230px] select-none text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gold-300/90">
          {branch.key === "main" ? "Flagship" : "New Branch"}
        </p>
        <h3 className="mt-1 font-serif text-xl font-bold leading-tight text-white drop-shadow-lg">
          {branch.name}
        </h3>
        <p className="mt-0.5 text-[11px] leading-snug text-white/70">{branch.address}</p>
        <p className="mt-1.5 text-[11px] text-white/85">
          {branch.availableRooms} of {branch.totalRooms} rooms available
          {branch.startingFrom !== null && (
            <> · from <span className="font-semibold text-gold-300">₨{branch.startingFrom.toLocaleString("en-PK")}</span></>
          )}
        </p>
        <button
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
          className="mt-3 rounded-xl border border-gold-400/50 bg-gold-500/15 px-4 py-2 text-xs font-semibold text-gold-200 backdrop-blur-md transition-all hover:bg-gold-500/30 hover:text-white"
        >
          Explore Building →
        </button>
      </div>
    </Html>
  );
}

// ─── Camera rig ───────────────────────────────────────────────
interface CamTarget { pos: THREE.Vector3; look: THREE.Vector3 }

function CameraRig({
  stage, branchKey, floorIndex, reducedMotion, compact,
}: {
  stage: Stage;
  branchKey: BranchKey | null;
  floorIndex: number | null;
  reducedMotion: boolean;
  compact: boolean;
}) {
  const { camera, size } = useThree();
  const target = useRef(new THREE.Vector3());
  const desired = useRef<CamTarget>({
    pos: new THREE.Vector3(0, 22, 78),
    look: new THREE.Vector3(0, 5, 0),
  });

  const aspect = size.width / Math.max(1, size.height);
  const fov = (camera as THREE.PerspectiveCamera).fov ?? 42;

  /**
   * Distance at which a box of the given half-extents fits the viewport.
   * Solved on both axes so a tall exploded stack never crops on wide
   * screens and a wide pair of buildings never crops on narrow ones.
   */
  const fitDistance = (halfH: number, halfW: number, margin: number) => {
    const vHalf = Math.tan((fov * Math.PI) / 360);
    const hHalf = vHalf * aspect;
    return Math.max(halfH / vHalf, halfW / hHalf) * margin;
  };

  // The overlay eats roughly 150px of header and 120px of date bar; framing
  // a little low keeps the model centred in the *visible* band.
  const chromeLift = size.height > 0 ? (150 - 120) / size.height : 0;
  // Phones spend far more of the screen on chrome (heading, chip row, date
  // dock), so the model has to sit further back to stay clear of it.
  const chromeMargin = compact ? 1.3 : 1;

  useEffect(() => {
    if (stage === "intro" || stage === "branch" || !branchKey) {
      // Both sites side by side: outermost edge is anchor + half site width.
      const halfW = Math.abs(BRANCH_ANCHOR.main[0]) + BRANCH_LAYOUT.main.siteWidth / 2;
      const halfH = 13;
      const d = fitDistance(halfH, halfW, 1.1 * chromeMargin);
      desired.current = {
        pos: new THREE.Vector3(0, d * 0.26, d),
        look: new THREE.Vector3(0, 6.5, 0),
      };
      return;
    }
    const a = BRANCH_ANCHOR[branchKey];
    const L = BRANCH_LAYOUT[branchKey];
    const explodedTop = L.levels.length * L.explodeGap;

    if (stage === "floor") {
      // Frame the whole exploded stack: ground plate up to the lifted roof.
      // The margin is generous on purpose — the façade sits nearer the camera
      // than the pivot, so it projects larger than the raw half-height implies.
      const topY = L.levels[L.levels.length - 1].base
        + L.levels[L.levels.length - 1].height + explodedTop + 2.5;
      const halfH = topY / 2;
      const halfW = L.siteWidth / 2.1;
      const d = fitDistance(halfH, halfW, 1.5 * chromeMargin);
      // Aim slightly above the stack's centre so the model settles into the
      // band between the header and the date bar rather than under them.
      const midY = topY * (0.56 + chromeLift);
      desired.current = {
        pos: new THREE.Vector3(a[0] - d * 0.28, midY + d * 0.14, a[2] + d * 0.94),
        look: new THREE.Vector3(a[0], midY, a[2]),
      };
      return;
    }

    // room stage — settle on the chosen storey, still showing its neighbours
    const fi = floorIndex ?? 0;
    const lvl = L.levels[Math.min(fi, L.levels.length - 1)];
    const y = lvl.base + explodeOffset(branchKey, fi, true) + lvl.height / 2;
    const halfH = Math.max(lvl.height, 4) * 1.9;
    const halfW = L.width / 1.7;
    const d = fitDistance(halfH, halfW, 1.15 * chromeMargin);
    desired.current = {
      pos: new THREE.Vector3(a[0] - d * 0.18, y + d * 0.16, a[2] + L.depth / 2 + d),
      look: new THREE.Vector3(a[0], y + halfH * chromeLift * 2, a[2] + L.depth / 2),
    };
  }, [stage, branchKey, floorIndex, aspect, fov, chromeLift, chromeMargin]);

  useFrame((_, dt) => {
    const k = reducedMotion ? 1 : 1 - Math.exp(-1.9 * dt);
    camera.position.lerp(desired.current.pos, k);
    target.current.lerp(desired.current.look, k);
    camera.lookAt(target.current);
  });

  return null;
}

// ─── Canvas sizing ────────────────────────────────────────────
/**
 * Size the renderer from its own container.
 *
 * R3F's built-in measurement can settle on the canvas's 300x150 intrinsic
 * default when the element is mounted into a container whose height is still
 * resolving — which is the normal case here, because the scene is a lazy chunk
 * and phones report a shorter viewport until the URL bar collapses. Observing
 * the container directly is immune to both.
 */
function CanvasResizer() {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const setSize = useThree((s) => s.setSize);

  useEffect(() => {
    const host = gl.domElement.parentElement;
    if (!host) return;

    // Drive the renderer from the container instead of waiting on R3F's own
    // measurement, which can settle on the canvas's 300x150 intrinsic default
    // here: the scene is a lazy chunk, so it mounts long after first paint,
    // and phones keep changing the viewport as the URL bar collapses.
    const apply = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (w < 1 || h < 1) return;
      if (gl.domElement.clientWidth === w && gl.domElement.clientHeight === h) return;
      gl.setSize(w, h, true);
      setSize(w, h);
      const cam = camera as THREE.PerspectiveCamera;
      if (cam.isPerspectiveCamera) {
        cam.aspect = w / h;
        cam.updateProjectionMatrix();
      }
    };

    apply();
    // The container can still be settling on the first frames.
    const timers = [50, 200, 600, 1400].map((ms) => setTimeout(apply, ms));
    const ro = new ResizeObserver(apply);
    ro.observe(host);
    window.addEventListener("orientationchange", apply);
    return () => {
      timers.forEach(clearTimeout);
      ro.disconnect();
      window.removeEventListener("orientationchange", apply);
    };
  }, [gl, camera, setSize]);

  return null;
}

// ─── Lighting ─────────────────────────────────────────────────
function Lighting({ night, detail }: { night: boolean; detail: Detail }) {
  return (
    <>
      <hemisphereLight
        intensity={night ? 0.18 : 0.62}
        color={night ? "#6f86a6" : "#ffffff"}
        groundColor={night ? "#0a0c0e" : "#8d8a82"}
      />
      <directionalLight
        position={[26, 34, 20]}
        intensity={night ? 0.28 : 1.5}
        color={night ? "#9fb4d6" : "#fff6e8"}
        castShadow={detail === "high"}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={50}
        shadow-camera-bottom={-30}
      />
      <directionalLight position={[-24, 16, -18]} intensity={night ? 0.12 : 0.42} color="#cfd8e6" />
      <ambientLight intensity={night ? 0.1 : 0.22} />
    </>
  );
}

// ─── Scene root ───────────────────────────────────────────────
export interface SceneProps {
  branches: ExperienceBranch[];
  stage: Stage;
  selectedBranch: ExperienceBranch | null;
  selectedFloor: number | null;
  selectedRoomId: string | null;
  detail: Detail;
  night: boolean;
  reducedMotion: boolean;
  /** Small screens get DOM cards instead of in-scene labels. */
  compact: boolean;
  onSelectBranch: (b: ExperienceBranch) => void;
  onSelectRoom: (r: ExperienceRoom) => void;
}

export function Scene(props: SceneProps) {
  const {
    branches, stage, selectedBranch, selectedFloor, selectedRoomId,
    detail, night, reducedMotion, compact, onSelectBranch, onSelectRoom,
  } = props;

  const exploded = stage === "floor" || stage === "room";
  // In-scene labels shrink with camera distance, which on a phone leaves an
  // unusable tap target — the overlay renders real cards there instead.
  const showBranchLabels = stage === "branch" && !compact;

  return (
    <Canvas
      dpr={detail === "high" ? [1, 1.8] : [1, 1.25]}
      shadows={detail === "high"}
      gl={{ antialias: detail === "high", powerPreference: "high-performance" }}
      camera={{ fov: 42, near: 0.5, far: 400, position: [0, 22, 78] }}
      style={{ background: "transparent" }}
    >
      <CanvasResizer />
      <AdaptiveDpr pixelated />
      <AdaptiveEvents />
      <fog attach="fog" args={[night ? "#080a0c" : "#dfd9d0", 90, 260]} />
      <Lighting night={night} detail={detail} />
      <CameraRig
        stage={stage}
        branchKey={selectedBranch?.key ?? null}
        floorIndex={selectedFloor}
        reducedMotion={reducedMotion}
        compact={compact}
      />

      {branches.map((b) => {
        const isSelected = selectedBranch?.id === b.id;
        const hidden = selectedBranch !== null && !isSelected && stage !== "branch";
        if (hidden) return null;
        return (
          <group key={b.id}>
            <Building
              branchKey={b.key}
              detail={detail}
              exploded={isSelected && exploded}
              dimmed={selectedBranch !== null && !isSelected}
              focusFloor={isSelected && stage === "room" ? selectedFloor : null}
              interactive={stage === "branch"}
              onSelectBranch={() => onSelectBranch(b)}
            />
            {showBranchLabels && <BranchLabel branch={b} onSelect={() => onSelectBranch(b)} />}
          </group>
        );
      })}

      {/* Room markers only once a floor is chosen — before that they'd be noise.
          Skipped on phones, where the overlay list is the reliable tap target. */}
      {!compact && selectedBranch && stage === "room" && selectedFloor !== null &&
        selectedBranch.floors
          .filter((f) => f.index === selectedFloor)
          .map((f) => (
            <RoomHotspots
              key={f.index}
              branchKey={selectedBranch.key}
              rooms={f.rooms}
              floorIndex={f.index}
              exploded
              selectedRoomId={selectedRoomId}
              onSelect={onSelectRoom}
            />
          ))}
    </Canvas>
  );
}
