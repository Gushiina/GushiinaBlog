<script setup lang="ts">
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  onServerPrefetch,
  ref,
  watch,
} from "vue";
import { useRoute } from "vue-router";
import { useBlogStore } from "@/stores/blog";
import { renderMarkdown } from "@/utils/markdown";
import type { Post } from "@/types";
const route = useRoute();
const store = useBlogStore();
const post = ref<Post | null>(null);
const loading = ref(true);
const progress = ref(0);
const largeText = ref(false);
const tocOpen = ref(false);
const notice = ref("");
const rendered = computed(() =>
  renderMarkdown(
    post.value?.content || "",
    store.posts,
    post.value?.id,
    store.attachments,
  ),
);
const related = computed(() =>
  store.posts
    .filter(
      (p) =>
        p.id !== post.value?.id &&
        p.tags.some((t) => post.value?.tags.includes(t)),
    )
    .slice(0, 3),
);
let request = 0;
let pending: Promise<void> | undefined;
watch(
  () => route.params.id,
  (id) => {
    pending = loadPost(String(id));
  },
  { immediate: true },
);
onServerPrefetch(() => pending);
async function loadPost(id: string) {
  const current = ++request;
  loading.value = true;
  tocOpen.value = false;
  notice.value = "";
  const result = await store.fetchPost(String(id));
  if (current !== request) return;
  post.value = result;
  loading.value = false;
  document.title = result
    ? result.title + " · 咕诗奈的博客"
    : "文章未找到 · 咕诗奈的博客";
  await nextTick();
  if (route.hash)
    document
      .getElementById(decodeURIComponent(route.hash.slice(1)))
      ?.scrollIntoView();
}
function updateProgress() {
  const distance = document.documentElement.scrollHeight - innerHeight;
  progress.value = distance > 0 ? Math.min(100, (scrollY / distance) * 100) : 0;
}
async function copyCode(event: MouseEvent) {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
    ".copy-code",
  );
  if (!button) return;
  const code = button
    .closest(".code-block-container")
    ?.querySelector("code")?.textContent;
  if (code) {
    try {
      await navigator.clipboard.writeText(code);
      button.textContent = "已复制";
    } catch {
      notice.value = "复制未成功，请手动选择代码。";
    }
  }
}
async function share() {
  try {
    await navigator.clipboard.writeText(location.href);
    notice.value = "文章链接已复制。";
  } catch {
    notice.value = "请从地址栏复制文章链接。";
  }
}
onMounted(() => {
  store.fetchPosts();
  window.addEventListener("scroll", updateProgress, { passive: true });
});
onUnmounted(() => {
  window.removeEventListener("scroll", updateProgress);
});
</script>
<template>
  <div
    class="reading-progress"
    :style="{ width: progress + '%' }"
    aria-hidden="true"
  ></div>
  <main id="main" class="reader-layout">
    <div class="reader-topline">
      <RouterLink to="/" class="text-link">↖ 返回日志</RouterLink
      ><span class="eyebrow">A NOTE FROM GUSHIINA</span>
    </div>
    <p v-if="loading" class="empty-state" role="status">正在展开这段信号…</p>
    <div v-else-if="!post" class="empty-state">
      <h1>这段信号暂时无法接收</h1>
      <p>文章可能不存在，或加载失败。</p>
      <RouterLink to="/" class="text-link">返回文章列表 ↗</RouterLink>
    </div>
    <div v-else class="reader-columns">
      <article class="article-paper" :class="{ 'large-text': largeText }">
        <header class="article-header">
          <div class="tag-list">
            <RouterLink
              v-for="tag in post.tags"
              :key="tag"
              :to="{ path: '/', query: { tag } }"
              >#{{ tag }}</RouterLink
            >
          </div>
          <h1>{{ post.title }}</h1>
          <div class="author-line">
            <img
              :src="store.profile?.avatar || '/assets/avatar.gif'"
              alt=""
              width="36"
              height="36"
            />
            <div>
              <strong>{{ store.profile?.nickname }}</strong>
              <div class="post-meta">
                <time>{{ post.date }}</time
                ><span
                  >{{ post.wordCount }} 字 · 约
                  {{ Math.max(1, Math.ceil(post.wordCount / 400)) }} 分钟</span
                >
              </div>
            </div>
          </div>
          <div class="reading-tools">
            <button @click="largeText = !largeText" :aria-pressed="largeText">
              Aa {{ largeText ? "标准字号" : "大字阅读" }}</button
            ><button
              v-if="rendered.headings.length"
              class="mobile-toc-toggle"
              @click="tocOpen = !tocOpen"
              :aria-expanded="tocOpen"
            >
              目录 {{ tocOpen ? "−" : "+" }}</button
            ><button @click="share">分享 ↗</button>
          </div>
          <p v-if="notice" role="status">{{ notice }}</p>
          <nav v-if="tocOpen" class="mobile-toc" aria-label="文章目录">
            <a
              v-for="heading in rendered.headings"
              :key="heading.id"
              :href="'#' + route.path + '#' + heading.id"
              @click="tocOpen = false"
              >{{ heading.text }}</a
            >
          </nav>
        </header>
        <div
          class="markdown-content"
          v-html="rendered.html"
          @click="copyCode"
        ></div>
        <footer class="article-end">
          <span class="end-star" aria-hidden="true">✳</span>
          <p>这一段信号，到这里就结束了。</p>
          <small>感谢阅读，我们在下一篇笔记见。</small>
          <p role="status">{{ notice }}</p>
          <RouterLink to="/" class="outlined-button">↖ 回到全部文章</RouterLink>
        </footer>
      </article>
      <aside class="reader-aside">
        <div class="sticky-toc">
          <p class="eyebrow">ON THIS PAGE</p>
          <h2>阅读导航 <span>↘</span></h2>
          <nav aria-label="文章目录">
            <a
              v-for="heading in rendered.headings"
              :key="heading.id"
              :href="'#' + route.path + '#' + heading.id"
              :class="{ 'toc-sub': heading.level > 2 }"
              >{{ heading.text }}</a
            >
            <p v-if="!rendered.headings.length" class="muted">
              这篇文章没有小标题。
            </p>
          </nav>
          <div class="related-notes" v-if="related.length">
            <p class="eyebrow">KEEP EXPLORING</p>
            <h3>同频笔记</h3>
            <RouterLink
              v-for="item in related"
              :key="item.id"
              :to="'/post/' + encodeURIComponent(item.id)"
              >{{ item.title }} ↗</RouterLink
            >
          </div>
          <a class="text-link back-top" :href="'#' + route.path + '#main'"
            >回到顶部 ↑</a
          >
        </div>
      </aside>
    </div>
  </main>
</template>
