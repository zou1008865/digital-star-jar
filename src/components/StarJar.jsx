import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import Matter from "matter-js";

const STAR_CATEGORY = 0x0001;
const WALL_CATEGORY = 0x0002;
const STAR_LIMIT = 120;
const GOLD = "#ffd76a";

const previewStars = [
  { color: "#61e6ff", glow: "rgba(97, 230, 255, 0.5)" },
  { color: "#ffd166", glow: "rgba(255, 209, 102, 0.48)" },
  { color: "#ff7ab6", glow: "rgba(255, 122, 182, 0.48)" }
];

function starPoints(size) {
  const points = [];
  const outer = size;
  const inner = size * 0.45;

  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    points.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    });
  }

  return points;
}

function createWall(x1, y1, x2, y2, thickness, options) {
  const length = Math.hypot(x2 - x1, y2 - y1);
  const centerX = (x1 + x2) / 2;
  const centerY = (y1 + y2) / 2;
  const wall = Matter.Bodies.rectangle(centerX, centerY, length, thickness, options);
  Matter.Body.setAngle(wall, Math.atan2(y2 - y1, x2 - x1));
  return wall;
}

function drawStar(context, body) {
  const points = starPoints(body.plugin.starSize);
  const { x, y } = body.position;

  context.save();
  context.translate(x, y);
  context.rotate(body.angle);

  context.globalAlpha = 0.28;
  context.fillStyle = body.plugin.glow;
  context.beginPath();
  context.arc(0, 0, body.plugin.starSize * 1.2, 0, Math.PI * 2);
  context.fill();

  context.shadowColor = body.plugin.glow;
  context.shadowBlur = 24;
  context.beginPath();
  points.forEach((point, index) => {
    if (index === 0) context.moveTo(point.x, point.y);
    else context.lineTo(point.x, point.y);
  });
  context.closePath();
  context.globalAlpha = 0.96;
  context.fillStyle = body.plugin.color;
  context.fill();
  context.globalAlpha = 0.76;
  context.lineWidth = 1.35;
  context.strokeStyle = "rgba(255,255,255,0.86)";
  context.stroke();
  context.restore();
}

