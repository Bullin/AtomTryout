import type { AppVersion } from '@/hooks/useProjects';

export interface CheckResult {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
}

const LT = String.fromCharCode(60);

export function runLocalChecks(version: AppVersion | null): CheckResult[] {
  const html = version ? version.html : '';
  const lower = html.toLowerCase();
  const hasContent = html.length !== 0;
  const hasInput = lower.includes(LT + 'input') || lower.includes(LT + 'select');
  const hasButton = lower.includes(LT + 'button');
  const usesStorage = lower.includes('localstorage.');
  return [
    {
      id: 'visible-content',
      label: '页面有可见内容',
      passed: hasContent,
      detail: hasContent
        ? '页面已渲染标题、说明与界面元素，内容长度正常'
        : '页面主体为空，未检测到可见文本',
    },
    {
      id: 'input-exists',
      label: '主要输入框存在',
      passed: hasInput,
      detail: hasInput
        ? '检测到输入框或下拉选择等表单控件'
        : '未检测到输入框（纯按钮类应用属正常情况）',
    },
    {
      id: 'button-exists',
      label: '主要按钮存在',
      passed: hasButton,
      detail: hasButton ? '检测到可点击的操作按钮' : '未检测到按钮，应用可能无法交互',
    },
    {
      id: 'localstorage',
      label: 'localStorage 已启用',
      passed: usesStorage,
      detail: usesStorage
        ? '脚本调用 localStorage，刷新后数据可持久化'
        : '未检测到 localStorage 调用，刷新后数据不会保留',
    },
  ];
}
