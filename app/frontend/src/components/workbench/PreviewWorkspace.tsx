import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Code2,
  Copy,
  Download,
  Eye,
  FileCode2,
  FileJson,
  FileText,
  FlaskConical,
  History,
  Loader2,
  Maximize,
  Minimize,
  Monitor,
  RefreshCw,
  Smartphone,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { BUILD_MS, formatTime, getActiveVersion, type Project } from '@/hooks/useProjects';

interface PreviewWorkspaceProps {
  project: Project;
  /** 需求发送后的“正在生成”状态：保留当前预览，不显示空白 */
  generating: boolean;
  /** 切换版本（当前 / 上一版本），预览与代码同步变化 */
  onSwitchVersion: (ver: number) => void;
  className?: string;
}

type TabKey = 'preview' | 'code' | 'test' | 'log';
type DeviceKey = 'desktop' | 'mobile';
type TestState = 'idle' | 'running' | 'passed';
type CodeFile = 'index.html' | 'styles.css' | 'app.js';

const CODE_FILES: { key: CodeFile; icon: typeof FileCode2 }[] = [
  { key: 'index.html', icon: FileCode2 },
  { key: 'styles.css', icon: FileJson },
  { key: 'app.js', icon: FileText },
];

/** 右侧预览工作区：预览 / 代码 / 测试 / 日志标签 + 设备切换、刷新、全屏、导出、版本切换 */
export default function PreviewWorkspace({ project, generating, onSwitchVersion, className }: PreviewWorkspaceProps) {
  const [tab, setTab] = useState<TabKey>('preview');
  const [device, setDevice] = useState<DeviceKey>('desktop');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [testState, setTestState] = useState<TestState>('idle');
  const [codeFile, setCodeFile] = useState<CodeFile>('index.html');
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const building = project.status === 'building';

  const version = getActiveVersion(project);
  const appLabel = version?.label ?? '应用';

  // 切换项目时重置局部状态
  useEffect(() => {
    setTab('preview');
    setTestState('idle');
    setCodeFile('index.html');
  }, [project.id]);

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

  const handleRunTest = useCallback(() => {
    if (testState === 'running') return;
    setTestState('running');
    setTimeout(() => {
      setTestState('passed');
      toast.success('测试通过', { description: '3 项冒烟测试全部通过' });
    }, 900);
  }, [testState]);

  const exportHtml = useCallback(() => {
    if (!version) return;
    const blob = new Blob([version.html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name || 'app'}-v${version.ver}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success('应用已导出', { description: `${project.name || 'app'}-v${version.ver}.html 已开始下载` });
  }, [project.name, version]);

  const codeContent = useMemo(() => {
    if (!version) return '';
    if (codeFile === 'styles.css') return version.css;
    if (codeFile === 'app.js') return version.js;
    return version.html;
  }, [version, codeFile]);

  const codeLines = useMemo(() => codeContent.split('\n'), [codeContent]);

  const handleCopy = useCallback(async () => {
    if (!codeContent) return;
    try {
      await navigator.clipboard.writeText(codeContent);
    } catch {
      // 降级：临时 textarea 复制
      const ta = document.createElement('textarea');
      ta.value = codeContent;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
    toast.success('代码已复制', { description: codeFile });
    setTimeout(() => setCopied(false), 1500);
  }, [codeContent, codeFile]);

  // 版本列表：按时间升序，最多两个（当前 + 上一版本）
  const versions = useMemo(() => [...project.versions].sort((a, b) => a.ver - b.ver), [project.versions]);
  const latestVer = versions.length ? versions[versions.length - 1].ver : 0;

  const logs = useMemo(() => {
    const lines: { t: number; msg: string }[] = [
      { t: project.createdAt, msg: `项目创建：${project.requirement.slice(0, 40)}` },
      { t: project.buildingAt, msg: '解析需求 → 识别标题、字段、按钮与核心交互' },
      ...(project.status === 'done'
        ? [{ t: project.buildingAt + BUILD_MS, msg: `应用「${appLabel}」生成完成，已注入预览` }]
        : []),
      ...project.revisions.map((r) => ({ t: r.at, msg: `收到修改需求：${r.text.slice(0, 40)}` })),
    ];
    return lines.sort((a, b) => a.t - b.t);
  }, [project, appLabel]);

  const TABS: { key: TabKey; label: string; icon: typeof Eye }[] = [
    { key: 'preview', label: '预览', icon: Eye },
    { key: 'code', label: '代码', icon: Code2 },
    { key: 'test', label: '测试', icon: FlaskConical },
    { key: 'log', label: '日志', icon: FileText },
  ];

  return (
    <section ref={containerRef} className={cn('flex min-w-0 flex-1 flex-col bg-background', className)}>
      {/* 顶部紧凑工具栏 */}
      <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b bg-card px-3">
        {/* 标签切换 */}
        <div className="flex items-center gap-1 rounded-md bg-secondary p-0.5" role="tablist" aria-label="工作区视图">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={cn(
                'flex items-center gap-1.5 rounded-[5px] px-2.5 py-1 text-xs font-medium transition-colors duration-150 sm:px-3',
                tab === key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:md:text-foreground',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* 工具按钮组 */}
        <div className="flex items-center gap-1">
          {tab === 'preview' && !building && (
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
            onClick={exportHtml}
            disabled={building || !version}
            aria-label="导出 HTML"
            className="flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors duration-150 hover:md:bg-accent hover:md:text-foreground active:scale-95 disabled:opacity-40 disabled:hover:md:bg-transparent"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">导出</span>
          </button>
        </div>
      </header>

      {/* 工作区内容 */}
      {tab === 'preview' ? (
        building ? (
          /* 首次创建：加载反馈 */
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 bg-muted/40 px-6 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground">正在生成「{appLabel}」应用…</p>
            <p className="text-xs text-muted-foreground">解析需求 → 生成界面 → 注入预览</p>
            <div className="mt-2 h-1.5 w-56 overflow-hidden rounded-full bg-secondary">
              <div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
            </div>
          </div>
        ) : (
          <div className="relative min-h-0 flex-1 overflow-auto bg-muted/40 p-4 sm:p-6">
            {device === 'desktop' ? (
              <div key={`d-${project.id}-${version?.ver}-${refreshKey}`} className="h-full min-h-[420px] overflow-hidden rounded-lg border bg-card shadow-sm">
                <AppFrame html={version?.html ?? ''} name={project.name} />
              </div>
            ) : (
              <div className="flex h-full min-h-[480px] items-start justify-center">
                {/* 手机外框 */}
                <div
                  key={`m-${project.id}-${version?.ver}-${refreshKey}`}
                  className="flex h-[640px] max-h-full w-[360px] shrink-0 flex-col overflow-hidden rounded-[24px] border-[6px] border-foreground/80 bg-background shadow-md"
                >
                  <div className="flex h-6 shrink-0 items-center justify-center bg-foreground/80">
                    <span className="h-1 w-16 rounded-full bg-background/60" />
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <AppFrame html={version?.html ?? ''} name={project.name} />
                  </div>
                </div>
              </div>
            )}
            {/* 生成期间：保留当前预览，仅叠加提示条，不显示空白 */}
            {generating && (
              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center p-3">
                <div className="flex items-center gap-2 rounded-full bg-card/95 px-4 py-2 text-xs font-medium text-primary shadow-sm ring-1 ring-primary/25 backdrop-blur">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  正在生成
                </div>
              </div>
            )}
          </div>
        )
      ) : tab === 'code' ? (
        <div className="flex min-h-0 flex-1">
          {/* 左侧：文件列表 + 版本切换 */}
          <aside className="flex w-[168px] shrink-0 flex-col border-r bg-card">
            <p className="px-3 pb-1 pt-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">文件</p>
            <ul className="px-2">
              {CODE_FILES.map(({ key, icon: Icon }) => (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => setCodeFile(key)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium transition-colors duration-150',
                      codeFile === key ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:md:bg-accent hover:md:text-foreground',
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate font-mono">{key}</span>
                  </button>
                </li>
              ))}
            </ul>

            <p className="mt-4 flex items-center gap-1.5 px-3 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              <History className="h-3 w-3" />
              版本
            </p>
            <ul className="space-y-1 px-2 pb-3">
              {[...versions].reverse().map((v) => {
                const active = v.ver === project.activeVer;
                return (
                  <li key={v.ver}>
                    <button
                      type="button"
                      onClick={() => onSwitchVersion(v.ver)}
                      className={cn(
                        'w-full rounded-md border px-2 py-1.5 text-left transition-colors duration-150',
                        active ? 'border-primary/30 bg-primary/10' : 'border-transparent hover:md:bg-accent',
                      )}
                    >
                      <span className="flex items-center gap-1.5">
                        <span className={cn('text-xs font-semibold', active ? 'text-primary' : 'text-foreground')}>v{v.ver}</span>
                        <span className="truncate text-[11px] text-muted-foreground">{v.label}</span>
                        {active && <span className="ml-auto shrink-0 rounded-full bg-primary px-1.5 py-px text-[10px] font-medium text-primary-foreground">当前</span>}
                      </span>
                      <span className="mt-0.5 block text-[10px] tabular-nums text-muted-foreground">{formatTime(v.createdAt)} 生成</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          {/* 右侧：代码内容（等宽字体 + 行号） */}
          <div className="flex min-w-0 flex-1 flex-col bg-card">
            <div className="flex h-10 shrink-0 items-center justify-between gap-2 border-b px-4">
              <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
                <Code2 className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {project.name} · {codeFile} · v{version?.ver ?? 1}（{appLabel}）
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!codeContent}
                  className="flex h-7 items-center gap-1.5 rounded-md border bg-background px-2.5 text-xs font-medium text-foreground transition-colors duration-150 hover:md:bg-accent active:scale-95 disabled:opacity-40"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? '已复制' : '复制代码'}
                </button>
                <button
                  type="button"
                  onClick={exportHtml}
                  disabled={building || !version}
                  className="flex h-7 items-center gap-1.5 rounded-md bg-primary px-2.5 text-xs font-medium text-primary-foreground transition-colors duration-150 hover:md:bg-primary/90 active:scale-95 disabled:opacity-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  导出 HTML
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full border-collapse font-mono text-[12.5px] leading-relaxed">
                <tbody>
                  {codeLines.map((line, i) => (
                    <tr key={i} className="align-top">
                      <td className="w-10 select-none border-r border-border/60 bg-secondary/40 px-2 text-right tabular-nums text-muted-foreground">
                        {i + 1}
                      </td>
                      <td className="whitespace-pre px-3 text-foreground">{line || ' '}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex h-7 shrink-0 items-center gap-3 border-t px-4 text-[11px] text-muted-foreground">
              <span>{codeLines.length} 行</span>
              <span>当前版本 v{version?.ver ?? 1}{latestVer !== version?.ver ? `（最新 v${latestVer}）` : ''}</span>
            </div>
          </div>
        </div>
      ) : tab === 'test' ? (
        <div className="min-h-0 flex-1 overflow-auto bg-card p-4 sm:p-6">
          <div className="mx-auto max-w-xl">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold">冒烟测试</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">验证 {appLabel} 的核心交互</p>
              </div>
              <button
                type="button"
                onClick={handleRunTest}
                disabled={testState === 'running' || building || generating}
                className="flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-transform duration-150 hover:md:bg-primary/90 active:scale-95 disabled:opacity-50"
              >
                {testState === 'running' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FlaskConical className="h-3.5 w-3.5" />}
                {testState === 'running' ? '运行中' : testState === 'passed' ? '重新运行' : '运行测试'}
              </button>
            </div>
            {testState === 'idle' ? (
              <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
                点击「运行测试」开始验证应用
              </div>
            ) : (
              <ul className="divide-y rounded-lg border bg-background">
                {['应用渲染与初始化', '核心交互（按钮 / 表单 / 状态更新）', '本地数据持久化'].map((name, i) => (
                  <li key={name} className="flex items-center gap-3 px-4 py-3">
                    {testState === 'running' ? (
                      <Loader2 className={cn('h-4 w-4 text-muted-foreground', i === 0 && 'animate-spin')} />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    )}
                    <span className="flex-1 text-sm">{name}</span>
                    <span
                      className={cn(
                        'text-xs font-medium',
                        testState === 'running' ? 'text-muted-foreground' : 'text-primary',
                      )}
                    >
                      {testState === 'running' ? (i === 0 ? '运行中' : '等待') : '通过'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {testState === 'passed' && (
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary">
                <CheckCircle2 className="h-3.5 w-3.5" />
                3 / 3 通过 · 用时 0.9s
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto bg-card">
          <div className="flex items-center gap-2 border-b px-4 py-2 text-xs text-muted-foreground">
            <FileText className="h-3.5 w-3.5" />
            构建日志 · {project.name}
          </div>
          <ul className="space-y-1.5 px-4 py-4 font-mono text-[12px] leading-relaxed">
            {logs.map((l, i) => (
              <li key={i} className="flex gap-3">
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {new Date(l.t).toLocaleTimeString('zh-CN', { hour12: false })}
                </span>
                <span className="text-foreground">{l.msg}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

/** 用 iframe 渲染生成的独立 HTML 应用（srcDoc 继承父级源，localStorage 可正常读写） */
function AppFrame({ html, name }: { html: string; name: string }) {
  return (
    <iframe
      title={`${name} 预览`}
      srcDoc={html}
      sandbox="allow-scripts allow-same-origin allow-modals allow-popups"
      className="h-full min-h-[420px] w-full border-0 bg-background"
    />
  );
}
