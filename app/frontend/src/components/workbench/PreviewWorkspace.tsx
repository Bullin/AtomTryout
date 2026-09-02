import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Code2,
  Download,
  Eye,
  Maximize,
  Minimize,
  Monitor,
  RefreshCw,
  Smartphone,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import HabitApp from './HabitApp';

interface PreviewWorkspaceProps {
  projectName: string;
  className?: string;
}

type TabKey = 'preview' | 'code';
type DeviceKey = 'desktop' | 'mobile';

const CODE_SNIPPET = `// 每日进步 · 习惯打卡应用（节选）
export default function HabitApp() {
  const { habits, addHabit, toggleHabit, removeHabit,
          doneCount, total, progress } = useHabits();

  // 状态通过 localStorage 持久化，刷新后数据仍存在
  useEffect(() => {
    localStorage.setItem('atom-taste-habits-v1',
      JSON.stringify({ date: todayKey(), habits }));
  }, [habits]);

  return (
    <ul>
      {habits.map((h) => (
        <HabitRow key={h.id} habit={h}
          onToggle={() => toggleHabit(h.id)}
          onRemove={() => removeHabit(h.id)} />
      ))}
    </ul>
  );
}`;

/** 读取本地习惯数据，用于导出快照 */
function readStoredHabits() {
  try {
    const raw = localStorage.getItem('atom-taste-habits-v1');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.habits) ? parsed.habits : [];
  } catch {
    return [];
  }
}

/** 右侧预览工作区：预览/代码标签、桌面/手机切换、刷新、全屏、导出 */
export default function PreviewWorkspace({ projectName, className }: PreviewWorkspaceProps) {
  const [tab, setTab] = useState<TabKey>('preview');
  const [device, setDevice] = useState<DeviceKey>('desktop');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const handleExport = useCallback(() => {
    const habits = readStoredHabits();
    const rows = habits
      .map(
        (h: { name: string; category: string; done: boolean }) =>
          `<li class="${h.done ? 'done' : ''}"><span>${h.done ? '☑' : '☐'} ${h.name}</span><em>${h.category}</em></li>`,
      )
      .join('\n');
    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>每日进步 · 导出快照</title>
<style>
  body{font-family:system-ui,-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;background:#f6faf8;color:#16241d;padding:32px;max-width:560px;margin:0 auto}
  h1{font-size:20px;margin:0 0 4px}
  p.date{color:#66766e;font-size:12px;margin:0 0 20px}
  ul{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px}
  li{display:flex;justify-content:space-between;border:1px solid #dde7e1;background:#fff;border-radius:8px;padding:10px 14px;font-size:14px}
  li.done{color:#8a978f;text-decoration:line-through}
  em{font-style:normal;font-size:11px;color:#66766e;background:#eef4f0;border-radius:4px;padding:1px 6px}
</style>
</head>
<body>
<h1>每日进步</h1>
<p class="date">导出时间：${new Date().toLocaleString('zh-CN')}</p>
<ul>
${rows || '<li>暂无习惯数据</li>'}
</ul>
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'daily-progress-export.html';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success('应用已导出', { description: 'daily-progress-export.html 已开始下载' });
  }, []);

  return (
    <section ref={containerRef} className={cn('flex min-w-0 flex-1 flex-col bg-background', className)}>
      {/* 顶部紧凑工具栏 */}
      <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b bg-card px-3">
        {/* 标签切换 */}
        <div className="flex items-center gap-1 rounded-md bg-secondary p-0.5" role="tablist" aria-label="工作区视图">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'preview'}
            onClick={() => setTab('preview')}
            className={cn(
              'flex items-center gap-1.5 rounded-[5px] px-3 py-1 text-xs font-medium transition-colors duration-150',
              tab === 'preview' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:md:text-foreground',
            )}
          >
            <Eye className="h-3.5 w-3.5" />
            预览
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'code'}
            onClick={() => setTab('code')}
            className={cn(
              'flex items-center gap-1.5 rounded-[5px] px-3 py-1 text-xs font-medium transition-colors duration-150',
              tab === 'code' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:md:text-foreground',
            )}
          >
            <Code2 className="h-3.5 w-3.5" />
            代码
          </button>
        </div>

        {/* 工具按钮组 */}
        <div className="flex items-center gap-1">
          {tab === 'preview' && (
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
            aria-label="导出应用"
            className="flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors duration-150 hover:md:bg-accent hover:md:text-foreground active:scale-95"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">导出</span>
          </button>
        </div>
      </header>

      {/* 工作区内容 */}
      {tab === 'preview' ? (
        <div className="relative min-h-0 flex-1 overflow-auto bg-muted/40 p-4 sm:p-6">
          {device === 'desktop' ? (
            <div key={`d-${refreshKey}`} className="h-full min-h-[420px] overflow-hidden rounded-lg border bg-card shadow-sm">
              <HabitApp />
            </div>
          ) : (
            <div className="flex h-full min-h-[480px] items-start justify-center">
              {/* 手机外框 */}
              <div
                key={`m-${refreshKey}`}
                className="flex h-[640px] max-h-full w-[360px] shrink-0 flex-col overflow-hidden rounded-[24px] border-[6px] border-foreground/80 bg-background shadow-md"
              >
                <div className="flex h-6 shrink-0 items-center justify-center bg-foreground/80">
                  <span className="h-1 w-16 rounded-full bg-background/60" />
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto">
                  <HabitApp />
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto bg-card">
          <div className="flex items-center gap-2 border-b px-4 py-2 text-xs text-muted-foreground">
            <Code2 className="h-3.5 w-3.5" />
            {projectName} · src/app/DailyProgress.tsx
          </div>
          <pre className="overflow-x-auto px-4 py-4 text-[12.5px] leading-relaxed">
            <code className="font-mono text-foreground">{CODE_SNIPPET}</code>
          </pre>
        </div>
      )}
    </section>
  );
}