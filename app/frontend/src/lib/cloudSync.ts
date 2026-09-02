import { client } from './api';

/** 云端 atom_projects 表行结构（revisions / versions 为 JSON 字符串） */
export interface CloudRow {
  id: number;
  project_key?: string | null;
  name?: string | null;
  requirement?: string | null;
  app_type?: string | null;
  status?: string | null;
  building_at?: number | null;
  revisions?: string | null;
  versions?: string | null;
  active_ver?: number | null;
  client_created_at?: number | null;
  client_updated_at?: number | null;
}

/** 写入云端所需的载荷 */
export interface CloudPayload {
  project_key: string;
  name: string;
  requirement: string;
  app_type: string;
  status: string;
  building_at: number;
  revisions: string;
  versions: string;
  active_ver: number;
  client_created_at: number;
  client_updated_at: number;
}

/** 查询当前登录用户（未登录时返回 null） */
export async function cloudMe(): Promise<unknown> {
  const res = await client.auth.me();
  return res?.data ?? null;
}

/** 拉取当前用户的全部云端项目 */
export async function cloudList(): Promise<CloudRow[]> {
  const res = await client.entities.atom_projects.queryAll({
    query: {},
    sort: '-client_updated_at',
    limit: 100,
  });
  return (res?.data?.items ?? []) as CloudRow[];
}

/** 新建云端项目，返回包含 id 的行 */
export async function cloudCreate(payload: CloudPayload): Promise<{ id?: number } | null> {
  const res = await client.entities.atom_projects.create({ data: { ...payload } });
  return (res?.data ?? null) as { id?: number } | null;
}

/** 更新云端项目 */
export async function cloudUpdate(id: number, payload: CloudPayload): Promise<void> {
  await client.entities.atom_projects.update({ id, data: { ...payload } });
}

/** 删除云端项目 */
export async function cloudDelete(id: number): Promise<void> {
  await client.entities.atom_projects.delete({ id });
}

/** 触发平台登录（登录后回跳 /auth/callback） */
export function cloudLogin(): void {
  client.auth.toLogin();
}
