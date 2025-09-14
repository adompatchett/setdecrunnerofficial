<!-- client/src/components/NavBar.vue -->
<template>
  <nav class="nav">
    <!-- Logo + Production -->
    <div class="nav__logo">
      <img src="/logo.png" alt="Set Dec Runner Logo" />
      <div class="nav__logo-texts">
        <span class="nav__logo-text">Set Dec Runner</span>
        <div class="nav__production">
          {{ productionLabel }}
        </div>
      </div>
    </div>

    <!-- Navigation Links (slug-aware) -->
    <div class="nav__links">
      <RouterLink class="nav__link" :to="{ name: 'tenant-home', params: { slug } }" draggable="false">Dashboard</RouterLink>
      <RouterLink class="nav__link" :to="{ name: 'runsheets', params: { slug } }" draggable="false">Run Sheets</RouterLink>
      <RouterLink class="nav__link" :to="{ name: 'sets', params: { slug } }" draggable="false">Sets</RouterLink>
      <RouterLink class="nav__link" :to="{ name: 'people', params: { slug } }" draggable="false">People</RouterLink>
      <RouterLink class="nav__link" :to="{ name: 'items', params: { slug } }" draggable="false">Items</RouterLink>
      <RouterLink class="nav__link" :to="{ name: 'places', params: { slug } }" draggable="false">Places</RouterLink>
      <RouterLink class="nav__link" :to="{ name: 'suppliers', params: { slug } }" draggable="false">Suppliers</RouterLink>

      <!-- 🔑 Admin for this production (role in members OR owner) -->
      <RouterLink
        v-if="showAdminUsersLink"
        class="nav__link nav__link--admin"
        :to="{ name: 'admin-users', params: { slug } }"
        draggable="false"
      >
        Create Users
      </RouterLink>

      <RouterLink
        :to="{ name: 'tenant-members', params: { slug: String($route.params.slug || '') } }"
        class="btn"
      >
        Members
      </RouterLink>
    </div>

    <!-- User Info + Logout -->
    <div class="nav__right">
      <img
        v-if="photoSrc"
        :src="photoSrc"
        class="nav__avatar"
        :alt="displayName || 'Profile'"
        draggable="false"
      />
      <span class="nav__name" :title="displayName">{{ displayName }}</span>
      <button class="btn" @click="logout">Logout</button>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { performLogout } from '../auth.js';
import { apiGet } from '../api.js';

const router = useRouter();
const route  = useRoute();

const props = defineProps({
  me: { type: Object, default: null },          // expects {_id, email, ...}
  company: { type: Object, default: null },     // { companyProduction: string }
});
defineEmits(['logout']);

const slug = computed(() => String(route.params.slug || ''));

/* ---------------- read user (prop or localStorage) ---------------- */
const user = computed(() => {
  if (props.me) return props.me;
  try { return JSON.parse(localStorage.getItem('user') || 'null'); }
  catch { return null; }
});

const currentUserId = computed(() => toId(user.value?._id || user.value));

/* ---------------- production fetch (to inspect members/roles) ---------------- */
const prod = ref(null);               // { _id, ownerUserId|owner, members:[...] }
const HEX24_RE = /^[a-f0-9]{24}$/i;
function toId(v) {
  if (!v) return '';
  if (typeof v === 'string' || typeof v === 'number') {
    const s = String(v).trim();
    return HEX24_RE.test(s) ? s : '';
  }
  if (Array.isArray(v)) return toId(v[0]);
  const nested = v._id ?? v.user ?? v.id ?? v.userId ?? v.uid ?? v.$oid ?? (typeof v.valueOf === 'function' ? v.valueOf() : null);
  if (nested && nested !== v) return toId(nested);
  try { const s = v.toString?.(); return HEX24_RE.test(s) ? s : ''; } catch { return ''; }
}
const idsEqual = (a, b) => {
  const A = toId(a), B = toId(b);
  return !!A && !!B && A === B;
};

async function fetchProduction() {
  try {
    // This endpoint should return the production by slug with members + owner fields
    const p = await apiGet(`/tenant/productions/${slug.value}`);
    prod.value = p || null;

    // cache the id for other parts of the app that rely on x-production-id
    const pid = toId(p?._id);
    if (pid) localStorage.setItem('currentProductionId', pid);
  } catch {
    prod.value = null;
  }
}

