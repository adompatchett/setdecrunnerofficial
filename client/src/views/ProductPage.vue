<!-- src/views/Product.vue -->
<template>
  <div>
    <PublicNav />

    <!-- Hero -->
    <section class="hero container">
      <div class="hero__copy">
        <h1>Set-Dec Runner</h1>
        <p class="lead">
          Digital run-sheets for film set decoration — simple, fast, and
          made for crews. One-time purchase per production.
        </p>

        <ul class="bullets">
          <li>Upload photos & receipts</li>
          <li>Runsheets, places, items, and people — all in one</li>
          <li>Tenant-scoped access for your production</li>
        </ul>
      </div>

      <div id="pricing" class="card checkout">
        <h2>Buy a Production</h2>

        <form @submit.prevent="startCheckout" class="col gap">
          <label class="lbl">
            <span>Production title</span>
            <input v-model.trim="title" placeholder="Dune: Part Two" required />
          </label>

          <label class="lbl">
            <span>Desired slug (URL)</span>
            <div class="sluginput">
              <span class="muted prefix">{{ origin }}/</span>
              <input v-model.trim="slug" placeholder="dune-2" required />
            </div>
            <small class="muted">Your team will log in at <code>{{ origin }}/{{ slug || 'your-slug' }}/login</code></small>
          </label>

          <button class="btn btn--primary" :disabled="loading">
            {{ loading ? 'Redirecting…' : 'Buy now' }}
          </button>
        </form>

        <p v-if="err" class="error">{{ err }}</p>
        <p v-if="$route.query.canceled" class="muted">Checkout canceled.</p>

        <div class="tiny-note">
          One-time purchase. No subscriptions. You’ll be redirected to Stripe.
        </div>
      </div>
    </section>

    <!-- Features band -->
    <section id="features" class="band">
      <div class="container grid">
        <div class="feature">
          <h3>Fast file uploads</h3>
          <p>Drop in photos and receipts right from your phone or desktop.</p>
        </div>
        <div class="feature">
          <h3>Google Places</h3>
          <p>Search and save vendors/locations with coordinates and contact info.</p>
        </div>
        <div class="feature">
          <h3>Crew-friendly</h3>
          <p>Built for the flow of set dec — create, assign, claim, complete.</p>
        </div>
      </div>
    </section>

    <!-- FAQ anchor (optional target for navbar link) -->
    <section id="faq" class="container faq">
      <h3>FAQ</h3>
      <details>
        <summary>Is this per-production pricing?</summary>
        <p>Yes. Each purchase unlocks one production (tenant).</p>
      </details>
      <details>
        <summary>Do you store payment info?</summary>
        <p>No — Stripe handles checkout and payment details.</p>
      </details>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import PublicNav from '../components/PublicNav.vue';
import { apiPost } from '../api.js';

const title = ref('');
const slug  = ref('');
const loading = ref(false);
const err = ref('');

const origin = computed(() => window.location.origin.replace(/\/+$/, ''));

async function startCheckout() {
  try {
    loading.value = true;
    err.value = '';

    // quick client-side slug sanitation (server should also validate)
    const cleanSlug = (slug.value || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!cleanSlug) {
      err.value = 'Please enter a valid slug (letters, numbers, dashes).';
      loading.value = false;
      return;
    }

    const { url } = await apiPost('/checkout/session', {
      title: title.value,
      desiredSlug: cleanSlug
    });
    window.location.assign(url); // Stripe redirect
  } catch (e) {
    err.value = e?.message || 'Unable to start checkout';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
/* hero layout */
.hero {
  display: grid;
  gap: 24px;
  grid-template-columns: 1.2fr 1fr;
  align-items: start;
  padding-top: 28px;
}
.hero__copy h1 {
  font-size: 36px;
  line-height: 1.15;
  margin: 0 0 8px;
}
.lead {
  font-size: 16px;
  color: #374151;
  margin: 0 0 12px;
}
.bullets {
  margin: 12px 0 0;
  padding: 0 0 0 18px;
  color: #374151;
}
.bullets li + li { margin-top: 6px; }

/* card */
.card {
  background: #fff;
  border: 1px solid #ececec;
  border-radius: 14px;
  box-shadow: 0 6px 18px rgba(0,0,0,.04);
  padding: 16px;
}
.checkout h2 {
  margin: 0 0 10px;
  font-size: 18px;
}
.col.gap {
  display: grid;
  gap: 10px;
}
.lbl {
  display: grid;
  gap: 6px;
  font-size: 13px;
  color: #374151;
}
.sluginput {
  display: flex;
  align-items: center;
  gap: 6px;
}
.sluginput .prefix { white-space: nowrap; }
.tiny-note {
  margin-top: 10px;
  font-size: 12px;
  color: #6b7280;
}

/* features band */
.band {
  background: #fff;
  border-top: 1px solid #eef0f3;
  border-bottom: 1px solid #eef0f3;
  margin-top: 30px;
}
.band .grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(3, 1fr);
  padding: 22px 0;
}
.feature {
  background: #fafafa;
  border: 1px solid #f1f1f1;
  border-radius: 12px;
  padding: 14px;
}
.feature h3 {
  margin: 0 0 6px;
  font-size: 16px;
}

/* faq */
.faq {
  padding: 24px 16px;
}
.faq h3 {
  margin: 18px 0 8px;
}
.faq details + details { margin-top: 10px; }

/* responsive */
@media (max-width: 920px) {
  .hero { grid-template-columns: 1fr; }
  .band .grid { grid-template-columns: 1fr; }
}
</style>