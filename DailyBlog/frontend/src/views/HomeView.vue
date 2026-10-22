<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useBlogStore } from "@/stores/blog";
import PostCard from "@/components/PostCard.vue";
import Sidebar from "@/components/Sidebar.vue";
import LiquidScene from "@/components/LiquidScene.vue";
const store = useBlogStore();
const route = useRoute();
const router = useRouter();
const keyword = ref("");
const archive = computed(() => route.query.view === "archive");
const featured = computed(
  () =>
    store.posts.find((p) => p.title.includes("输入与移动")) || store.posts[0],
);
const groups = computed(() => {
  const result: Record<string, typeof store.posts> = {};
  store.filteredPosts.forEach((post) =>
    (result[post.date.slice(0, 7)] ||= []).push(post),
  );
  return result;
});
watch(
  () => route.query,
  (query) => {
    keyword.value = String(query.q || "");
    store.clearSearch();
    store.setSearchParams({
      tag: query.tag ? String(query.tag) : undefined,
      keyword: keyword.value,
      yearMonth: query.month ? String(query.month) : undefined,
    });
  },
  { immediate: true },
);
function search() {
  router.replace({ query: { ...route.query, q: keyword.value || undefined } });
}
function tag(value?: string) {
  router.push({ query: { ...route.query, tag: value } });
}
onMounted(() => store.fetchPosts());
</script>
<template>
  <main id="main">
    <section v-if="!archive" class="hero" aria-labelledby="hero-title">
      <div class="hero-copy">
        <p class="eyebrow">
          <span class="status-dot"></span> ONLINE · 来自咕诗奈的个人频道
        </p>
        <h1 id="hero-title">
          这里有一些<br /><span>不规则的</span>脑电波<span class="title-star"
            >✳</span
          >
        </h1>
        <div class="hero-bottom">
          <p>
            {{ store.profile?.blog.description || "记录技术成长与生活点滴"
            }}<br />代码、游戏，以及正在发生的日常。
          </p>
          <RouterLink class="text-link" :to="{ path: '/', hash: '#journal' }"
            >开始接收信号 <span>↘</span></RouterLink
          >
        </div>
      </div>
      <div class="signal-art" aria-hidden="true">
        <LiquidScene />
        <div class="art-top"><span>GUSHIINA.EXE</span><span>_ □ ×</span></div>
        <div class="orbit orbit-one"></div>
        <div class="orbit orbit-two"></div>
        <div class="art-star">✳</div>
        <div class="anime-window">
          <div class="anime-titlebar">
            <span>電子少女 / loading...</span><span>♡</span>
          </div>
          <img :src="store.profile?.avatar || '/assets/avatar.gif'" alt="" />
          <div class="anime-caption">咕诗奈的脑内宇宙 <span>★ ★ ★</span></div>
        </div>
        <span class="art-label">妄想通信<br />DENPA // 2000</span
        ><span class="art-sticker">好奇心<br />永不下线 ↗</span
        ><span class="pixel-spark">✦</span>
        <div class="art-bottom">
          <span>♡ 2D SOUL / 3D WORLD</span><span>受信中 ▰▰▰▱</span>
        </div>
      </div>
    </section>
    <div v-if="!archive" class="ticker" aria-hidden="true">
      <span>NOTES FROM MY LITTLE UNIVERSE</span><b>✳</b
      ><span>学习中 / 存档中 / 偶尔发电</span><b>✳</b
      ><span>WELCOME TO MY PERSONAL SPACE</span><b>✳</b>
    </div>
    <div class="journal-layout" id="journal">
      <section class="journal-main" aria-labelledby="journal-title">
        <div class="section-heading">
          <div>
            <p class="eyebrow">
              {{ archive ? "THE COLLECTION" : "RECENT TRANSMISSIONS" }}
            </p>
            <h2 id="journal-title">
              {{ archive ? "所有存档" : "最近的脑内放送"
              }}<sup>{{ String(store.posts.length).padStart(2, "0") }}</sup>
            </h2>
          </div>
          <span class="section-symbol" aria-hidden="true">↙</span>
        </div>
        <form class="search-box" role="search" @submit.prevent="search">
          <label class="sr-only" for="search">搜索文章全文</label
          ><span aria-hidden="true">⌕</span
          ><input
            id="search"
            v-model="keyword"
            placeholder="在这里寻找一段电波…"
            type="search"
            @input="search"
          /><button type="submit">搜索 ↵</button>
        </form>
        <div class="filter-tabs" aria-label="按标签筛选">
          <button :class="{ selected: !route.query.tag }" @click="tag()">
            全部文章</button
          ><button
            v-for="item in store.tags"
            :key="item.tag"
            :class="{ selected: route.query.tag === item.tag }"
            @click="tag(item.tag)"
          >
            {{ item.tag }}<small>{{ item.count }}</small>
          </button>
        </div>
        <div v-if="store.loading" class="empty-state" role="status">
          正在接收文章信号…
        </div>
        <div v-else-if="store.error" class="empty-state" role="alert">
          <p>{{ store.error }}</p>
          <button class="outlined-button" @click="store.fetchPosts()">
            重新加载
          </button>
        </div>
        <div v-else-if="!store.filteredPosts.length" class="empty-state">
          <p>这个频段暂时没有信号。</p>
          <RouterLink to="/" class="text-link"
            >清除筛选，看看全部文章 ↗</RouterLink
          >
        </div>
        <template v-else-if="archive"
          ><section
            v-for="(posts, month) in groups"
            :key="month"
            class="archive-group"
          >
            <h3>{{ month }}</h3>
            <RouterLink
              v-for="post in posts"
              :key="post.id"
              :to="'/post/' + encodeURIComponent(post.id)"
              ><time>{{ post.date.slice(5) }}</time
              ><span>{{ post.title }}</span
              ><span>↗</span></RouterLink
            >
          </section></template
        >
        <template v-else
          ><RouterLink
            v-if="
              featured && !route.query.tag && !keyword && !route.query.month
            "
            class="featured-note"
            :to="'/post/' + encodeURIComponent(featured.id)"
            ><div class="feature-visual" aria-hidden="true">
              <span>FIELD NOTES / 01</span><b>游戏<br />拆解中<span>↗</span></b
              ><small>INPUT → MOVE → CREATE</small>
            </div>
            <div class="feature-copy">
              <span class="eyebrow">PICKED FOR YOU / 一篇推荐</span>
              <h3>{{ featured.title }}</h3>
              <p>{{ featured.excerpt }}</p>
              <span class="text-link">进入这篇笔记 ↗</span>
            </div></RouterLink
          >
          <div class="post-list">
            <PostCard
              v-for="(post, index) in store.filteredPosts"
              :key="post.id"
              :post="post"
              :index="index"
            /></div
        ></template>
        <p class="list-end" v-if="store.filteredPosts.length">
          — 已收到 {{ store.filteredPosts.length }} 段信号 / END OF TRANSMISSION
          —
        </p>
      </section>
      <Sidebar />
    </div>
  </main>
</template>
