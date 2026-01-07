<template>
  <div class="stack-browser">
    <div class="side-list">
      <div class="list-header">
        <h4>Image Registry</h4>
        <button class="refresh-btn" @click="loadList">🔄 Sync</button>
      </div>
      <div v-for="item in remoteLevels" :key="item.id"
        :class="['stack-item', { active: selectedStack?.id === item.id }]" @click="selectStack(item)">
        <div class="item-icon">📦</div>
        <div class="item-info">
          <p class="name">{{ item.name }}</p>
          <p class="tag">latest (ID: {{ item.id }})</p>
        </div>
      </div>
    </div>

    <div class="preview-panel">
      <div v-if="selectedStack" class="preview-content">

        <div class="preview-header">
          <div class="title-group">
            <span class="status-indicator">● Online</span>
            <h3>Stack: {{ selectedStack.name }}</h3>
          </div>
          <button class="btn-deploy" @click="deploy">
            ▶ Execute Deployment
          </button>
        </div>

        <div class="main-layout">
          <div class="topology-section">
            <div class="read-only-grid">
              <div v-for="(row, r) in parsedMap" :key="r" class="row">
                <div v-for="(cell, c) in row" :key="c" :class="['cell', cell]">
                  {{
                    cell === 'X' ? '🧱' :
                      cell === 'B' ? '📦' :
                        cell === 'T' ? '🎯' :
                          cell === 'F' ? '✅' : // 新增：已完成状态的图标
                            cell === 'P' ? '👷' : 
                             cell === 'M' ? '👷‍♂️' : ''
                  }}
                </div>
              </div>
            </div>
          </div>

          <div class="stack-meta">
            <h5>Configuration Metadata</h5>
            <pre><code>version: "3.9"
services:
  app:
    image: {{ selectedStack.name }}:latest
    deploy:
      replicas: {{ boxCount }}</code></pre>
          </div>
        </div>

        <div class="analysis-section">
          <h5 class="section-label">📊 排行榜</h5>
          <div class="ranking-container">
            <div class="ranking-column">
              <div class="rank-title">⚡ 用时排行榜</div>
              <div v-if="timeRankings?.length" class="ranking-table">
                <div class="ranking-header-row">
                  <span>名称</span>
                  <span>时长</span>
                </div>
                <div v-for="r in timeRankings" :key="r.name" class="ranking-row">
                  <span class="eng-name">{{ r.name }}</span>
                  <span class="val time">{{ (r.latency / 10).toFixed(1) }}s</span>
                </div>
              </div>
              <div v-else class="no-data">暂时无人通关，加油称为第一个通关者！</div>
            </div>

            <div class="ranking-column">
              <div class="rank-title">🎯 步长排行榜</div>
              <div v-if="stepRankings?.length" class="ranking-table">
                <div class="ranking-header-row">
                  <span>名称</span>
                  <span>步长</span>
                </div>
                <div v-for="r in stepRankings" :key="r.name" class="ranking-row">
                  <span class="eng-name">{{ r.name }}</span>
                  <span class="val step">{{ r.operations }} ops</span>
                </div>
              </div>
              <div v-else class="no-data">暂时无人通关，加油称为第一个通关者！</div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        Select a stack from the registry to preview.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { DockerApi, type LevelRecord, type RankingRecord } from '../services/api';

// 必须定义这个 boxCount
const boxCount = computed(() => {
  const map = selectedStack.value?.configData;
  if (!map || !Array.isArray(map)) return 0;

  // 展平数组并统计 B 和 F 的总数
  return map.flat().filter(x => x === 'B' || x === 'F').length;
});
const timeRankings = ref<RankingRecord[]>([]);
const stepRankings = ref<RankingRecord[]>([]);

const selectStack = async (item: LevelRecord) => {
  selectedStack.value = item;
  // 同时请求两个排行榜
  const [timeData, stepData] = await Promise.all([
    DockerApi.getMetrics(item.id, 'latency'),
    DockerApi.getMetrics(item.id, 'steps')
  ]);

  // 统一转换（处理 C# 大写 Key）
  const mapData = (data: any[]) => data.map(r => ({
    name: r.name || r.Name,
    latency: r.latency || r.Latency,
    operations: r.operations || r.Operations,
    timestamp: r.timestamp || r.Timestamp
  }));

  timeRankings.value = mapData(timeData);
  stepRankings.value = mapData(stepData);
};

const remoteLevels = ref<LevelRecord[]>([]);
const selectedStack = ref<LevelRecord | null>(null);
const emit = defineEmits(['save']);

// --- 修改点：直接返回数据，不再解析 ---
const parsedMap = computed(() => {
  return selectedStack.value ? selectedStack.value.configData : [];
});

// LevelEditor.vue 的 script 部分

const loadList = async () => {
  const data = await DockerApi.getLevels();
  console.log("Raw Data:", data);

  // 关键：将后端的大写 Key 转换为前端通用的小写 Key
  remoteLevels.value = data.map((item: any) => ({
    id: item.Id,           // 从大写 Id 取值
    name: item.Name,       // 从大写 Name 取值
    configData: item.ConfigData // 从大写 ConfigData 取值
  }));
};

