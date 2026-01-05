<template>
  <div class="push-box-mini">
    <div class="game-grid">
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
      <span>CPU: 12%</span>
      <span>STEP: {{ history.length }}</span> <span v-if="isWin" style="color: #52c41a; font-weight: bold;">[COMPLETED]</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';

type CellType = 'X' | 'P' | 'B' | 'T' | '_';
const props = defineProps<{ levelData: CellType[][] }>();

const map = ref<CellType[][]>([]);
const isWin = ref(false);
const history = ref<string[]>([]); // 存储地图快照的栈

// 初始化游戏
const initGame = () => {
  map.value = JSON.parse(JSON.stringify(props.levelData));
  isWin.value = false;
  history.value = []; // 清空历史
};

// 监听关卡数据变化
watch(() => props.levelData, initGame, { deep: true });

// 记录历史（在每次有效移动前调用）
const saveHistory = () => {
  history.value.push(JSON.stringify(map.value));
};

// 撤回功能 (Undo)
const undo = () => {
  if (history.value.length > 0) {
    const lastState = history.value.pop();
    if (lastState) {
      map.value = JSON.parse(lastState);
      isWin.value = false; // 撤回后肯定不是胜利状态
    }
  }
};

const move = (dr: number, dc: number) => {
  if (isWin.value) return;
  
  let pr = -1, pc = -1;
  map.value.forEach((row, r) => row.forEach((cell, c) => { if(cell === 'P') { pr = r; pc = c; } }));
  
  const nr = pr + dr, nc = pc + dc;
  if (!map.value[nr] || !map.value[nr][nc] || map.value[nr][nc] === 'X') return;

  if (map.value[nr][nc] === 'B') {
    const nnr = nr + dr, nnc = nc + dc;
    if (map.value[nnr][nnc] === '_' || map.value[nnr][nnc] === 'T') {
      saveHistory(); // 移动箱子前保存状态
      map.value[nnr][nnc] = 'B';
      updateMove(pr, pc, nr, nc);
    }
  } else {
    saveHistory(); // 仅移动人前保存状态
    updateMove(pr, pc, nr, nc);
  }
  checkWin();
};

const updateMove = (or:number, oc:number, nr:number, nc:number) => {
  map.value[or][oc] = props.levelData[or][oc] === 'T' ? 'T' : '_';
  map.value[nr][nc] = 'P';
};

const checkWin = () => {
  isWin.value = props.levelData.every((row, r) => row.every((cell, c) => cell === 'T' ? map.value[r][c] === 'B' : true));
};

// 键盘监听
const handleKey = (e: KeyboardEvent) => {
  const key = e.key.toLowerCase();
  
  // 移动
  if (key === 'w' || e.key === 'ArrowUp') move(-1, 0);
  if (key === 's' || e.key === 'ArrowDown') move(1, 0);
  if (key === 'a' || e.key === 'ArrowLeft') move(0, -1);
  if (key === 'd' || e.key === 'ArrowRight') move(0, 1);
  
  // 撤回 (R)
  if (key === 'r') {
    undo();
  }
  
  // 重置 (Space)
  if (e.code === 'Space') {
    e.preventDefault(); // 防止空格导致页面滚动
    initGame();
  }
};

onMounted(() => {
  initGame();
  window.addEventListener('keydown', handleKey);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKey);
});

const getEmoji = (c: CellType) => ({ 'P': '●', 'B': '▣', 'X': '■', 'T': '○', '_': '' }[c]);
const getCellClass = (r:number, c:number) => ({ 'is-wall': map.value[r][c] === 'X', 'is-t': props.levelData[r][c] === 'T' });
</script>

<style scoped>
/* 样式保持之前的紧凑版 */
.push-box-mini { background: #1a1a1a; padding: 10px; border-radius: 4px; box-shadow: inset 0 0 10px #000; }
.game-grid { border: 1px solid #333; display: inline-block; }
.game-row { display: flex; }
.game-cell { 
  width: 22px; height: 22px; /* 进一步缩小一点 */
  display: flex; align-items: center; justify-content: center; 
  font-size: 12px; color: #888; border: 0.1px solid #222;
}
.is-wall { background: #333; }
.is-t { background: #2a2020; }
.mini-status { margin-top: 8px; font-family: 'Courier New', Courier, monospace; font-size: 9px; color: #555; display: flex; gap: 12px; }
</style>