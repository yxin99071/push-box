<template>
  <div class="push-box-mini">
    <div v-if="!isStarted" class="start-overlay">
      <p style="color: #2496ed;">[SYSTEM PAUSED]</p>
      <p>ACCUMULATED LATENCY: {{ totalTime }}s</p>
      <p class="blink">Press [SPACE] to Resume Deployment</p>
    </div>

    <div class="game-grid" :class="{ 'is-paused': !isStarted }">
      <div v-for="(row, r) in map" :key="r" class="game-row">
        <div 
          v-for="(cell, c) in row" 
          :key="c" 
          :class="['game-cell', getCellClass(r, c)]"
        >
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

type CellType = 'X' | 'P' | 'B' | 'T' | '_';
const props = defineProps<{ levelData: CellType[][] }>();

const map = ref<CellType[][]>([]);
const isWin = ref(false);
const isStarted = ref(false); 
const history = ref<string[]>([]);

// --- 计时器变量 ---
const totalTime = ref(0); 
let timer: number | null = null;

// 1. 初始化/重置关卡逻辑
const initLevel = () => {
  stopTimer(); // 停止计时
  map.value = JSON.parse(JSON.stringify(props.levelData)); // 还原地图
  isWin.value = false;
  isStarted.value = false; // 进入暂停/待机状态
  history.value = [];
  // 注意：这里不重置 totalTime.value，实现累计
};

// 2. 计时器控制
const startTimer = () => {
  if (timer) return;
  timer = window.setInterval(() => {
    totalTime.value++;
  }, 1000);
};

const stopTimer = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};

// 3. 监听关卡数据变化（只有换关卡才彻底重置时间）
watch(() => props.levelData, () => {
  totalTime.value = 0; 
  initLevel();
}, { deep: true, immediate: true });

// 4. 移动逻辑
const move = (dr: number, dc: number) => {
  if (isWin.value || !isStarted.value) return;
  
  let pr = -1, pc = -1;
  map.value.forEach((row, r) => row.forEach((cell, c) => { if(cell === 'P') { pr = r; pc = c; } }));
  if (pr === -1) return;

  const nr = pr + dr, nc = pc + dc;
  if (!map.value[nr] || !map.value[nr][nc] || map.value[nr][nc] === 'X') return;

  const saveHistory = () => history.value.push(JSON.stringify(map.value));

  if (map.value[nr][nc] === 'B') {
    const nnr = nr + dr, nnc = nc + dc;
    if (map.value[nnr] && (map.value[nnr][nnc] === '_' || map.value[nnr][nnc] === 'T')) {
      saveHistory();
      map.value[nnr][nnc] = 'B';
      updateMove(pr, pc, nr, nc);
    }
  } else {
    saveHistory();
    updateMove(pr, pc, nr, nc);
  }
  checkWin();
};

const updateMove = (or:number, oc:number, nr:number, nc:number) => {
  map.value[or][oc] = props.levelData[or][oc] === 'T' ? 'T' : '_';
  map.value[nr][nc] = 'P';
};

const checkWin = () => {
  const win = props.levelData.every((row, r) => row.every((cell, c) => cell === 'T' ? map.value[r][c] === 'B' : true));
  if (win) {
    isWin.value = true;
    stopTimer();
    setTimeout(() => {
      alert(`🎉 Mission Accomplished!\nTotal Time Spent: ${totalTime.value} seconds.`);
    }, 100);
  }
};

// 5. 键盘监听
const handleKey = (e: KeyboardEvent) => {
  const key = e.key.toLowerCase();
  
  // 空格键逻辑
  if (e.code === 'Space') {
    e.preventDefault();
    if (!isStarted.value) {
      isStarted.value = true;
      startTimer(); // 继续计时
    } else {
      initLevel(); // 暂停计时并还原地图
    }
    return;
  }

  if (!isStarted.value) return; 

  if (key === 'w' || key === 'arrowup') move(-1, 0);
  if (key === 's' || key === 'arrowdown') move(1, 0);
  if (key === 'a' || key === 'arrowleft') move(0, -1);
  if (key === 'd' || key === 'arrowright') move(0, 1);
  
  if (key === 'r') {
    if (history.value.length > 0) {
      map.value = JSON.parse(history.value.pop()!);
      isWin.value = false;
    }
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKey);
});

onUnmounted(() => {
  stopTimer();
  window.removeEventListener('keydown', handleKey);
});

const getEmoji = (c: CellType) => ({ 'P': '●', 'B': '▣', 'X': '■', 'T': '○', '_': '' }[c]);
const getCellClass = (r:number, c:number) => ({ 'is-wall': map.value[r][c] === 'X', 'is-t': props.levelData[r][c] === 'T' });
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

.start-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 35px;
  background: rgba(0,0,0,0.9);
  z-index: 10;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #ccc;
  font-family: monospace;
  font-size: 11px;
}

.blink { animation: blinker 1.5s linear infinite; margin-top: 10px; color: #666; }
@keyframes blinker { 50% { opacity: 0; } }

.game-grid { border: 1px solid #333; display: inline-block; transition: opacity 0.3s; }
.is-paused { opacity: 0.2; }

.game-row { display: flex; }
.game-cell { 
  width: 22px; height: 22px; 
  display: flex; align-items: center; justify-content: center; 
  font-size: 12px; color: #888; border: 0.1px solid #222;
}

.is-wall { background: #333; }
.is-t { background: #2a2020; }

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

.success-tag { color: #52c41a; font-weight: bold; }
</style>