// --- 修改点：直接 emit 数组 ---
const deploy = () => {
  if (selectedStack.value) {
    // 传出整个对象，包含 id 和 configData
    alert("提示：按R可以撤回上一步，按Space重置关卡！");
    emit('save', selectedStack.value);
  }
};

defineExpose({
  refreshRankings: () => {
    if (selectedStack.value) {
      selectStack(selectedStack.value);
    }
  }
});

onMounted(loadList);
</script>

<style scoped>
.stack-browser {
  display: flex;
  height: 100%;
  background: #fff;
}

/* 左侧列表样式 */
.side-list {
  width: 280px;
  border-right: 1px solid #d1d5da;
  background: #f6f8fa;
  display: flex;
  flex-direction: column;
}

.list-header {
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e1e4e8;
}

.stack-item {
  padding: 12px 15px;
  display: flex;
  gap: 10px;
  cursor: pointer;
  border-bottom: 1px solid #e1e4e8;
}

.stack-item:hover {
  background: #ebf3ff;
}

.stack-item.active {
  background: #fff;
  border-left: 4px solid #2496ed;
}

.item-info .name {
  font-size: 13px;
  font-weight: 600;
  margin: 0;
  color: #0366d6;
}

.item-info .tag {
  font-size: 11px;
  color: #6a737d;
  margin: 0;
}

/* 右侧预览样式 */
.preview-panel {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
}

/* LevelEditor.vue 样式部分 */

.preview-header {
  display: flex;
  justify-content: space-between;
  /* 标题居左，按钮居右 */
  align-items: center;
  /* 垂直方向对齐 */
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f0f0f0;
  /* 加一条分割线，更有层次感 */
}

.preview-header h3 {
  margin: 0;
  font-size: 1.5rem;
  color: #24292e;
  /* 避免标题过长挤压按钮 */
  max-width: 60%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-deploy {
  background: #28a745;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  /* 确保按钮文字不换行 */
  transition: background 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-deploy:hover {
  background: #218838;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.btn-deploy:active {
  transform: translateY(1px);
}

/* 针对排行榜列宽的微调 */
.ranking-header-row, 
.ranking-row {
  display: grid;
  grid-template-columns: 1.5fr 1fr; 
  padding: 8px 12px;
  align-items: center;
}
.ranking-header-row {
  background: #f6f8fa;
  border-bottom: 2px solid #e1e4e8;
  font-weight: 600;
  color: #586069;
  font-size: 11px;
  text-transform: uppercase;
  border-radius: 6px 6px 0 0;
}
.node-id {
  font-weight: 600;
  color: #24292e;
}

.ops {
  color: #0366d6;
  /* 蓝色表示操作数 */
}

.latency {
  color: #28a745;
  /* 绿色表示耗时（越短越绿） */
  font-weight: bold;
}

.btn-deploy {
  background: #28a745;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
}

/* 只读网格 */
.read-only-grid {
  display: inline-block;
  padding: 10px;
  background: #f0f0f0;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 2px dashed #ccc;
}

.row {
  display: flex;
}

.cell {
  width: 30px;
  height: 30px;
  border: 1px solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  background: white;
}

.cell.X {
  background: #333;
}

.cell.T {
  background: #e6ffed;
}

/* 伪装代码块 */
.stack-meta {
  background: #24292e;
  color: #e1e4e8;
  padding: 15px;
  border-radius: 6px;
  font-family: monospace;
  font-size: 12px;
}

.stack-meta h5 {
  margin-top: 0;
  color: #f1f8ff;
}

.performance-ranking {
  margin-top: 20px;
  border-top: 1px solid #eee;
  padding-top: 20px;
}

.performance-ranking h5 {
  color: #24292e;
  margin-bottom: 12px;
  font-family: sans-serif;
}

.ranking-table {
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  background: #fff;
}

.ranking-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 2fr;
  padding: 8px 12px;
  background: #f6f8fa;
  font-weight: bold;
  border-bottom: 1px solid #e1e4e8;
}

.ranking-row {
  border-bottom: 1px solid #f1f1f1;
  font-size: 13px;
}

.ranking-row:last-child {
  border-bottom: none;
}

.node-id {
  color: #0366d6;
  font-family: monospace;
}

.latency {
  color: #28a745;
  font-weight: 600;
}

.ops {
  color: #6a737d;
}

.timestamp {
  color: #959da5;
  font-size: 11px;
}

.no-records {
  padding: 20px;
  text-align: center;
  background: #fff9db;
  border-radius: 6px;
  border: 1px dashed #f5d000;
  color: #856404;
  font-size: 13px;
}

.warn-icon {
  margin-right: 5px;
}
/* 在 style scoped 中添加 */
.cell.F {
  background: #e6ffed; /* 浅绿色背景 */
  border: 1px solid #b7eb8f;
}

/* 统一目标点 T 的样式，确保它和 F 有所区别但属于同一色系 */
.cell.T {
  background: #fffbe6; /* 浅黄色背景，代表待处理 */
  border: 1px solid #ffe58f;
}

.cell.B {
  background: #fff;
}

.cell.X {
  background: #f5f5f5;
  color: #d9d9d9; /* 墙壁在预览中可以淡化 */
}
.ranking-column {
  flex: 1;
  min-width: 0;
}
</style>