<template>
<header class="nav">
<div class="nav__inner container">
<div class="brand" @click="$router.push('/')" role="button" tabindex="0">
<img class="brand__logo" src="/logo.png" alt="Set‑Dec Runner logo" />

</div>


<nav class="links">
<RouterLink to="/features">Features</RouterLink>
<RouterLink to="/pricing">Pricing</RouterLink>
<RouterLink to="/FAQ">FAQ</RouterLink>

</nav>
</div>
</header>
</template>


<script setup>
import { RouterLink } from 'vue-router';
</script>


<style scoped>
.nav { padding:10px;position: sticky; top: 0; z-index: 40; backdrop-filter: blur(8px); background: rgba(255,255,255,.85); border-bottom: 1px solid #eaeaea; }
.nav__inner { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 12px 0; }
.brand { display: flex; align-items: center; gap: 10px; cursor: pointer; user-select: none; }
.brand__logo { height: 120x; width: 120px; border-radius: 8px; object-fit: contain; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.06); }
.brand__text { font-weight: 700; letter-spacing: .2px; }
.links { display: flex; gap: 14px; align-items: center; }
.links a { color: #222; text-decoration: none; font-weight: 500; }
.links a.router-link-active { color: #0a66c2; }


/* Buttons (keep in sync with your utility .btn classes) */
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 8px 14px; border-radius: 10px; border: 1px solid #0a66c2; background: #0a66c2; color: #fff; font-weight: 600; transition: .15s ease; }
.btn:hover { filter: brightness(1.05); transform: translateY(-1px); }
.btn--ghost { background: transparent; color: #0a66c2; }


@media (max-width: 768px) {
.links { gap: 10px; }
.btn { padding: 8px 12px; }
}
</style>