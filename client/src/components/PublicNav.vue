<!-- src/components/PublicNav.vue -->
<template>
  <header class="nav">
    <div class="nav__inner container">
      <div class="brand" @click="$router.push('/')">
        <img src="/logo.png" alt="Set-Dec Runner logo" class="logo-img" />
        
      </div>

      <nav class="links">
        <a href="#features">Features</a>
        <a href="#pricing">Pricing</a>
        <a href="#faq">FAQ</a>
        <router-link
          class="btn btn--primary"
          :to="{ name: 'tenant-login', params: { slug: 'demo' } }"
        >
          Login
        </router-link>
      </nav>
    </div>
  </header>
</template>

<script setup></script>

<style scoped>
.nav {
  position: sticky;
  top: 0;
  z-index: 40;
  backdrop-filter: blur(6px);
  background: rgba(255, 255, 255, 0.85);
  border-bottom: 1px solid #eef0f3;
}
.nav__inner {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 64px;
}
.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}
.logo-img {
  height: 100px;
  width: auto;
  display: block;
}
.logo-text {
  font-weight: 700;
  font-size: 18px;
  letter-spacing: 0.2px;
  color: #111827;
}
.links {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 16px;
}
.links a {
  color: #1f2937;
}
.links a:hover {
  text-decoration: none;
  color: #111827;
}
</style>
