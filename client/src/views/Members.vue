<template>
  <div class="no-print">
        <NavBar :me="me" @logout="logout" />
      </div>
  <div class="container">
    <h2>Members</h2>
    <p v-if="error" class="error">{{ error }}</p>
    <div class="toolbar">
      <input v-model="q" placeholder="Search members…" class="input" />
      <button class="btn" @click="load">Search</button>
    </div>
    <div v-if="loading" class="muted">Loading…</div>

    <div v-else class="grid">
      <div v-for="u in users" :key="u._id" class="card member">
        <img :src="photoUrl(u.photo)" class="avatar" alt="" />
        <div class="info">
          <div class="name">{{ u.name || u.email }}</div>
          <div class="muted small">{{ u.email }}</div>
          <div class="muted small">{{ u.role }}</div>
        </div>
      </div>
      <div v-if="!users.length" class="muted">No members found.</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import api from '../api.js';
import NavBar from '../components/NavBar.vue';

const route = useRoute();
const slug = computed(() => String(route.params.slug || ''));

const q = ref('');
const users = ref([]);
const loading = ref(false);
const error = ref('');

const API_BASE   = (import.meta.env.VITE_API_BASE || 'http://localhost:4000/api').replace(/\/+$/, '');
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '') || window.location.origin;

function photoUrl(p) {
  if (!p) return '';
  let s = String(p);
  if (/^(?:https?:)?\/\//i.test(s) || s.startsWith('data:')) return s.startsWith('//') ? `https:${s}` : s;
  s = s.replace(/\\/g, '/');
  const idx = s.indexOf('/uploads/');
  if (idx !== -1) s = s.slice(idx);
  if (!s.startsWith('/')) s = `/${s}`;
  if (!s.startsWith('/uploads/')) s = s.replace(/^\/+/, '/uploads/');
  return `${API_ORIGIN}${s}`;
}

function qs(obj = {}) {
  const s = new URLSearchParams(obj).toString();
  return s ? `?${s}` : '';
}

async function load() {
  loading.value = true; error.value = '';
  try {
    const res = await api.get('/tenant/users' + qs(q.value ? { q: q.value } : {}));
    users.value = Array.isArray(res) ? res : (res.items || []);
  } catch (e) {
    error.value = e?.body?.error || e?.message || 'Failed to load members';
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.container { max-width: 960px; margin: 0 auto; padding: 24px 16px; }
.toolbar { display:flex; gap:8px; margin-bottom:12px; }
.input { border:1px solid #d6d6d6; border-radius:8px; padding:8px 10px; flex:1; }
.btn { border:1px solid #d6d6d6; background:#f7f7f7; border-radius:8px; padding:8px 12px; cursor:pointer; }
.grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap:12px; }
.card { background:#fff; border:1px solid #ececec; border-radius:12px; padding:12px; display:flex; gap:12px; align-items:center; }
.member .avatar { width:48px; height:48px; border-radius:8px; object-fit:cover; background:#f3f4f6; }
.name { font-weight:600; }
.small { font-size:12px; }
.muted { color:#6b7280; }
.error { color:#b42318; background:#fff1f0; border:1px solid #ffd7d5; padding:10px 12px; border-radius:8px; }
</style>