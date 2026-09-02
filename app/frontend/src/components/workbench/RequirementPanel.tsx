import { useRef, useState } from 'react';
import { CheckCircle2, Loader2, MessageSquarePlus, Send, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatTime, type Project } from '@/hooks/useProjects';

interface RequirementPanelProps {
  project: Project;
  /** 发送新需求：触发“正在生成”约 2 秒后生成新应用 */
  onSend: (text: string, onDone?: (unsupported: boolean) => void) => void;
  /** 当前项目是否正在生成 */
  generating: boolean;
  className?: string;
}

/** 中间需求面板：需求沟通记录（用户需求 + 修改记录），底部固定输入框；生成时在输入框上方显示“正在生成” */
export default function RequirementPanel({ project, onSend, generating, className }: RequirementPanelProps) {
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const building = project.status === 'building';

  const handleSend = () => {
    if (generating) return;
    const text = draft.trim();
    if (!text) {
      toast.warning('请先描述你想创建或修改的应用');
      return;
    }
    onSend(text, (unsupported) => {
      if (unsupported) {
        toast.warning('当前仅支持浏览器内运行的小型应用', {
          description: '试试：番茄钟、待办、记账、习惯打卡、计算器、投票、倒计时',
        });
      } else {
        toast.success('应用生成完成', { description: '右侧预览已切换为最新应用' });
      }
    });
    setDraft('');
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    });
  };

  return (
    <section className={cn('flex w-[340px] shrink-0 flex-col border-r bg-card', className)}>
      {/* 面板头部：项目名 + 构建状态 */}
      <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b px-4">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="truncate text-sm font-semibold">{project.name}</h2>
        </div>
        {building ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
            <Loader2 className="h-3 w-3 animate-spin" />
            构建中
          </span>
        ) : (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary ring-1 ring-inset ring-primary/25">
            <CheckCircle2 className="h-3 w-3" />
            已完成
          </span>
        )}
      </header>

      {/* 主体：需求沟通记录 */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {/* 用户需求 */}
        <div>
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">用户需求</p>
          <div className="rounded-lg border bg-secondary/50 px-3 py-2.5 text-sm leading-relaxed text-foreground">
            {project.requirement}
          </div>
          <p className="mt-1 text-[11px] tabular-nums text-muted-foreground">创建于 {formatTime(project.createdAt)}</p>
        </div>

        {/* 修改记录 */}
        <div>
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">修改记录</p>
          {project.revisions.length === 0 ? (
            <p className="rounded-lg border border-dashed px-3 py-3 text-center text-xs text-muted-foreground">
              暂无修改记录，在下方描述你想调整的地方
            </p>
          ) : (
            <ol className="space-y-2">
              {project.revisions.map((r) => (
                <li key={r.id} className="rounded-lg border bg-card px-3 py-2.5">
                  <p className="text-sm leading-relaxed text-foreground">{r.text}</p>
                  <p className="mt-1 text-[11px] tabular-nums text-muted-foreground">{r.time}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {/* 底部固定输入区 */}
      <footer className="shrink-0 border-t bg-card p-3">
        {/* 正在生成提示：位于输入框上方 */}
        {generating && (
          <div className="mb-2 flex items-center gap-2 rounded-md bg-primary/5 px-3 py-2 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            正在生成
          </div>
        )}
        <div className="flex items-end gap-2 rounded-lg border bg-background p-2 focus-within:ring-2 focus-within:ring-ring/40">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={3}
            placeholder="描述你想创建或修改的应用"
            disabled={generating}
            className="max-h-32 min-h-[52px] flex-1 resize-none bg-transparent px-1 py-0.5 text-sm leading-relaxed outline-none placeholder:text-muted-foreground disabled:opacity-60"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={generating}
            aria-label="发送需求"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground transition-transform duration-150 hover:md:bg-primary/90 active:scale-95 disabled:opacity-50"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
        <p className="mt-1.5 flex items-center gap-1 px-1 text-[11px] text-muted-foreground">
          <MessageSquarePlus className="h-3 w-3" />
          按 Ctrl / ⌘ + Enter 发送
        </p>
      </footer>
    </section>
  );
}