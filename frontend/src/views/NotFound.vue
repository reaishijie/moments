<script setup lang="ts" name="NotFound">
</script>

<template>
  <div class="not-found">
    <h1>404</h1>
    <p>哎呀，页面内容漂走啦～💨</p>
    <RouterLink to="/" class="home-link">回到首页</RouterLink>
  </div>
</template>


<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100%;
  text-align: center;
  background: linear-gradient(to bottom, #e0f7fa, #ffffff);
  color: #0077b6;
  font-family: 'Segoe UI', sans-serif;
}

.not-found h1 {
  font-size: 8rem;
  margin: 0;
  text-shadow: 2px 2px 10px rgba(0,0,0,0.2);
}

.not-found p {
  font-size: 1.5rem;
  margin: 1rem 0;
}

.home-link {
  margin-top: 1rem;
  padding: 0.5rem 1.2rem;
  background-color: #00b4d8;
  color: white;
  border-radius: 8px;
  text-decoration: none;
  transition: background-color 0.3s;
}

.home-link:hover {
  background-color: #0077b6;
}
</style>
