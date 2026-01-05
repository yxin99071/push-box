<template>
  <div class="app-container">
    <header class="top-nav">
      <div class="nav-left">
        <span class="logo" @click="view = 'docs'">🐳 Docker Documentation</span>
        <nav>
          <a href="#" @click.prevent="view = 'docs'">Guides</a>
          <a href="#" @click.prevent="view = 'docs'">Reference</a>
          <a href="#" @click.prevent="view = 'editor'">Docker Compose</a>
        </nav>
      </div>
      <div class="nav-right">JP Server: 200 OK</div>
    </header>

    <div class="main-layout">
      <aside class="sidebar">
        <div class="search-box">Search docs...</div>
        <div 
          class="menu-item" 
          :class="{ active: view === 'docs' }" 
          @click="view = 'docs'"
        >
          Core Concepts
        </div>
        <div class="menu-item">Installation</div>
        <div class="menu-item">Docker Engine</div>
        <div 
          class="menu-item" 
          :class="{ active: view === 'editor' }" 
          @click="view = 'editor'"
        >
          Docker Compose
        </div>
      </aside>

      <main class="main-content">
        <DockerDocs v-if="view === 'docs'" />
        
        <LevelEditor 
          v-else-if="view === 'editor'" 
          @save="handleLevelUpdate" 
        />
      </main>
    </div>

    <div :class="['game-widget', { minimized: isMin }]">
      <div class="widget-header" @click="isMin = !isMin">
        <span>⚡ Diagnostic-Tools-v3.0.4</span>
        <button>{{ isMin ? 'Expand' : 'Hide' }}</button>
      </div>
      <div class="widget-body" v-show="!isMin">
        <PushBox :levelData="currentLevel" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import DockerDocs from './components/DockerDocs.vue';
import PushBox from './components/PushBox.vue';
import LevelEditor from './components/LevelEditor.vue';

// 视图切换状态：'docs' 为首页，'editor' 为设计器
const view = ref<'docs' | 'editor'>('docs');
const isMin = ref(true);

// 默认关卡参数
const currentLevel = ref<string[][]>([
  ['X', 'X', 'X', 'X', 'X', 'X'],
  ['X', 'P', '_', '_', 'X', 'X'],
  ['X', '_', 'B', 'T', '_', 'X'],
  ['X', 'X', 'X', 'X', 'X', 'X']
]);

/**
 * 处理设计器传回的数据
 * @param newLevelData 从 LevelEditor 发出的新地图数组
 */
const handleLevelUpdate = (newLevelData: string[][]) => {
  // 1. 更新当前游戏关卡
  currentLevel.value = newLevelData;
  // 2. 返回首页伪装文档
  view.value = 'docs';
  // 3. 自动展开游戏（方便测试新设计的关卡）
  isMin.value = false;
};
</script>

<style>
/* 基础重置 */
body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; }

.app-container { display: flex; flex-direction: column; height: 100vh; font-family: sans-serif; }

/* 顶部导航 */
.top-nav { height: 50px; background: #2496ed; color: white; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; z-index: 10; }
.nav-left { display: flex; gap: 30px; align-items: center; }
.logo { font-weight: bold; font-size: 1.1rem; cursor: pointer; }
.nav-left a { color: rgba(255,255,255,0.8); text-decoration: none; font-size: 0.9rem; margin-right: 10px; }
.nav-left a:hover { color: white; }

/* 主布局 */
.main-layout { display: flex; flex: 1; overflow: hidden; }

/* 侧边栏 */
.sidebar { width: 260px; background: #f8f9fa; border-right: 1px solid #eee; padding: 20px; overflow-y: auto; }
.search-box { background: #fff; border: 1px solid #ddd; padding: 8px; border-radius: 4px; color: #999; margin-bottom: 20px; font-size: 0.8rem; }
.menu-item { padding: 10px; color: #444; font-size: 0.9rem; cursor: pointer; transition: background 0.2s; }
.menu-item:hover { background: #f1f1f1; }
.menu-item.active { color: #2496ed; font-weight: bold; background: #eef7ff; border-radius: 4px; }

/* 内容区 */
.main-content { flex: 1; overflow-y: auto; background: white; }

/* 游戏悬浮窗 */
.game-widget { 
  position: fixed; 
  bottom: 0; 
  right: 20px; 
  width: 280px; /* 进一步缩小宽度 */
  background: white; 
  border: 1px solid #ddd; 
  border-bottom: none; 
  border-radius: 8px 8px 0 0; 
  box-shadow: 0 -2px 10px rgba(0,0,0,0.1); 
  transition: transform 0.3s; 
  z-index: 100;
}
.game-widget.minimized { transform: translateY(calc(100% - 40px)); }

.widget-header { 
  background: #333; 
  color: #eee; 
  padding: 10px; 
  cursor: pointer; 
  display: flex; 
  justify-content: space-between; 
  font-family: monospace; 
  font-size: 11px; 
}
.widget-header button { background: none; border: 1px solid #666; color: #ccc; font-size: 10px; cursor: pointer; }

.widget-body { 
  padding: 10px; 
  background: #fafafa; 
  display: flex;
  justify-content: center;
}
</style>