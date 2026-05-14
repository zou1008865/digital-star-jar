import { useEffect, useRef, useState } from "react";
import { Check, Dumbbell, HeartPulse, Library, RotateCcw, TerminalSquare } from "lucide-react";
import StarJar from "./components/StarJar.jsx";

const rituals = [
  {
    id: "fitness",
    label: "健身",
    color: "#61e6ff",
    glow: "rgba(97, 230, 255, 0.5)",
    Icon: Dumbbell
  },
  {
    id: "reading",
    label: "阅读",
    color: "#ffd166",
    glow: "rgba(255, 209, 102, 0.48)",
    Icon: Library
  },
  {
    id: "healthy-lunch",
    label: "健康饮食",
    color: "#84f5b2",
    glow: "rgba(132, 245, 178, 0.46)",
    Icon: HeartPulse
  },
  {
    id: "leetcode",
    label: "有效学习",
    color: "#ff7ab6",
    glow: "rgba(255, 122, 182, 0.48)",
    Icon: TerminalSquare
  }
];

const PERFECT_WEEK_GOAL = 28;
const STAR_STORAGE_KEY = "digital-star-jar.weekly-stars";
const TOTAL_STAR_STORAGE_KEY = "digital-star-jar.total-stars";
const DAILY_RITUAL_STORAGE_KEY = "digital-star-jar.daily-rituals";
const RITUAL_HISTORY_STORAGE_KEY = "digital-star-jar.ritual-history";
const RESTORE_VISUAL_LIMIT = 120;
const HISTORY_DAYS = 7;
const ranks = [
  { min: 0, title: "小菜鸡" },
  { min: 7, title: "不及格" },
  { min: 14, title: "不够行" },
  { min: 21, title: "自律中" },
  { min: 28, title: "完美" }
];

function getRank(stars) {
  return ranks.reduce((current, rank) => (stars >= rank.min ? rank : current), ranks[0]);
}

function readStoredNumber(key, fallback = 0) {
  try {
    const storedValue = window.localStorage.getItem(key);
    const parsedValue = Number.parseInt(storedValue ?? "0", 10);
    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
  } catch {
    return fallback;
  }
}

function getTodayKey() {
  const today = new Date();
  const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

function getDateKey(daysAgo = 0) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

function getRecentDateKeys() {
  return Array.from({ length: HISTORY_DAYS }, (_, index) => getDateKey(HISTORY_DAYS - 1 - index));
}

function trimRitualHistory(history) {
  const recentKeys = new Set(getRecentDateKeys());
  return Object.fromEntries(Object.entries(history).filter(([date]) => recentKeys.has(date)));
}

function readRitualHistory(todayKey) {
  try {
    const historyValue = window.localStorage.getItem(RITUAL_HISTORY_STORAGE_KEY);
    const parsedHistory = JSON.parse(historyValue ?? "{}");
    const history = parsedHistory && typeof parsedHistory === "object" && !Array.isArray(parsedHistory) ? parsedHistory : {};

    const legacyValue = window.localStorage.getItem(DAILY_RITUAL_STORAGE_KEY);
    const legacyDaily = JSON.parse(legacyValue ?? "{}");
    if (legacyDaily?.date && typeof legacyDaily.completed === "object") {
      history[legacyDaily.date] = {
        ...(history[legacyDaily.date] ?? {}),
        ...legacyDaily.completed
      };
    }

    return trimRitualHistory({ ...history, [todayKey]: history[todayKey] ?? {} });
  } catch {
    return { [todayKey]: {} };
  }
}

function formatHistoryLabel(dateKey, todayKey) {
  if (dateKey === todayKey) return "今天";
  const date = new Date(`${dateKey}T00:00:00`);
  return ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][date.getDay()];
}

