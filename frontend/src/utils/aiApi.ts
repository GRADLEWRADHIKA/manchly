import { instance } from './AxiosInstance';

export async function aiCall<T = any>(path: string, body: object): Promise<T> {
  const res = await instance.post(path, body);
  return res.data?.data ?? res.data;
}
