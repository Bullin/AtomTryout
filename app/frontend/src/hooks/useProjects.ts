import { useCallback, useEffect, useMemo, useState } from 'react';
import { generateApp } from '@/lib/appGenerator';

export type AppType = 'habit' | 'todo' | 'pomodoro' | 'custom';
export type ProjectStatus = 'building' | 'done';

export interface Revision {
  id: string;
  text: string;
  time: string;
  at: number;
}

/** 一次生成的应用版本（仅保留当前与上一版本） */
export interface AppVersion {
  /** 版本号，从 1 递增 */
  ver: number;
  /** 生成所依据的需求文本 */
  spec: string;
  /** 完整可独立运行 HTML */
  html: string;
  /** styles.css 内容 */
  css: string;
  /** app.js 内容 */
  js: string;
  /** 模板/类型标识 */
  kind: string;
  /** 模板中文名 */
  label: string;
  /** 生成时间 */
  createdAt: number;
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
  /** 版本列表（按时间升序，最多保留 2 个：当前 + 上一版本） */
  versions: AppVersion[];
  /** 当前激活的版本号 */
  activeVer: number;
}

/** 取项目当前激活版本（缺省回退到最新版本） */
export function getActiveVersion(p: Project): AppVersion | null {
  if (!p.versions || p.versions.length === 0) return null;
  return p.versions.find((v) => v.ver === p.activeVer) ?? p.versions[p.versions.length - 1];
}

/** 生成一个新版本对象 */
function makeVersion(ver: number, spec: string, name: string, createdAt: number): AppVersion {
  const gen = generateApp(spec, name);
  return { ver, spec, html: gen.html, css: gen.css, js: gen.js, kind: gen.kind, label: gen.label, createdAt };
}

const PROJECTS_KEY = 'atom-taste-projects-v1';
const UI_KEY = 'atom-taste-ui-v1';

/** 模拟构建耗时（毫秒），仅用于界面反馈，不涉及真实 AI */
export const BUILD_MS = 2200;

/** 每个项目的独立应用数据键（localStorage） */
export function appStorageKey(type: AppType, projectId: string): string {
  if (type === 'todo') return `atom-taste-todo-${projectId}`;
  if (type === 'pomodoro') return `atom-taste-pomo-${projectId}`;
  if (type === 'custom') return `atom-taste-custom-${projectId}`;
  return `atom-taste-habits-${projectId}`;
}

/** 规则式需求解析（本地关键词匹配，非真实 AI）：未命中任何类型时生成自定义应用，不再默认习惯打卡 */
export function inferAppType(text: string): AppType {
  const t = text.toLowerCase();
  if (/习惯|打卡|habit/.test(t)) return 'habit';
  if (/待办|清单|todo|task|任务/.test(t)) return 'todo';
  if (/番茄|计时|专注|倒计时|pomodoro|timer/.test(t)) return 'pomodoro';
  return 'custom';
}

/** 从需求文本中提取应用名称，使项目与需求对应（如“创建一个记账应用”→“记账”） */
export function deriveProjectName(text: string): string {
  let t = text
    .trim()
    .replace(/^(请|帮我|我想|我要|来)?(创建|生成|做|开发|设计|搭建)(一个|一款|个)?/, '')
    .trim();
  t = t.split(/[，,。.!！?？;；]/)[0].trim();
  const stripped = t.replace(/(应用|小程序|网站|工具|app)$/i, '').trim();
  if (!stripped) return '我的应用';
  // 去掉后缀后只剩纯数字（如“2028”）时保留原词，命名更友好
  const keep = /^\d+$/.test(stripped) ? t : stripped;
  return keep.length > 12 ? keep.slice(0, 12) : keep;
}