function SmoothNumber({ value }) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValueRef = useRef(value);

  useEffect(() => {
    const startValue = previousValueRef.current;
    const difference = value - startValue;
    const startedAt = performance.now();
    const duration = 420;
    let frameId = 0;

    const tick = (time) => {
      const progress = Math.min((time - startedAt) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setDisplayValue(Math.round(startValue + difference * eased));

      if (progress < 1) frameId = requestAnimationFrame(tick);
      else previousValueRef.current = value;
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [value]);

  return displayValue;
}

export default function App() {
  const jarRef = useRef(null);
  const [todayKey, setTodayKey] = useState(() => getTodayKey());
  const [weeklyStars, setWeeklyStars] = useState(() => readStoredNumber(STAR_STORAGE_KEY));
  const [totalStars, setTotalStars] = useState(() => {
    const savedWeeklyStars = readStoredNumber(STAR_STORAGE_KEY);
    return readStoredNumber(TOTAL_STAR_STORAGE_KEY, savedWeeklyStars);
  });
  const [ritualHistory, setRitualHistory] = useState(() => readRitualHistory(getTodayKey()));
  const lastCelebratedRef = useRef(weeklyStars);
  const [celebration, setCelebration] = useState(null);
  const rank = getRank(weeklyStars);
  const weekRemainder = weeklyStars % PERFECT_WEEK_GOAL;
  const weekProgress = weeklyStars > 0 && weekRemainder === 0 ? 100 : (weekRemainder / PERFECT_WEEK_GOAL) * 100;
  const completedToday = ritualHistory[todayKey] ?? {};
  const historyDays = getRecentDateKeys();

  useEffect(() => {
    const timer = window.setInterval(() => {
      const nextTodayKey = getTodayKey();
      if (nextTodayKey !== todayKey) {
        setTodayKey(nextTodayKey);
        setRitualHistory((history) => trimRitualHistory({ ...history, [nextTodayKey]: history[nextTodayKey] ?? {} }));
      }
    }, 60_000);

    return () => window.clearInterval(timer);
  }, [todayKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STAR_STORAGE_KEY, String(weeklyStars));
    } catch {
      // If localStorage is unavailable, the app still works for the current session.
    }
  }, [weeklyStars]);

  useEffect(() => {
    try {
      window.localStorage.setItem(TOTAL_STAR_STORAGE_KEY, String(Math.max(totalStars, weeklyStars)));
    } catch {
      // If localStorage is unavailable, the app still works for the current session.
    }
  }, [totalStars, weeklyStars]);

  useEffect(() => {
    try {
      window.localStorage.setItem(RITUAL_HISTORY_STORAGE_KEY, JSON.stringify(trimRitualHistory(ritualHistory)));
    } catch {
      // If localStorage is unavailable, the app still works for the current session.
    }
  }, [ritualHistory]);

  useEffect(() => {
    if (weeklyStars <= 0) return;
    const timer = window.setTimeout(() => {
      jarRef.current?.restoreStars(Math.min(weeklyStars, RESTORE_VISUAL_LIMIT), rituals);
    }, 120);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!celebration) return undefined;
    const timer = window.setTimeout(() => setCelebration(null), 2100);
    return () => window.clearTimeout(timer);
  }, [celebration]);

  useEffect(() => {
    if (weeklyStars === 0 || weeklyStars % PERFECT_WEEK_GOAL !== 0) return;
    if (lastCelebratedRef.current === weeklyStars) return;
    lastCelebratedRef.current = weeklyStars;
    triggerEvolution();
  }, [weeklyStars]);

  const triggerEvolution = () => {
    const particles = Array.from({ length: 120 }, (_, index) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 160 + Math.random() * 520;
      return {
        delay: Math.random() * 0.22,
        id: `${Date.now()}-${index}`,
        size: 2 + Math.random() * 5,
        x: `${Math.cos(angle) * distance}px`,
        y: `${Math.sin(angle) * distance}px`
      };
    });

    setCelebration({ id: Date.now(), particles });
  };

  const handleDrop = ({ color, glow, id }) => {
    if (completedToday[id]) return;

    setRitualHistory((history) =>
      trimRitualHistory({
        ...history,
        [todayKey]: {
          ...(history[todayKey] ?? {}),
          [id]: true
        }
      })
    );
    setWeeklyStars((count) => count + 1);
    setTotalStars((count) => Math.max(count, weeklyStars) + 1);
    jarRef.current?.dropStar({ color, glow });
  };

  const handleResetWeek = () => {
    if (weeklyStars === 0) return;
    const shouldReset = window.confirm("确定要清空本周星星吗？总资产会保留。");
    if (!shouldReset) return;

    setWeeklyStars(0);
    setTotalStars((count) => Math.max(count, weeklyStars));
    lastCelebratedRef.current = 0;
    jarRef.current?.clearStars();
  };

  return (
    <main className="app-shell">
      <div className="app-background" />
      <div className="top-light" />
      <div className="asset-panel" aria-live="polite">
        <div className="asset-row">
          <span>本周资产</span>
          <strong>
            <SmoothNumber value={weeklyStars} />
          </strong>
          <span>颗星星</span>
        </div>
        <div className="asset-row asset-row-total">
          <span>总资产</span>
          <strong>
            <SmoothNumber value={Math.max(totalStars, weeklyStars)} />
          </strong>
          <span>颗星星</span>
        </div>
        <button className="reset-week-button" disabled={weeklyStars === 0} onClick={handleResetWeek} type="button">
          <RotateCcw aria-hidden="true" />
          <span>清空本周</span>
        </button>
      </div>
      <div className="app-content">
        <section className="stage">
          <div className="intro">
            <h1>Digital Star Jar</h1>
            <div className="rank-title">{rank.title}</div>
            <p>每完成一次线下行动，就让一颗星星落进瓶子。</p>
          </div>

          <StarJar ref={jarRef} />

          <div className="evolution-progress" aria-label={`完美周进度 ${Math.round(weekProgress)}%`}>
            <div className="evolution-progress-fill" style={{ width: `${weekProgress}%` }} />
          </div>

          <div className="history-strip" aria-label="最近 7 天打卡记录">
            {historyDays.map((dateKey) => {
              const dayCount = rituals.filter(({ id }) => ritualHistory[dateKey]?.[id]).length;
              return (
                <div className={`history-day${dateKey === todayKey ? " is-today" : ""}`} key={dateKey}>
                  <span>{formatHistoryLabel(dateKey, todayKey)}</span>
                  <strong>{dayCount}/4</strong>
                </div>
              );
            })}
          </div>
        </section>

        <div className="ritual-grid">
          {rituals.map(({ id, label, color, glow, Icon }) => {
            const isCompleted = Boolean(completedToday[id]);
            return (
            <button
              aria-label={isCompleted ? `${label} 今日已完成` : label}
              className={`ritual-button group${isCompleted ? " is-completed" : ""}`}
              disabled={isCompleted}
              key={id}
              onClick={() => handleDrop({ color, glow, id })}
              style={{ "--accent": color, "--glow": glow }}
              type="button"
            >
              {isCompleted ? (
                <Check aria-hidden="true" className="ritual-icon ritual-check" />
              ) : (
                <Icon aria-hidden="true" className="ritual-icon" />
              )}
              <span>{label}</span>
              {isCompleted && <span className="ritual-done-text">今日已完成</span>}
            </button>
            );
          })}
        </div>
      </div>

      {celebration && (
        <div className="evolution-burst" aria-hidden="true" key={celebration.id}>
          <div className="evolution-aura" />
          {celebration.particles.map((particle) => (
            <span
              className="evolution-particle"
              key={particle.id}
              style={{
                "--delay": `${particle.delay}s`,
                "--size": `${particle.size}px`,
                "--x": particle.x,
                "--y": particle.y
              }}
            />
          ))}
        </div>
      )}
    </main>
  );
}
