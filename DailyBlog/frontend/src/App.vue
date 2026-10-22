<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { useBlogStore } from "@/stores/blog";
import { transitionAppearance } from "@/utils/motion";
const store = useBlogStore();
const dark = ref(document.documentElement.dataset.theme === "dark");
const aero = ref(document.documentElement.dataset.style === "aero");
function toggleStyle() {
  transitionAppearance(() => {
    aero.value = !aero.value;
    document.documentElement.dataset.style = aero.value ? "aero" : "collage";
    try {
      localStorage.setItem("gushiina-style", aero.value ? "aero" : "collage");
    } catch {}
  });
}
function toggleTheme() {
  transitionAppearance(() => {
    dark.value = !dark.value;
    document.documentElement.dataset.theme = dark.value ? "dark" : "light";
    try {
      localStorage.setItem("gushiina-theme", dark.value ? "dark" : "light");
    } catch {}
  });
}
let frame = 0;
function pointerGlow(event: PointerEvent) {
  if (
    event.pointerType !== "mouse" ||
    matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    return;
  const surface = (event.target as Element).closest<HTMLElement>(
    ".hero, .signal-art, .profile-panel",
  );
  if (!surface) return;
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => {
    const rect = surface.getBoundingClientRect();
    surface.style.setProperty(
      "--light-x",
      ((event.clientX - rect.left) / rect.width) * 100 + "%",
    );
    surface.style.setProperty(
      "--light-y",
      ((event.clientY - rect.top) / rect.height) * 100 + "%",
    );
  });
}
onMounted(() => {
  store.fetchProfile();
  window.addEventListener("pointermove", pointerGlow, { passive: true });
});
onUnmounted(() => {
  window.removeEventListener("pointermove", pointerGlow);
  cancelAnimationFrame(frame);
});
</script>
<template>
  <a class="skip-link" :href="'#' + $route.path + '#main'">跳到正文</a>
  <div class="ambient-layer" aria-hidden="true">
    <i class="fluid-orb orb-a"></i><i class="fluid-orb orb-b"></i
    ><i class="fluid-orb orb-c"></i><span class="ambient-spark spark-a">✳</span
    ><span class="ambient-spark spark-b">+</span
    ><span class="ambient-spark spark-c">✦</span>
  </div>
  <div class="site-shell">
    <header class="site-header">
      <RouterLink to="/" class="brand" aria-label="咕诗奈的博客首页"
        ><span class="brand-mark">g*</span
        ><span
          >GUSHIINA<span class="brand-sub">PERSONAL WEB JOURNAL</span></span
        ></RouterLink
      >
      <nav aria-label="主导航">
        <RouterLink
          to="/"
          :class="{ active: $route.path === '/' && !$route.query.view }"
          >日志 <small>JOURNAL</small></RouterLink
        ><RouterLink
          to="/?view=archive"
          :class="{ active: $route.query.view === 'archive' }"
          >归档 <small>ARCHIVE</small></RouterLink
        ><RouterLink :to="{ path: '/', hash: '#about' }"
          >关于 <small>ABOUT</small></RouterLink
        >
      </nav>
      <div class="appearance-controls">
        <button
          class="style-button"
          @click="toggleStyle"
          :aria-label="aero ? '切换荧光拼贴风格' : '切换 Aero 玻璃风格'"
        >
          <span aria-hidden="true">{{ aero ? "✧" : "✳" }}</span
          ><span>{{ aero ? "AERO" : "COLLAGE" }}</span
          ><span aria-hidden="true">⇄</span></button
        ><button
          class="theme-button"
          @click="toggleTheme"
          :aria-label="dark ? '切换浅色模式' : '切换深色模式'"
          :aria-pressed="dark"
        >
          <span aria-hidden="true">{{ dark ? "☼" : "◐" }}</span
          ><span class="theme-label">{{ dark ? "LIGHT" : "DARK" }}</span>
        </button>
      </div>
    </header>
    <RouterView />
    <footer class="site-footer">
      <span>{{ store.profile?.blog.footer || "© Gushiina" }}</span
      ><span>保持好奇 / STAY TUNED ↗</span>
    </footer>
  </div>
</template>
