import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import LeftNav from '@/components/workbench/LeftNav';
import RequirementPanel from '@/components/workbench/RequirementPanel';
import PreviewWorkspace from '@/components/workbench/PreviewWorkspace';

const CURRENT_PROJECT = '习惯打卡';

/** 全屏 AI 应用编辑器工作台：左导航（始终展示） + 中需求面板 + 右预览区 */
export default function Workbench() {
  const [activeProject, setActiveProject] = useState(CURRENT_PROJECT);
  const [view, setView] = useState<'requirements' | 'preview'>('preview');

  const status: 'done' | 'draft' = activeProject === CURRENT_PROJECT ? 'done' : 'draft';

  const handleSelectProject = (name: string) => {
    setActiveProject(name);
    if (name !== activeProject) toast(`已切换到项目「${name}」`);
  };

  const handleNewApp = () => {
    toast.info('已新建空白应用', { description: '在需求面板描述你的想法，AI 将为你生成' });
  };

  const handleSettings = () => {
    toast('设置', { description: '偏好设置将在后续版本开放' });
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-sm">
      {/* 左侧导航栏：任何屏幕尺寸下都保持展示，不收起 */}
      <LeftNav
        activeProject={activeProject}
        onSelectProject={handleSelectProject}
        onNewApp={handleNewApp}
        onSettings={handleSettings}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* 小屏顶栏：仅做需求/预览切换，导航栏常驻可见 */}
        <header className="flex h-11 shrink-0 items-center gap-2 border-b bg-card px-3 md:hidden">
          <span className="truncate text-xs font-medium text-muted-foreground">
            当前项目 · {activeProject}
          </span>
          <div
            className="ml-auto flex shrink-0 items-center gap-0.5 rounded-md bg-secondary p-0.5"
            role="tablist"
            aria-label="面板切换"
          >
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