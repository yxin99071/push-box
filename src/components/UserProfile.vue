<template>
  <div class="profile-editor">
    <h2>User Profile Settings</h2>
    <p class="subtitle">Update your node identity and access credentials.</p>
    
    <div class="form-container">
      <div class="form-group">
        <label>Display Name</label>
        <input v-model="profileForm.name" type="text" placeholder="自己的id" />
      </div>

      <div class="form-group">
        <label>New Password</label>
        <input v-model="profileForm.password" type="password" placeholder="Min 1 characters" />
      </div>

      <div class="form-group">
        <label>Confirm New Password</label>
        <input 
          v-model="profileForm.confirmPassword" 
          type="password" 
          placeholder="Repeat your new password" 
          :class="{ 'input-error': !isPasswordMatch && profileForm.confirmPassword }"
        />
        <span v-if="!isPasswordMatch && profileForm.confirmPassword" class="error-text">
          ⚠️ Passwords do not match.
        </span>
      </div>

      <button @click="submitUpdate" :disabled="loading || !isPasswordMatch" class="btn-update">
        {{ loading ? 'Synchronizing...' : 'Update Profile' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { DockerApi } from '../services/api';

const props = defineProps<{ user: { dockerId: string, name: string } }>();
const emit = defineEmits(['updated']);
const loading = ref(false);

const profileForm = reactive({
  name: props.user.name === 'noName' ? '' : props.user.name,
  password: '',
  confirmPassword: '' // 新增：确认密码字段
});

// 计算属性：校验两次密码是否一致
const isPasswordMatch = computed(() => {
  return profileForm.password === profileForm.confirmPassword;
});

const submitUpdate = async () => {
  // 1. 基础校验
  if (!profileForm.name) return alert("Display Name is required.");
  
  // 2. 密码一致性校验
  if (profileForm.password && !isPasswordMatch.value) {
    return alert("Verification failed: Passwords do not match.");
  }

  // 3. 密码长度校验（可选，符合运维安全规范）
  if (profileForm.password && profileForm.password.length < 1) {
    return alert("密码不能为空");
  }

  loading.value = true;
  try {
    const success = await DockerApi.updateProfile({
      dockerId: props.user.dockerId,
      newName: profileForm.name,
      newPassword: profileForm.password // 后端只接收这个最终确定的密码
    });
    
    if (success) {
      alert("Success: Node identity updated.");
      emit('updated', profileForm.name);
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* 增加错误状态的样式 */
.input-error {
  border-color: #ff4d4f !important;
  background-color: #fff2f0;
}
.error-text {
  color: #ff4d4f;
  font-size: 11px;
  margin-top: 4px;
  display: block;
}
.profile-editor { padding: 40px; max-width: 500px; }
.form-group { margin-bottom: 20px; }
label { display: block; font-size: 12px; font-weight: bold; margin-bottom: 8px; color: #555; }
input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
.readonly-input { background: #f5f5f5; color: #888; cursor: not-allowed; }
.btn-update { background: #2496ed; color: white; border: none; padding: 12px 20px; border-radius: 4px; cursor: pointer; font-weight: bold; }
</style>