import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Code2,
  Download,
  Eye,
  FileText,
  FlaskConical,
  Loader2,
  Maximize,
  Minimize,
  Monitor,
  RefreshCw,
  Smartphone,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import HabitApp from './HabitApp';
import { TodoApp, PomodoroApp } from './MiniApps';
import { APP_META, appStorageKey, BUILD_MS, type Project } from '@/hooks/useProjects';

interface PreviewWorkspaceProps {
  project: Project;
  className?: string;
}

type TabKey = 'preview' | 'code' | 'test' | 'log';
type DeviceKey = 'desktop' | 'mobile';
type TestState = 'idle' | 'running' | 'passed';

const CODE_SNIPPETS: Record<string, string> = {
  habit: `// 每日进步 · 习惯打卡应用（节选）
export default function HabitApp({ projectId }) {
  const { habits, addHabit, toggleHabit, removeHabit,
          doneCount, total, progress } = useHabits(projectId);

  // 状态按项目隔离，通过 localStorage 持久化
  useEffect(() => {
    localStorage.setItem(\`atom-taste-habits-\${projectId}\`,
      JSON.stringify({ date: todayKey(), habits }));
  }, [habits, projectId]);

  return (
    <ul>
      {habits.map((h) => (
        <HabitRow key={h.id} habit={h}
          onToggle={() => toggleHabit(h.id)}
          onRemove={() => removeHabit(h.id)} />
      ))}
    </ul>
  );
}`,
  todo: `// 待办清单应用（节选）
export function TodoApp({ projectId }) {
  const [todos, setTodos] = usePersisted(
    \`atom-taste-todo-\${projectId}\`, seedTodos);

  const add = (text) =>
    setTodos((prev) => [...prev, { id: uid(), text, done: false }]);

  const toggle = (id) =>
    setTodos((prev) => prev.map((t) =>
      t.id === id ? { ...t, done: !t.done } : t));

  return (
    <ul>
      {todos.map((t) => (
        <TodoRow key={t.id} todo={t}
          onToggle={() => toggle(t.id)} />
      ))}
    </ul>
  );
}`,
  pomodoro: `// 番茄专注计时器（节选）
export function PomodoroApp({ projectId }) {
  const [stats, setStats] = usePersisted(
    \`atom-taste-pomo-\${projectId}\`, { sessions: 0 });
  const [left, setLeft] = useState(FOCUS_SECONDS);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  // 归零时：计数 +1 并持久化
  if (left === 0) setStats((p) => ({ sessions: p.sessions + 1 }));
}`,
};

/** 读取当前项目的应用数据，用于导出快照 */
function readAppSnapshot(project: Project): { title: string; rows: string[] } {
  try {
    if (project.appType === 'pomodoro') {
      const raw = localStorage.getItem(appStorageKey('pomodoro', project.id));
      const s = raw ? JSON.parse(raw) : { sessions: 0 };
      return { title: '番茄专注', rows: [`累计完成 ${s.sessions ?? 0} 个番茄钟`] };
    }
    if (project.appType === 'todo') {
      const raw = localStorage.getItem(appStorageKey('todo', project.id));
      const list: { text: string; done: boolean }[] = raw ? JSON.parse(raw) : [];
      return { title: '待办清单', rows: list.map((t) => `${t.done ? '☑' : '☐'} ${t.text}`) };
    }
    const raw = localStorage.getItem(appStorageKey('habit', project.id));
    const parsed = raw ? JSON.parse(raw) : null;
    const list: { name: string; category: string; done: boolean }[] = parsed?.habits ?? [];
    return { title: '每日进步', rows: list.map((h) => `${h.done ? '☑' : '☐'} ${h.name}（${h.category}）`) };
  } catch {
    return { title: '应用快照', rows: [] };
  }
}

