import { useCallback, useEffect, useMemo, useState } from 'react';
import { appStorageKey } from './useProjects';

export type HabitIconKey = 'book' | 'dumbbell' | 'droplet' | 'moon' | 'sparkles' | 'target' | 'sun';

export interface Habit {
  id: string;
  name: string;
  category: string;
  icon: HabitIconKey;
  done: boolean;
}

interface PersistShape {
  date: string;
  habits: Habit[];
}

/** 当天日期键，用于跨天自动重置完成状态 */
function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/** 默认示例习惯：阅读、运动、喝水、早睡，其中前两条已完成（今日 2/4） */
function seedHabits(): Habit[] {
  const base = Date.now();
  return [
    { id: `seed-${base}-1`, name: '阅读 20 分钟', category: '学习', icon: 'book', done: true },
    { id: `seed-${base}-2`, name: '运动 30 分钟', category: '健康', icon: 'dumbbell', done: true },
    { id: `seed-${base}-3`, name: '喝水 8 杯', category: '健康', icon: 'droplet', done: false },
    { id: `seed-${base}-4`, name: '早睡 23:00 前', category: '作息', icon: 'moon', done: false },
  ];
}

function loadHabits(projectId: string): Habit[] {
  try {
    const raw = localStorage.getItem(appStorageKey('habit', projectId));
    if (!raw) return seedHabits();
    const parsed = JSON.parse(raw) as PersistShape;
    if (!parsed || !Array.isArray(parsed.habits)) return seedHabits();
    // 跨天：保留习惯列表，重置完成状态
    if (parsed.date !== todayKey()) {
      return parsed.habits.map((h) => ({ ...h, done: false }));
    }
    return parsed.habits;
  } catch {
    return seedHabits();
  }
}

/** 习惯打卡应用的状态管理 + 按项目隔离的 localStorage 持久化 */
export function useHabits(projectId: string) {
  const [habits, setHabits] = useState<Habit[]>(() => loadHabits(projectId));

  useEffect(() => {
    try {
      const payload: PersistShape = { date: todayKey(), habits };
      localStorage.setItem(appStorageKey('habit', projectId), JSON.stringify(payload));
    } catch {
      // 存储不可用时静默降级，不影响交互
    }
  }, [habits, projectId]);

  const addHabit = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    setHabits((prev) => [
      ...prev,
      {
        id: `h-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: trimmed,
        category: '自定义',
        icon: 'sparkles',
        done: false,
      },
    ]);
    return true;
  }, []);

  const toggleHabit = useCallback((id: string) => {
    setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, done: !h.done } : h)));
  }, []);

  const removeHabit = useCallback((id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const doneCount = useMemo(() => habits.filter((h) => h.done).length, [habits]);
  const total = habits.length;
  const progress = total === 0 ? 0 : Math.round((doneCount / total) * 100);

  return { habits, addHabit, toggleHabit, removeHabit, doneCount, total, progress };
}