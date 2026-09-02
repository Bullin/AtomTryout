import { Atom, CalendarCheck, LayoutTemplate, ListTodo, Plus, Settings, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { APP_META, type AppType, type Project } from '@/hooks/useProjects';

interface LeftNavProps {
  projects: Project[];
  activeProject: Project | null;
  onSelectProject: (id: string) => void;
  onNewApp: () => void;
  onSettings: () => void;
  className?: string;
}

const TYPE_ICON: Record<AppType, typeof CalendarCheck> = {
  habit: CalendarCheck,
  todo: ListTodo,
  pomodoro: Timer,
  custom: LayoutTemplate,
};

/** 左侧窄导航栏：产品名称、新建应用、当前项目、最近项目（真实数据）、设置入口 */
export default function LeftNav({ projects, activeProject, onSelectProject, onNewApp, onSettings, className }: LeftNavProps) {
  const recent = projects
    .filter((p) => p.id !== activeProject?.id)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 2);

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
          <button
            type="button"
            onClick={() => onSelectProject(activeProject.id)}
            aria-current="page"
            className="flex w-full items-center gap-2 rounded-md bg-primary/10 px-2 py-1.5 text-left text-sm font-medium text-primary ring-1 ring-inset ring-primary/30"
          >
            <FolderIcon type={activeProject.appType} />
            <span className="truncate">{activeProject.name}</span>
            <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          </button>
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
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectProject(p.id)}
                title={p.requirement}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-sidebar-foreground transition-colors duration-150 hover:md:bg-sidebar-accent"
              >
                <FolderIcon type={p.appType} />
                <span className="truncate">{p.name}</span>
              </button>
            ))}
          </div>
        )}
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

function FolderIcon({ type }: { type: AppType }) {
  const Icon = TYPE_ICON[type] ?? Atom;
  return <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />;
}

export { APP_META };