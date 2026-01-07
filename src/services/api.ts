/**
 * Docker Metrics Provider - API Service Layer
 * 伪装成遥测数据采集服务接口
 */

const BASE_URL = 'http://172.25.36.105:7176/api/Metrics'; // 替换为你的VS运行地址

export interface LoginResponse {
  dockerId: string;
  name: string;
  status: string;
}
export interface LevelRecord {
  id: number;
  name: string;
  configData: string[][]; // 这里直接定义为二维数组
}
export interface RankingRecord {
  name: string;       // 修改为 name
  latency: number;
  operations: number;
  timestamp: string;
}


export const DockerApi = {
  /**
   * 身份验证接口
   * @param dockerId 账号 (1800-1830)
   * @param password 密码 (1800-1830)
   */
  async login(dockerId: string, password: string): Promise<LoginResponse | null> {
    try {
      const response = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dockerId, password })
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      return await response.json();
    } catch (error) {
      console.error("Metric Service Error:", error);
      return null;
    }
  },

  /**
   * 提交性能指标 (排行榜数据)
   */
  async pushMetrics(record: { dockerId: string, levelId: number, latency: number, operations: number }) {
    try {
      const response = await fetch(`${BASE_URL}/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
      return await response.json();
    } catch (error) {
      console.warn("Metric buffering active due to sync error.");
      return null;
    }
  },
  async getLevels(): Promise<LevelRecord[]> {
    try {
      const response = await fetch(`${BASE_URL}/levels`);
      if (!response.ok) return [];

      // 这里的 data 已经是解析好的对象数组了
      const data: LevelRecord[] = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to fetch deployment stacks:", error);
      return [];
    }
  },
  async getMetrics(levelId: number, sortBy: 'latency' | 'steps' = 'latency'): Promise<RankingRecord[]> {
    try {
      const response = await fetch(`${BASE_URL}/rankings/${levelId}?sortBy=${sortBy}`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      return [];
    }
  },
  async updateProfile(payload: any) {
    const res = await fetch(`http://172.25.36.105:7176/api/users/update-profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.ok;
  }

};