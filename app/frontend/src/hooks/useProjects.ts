import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { generateApp } from '@/lib/appGenerator';
import {
  cloudCreate,
  cloudDelete,
  cloudList,
  cloudLogin,
  cloudLogout,
  cloudMe,
  cloudUpdate,
  type CloudPayload,
  type CloudRow,
  type CloudUser,
} from '@/lib/cloudSync';

export type AppType = 'habit' | 'todo' | 'pomodoro' | 'custom';
export type ProjectStatus = 'building' | 'done';
export type AuthState = 'loading' | 'authenticated' | 'anonymous';

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
  /** 云端 atom_projects 表行 id（登录后同步时写入） */
  cloudId?: number | null;
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

/** 项目 → 云端行载荷 */
function toPayload(p: Project): CloudPayload {
  return {
    project_key: p.id,
    name: p.name,
    requirement: p.requirement,
    app_type: p.appType,
    status: p.status,
    building_at: p.buildingAt,
    revisions: JSON.stringify(p.revisions),
    versions: JSON.stringify(p.versions),
    active_ver: p.activeVer,
    client_created_at: p.createdAt,
    client_updated_at: p.updatedAt,
  };
}

/** 云端行 → 项目（解析失败返回 null） */
function fromRow(r: CloudRow): Project | null {
  if (!r.project_key) return null;
  try {
    const revisions = JSON.parse(r.revisions || '[]');
    const versions = JSON.parse(r.versions || '[]');
    const p: Project = {
      id: r.project_key,
      name: r.name || '我的应用',
      requirement: r.requirement || '',
      appType: (r.app_type as AppType) || 'custom',
      status: (r.status as ProjectStatus) || 'done',
      buildingAt: r.building_at || r.client_updated_at || Date.now(),
      revisions: Array.isArray(revisions) ? revisions : [],
      createdAt: r.client_created_at || Date.now(),
      updatedAt: r.client_updated_at || Date.now(),
      versions: Array.isArray(versions) ? versions : [],
      activeVer: r.active_ver || 1,
      cloudId: r.id,
    };
    return normalize(p);
  } catch {
    return null;
  }
}

/** 本地与云端按 project_key 合并：同 key 取更新时间较新者；本地独有项保留（后续自动上传） */
function mergeProjects(local: Project[], cloud: Project[]): Project[] {
  const map = new Map<string, Project>();
  for (const p of local) map.set(p.id, p);
  for (const c of cloud) {
    const ex = map.get(c.id);
    if (!ex) {
      map.set(c.id, c);
    } else if (c.updatedAt > ex.updatedAt) {
      map.set(c.id, { ...c, cloudId: c.cloudId ?? ex.cloudId });
    } else if (!ex.cloudId && c.cloudId) {
      map.set(c.id, { ...ex, cloudId: c.cloudId });
    }
  }
  return [...map.values()].filter((p) => p.id !== 'p-demo-daily');
}

