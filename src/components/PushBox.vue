<template>
  <div class="push-box-mini">
    <div v-if="!isStarted" class="start-overlay">
      <p style="color: #2496ed;">[SYSTEM PAUSED]</p>
      <p>ACCUMULATED LATENCY: {{ totalTime }}s</p>
      <p class="blink">Press [SPACE] to Resume Deployment</p>
    </div>

    <div class="game-grid" :class="{ 'is-paused': !isStarted }">
      <div v-for="(row, r) in map" :key="r" class="game-row">
        <div v-for="(cell, c) in row" :key="c" :class="['game-cell', getCellClass(r, c)]">
          {{ getEmoji(cell) }}
        </div>
      </div>
    </div>

    <div class="mini-status">
      <span>TOTAL_LATENCY: {{ totalTime }}s</span>
      <span>STEP: {{ history.length }}</span>
      <span v-if="isWin" class="success-tag">[DEPLOY_SUCCESS]</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { DockerApi } from '../services/api';

type CellType = 'X' | 'P' | 'B' | 'T' | '_' | 'F' | 'M';

const props = defineProps<{
  levelData: CellType[][],
  levelId: number,
  currentUser: { dockerId: string, name: string }
}>();

const emit = defineEmits(['refreshRank']);

const map = ref<CellType[][]>([]);
const isWin = ref(false);
const isStarted = ref(false);
const history = ref<string[]>([]);
const totalTime = ref(0);
let timer: number | null = null;

// 1. 初始化
const initLevel = () => {
  stopTimer();
  map.value = JSON.parse(JSON.stringify(props.levelData));
  isWin.value = false;
  isStarted.value = false;
  history.value = [];
  // 【关键修改】：这里不再执行 totalTime.value = 0
  // 只有当 props.levelData 改变（换关卡）时，才在 watch 里重置时间
};

// 2. 计时器
const startTimer = () => {
  if (timer) return;
  timer = window.setInterval(() => { totalTime.value++; }, 1000);
};

const stopTimer = () => {
  if (timer) { clearInterval(timer); timer = null; }
};

watch(() => props.levelId, () => {
  // 当关卡 ID 变了，说明是新任务，重置累计时间
  totalTime.value = 0;
  initLevel();
}, { immediate: true });

// 3. 核心移动逻辑 (已集成 M 状态)
const move = (dr: number, dc: number) => {
  if (isWin.value || !isStarted.value) return;

  let pr = -1, pc = -1;
  map.value.forEach((row, r) => row.forEach((cell, c) => { 
    if (cell === 'P' || cell === 'M') { pr = r; pc = c; } 
  }));
  if (pr === -1) return;

  const nr = pr + dr, nc = pc + dc;
  const targetCell = map.value[nr]?.[nc];

  if (!targetCell || targetCell === 'X') return;

  const saveHistory = () => history.value.push(JSON.stringify(map.value));

  // A. 推箱子 (B 或 F)
  if (targetCell === 'B' || targetCell === 'F') {
    const nnr = nr + dr, nnc = nc + dc;
    const nextNextCell = map.value[nnr]?.[nnc];

    if (nextNextCell === '_' || nextNextCell === 'T') {
      saveHistory();
      // 箱子位移
      map.value[nnr][nnc] = (nextNextCell === 'T') ? 'F' : 'B';
      // 玩家进入：原处是 F 则新位置是 M
      map.value[nr][nc] = (targetCell === 'F') ? 'M' : 'P';
      // 玩家离开：原处是 M 则还原 T
      map.value[pr][pc] = (map.value[pr][pc] === 'M') ? 'T' : '_';
      
      handlePostMove();
    }
  } 
  // B. 走空地 ( _ 或 T)
  else if (targetCell === '_' || targetCell === 'T') {
    saveHistory();
    map.value[nr][nc] = (targetCell === 'T') ? 'M' : 'P';
    map.value[pr][pc] = (map.value[pr][pc] === 'M') ? 'T' : '_';
    
    handlePostMove();
  }
};

