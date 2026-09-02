import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import LeftNav from '@/components/workbench/LeftNav';
import RequirementPanel from '@/components/workbench/RequirementPanel';
import PreviewWorkspace from '@/components/workbench/PreviewWorkspace';
import CreatePage from '@/components/workbench/CreatePage';
import { formatTime, useProjects } from '@/hooks/useProjects';

/**
 * 应用入口：根据项目状态在「创建页」与「编辑工作台」之间切换。
 * - 无项目（localStorage 为空）：显示创建页
 * - 已有项目：直接进入最近打开的三栏编辑工作台（导航常驻，小屏可切换需求/预览）
 * 项目数据 localStorage 缓存 + Atoms Cloud 云端同步；最近项目支持删除。
 */
export default function Workbench() {
  const {
    projects,
    ui,
    activeProject,
    authState,
    user,
    syncing,
    createProject,
    openProject,
    goCreate,
    regenerate,
    regeneratingId,
    setActiveVersion,
    deleteProject,
    loginToCloud,
    logout,
  } = useProjects();
  const [view, setView] = useState<'requirements' | 'preview'>('preview');

  // 创建页：没有项目，或用户主动点击「新建应用」返回
  if (ui.mode !== 'edit' || !activeProject) {
    return (
      <CreatePage
        projects={projects}
        authState={authState}
        user={user}
        syncing={syncing}
        onCreate={createProject}
        onOpen={openProject}
        onDelete={(id) => {
          deleteProject(id);
          toast('项目已删除', { description: authState === 'authenticated' ? '云端记录同步删除' : undefined });
        }}
        onLogin={loginToCloud}
        onLogout={logout}
      />
    );
  }

  const generating = regeneratingId === activeProject.id;

  const handleNewApp = () => {
    goCreate();
    toast('已返回创建页', { description: '已有项目已保留，可从最近项目随时返回' });
  };

  const handleSettings = () => {
    toast('设置', { description: '偏好设置将在后续版本开放' });
  };

  const handleDelete = (id: string) => {
    const name = projects.find((p) => p.id === id)?.name;
    deleteProject(id);
    toast('项目已删除', {
      description: authState === 'authenticated' ? `「${name}」已从本地与云端移除` : `「${name}」已从本地移除`,
    });
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-sm">
      {/* 左侧导航栏：任何屏幕尺寸下都保持展示，不收起 */}
      <LeftNav
        projects={projects}
        activeProject={activeProject}
        authState={authState}
        user={user}
        syncing={syncing}
        onSelectProject={openProject}
        onDeleteProject={handleDelete}
        onNewApp={handleNewApp}
        onSettings={handleSettings}
        onLogin={loginToCloud}
        onLogout={logout}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* 小屏顶栏：仅做需求/预览切换，导航栏常驻可见 */}
        <header className="flex h-11 shrink-0 items-center gap-2 border-b bg-card px-3 md:hidden">
          <span className="truncate text-xs font-medium text-muted-foreground">
            当前项目 · {activeProject.name}
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

        {/* 三栏主体：沿用既有工作台布局与视觉 */}
        <div className="flex min-h-0 flex-1">
          <RequirementPanel
            project={activeProject}
            generating={generating}
            onSend={(text, onDone) => regenerate(activeProject.id, text, onDone)}
            className={cn('hidden md:flex', view === 'requirements' && 'flex w-full md:w-[340px]')}
          />
          <PreviewWorkspace
            project={activeProject}
            generating={generating}
            onSwitchVersion={(ver) => {
              setActiveVersion(activeProject.id, ver);
              const v = activeProject.versions.find((x) => x.ver === ver);
              toast(`已切换到 v${ver}`, { description: v ? `${v.label} · ${formatTime(v.createdAt)} 生成` : undefined });
            }}
            className={cn(view === 'requirements' ? 'hidden md:flex' : 'flex')}
          />
        </div>
      </div>
    </div>
  );
}