function drawParticle(context, particle) {
  const progress = particle.life / particle.maxLife;
  context.save();
  context.globalAlpha = Math.max(0, 1 - progress);
  context.shadowColor = "rgba(255, 214, 106, 0.8)";
  context.shadowBlur = 9;
  context.fillStyle = particle.color;
  context.beginPath();
  context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

const StarJar = forwardRef(function StarJar(_, ref) {
  const sceneRef = useRef(null);
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const frameRef = useRef(0);
  const wallsRef = useRef([]);
  const sizeRef = useRef({ dpr: 1, height: 0, width: 0 });
  const dropStarRef = useRef(() => {});
  const restoreStarsRef = useRef(() => {});
  const clearStarsRef = useRef(() => {});
  const audioRef = useRef(null);
  const lastSoundAtRef = useRef(0);
  const particlesRef = useRef([]);

  useImperativeHandle(
    ref,
    () => ({
      clearStars: () => clearStarsRef.current(),
      dropStar: (star) => dropStarRef.current(star),
      restoreStars: (count, palette) => restoreStarsRef.current(count, palette)
    }),
    []
  );

  useEffect(() => {
    const scene = sceneRef.current;
    const canvas = canvasRef.current;
    if (!scene || !canvas) return undefined;

    const context = canvas.getContext("2d");
    const engine = Matter.Engine.create({
      enableSleeping: true,
      gravity: { x: 0, y: 2.15 }
    });

    engineRef.current = engine;

    const wallOptions = {
      isStatic: true,
      collisionFilter: {
        category: WALL_CATEGORY,
        mask: STAR_CATEGORY
      },
      render: { visible: false }
    };

    const getAudio = () => {
      if (!audioRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return null;
        audioRef.current = new AudioContext();
      }

      if (audioRef.current.state === "suspended") {
        audioRef.current.resume();
      }

      return audioRef.current;
    };

    const playChime = (intensity = 1) => {
      const now = performance.now();
      if (now - lastSoundAtRef.current < 85) return;
      lastSoundAtRef.current = now;

      const audio = getAudio();
      if (!audio) return;

      const startedAt = audio.currentTime;
      const master = audio.createGain();
      const shimmer = audio.createGain();
      const filter = audio.createBiquadFilter();

      filter.type = "highpass";
      filter.frequency.value = 560;
      master.gain.setValueAtTime(0.0001, startedAt);
      master.gain.exponentialRampToValueAtTime(0.08 * intensity, startedAt + 0.012);
      master.gain.exponentialRampToValueAtTime(0.0001, startedAt + 1.1);

      shimmer.gain.setValueAtTime(0.0001, startedAt);
      shimmer.gain.exponentialRampToValueAtTime(0.045 * intensity, startedAt + 0.018);
      shimmer.gain.exponentialRampToValueAtTime(0.0001, startedAt + 0.72);

      master.connect(filter);
      shimmer.connect(filter);
      filter.connect(audio.destination);

      [
        { frequency: 1174.66, gain: master, type: "sine" },
        { frequency: 1760, gain: shimmer, type: "triangle" },
        { frequency: 2349.32, gain: shimmer, type: "sine" }
      ].forEach(({ frequency, gain, type }, index) => {
        const oscillator = audio.createOscillator();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, startedAt);
        oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.996, startedAt + 0.42);
        oscillator.connect(gain);
        oscillator.start(startedAt + index * 0.006);
        oscillator.stop(startedAt + 1.12);
      });
    };

    const burstParticles = (x, y, amount = 16) => {
      for (let index = 0; index < amount; index += 1) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.35;
        const speed = 1.3 + Math.random() * 3.2;
        particlesRef.current.push({
          color: Math.random() > 0.35 ? GOLD : "#fff2a8",
          life: 0,
          maxLife: 420 + Math.random() * 260,
          size: 1.3 + Math.random() * 2.2,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          x,
          y
        });
      }
    };

    const rebuildJar = () => {
      const { width, height } = scene.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      if (width < 10 || height < 10) return;

      sizeRef.current = { dpr, height, width };
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      Matter.Composite.remove(engine.world, wallsRef.current);

      const jarWidth = Math.min(width * 0.64, 430);
      const centerX = width / 2;
      const topY = height * 0.16;
      const bottomY = height * 0.88;
      const topWidth = jarWidth * 0.86;
      const bottomWidth = jarWidth * 0.62;
      const thickness = 28;

      const leftTopX = centerX - topWidth / 2;
      const rightTopX = centerX + topWidth / 2;
      const leftBottomX = centerX - bottomWidth / 2;
      const rightBottomX = centerX + bottomWidth / 2;

      wallsRef.current = [
        createWall(leftTopX, topY, leftBottomX, bottomY, thickness, wallOptions),
        createWall(rightTopX, topY, rightBottomX, bottomY, thickness, wallOptions),
        createWall(leftBottomX, bottomY, rightBottomX, bottomY, thickness, wallOptions)
      ];

      Matter.Composite.add(engine.world, wallsRef.current);
    };

    const createStar = ({
      color = "#ffd166",
      glow = "rgba(255,255,255,0.35)",
      isRestored = false,
      x,
      y
    } = {}) => {
      const { Bodies, Body, Composite } = Matter;
      const { height, width } = sizeRef.current;
      if (!width || !height) return null;

      const size = 23 + Math.random() * 7;
      const startX = x ?? width / 2 + (Math.random() - 0.5) * Math.min(width * 0.26, 150);
      const startY = y ?? 8;
      const star = Bodies.circle(startX, startY, size * 0.78, {
        collisionFilter: {
          category: STAR_CATEGORY,
          mask: STAR_CATEGORY | WALL_CATEGORY
        },
        density: 0.0018,
        friction: 0.82,
        frictionAir: 0.012,
        restitution: 0.28,
        render: { visible: false },
        sleepThreshold: 80,
        plugin: {
          color,
          glow,
          hasLanded: isRestored,
          isStar: true,
          starSize: size
        }
      });

      Body.setAngle(star, Math.random() * Math.PI);
      if (isRestored) {
        Body.setAngularVelocity(star, 0);
        Body.setVelocity(star, { x: 0, y: 0 });
      } else {
        Body.setAngularVelocity(star, (Math.random() - 0.5) * 0.22);
        Body.setVelocity(star, {
          x: (Math.random() - 0.5) * 2.2,
          y: 8 + Math.random() * 1.5
        });
      }

      Composite.add(engine.world, star);

      const stars = Composite.allBodies(engine.world).filter((body) => body.plugin?.isStar);
      if (stars.length > STAR_LIMIT) {
        Composite.remove(engine.world, stars.slice(0, stars.length - STAR_LIMIT));
      }

      return star;
    };

    const dropStar = (star) => {
      getAudio();
      createStar(star);
    };

    const clearStars = () => {
      const existingStars = Matter.Composite.allBodies(engine.world).filter((body) => body.plugin?.isStar);
      if (existingStars.length) Matter.Composite.remove(engine.world, existingStars);
      particlesRef.current = [];
    };

    const restoreStars = (count, palette = previewStars) => {
      const { height, width } = sizeRef.current;
      if (!width || !height) return;

      clearStars();

      const visibleCount = Math.min(Math.max(count, 0), STAR_LIMIT);
      const columns = Math.max(6, Math.ceil(Math.sqrt(visibleCount)));
      const centerX = width / 2;
      const spreadX = Math.min(width * 0.28, 180);
      const baseY = height * 0.82;
      const rowGap = 17;
      const colGap = spreadX / Math.max(columns - 1, 1);

      for (let index = 0; index < visibleCount; index += 1) {
        const paletteItem = palette[index % palette.length] ?? previewStars[index % previewStars.length];
        const row = Math.floor(index / columns);
        const column = index % columns;
        const rowWidth = Math.max(1, columns - Math.min(row * 0.55, columns - 2));
        const rowOffset = ((columns - rowWidth) / 2) * colGap;
        const x = centerX - spreadX / 2 + rowOffset + Math.min(column, rowWidth - 1) * colGap + (Math.random() - 0.5) * 8;
        const y = baseY - row * rowGap + (Math.random() - 0.5) * 7;
        createStar({ ...paletteItem, isRestored: true, x, y });
      }

      for (let step = 0; step < 90; step += 1) {
        Matter.Engine.update(engine, 1000 / 60);
      }
    };

    dropStarRef.current = dropStar;
    restoreStarsRef.current = restoreStars;
    clearStarsRef.current = clearStars;

    const onCollisionStart = ({ pairs }) => {
      pairs.forEach(({ bodyA, bodyB }) => {
        const star = bodyA.plugin?.isStar ? bodyA : bodyB.plugin?.isStar ? bodyB : null;
        if (!star || star.plugin.hasLanded) return;

        const impact = Math.hypot(star.velocity.x, star.velocity.y);
        if (impact < 2.2) return;

        star.plugin.hasLanded = true;
        burstParticles(star.position.x, star.position.y + star.plugin.starSize * 0.45, 18);
        playChime(Math.min(1.15, 0.72 + impact / 16));
      });
    };

    Matter.Events.on(engine, "collisionStart", onCollisionStart);

    let lastTime = performance.now();
    const tick = (time) => {
      const delta = Math.min(time - lastTime, 1000 / 30);
      lastTime = time;

      Matter.Engine.update(engine, delta);

      const { dpr, height, width } = sizeRef.current;
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      particlesRef.current = particlesRef.current
        .map((particle) => ({
          ...particle,
          life: particle.life + delta,
          vx: particle.vx * 0.985,
          vy: particle.vy + 0.038 * delta,
          x: particle.x + particle.vx * (delta / 16.67),
          y: particle.y + particle.vy * (delta / 16.67)
        }))
        .filter((particle) => particle.life < particle.maxLife);

      Matter.Composite.allBodies(engine.world).forEach((body) => {
        if (body.plugin?.isStar) drawStar(context, body);
      });

      particlesRef.current.forEach((particle) => drawParticle(context, particle));

      const outOfView = Matter.Composite.allBodies(engine.world).filter(
        (body) => body.plugin?.isStar && body.position.y > height + 120
      );
      if (outOfView.length) Matter.Composite.remove(engine.world, outOfView);

      if (width > 0) frameRef.current = window.requestAnimationFrame(tick);
    };

    rebuildJar();
    frameRef.current = window.requestAnimationFrame(tick);

    const previewTimers = [];

    window.addEventListener("resize", rebuildJar);

    return () => {
      previewTimers.forEach((timer) => window.clearTimeout(timer));
      window.cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", rebuildJar);
      Matter.Events.off(engine, "collisionStart", onCollisionStart);
      Matter.Composite.clear(engine.world, false);
      Matter.Engine.clear(engine);
      audioRef.current?.close();
    };
  }, []);

  return (
    <div ref={sceneRef} className="jar-stage">
      <div className="jar-glass" />
      <div className="jar-shine" />
      <canvas ref={canvasRef} className="jar-canvas" />
    </div>
  );
});

export default StarJar;