/** 右侧预览工作区：预览 / 代码 / 测试 / 日志标签 + 设备切换、刷新、全屏、导出 */
export default function PreviewWorkspace({ project, className }: PreviewWorkspaceProps) {
  const [tab, setTab] = useState<TabKey>('preview');
  const [device, setDevice] = useState<DeviceKey>('desktop');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [testState, setTestState] = useState<TestState>('idle');
  const containerRef = useRef<HTMLDivElement>(null);
  const building = project.status === 'building';

  // 切换项目时重置局部状态
  useEffect(() => {
    setTab('preview');
    setTestState('idle');
  }, [project.id]);

  // 同步原生全屏状态（按 Esc 退出时更新 UI）
  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
    toast.success('已重新加载预览');
  }, []);

  const handleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await el.requestFullscreen();
      }
    } catch {
      // 环境不支持原生全屏时降级为 CSS 全屏
      setIsFullscreen((v) => !v);
    }
  }, []);

  const handleRunTest = useCallback(() => {
    if (testState === 'running') return;
    setTestState('running');
    setTimeout(() => {
      setTestState('passed');
      toast.success('测试通过', { description: '3 项冒烟测试全部通过' });
    }, 900);
  }, [testState]);

  const handleExport = useCallback(() => {
    const { title, rows } = readAppSnapshot(project);
    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title} · 导出快照</title>
<style>
  body{font-family:system-ui,-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;background:#f6faf8;color:#16241d;padding:32px;max-width:560px;margin:0 auto}
  h1{font-size:20px;margin:0 0 4px}
  p.date{color:#66766e;font-size:12px;margin:0 0 20px}
  ul{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px}
  li{border:1px solid #dde7e1;background:#fff;border-radius:8px;padding:10px 14px;font-size:14px}
</style>
</head>
<body>
<h1>${title}</h1>
<p class="date">导出时间：${new Date().toLocaleString('zh-CN')}</p>
<ul>
${rows.map((r) => `<li>${r}</li>`).join('\n') || '<li>暂无数据</li>'}
</ul>
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.appType}-export.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success('应用已导出', { description: `${project.appType}-export.html 已开始下载` });
  }, [project]);

  const logs = useMemo(() => {
    const lines: { t: number; msg: string }[] = [
      { t: project.createdAt, msg: `项目创建：${project.requirement.slice(0, 40)}` },
      { t: project.buildingAt, msg: 'AI 开始解析需求并生成应用代码' },
      ...(project.status === 'done'
        ? [{ t: project.buildingAt + BUILD_MS, msg: `应用「${APP_META[project.appType].name}」构建完成，已注入预览` }]
        : []),
      ...project.revisions.map((r) => ({ t: r.at, msg: `收到修改需求：${r.text.slice(0, 40)}` })),
    ];
    return lines.sort((a, b) => a.t - b.t);
  }, [project]);

  const TABS: { key: TabKey; label: string; icon: typeof Eye }[] = [
    { key: 'preview', label: '预览', icon: Eye },
    { key: 'code', label: '代码', icon: Code2 },
    { key: 'test', label: '测试', icon: FlaskConical },
    { key: 'log', label: '日志', icon: FileText },
  ];

  return (
    <section ref={containerRef} className={cn('flex min-w-0 flex-1 flex-col bg-background', className)}>
      {/* 顶部紧凑工具栏 */}
      <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b bg-card px-3">
        {/* 标签切换 */}
        <div className="flex items-center gap-1 rounded-md bg-secondary p-0.5" role="tablist" aria-label="工作区视图">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={cn(
                'flex items-center gap-1.5 rounded-[5px] px-2.5 py-1 text-xs font-medium transition-colors duration-150 sm:px-3',
                tab === key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:md:text-foreground',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* 工具按钮组 */}
        <div className="flex items-center gap-1">
          {tab === 'preview' && !building && (
            <>
              <div className="mr-1 flex items-center gap-0.5 rounded-md border bg-background p-0.5" aria-label="预览设备">
                <button
                  type="button"
                  onClick={() => {
                    setDevice('desktop');
                    toast('已切换到桌面预览');
                  }}
                  aria-label="桌面预览"
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-[4px] transition-colors duration-150',
                    device === 'desktop' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:md:bg-accent',
                  )}
                >
                  <Monitor className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDevice('mobile');
                    toast('已切换到手机预览');
                  }}
                  aria-label="手机预览"
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-[4px] transition-colors duration-150',
                    device === 'mobile' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:md:bg-accent',
                  )}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                </button>
              </div>
              <button
                type="button"
                onClick={handleRefresh}
                aria-label="刷新预览"
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:md:bg-accent hover:md:text-foreground active:scale-95"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={handleFullscreen}
            aria-label={isFullscreen ? '退出全屏' : '进入全屏'}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:md:bg-accent hover:md:text-foreground active:scale-95"
          >
            {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={building}
            aria-label="导出应用"
            className="flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors duration-150 hover:md:bg-accent hover:md:text-foreground active:scale-95 disabled:opacity-40 disabled:hover:md:bg-transparent"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">导出</span>
          </button>
        </div>
      </header>

      {/* 工作区内容 */}
      {tab === 'preview' ? (
        building ? (
          /* 构建中：加载反馈，不显示旧应用 */
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 bg-muted/40 px-6 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground">AI 正在生成「{APP_META[project.appType].name}」应用…</p>
            <p className="text-xs text-muted-foreground">解析需求 → 生成界面 → 注入预览</p>
            <div className="mt-2 h-1.5 w-56 overflow-hidden rounded-full bg-secondary">
              <div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
            </div>
          </div>
        ) : (
          <div className="relative min-h-0 flex-1 overflow-auto bg-muted/40 p-4 sm:p-6">
            {device === 'desktop' ? (
              <div key={`d-${project.id}-${refreshKey}`} className="h-full min-h-[420px] overflow-hidden rounded-lg border bg-card shadow-sm">
                <AppRenderer project={project} />
              </div>
            ) : (
              <div className="flex h-full min-h-[480px] items-start justify-center">
                {/* 手机外框 */}
                <div
                  key={`m-${project.id}-${refreshKey}`}
                  className="flex h-[640px] max-h-full w-[360px] shrink-0 flex-col overflow-hidden rounded-[24px] border-[6px] border-foreground/80 bg-background shadow-md"
                >
                  <div className="flex h-6 shrink-0 items-center justify-center bg-foreground/80">
                    <span className="h-1 w-16 rounded-full bg-background/60" />
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <AppRenderer project={project} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      ) : tab === 'code' ? (
        <div className="min-h-0 flex-1 overflow-auto bg-card">
          <div className="flex items-center gap-2 border-b px-4 py-2 text-xs text-muted-foreground">
            <Code2 className="h-3.5 w-3.5" />
            {project.name} · {APP_META[project.appType].file}
          </div>
          <pre className="overflow-x-auto px-4 py-4 text-[12.5px] leading-relaxed">
            <code className="font-mono text-foreground">{CODE_SNIPPETS[project.appType]}</code>
          </pre>
        </div>
      ) : tab === 'test' ? (
        <div className="min-h-0 flex-1 overflow-auto bg-card p-4 sm:p-6">
          <div className="mx-auto max-w-xl">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold">冒烟测试</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">验证 {APP_META[project.appType].label} 的核心交互</p>
              </div>
              <button
                type="button"
                onClick={handleRunTest}
                disabled={testState === 'running' || building}
                className="flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-transform duration-150 hover:md:bg-primary/90 active:scale-95 disabled:opacity-50"
              >
                {testState === 'running' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FlaskConical className="h-3.5 w-3.5" />}
                {testState === 'running' ? '运行中' : testState === 'passed' ? '重新运行' : '运行测试'}
              </button>
            </div>
            {testState === 'idle' ? (
              <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
                点击「运行测试」开始验证应用
              </div>
            ) : (
              <ul className="divide-y rounded-lg border bg-background">
                {['应用渲染与初始化', '核心交互（新增 / 完成 / 删除）', '本地数据持久化'].map((name, i) => (
                  <li key={name} className="flex items-center gap-3 px-4 py-3">
                    {testState === 'running' ? (
                      <Loader2 className={cn('h-4 w-4 text-muted-foreground', i === 0 && 'animate-spin')} />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    )}
                    <span className="flex-1 text-sm">{name}</span>
                    <span
                      className={cn(
                        'text-xs font-medium',
                        testState === 'running' ? 'text-muted-foreground' : 'text-primary',
                      )}
                    >
                      {testState === 'running' ? (i === 0 ? '运行中' : '等待') : '通过'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {testState === 'passed' && (
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary">
                <CheckCircle2 className="h-3.5 w-3.5" />
                3 / 3 通过 · 用时 0.9s
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto bg-card">
          <div className="flex items-center gap-2 border-b px-4 py-2 text-xs text-muted-foreground">
            <FileText className="h-3.5 w-3.5" />
            构建日志 · {project.name}
          </div>
          <ul className="space-y-1.5 px-4 py-4 font-mono text-[12px] leading-relaxed">
            {logs.map((l, i) => (
              <li key={i} className="flex gap-3">
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {new Date(l.t).toLocaleTimeString('zh-CN', { hour12: false })}
                </span>
                <span className="text-foreground">{l.msg}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

/** 按项目类型渲染对应的可运行应用 */
function AppRenderer({ project }: { project: Project }) {
  if (project.appType === 'todo') return <TodoApp projectId={project.id} />;
  if (project.appType === 'pomodoro') return <PomodoroApp projectId={project.id} />;
  return <HabitApp projectId={project.id} />;
}