/** 项目持久化（localStorage 缓存 + Atoms Cloud 同步）+ 页面状态管理 */
export function useProjects() {
  const initial = useMemo(() => {
    const ps = loadProjects();
    return { ps, ui: loadUi(ps) };
  }, []);
  const [projects, setProjects] = useState<Project[]>(initial.ps);
  const [ui, setUi] = useState<UiState>(initial.ui);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [user, setUser] = useState<CloudUser | null>(null);
  const [syncing, setSyncing] = useState(false);
  /** 演示用：模拟生成失败的项目 id（仅状态提示，不影响版本与数据） */
  const [failureId, setFailureId] = useState<string | null>(null);

  const projectsRef = useRef(projects);
  const authRef = useRef(authState);
  /** 每个项目上次成功同步的载荷签名，用于跳过无变化的写入 */
  const lastSyncedRef = useRef<Record<string, string>>({});

  useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);
  useEffect(() => {
    authRef.current = authState;
  }, [authState]);

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

  /** 登录后拉取云端项目并与本地合并 */
  const loadCloud = useCallback(async () => {
    try {
      const rows = await cloudList();
      const cloudProjects = rows.map(fromRow).filter((p): p is Project => p !== null);
      setProjects((prev) => mergeProjects(prev, cloudProjects));
    } catch {
      // 拉取失败：保持本地数据，后续变更仍会尝试上传
    }
  }, []);

  // 启动时检查登录状态（三态：loading / authenticated / anonymous）
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const u = await cloudMe();
        if (cancelled) return;
        if (u) {
          setUser(u);
          setAuthState('authenticated');
          void loadCloud();
        } else {
          setUser(null);
          setAuthState('anonymous');
        }
      } catch {
        if (!cancelled) {
          setUser(null);
          setAuthState('anonymous');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadCloud]);

  // 已登录时：项目变更防抖同步到云端（新建 → create 并回填 cloudId；已有 → update）
  useEffect(() => {
    if (authState !== 'authenticated') return;
    const t = window.setTimeout(async () => {
      const dirty = projectsRef.current.filter((p) => lastSyncedRef.current[p.id] !== JSON.stringify(toPayload(p)));
      if (dirty.length === 0) return;
      setSyncing(true);
      for (const p of dirty) {
        const payload = toPayload(p);
        try {
          if (p.cloudId) {
            await cloudUpdate(p.cloudId, payload);
          } else {
            const created = await cloudCreate(payload);
            if (created?.id) {
              setProjects((prev) => prev.map((x) => (x.id === p.id ? { ...x, cloudId: created.id } : x)));
            }
          }
          lastSyncedRef.current[p.id] = JSON.stringify(payload);
        } catch {
          // 单条失败：不记录签名，下次变更自动重试
        }
      }
      setSyncing(false);
    }, 800);
    return () => window.clearTimeout(t);
  }, [projects, authState]);

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

  /** 删除项目：本地移除 + 云端删除（已同步时）；若删的是当前项目则自动切换 */
  const deleteProject = useCallback((id: string) => {
    const target = projectsRef.current.find((p) => p.id === id);
    if (target?.cloudId) {
      cloudDelete(target.cloudId).catch(() => {
        // 云端删除失败：本地已移除，下次登录合并时仍会出现在云端，可再删
      });
    }
    delete lastSyncedRef.current[id];
    setFailureId((cur) => (cur === id ? null : cur));
    const next = projectsRef.current.filter((p) => p.id !== id);
    setProjects(next);
    setUi((prev) => {
      if (prev.currentProjectId !== id) return prev;
      if (next.length === 0) return { mode: 'create', currentProjectId: null };
      const newest = [...next].sort((a, b) => b.updatedAt - a.updatedAt)[0];
      return { mode: 'edit', currentProjectId: newest.id };
    });
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
      setFailureId((cur) => (cur === projectId ? null : cur));
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

  /** 演示：触发一次模拟生成失败（仅记录状态，保留全部版本与数据） */
  const simulateFailure = useCallback((projectId: string) => {
    setFailureId(projectId);
  }, []);

  /** 失败后重试：清除失败状态；生成结果本就保留，预览可继续操作 */
  const retryGenerate = useCallback((projectId: string) => {
    setFailureId((cur) => (cur === projectId ? null : cur));
    setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, updatedAt: Date.now() } : p)));
  }, []);

  /** 失败后恢复上一版本：切换 activeVer 到上一版本并清除失败状态 */
  const restorePreviousVersion = useCallback((projectId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const sorted = [...p.versions].sort((a, b) => a.ver - b.ver);
        if (sorted.length < 2) return p;
        return { ...p, activeVer: sorted[sorted.length - 2].ver, updatedAt: Date.now() };
      }),
    );
    setFailureId((cur) => (cur === projectId ? null : cur));
  }, []);

  /** 触发平台登录：登录后页面重载并自动拉取云端项目 */
  const loginToCloud = useCallback(() => {
    cloudLogin();
  }, []);

  /**
   * 立即同步所有未同步 / 有变更的项目到云端（退出登录前调用，绕过 800ms 防抖）。
   * 返回"已确认存在于云端"的项目 id 集合：原本有 cloudId 的 + 本次成功 create 的。
   * 无 cloudId 且同步失败的项目不纳入集合，退出时保留其本地缓存（降级不丢数据）。
   */
  const flushSync = useCallback(async (): Promise<Set<string>> => {
    const synced = new Set<string>();
    for (const p of projectsRef.current) {
      const payload = toPayload(p);
      if (p.cloudId) {
        if (lastSyncedRef.current[p.id] !== JSON.stringify(payload)) {
          try {
            await cloudUpdate(p.cloudId, payload);
            lastSyncedRef.current[p.id] = JSON.stringify(payload);
          } catch {
            // 更新失败：云端仍有旧版本，仍视为"已存在于云端"
          }
        }
        synced.add(p.id);
      } else {
        try {
          const created = await cloudCreate(payload);
          if (created?.id) {
            setProjects((prev) => prev.map((x) => (x.id === p.id ? { ...x, cloudId: created.id } : x)));
            lastSyncedRef.current[p.id] = JSON.stringify(payload);
            synced.add(p.id);
          }
        } catch {
          // 新建失败：保留本地，下次登录再合并
        }
      }
    }
    return synced;
  }, []);

  /**
   * 退出登录：先 flush 待同步数据 → 清除已同步项目的本地缓存与应用数据
   * （共享设备安全：账号数据不在本地留存，重新登录以云端拉取为准）→ 平台登出。
   * 未同步（无 cloudId 且 flush 失败）的项目保留本地，避免网络异常丢数据。
   */
  const logout = useCallback(async () => {
    setSyncing(true);
    let synced: Set<string> = new Set();
    try {
      synced = await flushSync();
    } finally {
      setSyncing(false);
    }
    for (const p of projectsRef.current) {
      if (!synced.has(p.id)) continue;
      try {
        localStorage.removeItem(appStorageKey(p.appType, p.id));
      } catch {
        // 忽略存储不可用
      }
      delete lastSyncedRef.current[p.id];
    }
    setProjects((prev) => prev.filter((p) => !synced.has(p.id)));
    setUi({ mode: 'create', currentProjectId: null });
    setUser(null);
    setAuthState('anonymous');
    void cloudLogout();
  }, [flushSync]);

  const activeProject = projects.find((p) => p.id === ui.currentProjectId) ?? null;

  return {
    projects,
    ui,
    activeProject,
    authState,
    user,
    syncing,
    createProject,
    openProject,
    goCreate,
    addRevision,
    regenerate,
    regeneratingId,
    setActiveVersion,
    deleteProject,
    loginToCloud,
    logout,
    failureId,
    simulateFailure,
    retryGenerate,
    restorePreviousVersion,
  };
}
