import { useState } from 'react';
import {
  Atom,
  CalendarCheck,
  Cloud,
  CloudOff,
  LayoutTemplate,
  ListTodo,
  Loader2,
  LogIn,
  LogOut,
  Plus,
  Settings,
  Timer,
  Trash2,
  UserRound,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { APP_META, type AppType, type AuthState, type Project } from '@/hooks/useProjects';
import type { CloudUser } from '@/lib/cloudSync';

interface LeftNavProps {
  projects: Project[];
  activeProject: Project | null;
  authState: AuthState;
  user: CloudUser | null;
  syncing: boolean;
  onSelectProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onNewApp: () => void;
  onSettings: () => void;
  onLogin: () => void;
  onLogout: () => void;
  className?: string;
}

const TYPE_ICON: Record<AppType, typeof CalendarCheck> = {
  habit: CalendarCheck,
  todo: ListTodo,
  pomodoro: Timer,
  custom: LayoutTemplate,
};

/** 单个项目行：点击打开；悬停显示删除；删除需行内二次确认，避免误删 */
function ProjectRow({
  project,
  active,
  onSelect,
  onDelete,
}: {
  project: Project;
  active?: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex w-full items-center gap-1.5 rounded-md bg-destructive/10 px-2 py-1.5 text-sm ring-1 ring-inset ring-destructive/30">
        <span className="min-w-0 flex-1 truncate text-destructive">删除「{project.name}」？</span>
        <button
          type="button"
          onClick={() => {
            onDelete(project.id);
            setConfirming(false);
          }}
          className="shrink-0 rounded bg-destructive px-1.5 py-0.5 text-[11px] font-medium text-destructive-foreground"
        >
          删除
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-background"
        >
          取消
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors duration-150',
        active
          ? 'bg-primary/10 font-medium text-primary ring-1 ring-inset ring-primary/30'
          : 'text-sidebar-foreground hover:md:bg-sidebar-accent',
      )}
    >
      <button
        type="button"
        onClick={() => onSelect(project.id)}
        aria-current={active ? 'page' : undefined}
        title={project.requirement}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
      >
        <FolderIcon type={project.appType} />
        <span className="truncate">{project.name}</span>
        {active && <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label={`删除项目 ${project.name}`}
        title="删除项目"
        className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity duration-150 hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/** 左侧窄导航栏：产品名称、新建应用、当前项目、最近项目（真实数据）、云端同步状态、设置 */
export default function LeftNav({
  projects,
  activeProject,
  authState,
  user,
  syncing,
  onSelectProject,
  onDeleteProject,
  onNewApp,
  onSettings,
  onLogin,
  onLogout,
  className,
}: LeftNavProps) {
  const recent = projects
    .filter((p) => p.id !== activeProject?.id)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 3);

  return (
    <aside className={cn('flex w-[220px] shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground', className)}>
      {/* 产品名称 */}
      <div className="flex h-12 items-center gap-2 border-b px-4">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Atom className="h-3.5 w-3.5" />
        </span>
        <span className="text-sm font-semibold tracking-tight">Atom 尝鲜</span>
      </div>

      {/* 新建应用：返回创建页，不清除已有项目 */}
      <div className="px-3 pt-3">
        <button
          type="button"
          onClick={onNewApp}
          className="flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors duration-150 hover:md:bg-primary/90 active:scale-[0.99]"
        >
          <Plus className="h-4 w-4" />
          新建应用
        </button>
      </div>

      {/* 当前项目 */}
      <div className="px-3 pt-4">
        <p className="px-1 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">当前项目</p>
        {activeProject ? (
          <ProjectRow project={activeProject} active onSelect={onSelectProject} onDelete={onDeleteProject} />
        ) : (
          <p className="px-2 py-1.5 text-sm text-muted-foreground">暂无项目</p>
        )}
      </div>

      {/* 最近项目 */}
      <div className="px-3 pt-4">
        <p className="px-1 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">最近项目</p>
        {recent.length === 0 ? (
          <p className="px-2 py-1 text-xs text-muted-foreground">还没有其他项目</p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {recent.map((p) => (
              <ProjectRow key={p.id} project={p} onSelect={onSelectProject} onDelete={onDeleteProject} />
            ))}
          </div>
        )}
      </div>

      {/* 底部：登录状态（三态）+ 退出 + 设置 */}
      <div className="mt-auto border-t px-3 py-2">
        {authState === 'authenticated' ? (
          <div className="flex items-center gap-2 px-2 py-1.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary" title={user?.email ?? '已登录'}>
              <UserRound className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-medium text-foreground" title={user?.name || user?.email || '已登录'}>
                {user?.name || user?.email || '已登录'}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                {syncing ? <Loader2 className="h-3 w-3 shrink-0 animate-spin text-primary" /> : <Cloud className="h-3 w-3 shrink-0 text-primary" />}
                {syncing ? '正在同步到云端…' : '已登录 · 云端保存中'}
              </span>
            </span>
            <button
              type="button"
              onClick={onLogout}
              aria-label="退出登录"
              title="退出登录"
              className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors duration-150 hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : authState === 'loading' ? (
          <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground" role="status" aria-live="polite">
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
            <span>正在检查登录状态…</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={onLogin}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-muted-foreground transition-colors duration-150 hover:md:bg-sidebar-accent hover:md:text-foreground"
            title="登录后项目将自动保存到云端，跨设备可用"
          >
            <CloudOff className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1">未登录 · 仅本地保存</span>
            <LogIn className="h-3.5 w-3.5 shrink-0" />
            <span className="shrink-0 font-medium text-primary">登录</span>
          </button>
        )}
        <button
          type="button"
          onClick={onSettings}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-sidebar-foreground transition-colors duration-150 hover:md:bg-sidebar-accent"
        >
          <Settings className="h-4 w-4 shrink-0 text-muted-foreground" />
          设置
        </button>
      </div>
    </aside>
  );
}

function FolderIcon({ type }: { type: AppType }) {
  const Icon = TYPE_ICON[type] ?? Atom;
  return <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />;
}

export { APP_META };