// 4. 移动后的处理：判定+提交
const handlePostMove = async () => {
  const win = !map.value.some(row => row.includes('T') || row.includes('M'));

  if (win && !isWin.value) {
    isWin.value = true;
    stopTimer();
    const finalSteps = history.value.length;
    const finalTime = totalTime.value; // 此时是累计后的总时间
    totalTime.value = 0;
    try {
      await DockerApi.pushMetrics({
        dockerId: props.currentUser.dockerId,
        levelId: props.levelId,
        latency: finalTime * 10,
        operations: finalSteps
      });

      emit('refreshRank');
      
      setTimeout(() => {
        alert(`🎉 DEPLOYMENT SUCCESS!\n\nTotal Accumulated Time: ${finalTime}s\nSteps: ${finalSteps}`);
        // 成功后，如果用户选择留在本页，可以考虑重置时间以便下一次挑战
        // totalTime.value = 0; 
      }, 300);
    } catch (e) {
      console.error("Telemetry Sync Error:", e);
    }
  }
};
// 5. 键盘交互
const handleKey = (e: KeyboardEvent) => {
  const key = e.key.toLowerCase();
  if (e.code === 'Space') {
    e.preventDefault();
    if (!isStarted.value) { isStarted.value = true; startTimer(); } 
    else { initLevel(); }
    return;
  }
  if (!isStarted.value) return;

  const directionMap: Record<string, [number, number]> = {
    'w': [-1, 0], 'arrowup': [-1, 0],
    's': [1, 0], 'arrowdown': [1, 0],
    'a': [0, -1], 'arrowleft': [0, -1],
    'd': [0, 1], 'arrowright': [0, 1]
  };

  if (directionMap[key]) {
    move(...directionMap[key]);
  } else if (key === 'r') {
    if (history.value.length > 0) {
      map.value = JSON.parse(history.value.pop()!);
      isWin.value = false;
    }
  }
};

onMounted(() => window.addEventListener('keydown', handleKey));
onUnmounted(() => { stopTimer(); window.removeEventListener('keydown', handleKey); });

const getEmoji = (c: CellType) => ({ 
  'P': '●', 'B': '▣', 'F': '✅', 'X': '■', 'T': '○', '_': '', 'M': '◎' 
}[c]);

const getCellClass = (r: number, c: number) => {
  const cell = map.value[r][c];
  return {
    'is-wall': cell === 'X',
    'is-t': props.levelData[r][c] === 'T' || cell === 'M', // 目标点底色保持
    'is-f': cell === 'F'
  };
};
</script>

<style scoped>
.push-box-mini {
  background: #1a1a1a;
  padding: 10px;
  border-radius: 4px;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.is-f {
  background: #1d3524 !important; /* 暗绿色背景 */
  color: #52c41a !important;      /* 亮绿色图标 */
  text-shadow: 0 0 5px #52c41a;
}
.start-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 35px;
  background: rgba(0, 0, 0, 0.9);
  z-index: 10;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #ccc;
  font-family: monospace;
  font-size: 11px;
}

.blink {
  animation: blinker 1.5s linear infinite;
  margin-top: 10px;
  color: #666;
}

@keyframes blinker {
  50% {
    opacity: 0;
  }
}

.game-grid {
  border: 1px solid #333;
  display: inline-block;
  transition: opacity 0.3s;
}

.is-paused {
  opacity: 0.2;
}

.game-row {
  display: flex;
}

.game-cell {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #888;
  border: 0.1px solid #222;
}

.is-wall {
  background: #333;
}

.is-t {
  background: #2a2020;
}

.mini-status {
  margin-top: 8px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 9px;
  color: #555;
  display: flex;
  gap: 12px;
  width: 100%;
  justify-content: center;
}

.success-tag {
  color: #52c41a;
  font-weight: bold;
}
</style>