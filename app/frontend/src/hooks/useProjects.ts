import { useCallback, useEffect, useMemo, useState } from 'react';

export type AppType = 'habit' | 'todo' | 'pomodoro';
export type ProjectStatus = 'building' | 'done';

export interface Revision {
  id: string;
  text: string;
  time: string;
  at: number;
}

export interface Project {
  id: string;
  name: string;
  requirement: string;
  appType: AppType;
  status: ProjectStatus;
  buildingAt: number;
  revisions: Revision[];
  createdAt: number;
  updatedAt: number;
}

const PROJECTS_KEY = 'atom-taste-projects-v1';
const UI_KEY = 'atom-taste-ui-v1';

/** 模拟构建耗时（毫秒），仅用于界面反馈，不涉及真实 AI */
export const BUILD_MS = 2200;

/** 每个项目的独立应用数据键（localStorage） */
export function appStorageKey(type: AppType, projectId: string): string {
  if (type === 'todo') return `atom-taste-todo-${projectId}`;
  if (type === 'pomodoro') return `atom-taste-pomo-${projectId}`;
  return `atom-taste-habits-${projectId}`;
}

/** 规则式需求解析（本地关键词匹配，非真实 AI） */
export function inferAppType(text: string): AppType {
  const t = text.toLowerCase();
  if (/待办|清单|todo|task|任务/.test(t)) return 'todo';
  if (/番茄|计时|专注|倒计时|pomodoro|timer/.test(t)) return 'pomodoro';
  return 'habit';
}

export const APP_META: Record<AppType, { name: string; label: string; file: string }> = {
  habit: { name: '习惯打卡', label: '习惯打卡应用', file: 'src/app/daily-progress.tsx' },
  todo: { name: '待办清单', label: '待办清单应用', file: 'src/app/todo-list.tsx' },
  pomodoro: { name: '番茄专注', label: '番茄专注计时应用', file: 'src/app/pomodoro.tsx' },
};

export function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (d.toDateString() === now.toDateString()) return `今天 ${hm}`;
  return `${d.getMonth() + 1}月${d.getDate()}日 ${hm}`;
}

function normalize(p: Project): Project {
  if (p.status === 'building' && Date.now() - p.buildingAt >= BUILD_MS) {
    return { ...p, status: 'done' };
  }
  return p;
}

function loadProjects(): Project[] {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.map(normalize);
  } catch {
    return [];
  }
}

interface UiState {
  mode: 'create' | 'edit';
  currentProjectId: string | null;
}

function loadUi(projects: Project[]): UiState {
  try {
    const raw = localStorage.getItem(UI_KEY);
    if (raw) {
      const ui = JSON.parse(raw) as UiState;
      if (ui?.mode === 'create') return ui;
      if (ui?.mode === 'edit' && ui.currentProjectId && projects.some((p) => p.id === ui.currentProjectId)) {
        return ui;
      }
    }
  } catch {
    // 忽略损坏的 UI 状态
  }
  // 默认：有项目则进入最近打开的编辑页，没有项目则进入创建页
  const last = [...projects].sort((a, b) => b.updatedAt - a.updatedAt)[0];
  return last ? { mode: 'edit', currentProjectId: last.id } : { mode: 'create', currentProjectId: null };
}

/** 项目持久化 + 页面状态（创建页 / 编辑页）管理 */
export function useProjects() {
  const initial = useMemo(() => {
    const ps = loadProjects();
    return { ps, ui: loadUi(ps) };
  }, []);
  const [projects, setProjects] = useState<Project[]>(initial.ps);
  const [ui, setUi] = useState<UiState>(initial.ui);

  useEffect(() => {
    try {
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    } catch {
      // 存储不可用时静默降级
    }
  }, [projects]);

  useEffect(() => {
    try {
      localStorage.setItem(UI_KEY, JSON.stringify(ui));
    } catch {
      // 忽略
    }
  }, [ui]);

  // 构建中：定时刷新派生状态（building -> done）
  useEffect(() => {
    if (!projects.some((p) => p.status === 'building')) return;
    const t = setInterval(() => {
      setProjects((prev) => {
        const next = prev.map(normalize);
        return next.some((p, i) => p !== prev[i]) ? next : prev;
      });
    }, 400);
    return () => clearInterval(t);
  }, [projects]);

  const createProject = useCallback(
    (requirement: string): { ok: true; id: string } | { ok: false; error: string } => {
      const text = requirement.trim();
      if (text.length < 4) {
        return { ok: false, error: '请至少输入 4 个字，描述你想创建的应用' };
      }
      const id = `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const appType = inferAppType(text);
      const now = Date.now();
      const project: Project = {
        id,
        name: APP_META[appType].name,
        requirement: text,
        appType,
        status: 'building',
        buildingAt: now,
        revisions: [],
        createdAt: now,
        updatedAt: now,
      };
      setProjects((prev) => [...prev, project]);
      setUi({ mode: 'edit', currentProjectId: id });
      return { ok: true, id };
    },
    [],
  );

  const openProject = useCallback((id: string) => {
    setUi({ mode: 'edit', currentProjectId: id });
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, updatedAt: Date.now() } : p)));
  }, []);

  /** 返回创建页：保留已有项目 */
  const goCreate = useCallback(() => {
    setUi({ mode: 'create', currentProjectId: null });
  }, []);

  const addRevision = useCallback((projectId: string, text: string) => {
    const t = text.trim();
    if (!t) return;
    const now = Date.now();
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, updatedAt: now, revisions: [...p.revisions, { id: `r-${now}`, text: t, time: formatTime(now), at: now }] }
          : p,
      ),
    );
  }, []);

  const activeProject = projects.find((p) => p.id === ui.currentProjectId) ?? null;

  return { projects, ui, activeProject, createProject, openProject, goCreate, addRevision };
}