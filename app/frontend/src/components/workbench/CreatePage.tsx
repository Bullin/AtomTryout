import { useState } from 'react';
import { AlertCircle, Atom, Check, Clock3, Cloud, CloudOff, Inbox, Loader2, LogIn, LogOut, Sparkles, Trash2, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatTime, type AuthState, type Project } from '@/hooks/useProjects';
import type { CloudUser } from '@/lib/cloudSync';

interface CreatePageProps {
  projects: Project[];
  authState: AuthState;
  user: CloudUser | null;
  syncing: boolean;
  onCreate: (requirement: string) => { ok: true; id: string } | { ok: false; error: string };
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onLogin: () => void;
  onLogout: () => void;
}

const EXAMPLES = [
  '创建一个习惯打卡应用，记录每天阅读、运动和喝水',
  '创建一个待办清单应用，支持添加、完成和删除任务',
  '创建一个番茄专注计时器，帮助我专注工作 25 分钟',
];

/** 最近项目行：点击打开；悬停显示删除；删除需行内二次确认 */
function RecentItem({ project, onOpen, onDelete }: { project: Project; onOpen: (id: string) => void; onDelete: (id: string) => void }) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-2 px-4 py-3">
        <span className="min-w-0 flex-1 truncate text-sm text-destructive">确认删除「{project.name}」？此操作不可恢复。</span>
        <button
          type="button"
          onClick={() => {
            onDelete(project.id);
            setConfirming(false);
            toast.success('项目已删除');
          }}
          className="flex shrink-0 items-center gap-1 rounded-md bg-destructive px-2.5 py-1 text-xs font-medium text-destructive-foreground"
        >
          <Check className="h-3 w-3" />
          删除
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="shrink-0 rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-accent"
        >
          取消
        </button>
      </div>
    );
  }

  return (
    <div className="group flex items-center">
      <button
        type="button"
        onClick={() => onOpen(project.id)}
        className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left transition-colors duration-150 md:hover:bg-accent"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground">
          <Atom className="h-3.5 w-3.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-foreground">{project.name}</span>
          <span className="block truncate text-xs text-muted-foreground">{project.requirement}</span>
        </span>
        <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{formatTime(project.updatedAt)}</span>
      </button>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label={`删除项目 ${project.name}`}
        title="删除项目"
        className="mr-3 shrink-0 rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity duration-150 hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/** 无项目时的创建页：品牌标识 + 主标题 + 大输入框 + 示例需求 + 最近项目（可删除） */
export default function CreatePage({ projects, authState, user, syncing, onCreate, onOpen, onDelete, onLogin, onLogout }: CreatePageProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recent = [...projects].sort((a, b) => b.updatedAt - a.updatedAt);

  const submit = () => {
    const r = onCreate(text);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setError(null);
    toast.success('项目已创建', { description: 'AI 正在生成应用，请稍候' });
  };

  return (
    <div className="flex h-screen w-full justify-center overflow-y-auto bg-background">
      <main className="flex w-full max-w-[640px] flex-col px-6 py-12 sm:py-16">
        {/* 品牌标识 + 云端状态 */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Atom className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold leading-none tracking-tight">Atom 尝鲜</p>
              <p className="mt-1 text-xs text-muted-foreground">描述想法，即刻生成可运行的应用</p>
            </div>
          </div>
          {authState === 'authenticated' ? (
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary ring-1 ring-inset ring-primary/25">
                <UserRound className="h-3 w-3" aria-hidden />
                <span className="max-w-[120px] truncate" title={user?.name || user?.email || '已登录'}>
                  {user?.name || user?.email || '已登录'}
                </span>
                <span className="h-3 w-px bg-primary/30" aria-hidden />
                {syncing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Cloud className="h-3 w-3" />}
                {syncing ? '同步中' : '云端已保存'}
              </span>
              <button
                type="button"
                onClick={onLogout}
                aria-label="退出登录"
                title="退出登录"
                className="flex shrink-0 items-center gap-1 rounded-full border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors duration-150 hover:border-destructive/40 hover:text-destructive"
              >
                <LogOut className="h-3 w-3" />
                退出
              </button>
            </div>
          ) : authState === 'loading' ? (
            <span
              className="flex shrink-0 items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
              role="status"
              aria-live="polite"
            >
              <Loader2 className="h-3 w-3 animate-spin" />
              正在检查登录状态…
            </span>
          ) : (
            <button
              type="button"
              onClick={onLogin}
              className="flex shrink-0 items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors duration-150 hover:border-primary/40 hover:text-foreground"
              title="登录后项目将自动保存到云端"
            >
              <CloudOff className="h-3 w-3" />
              未登录 · 仅本地保存
              <LogIn className="h-3 w-3" />
              <span className="font-semibold text-primary">登录</span>
            </button>
          )}
        </div>

        {/* 主标题 */}
        <h1 className="mt-10 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          你的下一个想法，从这里开始
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          用一句话描述你想要的产品，Atom 会在编辑器里为你生成一个可以立即使用的真实应用。
        </p>

        {/* 大输入框 */}
        <div className="mt-6">
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit();
            }}
            rows={5}
            placeholder="描述你想创建的应用，例如：创建一个习惯打卡应用"
            className="w-full resize-none rounded-lg border border-input bg-card px-4 py-3 text-sm leading-relaxed shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
          />
          {error && (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-destructive">
              <AlertCircle className="h-3.5 w-3.5" />
              {error}
            </p>
          )}
        </div>

        {/* 主按钮 */}
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={submit}
            className="flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-transform duration-150 md:hover:bg-primary/90 active:scale-[0.98]"
          >
            <Sparkles className="h-4 w-4" />
            开始创建
          </button>
          <span className="text-xs text-muted-foreground">Ctrl / ⌘ + Enter 快速创建</span>
        </div>

        {/* 示例需求 */}
        <div className="mt-6">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">试试这些示例</p>
          <div className="flex flex-col gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => {
                  setText(ex);
                  setError(null);
                }}
                className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-left text-sm text-foreground transition-colors duration-150 md:hover:border-primary/40 md:hover:bg-primary/5 active:scale-[0.99]"
              >
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="truncate">{ex}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 最近项目（支持删除） */}
        <div className="mt-10">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            <Clock3 className="h-3 w-3" />
            最近项目
            {recent.length > 0 && <span className={cn('ml-1 normal-case tracking-normal')}>· 悬停可删除</span>}
          </p>
          {recent.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-10 text-center">
              <Inbox className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">还没有项目，从上方描述你的第一个想法</p>
            </div>
          ) : (
            <ul className="divide-y rounded-lg border bg-card">
              {recent.map((p) => (
                <li key={p.id}>
                  <RecentItem project={p} onOpen={onOpen} onDelete={onDelete} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}