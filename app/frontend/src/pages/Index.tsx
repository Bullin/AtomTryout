import { useState } from 'react';
import { Atom, Menu } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import LeftNav from '@/components/workbench/LeftNav';
import RequirementPanel from '@/components/workbench/RequirementPanel';
import PreviewWorkspace from '@/components/workbench/PreviewWorkspace';

const CURRENT_PROJECT = '习惯打卡';

/** 全屏 AI 应用编辑器工作台：左导航 + 中需求面板 + 右预览区 */
export default function Workbench() {
  const [activeProject, setActiveProject] = useState(CURRENT_PROJECT);
  const [navOpen, setNavOpen] = useState(false);
  const [view, setView] = useState<'requirements' | 'preview'>('preview');

  const status: 'done' | 'draft' = activeProject === CURRENT_PROJECT ? 'done' : 'draft';

  const handleSelectProject = (name: string) => {
    setActiveProject(name);
    setNavOpen(false);
    if (name !== activeProject) toast(`已切换到项目「${name}」`);
  };

  const handleNewApp = () => {
    setNavOpen(false);
    toast.info('已新建空白应用', { description: '在需求面板描述你的想法，AI 将为你生成' });
  };

  const handleSettings = () => {
    setNavOpen(false);
    toast('设置', { description: '偏好设置将在后续版本开放' });
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-sm">
      {/* 左栏：桌面端静态显示 */}
      <LeftNav
        className="hidden lg:flex"
        activeProject={activeProject}
        onSelectProject={handleSelectProject}
        onNewApp={handleNewApp}
        onSettings={handleSettings}
      />

      {/* 左栏：小屏抽屉 */}
      {navOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/30 animate-in fade-in duration-200"
            onClick={() => setNavOpen(false)}
            aria-hidden
          />
          <LeftNav
            className="absolute inset-y-0 left-0 shadow-xl animate-in slide-in-from-left duration-200"
            activeProject={activeProject}
            onSelectProject={handleSelectProject}
            onNewApp={handleNewApp}
            onSettings={handleSettings}
          />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* 小屏顶栏：导航开关 + 需求/预览切换 */}
        <header className="flex h-11 shrink-0 items-center gap-2 border-b bg-card px-3 lg:hidden">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            aria-label="打开导航"
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:md:bg-accent hover:md:text-foreground active:scale-95"
          >
            <Menu className="h-4 w-4" />
          </button>
          <span className="flex items-center gap-1.5 text-sm font-semibold tracking-tight">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Atom className="h-3 w-3" />
            </span>
            Atom 尝鲜
          </span>
          <div className="ml-auto flex items-center gap-0.5 rounded-md bg-secondary p-0.5 md:hidden" role="tablist" aria-label="面板切换">
            <button
              type="button"
              role="tab"
              aria-selected={view === 'requirements'}
              onClick={() => setView('requirements')}
              className={cn(
                'rounded-[5px] px-2.5 py-1 text-xs font-medium transition-colors duration-150',
                view === 'requirements' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground',
              )}
            >
              需求
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === 'preview'}
              onClick={() => setView('preview')}
              className={cn(
                'rounded-[5px] px-2.5 py-1 text-xs font-medium transition-colors duration-150',
                view === 'preview' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground',
              )}
            >
              预览
            </button>
          </div>
        </header>

        {/* 三栏主体 */}
        <div className="flex min-h-0 flex-1">
          <RequirementPanel
            projectName={activeProject}
            status={status}
            className={cn('hidden md:flex', view === 'requirements' && 'flex w-full md:w-[340px]')}
          />
          <PreviewWorkspace
            projectName={activeProject}
            className={cn(view === 'requirements' ? 'hidden md:flex' : 'flex')}
          />
        </div>
      </div>
    </div>
  );
}