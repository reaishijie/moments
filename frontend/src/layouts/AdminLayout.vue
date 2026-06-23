<script setup lang="ts" name="AdminLayout">
import { RouterView } from 'vue-router'
import Sidebar from '@/components/admin/Sidebar.vue'
import HeaderBar from '@/components/admin/HeaderBar.vue'
</script>

<template>
  <div class="admin-shell">
    <div class="admin-workspace">
      <HeaderBar />
      <main class="admin-main" aria-label="后台内容区">
        <RouterView />
      </main>
    </div>
    <Sidebar />
  </div>
</template>

<style scoped>
.admin-shell {
  --admin-ink: var(--color-text-primary);
  --admin-muted: #787878;
  --admin-soft: var(--color-ad);
  --admin-line: var(--color-border);
  --admin-card: color-mix(in srgb, var(--color-bg-app) 88%, transparent);
  --admin-blue: #6cadf1;
  --admin-cyan: #9ac3ef;
  --admin-green: #53b16a;
  --admin-amber: #f8a778;
  --admin-red: #ec6f7d;
  --admin-shadow: var(--color-shadow);

  display: block;
  min-height: 100vh;
  width: 100%;
  max-width: 100vw;
  overflow: hidden;
  color: var(--admin-ink);
  background:
    radial-gradient(circle at 12% 8%, rgba(248, 167, 120, 0.18), transparent 24%),
    radial-gradient(circle at 88% 18%, rgba(108, 173, 241, 0.2), transparent 30%),
    linear-gradient(135deg, color-mix(in srgb, var(--color-bg-outside) 96%, #ffffff), var(--color-bg-outside));
}


.admin-workspace {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  height: 100vh;
  overflow: hidden;
}

.admin-main {
  flex: 1;
  min-width: 0;
  overflow: auto;
  padding: 22px 22px 102px;
}

@media (max-width: 768px) {
  .admin-shell {
    min-width: 100vw;
  }

  .admin-workspace {
    height: 100vh;
  }

  .admin-main {
    padding: 16px 16px 96px;
  }
}
</style>
