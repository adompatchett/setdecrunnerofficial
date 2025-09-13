<template>
  <router-view />
</template>

<script setup>
// Nothing special needed here
</script>

<style>
/* ---------- Global font + base styles ---------- */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

html, body, #app {
  margin: 0;
  padding: 0;
  min-height: 100%;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI',
    Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  font-size: 15px;
  line-height: 1.5;
  color: #111827; /* neutral dark */
  background: #f9fafb; /* soft gray background */
}

/* Reset link look */
a {
  color: #2563eb;
  text-decoration: none;
}
a:hover {
  text-decoration: underline;
}

/* Buttons (base styling for consistency) */
button, .btn {
  appearance: none;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 8px 12px;
  font: inherit;
  cursor: pointer;
  background: #fff;
  color: #111827;
  transition: background 0.15s ease, border-color 0.15s ease, transform 0.05s ease;
}
button:hover, .btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}
button:active, .btn:active {
  transform: translateY(1px);
}

/* Inputs */
input, select, textarea {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 8px 10px;
  font: inherit;
  background: #fff;
  color: #111827;
}
input:focus, select:focus, textarea:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.3);
}

/* Utility */
.container {
  max-width: 1120px;
  margin: 0 auto;
  padding: 24px 16px;
}
.muted {
  color: #6b7280;
  font-size: 13px;
}
.error {
  color: #b42318;
  background: #fff1f0;
  border: 1px solid #ffd7d5;
  padding: 10px 12px;
  border-radius: 8px;
}
</style>