export const APP_META: Record<AppType, { name: string; label: string; file: string }> = {
  habit: { name: '习惯打卡', label: '习惯打卡应用', file: 'src/app/daily-progress.tsx' },
  todo: { name: '待办清单', label: '待办清单应用', file: 'src/app/todo-list.tsx' },
  pomodoro: { name: '番茄专注', label: '番茄专注计时应用', file: 'src/app/pomodoro.tsx' },
  custom: { name: '自定义应用', label: '自定义应用', file: 'src/app/custom-app.tsx' },
};

export function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (d.toDateString() === now.toDateString()) return `今天 ${hm}`;
  return `${d.getMonth() + 1}月${d.getDate()}日 ${hm}`;
}

function normalize(p: Project): Project {
  let q = p;
  // 兼容旧数据：没有 versions 字段时，按需求（或旧的 appHtml 字段）即时回填为 v1
  if (!Array.isArray(q.versions) || q.versions.length === 0) {
    const legacy = q as unknown as { spec?: string; appHtml?: string; appKind?: string; appLabel?: string };
    const spec = legacy.spec || q.requirement;
    const v1: AppVersion = makeVersion(1, spec, q.name, q.buildingAt || q.createdAt || Date.now());
    q = { ...q, versions: [v1], activeVer: 1 };
  } else if (q.versions.some((v) => typeof v.css !== 'string')) {
    // 兼容只存了 html 的旧版本：拆出 css / js
    q = {
      ...q,
      versions: q.versions.map((v) => {
        if (typeof v.css === 'string' && typeof v.js === 'string') return v;
        const css = v.html.match(/<style>([\s\S]*?)<\/style>/)?.[1]?.trim() ?? '';
        const js = v.html.match(/<script>([\s\S]*?)<\/script>/)?.[1]?.trim() ?? '';
        return { ...v, css, js };
      }),
    };
  }
  if (q.status === 'building' && Date.now() - q.buildingAt >= BUILD_MS) {
    return { ...q, status: 'done' };
  }
  return q;
}

function loadProjects(): Project[] {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    // 清理历史遗留的开发示例项目，避免污染“最近项目”
    return arr.map(normalize).filter((p) => p.id !== 'p-demo-daily');
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
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

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
      const name = deriveProjectName(text);
      const now = Date.now();
      const project: Project = {
        id,
        name,
        requirement: text,
        appType,
        status: 'building',
        buildingAt: now,
        revisions: [],
        createdAt: now,
        updatedAt: now,
        versions: [makeVersion(1, text, name, now)],
        activeVer: 1,
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

  /** 发送新需求：加入修改记录 → 显示“正在生成”约 2 秒 → 生成新版本（仅保留当前 + 上一版本） */
  const regenerate = useCallback(
    (projectId: string, text: string, onDone?: (unsupported: boolean) => void) => {
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
      setRegeneratingId(projectId);
      window.setTimeout(() => {
        let unsupported = false;
        setProjects((prev) =>
          prev.map((p) => {
            if (p.id !== projectId) return p;
            const nextVer = Math.max(0, ...p.versions.map((v) => v.ver)) + 1;
            const version = makeVersion(nextVer, t, p.name, Date.now());
            unsupported = version.kind === 'unsupported';
            // 只保留最近两个版本（当前 + 上一版本）
            return {
              ...p,
              versions: [...p.versions, version].slice(-2),
              activeVer: nextVer,
              updatedAt: Date.now(),
            };
          }),
        );
        setRegeneratingId(null);
        onDone?.(unsupported);
      }, 2000);
    },
    [],
  );

  /** 切换当前版本：预览与代码同步变化 */
  const setActiveVersion = useCallback((projectId: string, ver: number) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId && p.versions.some((v) => v.ver === ver)
          ? { ...p, activeVer: ver, updatedAt: Date.now() }
          : p,
      ),
    );
  }, []);

  const activeProject = projects.find((p) => p.id === ui.currentProjectId) ?? null;

  return { projects, ui, activeProject, createProject, openProject, goCreate, addRevision, regenerate, regeneratingId, setActiveVersion };
}
