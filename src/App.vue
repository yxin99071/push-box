<template>
  <div v-if="!isLoggedIn" class="docker-login-page">
    <div class="login-container">
      <div class="login-box">
        <div class="docker-logo-section">
          <span class="whale-icon">🐳</span>
          <span class="docker-brand">docker</span>
        </div>
        <h3>Sign In</h3>
        <p class="tagline">Enter your Docker ID to continue to Docker Hub.</p>
        
        <div class="input-group">
          <label>Docker ID</label>
          <input v-model="loginForm.user" type="text" placeholder="Username" />
        </div>
        
        <div class="input-group">
          <label>Password</label>
          <input 
            v-model="loginForm.pwd" 
            type="password" 
            placeholder="Password" 
            @keyup.enter="doLogin"
          />
        </div>

        <button class="btn-signin" @click="doLogin">Sign In</button>
        
        <div class="login-help">
          <a href="#">Forgot Docker ID?</a> · <a href="#">Forgot password?</a>
        </div>
      </div>
      <div class="login-notice">
        New to Docker? <a href="#">Create Account</a>
      </div>
    </div>
  </div>

  <div v-else class="app-container">
    <header class="top-nav">
      <div class="nav-left">
        <span class="logo" @click="view = 'docs'">🐳 Docker Documentation</span>
        <nav>
          <a href="#" @click.prevent="view = 'docs'">Guides</a>
          <a href="#" @click.prevent="view = 'docs'">Reference</a>
          <a href="#" @click.prevent="view = 'editor'">Docker Compose</a>
        </nav>
      </div>
      <div class="nav-right">
        <span class="user-badge">admin@jp-east</span>
        <button class="btn-logout" @click="isLoggedIn = false">Sign Out</button>
      </div>
    </header>

    <div class="main-layout">
      <aside class="sidebar">
        <div class="search-box">Search docs...</div>
        <div class="menu-item" :class="{ active: view === 'docs' }" @click="view = 'docs'">Core Concepts</div>
        <div class="menu-item">Installation</div>
        <div class="menu-item">Docker Engine</div>
        <div class="menu-item" :class="{ active: view === 'editor' }" @click="view = 'editor'">Docker Compose</div>
      </aside>

      <main class="main-content">
        <DockerDocs v-if="view === 'docs'" />
        <LevelEditor v-else-if="view === 'editor'" @save="handleLevelUpdate" />
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
import { ref, reactive } from 'vue';
import DockerDocs from './components/DockerDocs.vue';
import PushBox from './components/PushBox.vue';
import LevelEditor from './components/LevelEditor.vue';

// --- 登录相关 ---
const isLoggedIn = ref(false);
const loginForm = reactive({ user: '', pwd: '' });

const doLogin = () => {
  if (loginForm.user === 'admin' && loginForm.pwd === 'admin') {
    isLoggedIn.value = true;
  } else {
    alert("Error: Authentication failed. Please check your Docker ID and password.");
  }
};

// --- 原有逻辑 ---
const view = ref<'docs' | 'editor'>('docs');
const isMin = ref(true);
const currentLevel = ref<string[][]>([
  ['X', 'X', 'X', 'X', 'X', 'X'],
  ['X', 'P', '_', '_', 'X', 'X'],
  ['X', '_', 'B', 'T', '_', 'X'],
  ['X', 'X', 'X', 'X', 'X', 'X']
]);

const handleLevelUpdate = (newLevelData: string[][]) => {
  currentLevel.value = newLevelData;
  view.value = 'docs';
  isMin.value = false;
};
</script>

<style>
/* 1. 登录页面样式 (Docker 风格) */
.docker-login-page {
  height: 100vh;
  background-color: #f7f8f9;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: -apple-system, system-ui, "Segoe UI", Roboto, sans-serif;
}
.login-container { width: 360px; }
.login-box {
  background: white;
  padding: 40px;
  border: 1px solid #dbe2e8;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  text-align: left;
}
.docker-logo-section { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; }
.whale-icon { font-size: 32px; }
.docker-brand { font-size: 26px; font-weight: 800; color: #2496ed; letter-spacing: -1px; }

.login-box h3 { font-size: 20px; margin: 0 0 10px 0; color: #23272b; }
.tagline { font-size: 13px; color: #637381; margin-bottom: 25px; }

.input-group { margin-bottom: 18px; }
.input-group label { display: block; font-size: 12px; font-weight: 700; color: #444; margin-bottom: 6px; }
.input-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #cbd5e0;
  border-radius: 3px;
  box-sizing: border-box;
  font-size: 14px;
}
.btn-signin {
  width: 100%;
  padding: 12px;
  background: #2496ed;
  color: white;
  border: none;
  border-radius: 3px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 5px;
}
.btn-signin:hover { background: #1d83d1; }

.login-help { margin-top: 20px; text-align: center; font-size: 12px; color: #637381; }
.login-help a { color: #2496ed; text-decoration: none; }
.login-notice { margin-top: 25px; text-align: center; font-size: 14px; color: #444; }
.login-notice a { color: #2496ed; text-decoration: none; font-weight: 600; }

/* 2. 主页面额外样式 */
.user-badge { font-size: 0.85rem; color: #d0e8ff; margin-right: 15px; }
.btn-logout { 
  background: rgba(255,255,255,0.1); 
  border: 1px solid rgba(255,255,255,0.3); 
  color: white; 
  padding: 4px 8px; 
  border-radius: 3px; 
  cursor: pointer; 
  font-size: 0.8rem;
}
.btn-logout:hover { background: rgba(255,255,255,0.2); }

/* 原有基础样式保持不变... */
body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; }
.app-container { display: flex; flex-direction: column; height: 100vh; font-family: sans-serif; }
.top-nav { height: 50px; background: #2496ed; color: white; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; z-index: 10; }
.nav-left { display: flex; gap: 30px; align-items: center; }
.logo { font-weight: bold; font-size: 1.1rem; cursor: pointer; }
.nav-left a { color: rgba(255,255,255,0.8); text-decoration: none; font-size: 0.9rem; margin-right: 10px; }
.main-layout { display: flex; flex: 1; overflow: hidden; }
.sidebar { width: 260px; background: #f8f9fa; border-right: 1px solid #eee; padding: 20px; overflow-y: auto; }
.search-box { background: #fff; border: 1px solid #ddd; padding: 8px; border-radius: 4px; color: #999; margin-bottom: 20px; font-size: 0.8rem; }
.menu-item { padding: 10px; color: #444; font-size: 0.9rem; cursor: pointer; transition: background 0.2s; }
.menu-item.active { color: #2496ed; font-weight: bold; background: #eef7ff; border-radius: 4px; }
.main-content { flex: 1; overflow-y: auto; background: white; }
.game-widget { position: fixed; bottom: 0; right: 20px; width: 280px; background: white; border: 1px solid #ddd; border-bottom: none; border-radius: 8px 8px 0 0; box-shadow: 0 -2px 10px rgba(0,0,0,0.1); transition: transform 0.3s; z-index: 100; }
.game-widget.minimized { transform: translateY(calc(100% - 40px)); }
.widget-header { background: #333; color: #eee; padding: 10px; cursor: pointer; display: flex; justify-content: space-between; font-family: monospace; font-size: 11px; }
.widget-header button { background: none; border: 1px solid #666; color: #ccc; font-size: 10px; cursor: pointer; }
.widget-body { padding: 10px; background: #fafafa; display: flex; justify-content: center; }
</style>