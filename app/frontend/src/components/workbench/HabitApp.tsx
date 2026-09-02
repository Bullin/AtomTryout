import { useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Circle,
  Droplet,
  Dumbbell,
  Moon,
  Plus,
  Sparkles,
  Sun,
  Target,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useHabits, type Habit, type HabitIconKey } from '@/hooks/useHabits';

const ICON_MAP: Record<HabitIconKey, typeof BookOpen> = {
  book: BookOpen,
  dumbbell: Dumbbell,
  droplet: Droplet,
  moon: Moon,
  sparkles: Sparkles,
  target: Target,
  sun: Sun,
};

function todayLabel(): string {
  return new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}

/** 预览区内嵌的独立应用「每日进步」：真实可交互，localStorage 持久化 */
export default function HabitApp() {
  const { habits, addHabit, toggleHabit, removeHabit, doneCount, total, progress } = useHabits();
  const [draft, setDraft] = useState('');
  const dateStr = useMemo(() => todayLabel(), []);
  const allDone = total > 0 && doneCount === total;

  const handleAdd = () => {
    if (addHabit(draft)) {
      setDraft('');
      toast.success('习惯已添加');
    } else {
      toast.warning('请输入习惯名称');
    }
  };

  const handleToggle = (h: Habit) => {
    toggleHabit(h.id);
    toast.success(h.done ? `已取消「${h.name}」` : `完成「${h.name}」，继续保持！`);
  };

  const handleRemove = (h: Habit) => {
    removeHabit(h.id);
    toast(`已删除「${h.name}」`, { description: '如需恢复，可在上方输入框重新添加' });
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col overflow-y-auto bg-background px-5 py-6 sm:px-8">
      {/* 应用头部 */}
      <header className="mb-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-lg font-bold tracking-tight text-foreground">每日进步</h1>
          <span className="text-xs tabular-nums text-muted-foreground">{dateStr}</span>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="shrink-0 text-sm font-medium tabular-nums text-foreground">
            今日完成 <span className="text-primary">{doneCount}</span>/{total}
          </span>
        </div>
        {allDone && (
          <p className="mt-2 inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
            <Sparkles className="h-3 w-3" />
            今日目标全部达成，做得好！
          </p>
        )}
      </header>

      {/* 新增习惯 */}
      <div className="mb-4 flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd();
          }}
          placeholder="新增一个习惯，如：冥想 10 分钟"
          className="h-9 flex-1 rounded-md border border-input bg-card px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="flex h-9 shrink-0 items-center gap-1 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-transform duration-150 hover:md:bg-primary/90 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          添加
        </button>
      </div>

      {/* 习惯列表 */}
      {total === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-12 text-center">
          <Target className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">还没有习惯，先添加第一个吧</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {habits.map((h) => {
            const Icon = ICON_MAP[h.icon] ?? Sparkles;
            return (
              <li
                key={h.id}
                className={cn(
                  'flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5 transition-colors duration-150',
                  h.done && 'border-primary/30 bg-primary/5',
                )}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
                    h.done ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground',
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={cn('truncate text-sm font-medium', h.done && 'text-muted-foreground line-through')}>
                    {h.name}
                  </p>
                  <span
                    className={cn(
                      'mt-0.5 inline-block rounded-sm px-1.5 py-px text-[10px] font-medium',
                      h.category === '自定义'
                        ? 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200'
                        : 'bg-secondary text-muted-foreground',
                    )}
                  >
                    {h.category}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle(h)}
                  aria-label={h.done ? '取消完成' : '标记完成'}
                  className={cn(
                    'flex h-8 shrink-0 items-center gap-1 rounded-md px-2.5 text-xs font-medium transition-all duration-150 active:scale-95',
                    h.done
                      ? 'bg-primary text-primary-foreground hover:md:bg-primary/90'
                      : 'border border-input bg-background text-foreground hover:md:border-primary/40 hover:md:bg-primary/5 hover:md:text-primary',
                  )}
                >
                  {h.done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                  {h.done ? '已完成' : '完成'}
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(h)}
                  aria-label={`删除 ${h.name}`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:md:bg-destructive/10 hover:md:text-destructive active:scale-95"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <footer className="mt-auto pt-6 text-center text-[11px] text-muted-foreground">
        数据保存在本地浏览器，刷新后依然存在
      </footer>
    </div>
  );
}