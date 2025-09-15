<template>
<footer class="footer">
<div class="footer__inner container">
<div class="footer__brand">
<img src="/logo.png" alt="Set‑Dec Runner" />
<div>
<div class="title">Set‑Dec Runner</div>
<div class="muted">© {{ year }} Magic Cat Software</div>
</div>
</div>
<div class="footer__links">
<a href="https://github.com/adompatchett/setdecrunner" target="_blank" rel="noreferrer">GitHub</a>
<RouterLink to="/privacy">Privacy</RouterLink>
<RouterLink to="/terms">Terms</RouterLink>
<RouterLink to="/contact">Contact</RouterLink>
</div>
</div>
</footer>
</template>


<script setup>
import { RouterLink } from 'vue-router';
const year = new Date().getFullYear();
</script>


<style scoped>
.footer { border-top: 1px solid #ececec; background: #fff; }
.footer__inner { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 18px 0; }
.footer__brand { display: flex; gap: 12px; align-items: center; }
.footer__brand img { width: 36px; height: 36px; border-radius: 8px; object-fit: contain; background:#fff; box-shadow: 0 1px 3px rgba(0,0,0,.06); }
.title { font-weight: 700; }
.muted { color: #6b7280; font-size: 12px; }
.footer__links { display: flex; gap: 14px; align-items: center; }
.footer__links a { color: #374151; text-decoration: none; }
.footer__links a:hover { text-decoration: underline; }
</style>