import { useRef, useState } from 'react';
import { CheckCircle2, MessageSquarePlus, Send } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface RequirementPanelProps {
  projectName: string;
  status?: 'done' | 'draft';
  className?: string;
}

interface RevisionItem {
  id: string;
  text: string;
  time: string;
}

const INITIAL_REQUIREMENT = '做一个每日习惯打卡应用，支持新增、完成和删除习惯，进度实时显示，数据保存在本地浏览器。';

const INITIAL_REVISIONS: RevisionItem[] = [
  { id: 'r1', text: '把进度条改成绿色，并在标题旁显示「今日完成 2/4」。', time: '昨天 18:24' },
  { id: 'r2', text: '新增习惯后自动聚焦输入框；删除改为行尾图标按钮。', time: '今天 09:12' },
];

function nowTime(): string {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `今天 ${hh}:${mm}`;
}

/** 中间需求面板：需求沟通记录（需求 + 修改记录），底部固定输入框 */
export default function RequirementPanel({ projectName, status = 'done', className }: RequirementPanelProps) {
  const [draft, setDraft] = useState('');
  const [revisions, setRevisions] = useState<RevisionItem[]>(INITIAL_REVISIONS);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    const text = draft.trim();
    if (!text) {
      toast.warning('请先描述你想创建或修改的应用');
      return;
    }
    setRevisions((prev) => [...prev, { id: `r-${Date.now()}`, text, time: nowTime() }]);
    setDraft('');
    toast.success('修改需求已发送');
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    });
  };

  return (
    <section className={cn('flex w-[340px] shrink-0 flex-col border-r bg-card', className)}>
      {/* 面板头部：项目名 + 状态 */}
      <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b px-4">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="truncate text-sm font-semibold">{projectName}</h2>
        </div>
        {status === 'done' ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary ring-1 ring-inset ring-primary/25">
            <CheckCircle2 className="h-3 w-3" />
            已完成
          </span>
        ) : (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
            草稿
          </span>
        )}
      </header>

      {/* 主体：需求沟通记录 */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {/* 用户需求 */}
        <div>
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">用户需求</p>
          <div className="rounded-lg border bg-secondary/50 px-3 py-2.5 text-sm leading-relaxed text-foreground">
            {INITIAL_REQUIREMENT}
          </div>
        </div>

        {/* 修改记录 */}
        <div>
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">修改记录</p>
          <ol className="space-y-2">
            {revisions.map((r) => (
              <li key={r.id} className="rounded-lg border bg-card px-3 py-2.5">
                <p className="text-sm leading-relaxed text-foreground">{r.text}</p>
                <p className="mt-1 text-[11px] tabular-nums text-muted-foreground">{r.time}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* 底部固定输入区 */}
      <footer className="shrink-0 border-t bg-card p-3">
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
            className="max-h-32 min-h-[52px] flex-1 resize-none bg-transparent px-1 py-0.5 text-sm leading-relaxed outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={handleSend}
            aria-label="发送需求"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground transition-transform duration-150 hover:md:bg-primary/90 active:scale-95 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
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