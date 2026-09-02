import { useEffect, useState } from 'react';
import { CheckCircle2, Circle, Pause, Play, RotateCcw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { appStorageKey } from '@/hooks/useProjects';

interface Todo {
  id: string;
  text: string;
  done: boolean;
}

interface PomoStats {
  sessions: number;
}

/** 通用 localStorage 持久化状态 */
function usePersisted<T>(key: string, seed: () => T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) return JSON.parse(raw) as T;
    } catch {
      // 忽略损坏数据，回退到种子
    }
    return seed();
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // 存储不可用时静默降级
    }
  }, [key, value]);

  return [value, setValue] as const;
}

function todayLabel(): string {
  return new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}

/** 生成应用之一：待办清单（新增 / 完成 / 删除，按项目隔离持久化） */
export function TodoApp({ projectId }: { projectId: string }) {
  const key = appStorageKey('todo', projectId);
  const [todos, setTodos] = usePersisted<Todo[]>(key, () => {
    const base = Date.now();
    return [
      { id: `t-${base}-1`, text: '整理本周会议纪要', done: true },
      { id: `t-${base}-2`, text: '回复客户邮件', done: false },
      { id: `t-${base}-3`, text: '规划明天行程', done: false },
    ];
  });
  const [draft, setDraft] = useState('');
  const doneCount = todos.filter((t) => t.done).length;
  const total = todos.length;
  const progress = total === 0 ? 0 : Math.round((doneCount / total) * 100);

  const handleAdd = () => {
    const text = draft.trim();
    if (!text) {
      toast.warning('请输入待办事项');
      return;
    }
    setTodos((prev) => [...prev, { id: `t-${Date.now()}`, text, done: false }]);
    setDraft('');
    toast.success('待办已添加');
  };

  const handleToggle = (t: Todo) => {
    setTodos((prev) => prev.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)));
  };

  const handleRemove = (t: Todo) => {
    setTodos((prev) => prev.filter((x) => x.id !== t.id));
    toast(`已删除「${t.text}」`);
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col overflow-y-auto bg-background px-5 py-6 sm:px-8">
      <header className="mb-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-lg font-bold tracking-tight text-foreground">待办清单</h1>
          <span className="text-xs tabular-nums text-muted-foreground">{todayLabel()}</span>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="shrink-0 text-sm font-medium tabular-nums text-foreground">
            已完成 <span className="text-primary">{doneCount}</span>/{total}
          </span>
        </div>
      </header>

      <div className="mb-4 flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd();
          }}
          placeholder="新增一条待办，如：预约牙医"
          className="h-9 flex-1 rounded-md border border-input bg-card px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="h-9 shrink-0 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-transform duration-150 hover:md:bg-primary/90 active:scale-[0.98]"
        >
          添加
        </button>
      </div>

      {total === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
          暂无待办，先添加第一条吧
        </div>
      ) : (
        <ul className="space-y-2">
          {todos.map((t) => (
            <li
              key={t.id}
              className={cn(
                'flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5 transition-colors duration-150',
                t.done && 'border-primary/30 bg-primary/5',
              )}
            >
              <button
                type="button"
                onClick={() => handleToggle(t)}
                aria-label={t.done ? '取消完成' : '标记完成'}
                className={cn(
                  'flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-all duration-150 active:scale-95',
                  t.done
                    ? 'bg-primary text-primary-foreground hover:md:bg-primary/90'
                    : 'border border-input bg-background text-foreground hover:md:border-primary/40 hover:md:bg-primary/5 hover:md:text-primary',
                )}
              >
                {t.done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                {t.done ? '已完成' : '完成'}
              </button>
              <p className={cn('min-w-0 flex-1 truncate text-sm font-medium', t.done && 'text-muted-foreground line-through')}>
                {t.text}
              </p>
              <button
                type="button"
                onClick={() => handleRemove(t)}
                aria-label={`删除 ${t.text}`}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:md:bg-destructive/10 hover:md:text-destructive active:scale-95"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <footer className="mt-auto pt-6 text-center text-[11px] text-muted-foreground">
        数据保存在本地浏览器，刷新后依然存在
      </footer>
    </div>
  );
}

const FOCUS_SECONDS = 25 * 60;

function fmt(s: number): string {
  const m = Math.floor(Math.max(0, s) / 60);
  const sec = Math.max(0, s) % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

/** 生成应用之一：番茄专注计时器（开始 / 暂停 / 重置，完成计数持久化） */
export function PomodoroApp({ projectId }: { projectId: string }) {
  const key = appStorageKey('pomodoro', projectId);
  const [stats, setStats] = usePersisted<PomoStats>(key, () => ({ sessions: 0 }));
  const [left, setLeft] = useState(FOCUS_SECONDS);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  useEffect(() => {
    if (left > 0) return;
    setRunning(false);
    setLeft(FOCUS_SECONDS);
    setStats((p) => ({ sessions: p.sessions + 1 }));
    toast.success('完成 1 个番茄钟，休息一下吧');
  }, [left, setStats]);

  const elapsedPct = Math.round(((FOCUS_SECONDS - left) / FOCUS_SECONDS) * 100);

  return (
    <div className="mx-auto flex h-full w-full max-w-md flex-col items-center overflow-y-auto bg-background px-5 py-8 sm:px-8">
      <h1 className="text-lg font-bold tracking-tight text-foreground">番茄专注</h1>
      <p className="mt-1 text-xs text-muted-foreground">每个番茄钟 25 分钟，专注一件事</p>

      <div className="mt-8 w-full">
        <div className="mb-2 flex items-baseline justify-center gap-2">
          <span className="text-5xl font-semibold tabular-nums tracking-tight text-foreground">{fmt(left)}</span>
        </div>
        <div className="mx-auto h-2 w-full max-w-xs overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-1000 ease-linear"
            style={{ width: `${elapsedPct}%` }}
          />
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {running ? '专注中…保持节奏' : elapsedPct > 0 ? '已暂停' : '准备就绪'}
        </p>
      </div>

      <div className="mt-6 flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setRunning((r) => {
              toast(r ? '计时已暂停' : '开始专注计时');
              return !r;
            });
          }}
          className="flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-transform duration-150 hover:md:bg-primary/90 active:scale-[0.98]"
        >
          {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {running ? '暂停' : '开始'}
        </button>
        <button
          type="button"
          onClick={() => {
            setRunning(false);
            setLeft(FOCUS_SECONDS);
            toast('计时器已重置');
          }}
          className="flex h-9 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground transition-colors duration-150 hover:md:bg-accent active:scale-[0.98]"
        >
          <RotateCcw className="h-4 w-4" />
          重置
        </button>
      </div>

      <div className="mt-8 w-full rounded-lg border bg-card px-4 py-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">累计完成</span>
          <span className="font-semibold tabular-nums text-primary">{stats.sessions} 个番茄钟</span>
        </div>
      </div>

      <footer className="mt-auto pt-8 text-center text-[11px] text-muted-foreground">
        完成计数保存在本地浏览器，刷新后依然存在
      </footer>
    </div>
  );
}

interface CustomItem {
  id: string;
  text: string;
  done: boolean;
}

/** 生成应用之一：自定义应用（未命中预置类型时，按需求名称生成的可运行记录工具） */
export function CustomApp({
  projectId,
  appName,
  requirement,
}: {
  projectId: string;
  appName: string;
  requirement: string;
}) {
  const key = appStorageKey('custom', projectId);
  const [items, setItems] = usePersisted<CustomItem[]>(key, () => []);
  const [draft, setDraft] = useState('');
  const doneCount = items.filter((i) => i.done).length;
  const total = items.length;
  const progress = total === 0 ? 0 : Math.round((doneCount / total) * 100);

  const handleAdd = () => {
    const text = draft.trim();
    if (!text) {
      toast.warning('请输入内容');
      return;
    }
    setItems((prev) => [...prev, { id: `c-${Date.now()}`, text, done: false }]);
    setDraft('');
    toast.success('已添加');
  };

  const handleToggle = (it: CustomItem) => {
    setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, done: !x.done } : x)));
  };

  const handleRemove = (it: CustomItem) => {
    setItems((prev) => prev.filter((x) => x.id !== it.id));
    toast(`已删除「${it.text}」`);
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col overflow-y-auto bg-background px-5 py-6 sm:px-8">
      <header className="mb-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-lg font-bold tracking-tight text-foreground">{appName}</h1>
          <span className="text-xs tabular-nums text-muted-foreground">{todayLabel()}</span>
        </div>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">来自需求：{requirement}</p>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="shrink-0 text-sm font-medium tabular-nums text-foreground">
            已完成 <span className="text-primary">{doneCount}</span>/{total}
          </span>
        </div>
      </header>

      <div className="mb-4 flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd();
          }}
          placeholder={`添加与「${appName}」相关的内容`}
          className="h-9 flex-1 rounded-md border border-input bg-card px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="h-9 shrink-0 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-transform duration-150 hover:md:bg-primary/90 active:scale-[0.98]"
        >
          添加
        </button>
      </div>

      {total === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
          还没有记录，先添加第一条与「{appName}」相关的内容吧
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((it) => (
            <li
              key={it.id}
              className={cn(
                'flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5 transition-colors duration-150',
                it.done && 'border-primary/30 bg-primary/5',
              )}
            >
              <button
                type="button"
                onClick={() => handleToggle(it)}
                aria-label={it.done ? '取消完成' : '标记完成'}
                className={cn(
                  'flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-all duration-150 active:scale-95',
                  it.done
                    ? 'bg-primary text-primary-foreground hover:md:bg-primary/90'
                    : 'border border-input bg-background text-foreground hover:md:border-primary/40 hover:md:bg-primary/5 hover:md:text-primary',
                )}
              >
                {it.done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                {it.done ? '已完成' : '完成'}
              </button>
              <p className={cn('min-w-0 flex-1 truncate text-sm font-medium', it.done && 'text-muted-foreground line-through')}>
                {it.text}
              </p>
              <button
                type="button"
                onClick={() => handleRemove(it)}
                aria-label={`删除 ${it.text}`}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:md:bg-destructive/10 hover:md:text-destructive active:scale-95"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <footer className="mt-auto pt-6 text-center text-[11px] text-muted-foreground">
        数据保存在本地浏览器，刷新后依然存在
      </footer>
    </div>
  );
}