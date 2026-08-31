import { instance } from './AxiosInstance';

export async function aiCall<T = any>(path: string, body: object, timeoutMs?: number): Promise<T> {
  const res = await instance.post(path, body, timeoutMs ? {timeout: timeoutMs} : undefined);
  return res.data?.data ?? res.data;
}
