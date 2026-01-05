<template>
  <div class="editor-container">
    <header class="editor-header">
      <h2>Docker Compose - Service Topology Designer</h2>
      <p>Select a template or manually configure nodes, volumes (boxes), and entrypoints (players).</p>
    </header>

    <div class="editor-main">
      <aside class="presets-sidebar">
        <h4>Available Templates</h4>
        <div class="preset-list">
          <button 
            v-for="(p, index) in presets" 
            :key="index" 
            @click="loadPreset(p.data)"
            class="preset-item"
          >
            {{ p.name }}
          </button>
        </div>
      </aside>

      <section class="editor-canvas">
        <div class="palette-bar">
          <button v-for="(label, type) in types" :key="type" 
                  @click="selectedType = type"
                  :class="['tool-btn', { active: selectedType === type }]">
            {{ label }}
          </button>
        </div>

        <div class="grid-wrapper">
          <div v-for="(row, r) in grid" :key="r" class="row">
            <div v-for="(cell, c) in row" :key="c" 
                 class="cell" @click="setCell(r, c)">
              {{ getEmoji(cell) }}
            </div>
          </div>
        </div>
      </section>
    </div>

    <footer class="editor-footer">
      <button class="deploy-btn" @click="confirmLevel">Apply Configuration</button>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

type CellType = 'X' | 'P' | 'B' | 'T' | '_';
const emit = defineEmits(['save']);

// ---------------------------------------------------------
// 【此处配置预设关卡】
// 你可以在这里定义多个数组。注意：网格大小建议保持一致（如 8x8）
// ---------------------------------------------------------
const presets = [
  {
    name: "Default Stack (Basic)",
    data: [
      ['X', 'X', 'X', 'X', 'X', 'X', 'X', 'X'],
      ['X', '_', '_', '_', '_', '_', '_', 'X'],
      ['X', '_', 'P', 'B', 'T', '_', '_', 'X'],
      ['X', '_', '_', '_', '_', '_', '_', 'X'],
      ['X', '_', '_', '_', '_', '_', '_', 'X'],
      ['X', '_', '_', '_', '_', '_', '_', 'X'],
      ['X', '_', '_', '_', '_', '_', '_', 'X'],
      ['X', 'X', 'X', 'X', 'X', 'X', 'X', 'X'],
    ]
  },
    {
    name: "Classic Warehouse (JP-01)",
    data: [
        ['_', '_', '_', 'X', 'X', 'X', 'X', '_'],
        ['X', 'X', 'X', 'X', '_', '_', 'X', '_'],
        ['X', '_', '_', 'B', '_', '_', 'X', 'X'],
        ['X', '_', 'X', 'B', 'X', '_', '_', 'X'],
        ['X', '_', '_', 'B', '_', '_', '_', 'X'],
        ['X', 'T', 'X', 'X', 'X', '_', '_', 'X'],
        ['X', 'T', 'X', 'X', 'X', 'X', '_', 'X'],
        ['X', 'T', '_', 'P', '_', '_', '_', 'X'],
        ['X', 'X', 'X', 'X', 'X', 'X', 'X', 'X']
    ]
    }
];

const types: Record<CellType, string> = {
  'X': 'Wall', 'P': 'Player', 'B': 'Box', 'T': 'Target', '_': 'Clear'
};

const selectedType = ref<CellType>('X');
const grid = ref<CellType[][]>(JSON.parse(JSON.stringify(presets[0].data)));

const loadPreset = (data: CellType[][]) => {
  grid.value = JSON.parse(JSON.stringify(data));
};

const setCell = (r: number, c: number) => {
  grid.value[r][c] = selectedType.value;
};

const getEmoji = (c: CellType) => ({ 'P': '●', 'B': '▣', 'X': '■', 'T': '○', '_': '' }[c]);

const confirmLevel = () => {
  emit('save', JSON.parse(JSON.stringify(grid.value)));
};
</script>

<style scoped>
.editor-container { padding: 20px; background: #fff; height: 100%; display: flex; flex-direction: column; }
.editor-header { margin-bottom: 20px; text-align: left; }
.editor-header h2 { color: #2496ed; margin: 0; }
.editor-header p { color: #666; font-size: 0.9rem; }

.editor-main { display: flex; gap: 30px; flex: 1; }

/* 预设列表样式 */
.presets-sidebar { width: 220px; background: #f4f6f8; padding: 15px; border-radius: 8px; text-align: left; }
.presets-sidebar h4 { margin-top: 0; color: #333; font-size: 0.9rem; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
.preset-list { display: flex; flex-direction: column; gap: 8px; }
.preset-item { padding: 8px 12px; background: white; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; text-align: left; font-size: 0.85rem; }
.preset-item:hover { border-color: #2496ed; background: #eef7ff; }

/* 编辑区样式 */
.editor-canvas { flex: 1; display: flex; flex-direction: column; align-items: center; }
.palette-bar { margin-bottom: 15px; display: flex; gap: 10px; }
.tool-btn { padding: 6px 12px; cursor: pointer; border: 1px solid #ccc; background: #fff; font-size: 0.8rem; }
.tool-btn.active { background: #2496ed; color: white; border-color: #2496ed; }

.grid-wrapper { background: #1a1a1a; padding: 10px; border-radius: 4px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
.row { display: flex; }
.cell { width: 32px; height: 32px; border: 1px solid #222; display: flex; align-items: center; justify-content: center; cursor: cell; color: #888; font-size: 14px; }
.cell:hover { background: #333; }

.editor-footer { margin-top: 20px; padding: 15px; border-top: 1px solid #eee; }
.deploy-btn { padding: 10px 30px; background: #27c93f; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
</style>