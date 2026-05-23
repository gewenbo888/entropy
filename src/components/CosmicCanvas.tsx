"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Persistent full-viewport cosmic field.
 * ~14k GPU particles distributed in a galactic disk + halo, slowly expanding,
 * color-graded hot→cold (entropy gradient). The cursor acts as a gravitational
 * mass that lenses nearby particles — "mouse movement bends spacetime."
 */
export default function CosmicCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0.6, 9);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // ---- geometry ----
    const COUNT = Math.max(4000, Math.min(14000, Math.floor((window.innerWidth * window.innerHeight) / 220)));
    const positions = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT);
    const radii = new Float32Array(COUNT);
    const sizes = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      const arm = Math.floor(Math.random() * 3);
      const t = Math.pow(Math.random(), 0.6);
      const radius = t * 11 + Math.random() * 0.5;
      const angle = arm * ((Math.PI * 2) / 3) + t * 4.2 + (Math.random() - 0.5) * 0.6;
      const spread = (1 - t) * 0.4 + 0.25;
      const x = Math.cos(angle) * radius + (Math.random() - 0.5) * radius * spread;
      const z = Math.sin(angle) * radius + (Math.random() - 0.5) * radius * spread;
      const y = (Math.random() - 0.5) * (0.6 + (1 - t) * 2.4);
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      seeds[i] = Math.random() * 6.28;
      radii[i] = radius / 11;
      sizes[i] = Math.random() * 1.6 + 0.4;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    geo.setAttribute("aRadius", new THREE.BufferAttribute(radii, 1));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));

    const uniforms = {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uStrength: { value: 0 },
      uPixelRatio: { value: renderer.getPixelRatio() },
      uExpand: { value: 1 },
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        uniform float uTime;
        uniform vec2 uMouse;
        uniform float uStrength;
        uniform float uPixelRatio;
        uniform float uExpand;
        attribute float aSeed;
        attribute float aRadius;
        attribute float aSize;
        varying float vR;
        varying float vTwinkle;

        void main() {
          vR = aRadius;
          vec3 p = position * uExpand;
          // gentle orbital drift
          float a = uTime * 0.018 * (1.2 - aRadius);
          float c = cos(a), s = sin(a);
          p.xz = mat2(c, -s, s, c) * p.xz;
          p.y += sin(uTime * 0.25 + aSeed) * 0.06;

          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          vec4 proj = projectionMatrix * mv;

          // gravitational lensing toward cursor (screen space)
          vec2 ndc = proj.xy / proj.w;
          vec2 d = ndc - uMouse;
          float dist = length(d);
          float pull = uStrength / (dist * dist + 0.05);
          ndc -= normalize(d + 0.0001) * min(pull * 0.05, 0.4);
          proj.xy = ndc * proj.w;

          gl_Position = proj;

          vTwinkle = 0.6 + 0.4 * sin(uTime * 1.6 + aSeed * 3.0);
          gl_PointSize = aSize * uPixelRatio * (160.0 / -mv.z) * (0.5 + vTwinkle * 0.6);
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        varying float vR;
        varying float vTwinkle;

        void main() {
          vec2 uv = gl_PointCoord - 0.5;
          float d = length(uv);
          if (d > 0.5) discard;
          float alpha = smoothstep(0.5, 0.0, d);

          // entropy gradient: hot core (gold/white) -> cool halo (blue/purple) -> ember flecks
          vec3 hot  = vec3(1.0, 0.92, 0.74);   // gold-white
          vec3 mid  = vec3(0.42, 0.74, 1.0);   // electric blue
          vec3 cool = vec3(0.66, 0.36, 0.98);  // cosmic purple
          vec3 col = mix(hot, mid, smoothstep(0.0, 0.5, vR));
          col = mix(col, cool, smoothstep(0.5, 1.0, vR));
          // rare ember points
          col = mix(col, vec3(1.0, 0.30, 0.42), step(0.985, fract(vR * 53.0)) * 0.8);

          gl_FragColor = vec4(col, alpha * (0.55 + vTwinkle * 0.45));
        }
      `,
    });

    const points = new THREE.Points(geo, material);
    scene.add(points);

    // faint central glow sprite
    const glowGeo = new THREE.BufferGeometry();
    glowGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array([0, 0, 0]), 3));
    const glowMat = new THREE.PointsMaterial({
      size: 520,
      sizeAttenuation: true,
      color: new THREE.Color(0x6a4cff),
      transparent: true,
      opacity: 0.05,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    scene.add(new THREE.Points(glowGeo, glowMat));

    // ---- interaction ----
    const targetMouse = new THREE.Vector2(0, 0);
    let targetStrength = 0;
    const onMove = (e: MouseEvent) => {
      targetMouse.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
      targetStrength = 0.16;
    };
    const onTouch = (e: TouchEvent) => {
      if (!e.touches[0]) return;
      targetMouse.set(
        (e.touches[0].clientX / window.innerWidth) * 2 - 1,
        -((e.touches[0].clientY / window.innerHeight) * 2 - 1),
      );
      targetStrength = 0.16;
    };
    const onLeave = () => { targetStrength = 0; };
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("mouseout", onLeave);

    // scroll parallax: drift camera + read scroll for expansion
    let scrollY = 0;
    const onScroll = () => { scrollY = window.scrollY; };
    window.addEventListener("scroll", onScroll, { passive: true });

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      uniforms.uPixelRatio.value = renderer.getPixelRatio();
    };
    window.addEventListener("resize", onResize);

    // ---- loop ----
    const clock = new THREE.Clock();
    let raf = 0;
    const tick = () => {
      const t = clock.getElapsedTime();
      uniforms.uTime.value = t;
      uniforms.uMouse.value.lerp(targetMouse, 0.06);
      uniforms.uStrength.value += (targetStrength - uniforms.uStrength.value) * 0.05;

      const docH = Math.max(1, document.body.scrollHeight - window.innerHeight);
      const prog = Math.min(1, scrollY / docH);
      uniforms.uExpand.value = 1 + prog * 0.9; // universe expands as you descend
      camera.position.x = uniforms.uMouse.value.x * 0.7;
      camera.position.y = 0.6 - uniforms.uMouse.value.y * 0.5 + prog * 1.2;
      camera.lookAt(0, 0, 0);
      points.rotation.y = t * 0.01;

      renderer.render(scene, camera);
      if (!reduce) raf = requestAnimationFrame(tick);
    };
    tick();
    if (reduce) renderer.render(scene, camera);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("mouseout", onLeave);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      geo.dispose();
      material.dispose();
      glowGeo.dispose();
      glowMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      aria-hidden
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{
        background:
          "radial-gradient(120% 90% at 50% 8%, #0a0820 0%, #050410 45%, #020208 100%)",
      }}
    />
  );
}
