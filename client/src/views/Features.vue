<!-- client/src/views/Features.vue -->
<template>
  <PublicNav />

  <section class="features container">
    <header class="head">
      <h1>Features</h1>
      <p class="muted">Everything you need to run set-dec logistics — in clean, simple black & white.</p>
    </header>

    <!-- Core capabilities -->
    <div class="grid">
      <article class="card">
        <h3>Digital Runsheets</h3>
        <ul>
          <li>Pickup/Delivery (PD) and Return/Dropoff (RD) flows</li>
          <li>Printable runsheets for on-paper workflows</li>
          <li>Mustache templating for dynamic instructions</li>
          <li>Assign to drivers in a click</li>
        </ul>
      </article>

      <article class="card">
        <h3>Driver PWA</h3>
        <ul>
          <li>Mobile-first, offline-friendly experience</li>
          <li>Simple checklists, timestamps, and notes</li>
          <li>Signature capture at pickup and return</li>
        </ul>
      </article>

      <article class="card">
        <h3>Places & Routing</h3>
        <ul>
          <li>Google Autocomplete for fast address entry</li>
          <li>Save suppliers, sets, storage, and offices</li>
          <li>Clear, readable maps in monochrome style</li>
        </ul>
      </article>

      <article class="card">
        <h3>Items & Photos</h3>
        <ul>
          <li>Track items without on-camera labels</li>
          <li>Upload photos of items, places, and receipts</li>
          <li>Update location/state as you go</li>
        </ul>
      </article>

      <article class="card">
        <h3>Multi-Tenant & Roles</h3>
        <ul>
          <li>Separate portals per production</li>
          <li>Admin, coordinator, and driver roles</li>
          <li>Granular access to runsheets and data</li>
        </ul>
      </article>

      <article class="card">
        <h3>Payments & Billing</h3>
        <ul>
          <li>Stripe checkout — no card data stored here</li>
          <li>Plans for studios and indie productions</li>
          <li>Cancel anytime</li>
        </ul>
      </article>

      <article class="card">
        <h3>Security & Privacy</h3>
        <ul>
          <li>Encrypted passwords and secure sessions</li>
          <li>Developers access only for debugging</li>
          <li>Private portals — members-only access</li>
        </ul>
      </article>

      <article class="card">
        <h3>Tech Stack & AI</h3>
        <ul>
          <li>Node.js, Express, MongoDB, Vue 3</li>
          <li>AI assists; code reviewed line-by-line</li>
          <li>Built to be robust and easy to use</li>
        </ul>
      </article>

      <article class="card">
        <h3>Feedback & Roadmap</h3>
        <ul>
          <li>Suggest features and report bugs</li>
          <li>Alpha 1.0 — break it, we’ll harden it</li>
          <li>
            <a href="https://www.set-dec.com/featuresandbugs" target="_blank" rel="noreferrer">
              Submit feedback
            </a>
          </li>
        </ul>
      </article>
    </div>

    <div class="cta">
      <RouterLink class="btn" to="/pricing">See Pricing</RouterLink>
      <RouterLink class="btn btn--ghost" :to="{ name: 'tenant-login', params: { slug: 'demo' } }">Try Demo</RouterLink>
    </div>
  </section>
</template>

<script setup>
import { RouterLink } from 'vue-router';
import PublicNav from '../components/PublicNav.vue';
</script>

<style scoped>
/* -------- Monochrome palette -------- */
:root {
  --ink: #111;
  --ink-2: #2a2a2a;
  --ink-3: #5a5a5a;
  --line: #e6e6e6;
  --panel: #ffffff;
  --bg: #f6f6f6;
}

/* -------- Page container (matches site) -------- */
.container {
  max-width: 1180px;
  margin: 0 auto;
  padding: 28px 20px;
  position: relative;
  isolation: isolate;
}
.container::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  background: url("../../public/HomeBackground.jpg") center/cover no-repeat;
  filter: grayscale(100%) contrast(1.05) brightness(0.98);
  opacity: 0.18;
}
.container::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  background-image: radial-gradient(#0002 1px, transparent 1px);
  background-size: 3px 3px;
  mix-blend-mode: multiply;
  opacity: 0.12;
}

/* -------- Header -------- */
.head { text-align: center; margin-bottom: 18px; }
.head h1 { margin: 0 0 6px; }
.muted { color: var(--ink-3); }

/* -------- Grid + Cards -------- */
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.card {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 8px 24px rgba(0,0,0,.08);
  transition: transform .15s ease, box-shadow .15s ease;
}
.card:hover { transform: translateY(-2px); box-shadow: 0 16px 36px rgba(0,0,0,.14); }
.card h3 { margin: 0 0 10px; font-size: 18px; }
.card ul { margin: 0; padding-left: 18px; color: var(--ink-2); display: grid; gap: 6px; }

/* -------- CTA -------- */
.cta {
  margin-top: 20px;
  display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;
}
.btn {
  display: inline-flex; align-items: center; justify-content: center;
  gap: 10px; padding: 12px 18px; border-radius: 12px;
  background: #111; color: #fff; border: 1px solid #000;
  font-weight: 700; text-decoration: none; letter-spacing: .2px;
  box-shadow: 0 2px 0 #000;
  transition: transform .12s ease, box-shadow .12s ease, opacity .12s ease;
}
.btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(0,0,0,.18); }
.btn--ghost { background: transparent; color: #111; border: 1px solid #222; }
.btn--ghost:hover { background: #111; color: #fff; }

/* -------- Responsive -------- */
@media (max-width: 1024px) { .grid { grid-template-columns: 1fr; } }
</style>
