import { Atom, FolderKanban, LayoutDashboard, Plus, Settings, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeftNavProps {
  activeProject: string;
  onSelectProject: (name: string) => void;
  onNewApp: () => void;
  onSettings: () => void;
  className?: string;
}

const CURRENT_PROJECT = '习惯打卡';
const RECENT_PROJECTS = [
  { name: '番茄专注计时器', icon: Timer },
  { name: '团队周报看板', icon: LayoutDashboard },
];

/** 左侧窄导航栏：产品名称、新建应用、当前项目、最近项目、设置入口 */
export default function LeftNav({ activeProject, onSelectProject, onNewApp, onSettings, className }: LeftNavProps) {
  return (
    <aside className={cn('flex w-[220px] shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground', className)}>
      {/* 产品名称 */}
      <div className="flex h-12 items-center gap-2 border-b px-4">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Atom className="h-3.5 w-3.5" />
        </span>
        <span className="text-sm font-semibold tracking-tight">Atom 尝鲜</span>
      </div>

      {/* 新建应用 */}
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
        <button
          type="button"
          onClick={() => onSelectProject(CURRENT_PROJECT)}
          aria-current={activeProject === CURRENT_PROJECT ? 'page' : undefined}
          className={cn(
            'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors duration-150',
            activeProject === CURRENT_PROJECT
              ? 'bg-primary/10 font-medium text-primary ring-1 ring-inset ring-primary/30'
              : 'text-sidebar-foreground hover:md:bg-sidebar-accent',
          )}
        >
          <FolderKanban className="h-4 w-4 shrink-0" />
          <span className="truncate">{CURRENT_PROJECT}</span>
          {activeProject === CURRENT_PROJECT && <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
        </button>
      </div>

      {/* 最近项目 */}
      <div className="px-3 pt-4">
        <p className="px-1 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">最近项目</p>
        <div className="flex flex-col gap-0.5">
          {RECENT_PROJECTS.map(({ name, icon: Icon }) => (
            <button
              key={name}
              type="button"
              onClick={() => onSelectProject(name)}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors duration-150',
                activeProject === name
                  ? 'bg-primary/10 font-medium text-primary ring-1 ring-inset ring-primary/30'
                  : 'text-sidebar-foreground hover:md:bg-sidebar-accent',
              )}
            >
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 设置入口（固定底部） */}
      <div className="mt-auto border-t px-3 py-2">
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