/* ---------------- admin check (members[].role === 'admin' or owner) ---------------- */
const isOwner = computed(() => {
  const ownerId = toId(prod.value?.ownerUserId ?? prod.value?.owner);
  return !!ownerId && idsEqual(ownerId, currentUserId.value);
});

const isAdminByMembers = computed(() => {
  const members = prod.value?.members;
  if (!Array.isArray(members)) return false;

  // Supports both shapes: [ObjectId] and [{ user:ObjectId, role: 'admin' | ... }]
  for (const m of members) {
    // Object form
    if (m && typeof m === 'object') {
      const mid = toId(m.user ?? m._id ?? m.id ?? m);
      if (!mid) continue;
      if (idsEqual(mid, currentUserId.value)) {
        const role = String(m.role || '').toLowerCase();
        if (role === 'admin') return true;
      }
    } else {
      // Primitive id form: can't read role in this shape
      // (skip; admin decision will rely on owner or global role if you choose)
      continue;
    }
  }
  return false;
});

/* Final flag: show link if owner or admin (by members role) */
const showAdminUsersLink = computed(() => isOwner.value || isAdminByMembers.value);

/* ---------------- presentation helpers ---------------- */
const productionLabel = computed(() =>
  props.company?.companyProduction || `/${slug.value}`
);

const displayName = computed(() =>
  user.value?.name ||
  user.value?.fullName ||
  user.value?.displayName ||
  user.value?.email ||
  ''
);

// Profile photo normalization
const rawPhoto = computed(() => {
  const u = user.value || {};
  return (
    u.photo || u.avatar || u.photoUrl || u.photoURL || u.picture ||
    u.image?.url || u.image || u.providerData?.[0]?.photoURL ||
    u.photos?.[0]?.value || u.profile?._json?.picture ||
    u.profile?.picture || u.profile?.photos?.[0]?.value || ''
  );
});
const rawApiBase = (import.meta.env.VITE_API_BASE || 'http://localhost:4000/api').replace(/\/+$/, '');
const apiOrigin  = rawApiBase.replace(/\/api\/?$/, '') || window.location.origin;

function normalizePhoto(p) {
  if (!p) return '';
  if (/^(?:https?:)?\/\//i.test(p) || p.startsWith('data:')) {
    if (p.startsWith('//')) return `https:${p}`;
    if (location.protocol === 'https:' && p.startsWith('http:')) p = p.replace(/^http:/i, 'https:');
    try {
      const u = new URL(p, location.origin);
      if (/\bgoogleusercontent\.com$/i.test(u.hostname) && !/[?&](?:sz|s)=\d+/i.test(u.search)) {
        u.search += (u.search ? '&' : '?') + 'sz=128';
        return u.toString();
      }
    } catch {}
    return p;
  }
  let s = String(p).replace(/\\/g, '/');
  const idx = s.indexOf('/uploads/');
  if (idx !== -1) s = s.slice(idx);
  if (!s.startsWith('/')) s = `/${s}`;
  if (!s.startsWith('/uploads/')) s = s.replace(/^\/+/, '/uploads/');
  return `${apiOrigin}${s}`;
}
const photoSrc = computed(() => normalizePhoto(rawPhoto.value));

/* ---------------- actions ---------------- */
function logout() {
  const s = String(route.params.slug || '');
  performLogout(router, s);
}

/* ---------------- lifecycle ---------------- */
onMounted(fetchProduction);
</script>

<style scoped>
.nav { display:flex; align-items:center; gap:16px; padding:10px 14px; border-bottom:1px solid #eee; background:#fff; }
.nav__logo { display:flex; align-items:center; gap:10px; }
.nav__logo img { height:32px; width:auto; }
.nav__logo-texts { display:flex; flex-direction:column; line-height:1.1; }
.nav__logo-text { font-weight:700; }
.nav__production { font-size:.9rem; color:#666; }
.nav__links { display:flex; gap:10px; flex-wrap:wrap; margin-left:12px; }
.nav__link { color:#333; text-decoration:none; padding:6px 8px; border-radius:8px; }
.nav__link--admin { background:#f3f5ff; border:1px solid #dfe5ff; }
.nav__right { margin-left:auto; display:flex; align-items:center; gap:8px; }
.nav__avatar { width:28px; height:28px; border-radius:50%; object-fit:cover; }
.nav__name { max-width:180px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:#444; }
.btn.btn--ghost { background:transparent; border:1px solid #ddd; border-radius:8px; padding:6px 10px; cursor:pointer; }
</style>

