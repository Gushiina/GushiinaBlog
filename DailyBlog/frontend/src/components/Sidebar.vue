<script setup lang="ts">
import { useBlogStore } from "@/stores/blog";
const store = useBlogStore();
</script>
<template>
  <aside class="sidebar">
    <section class="profile-panel" id="about">
      <div class="panel-label">
        <span>THE HUMAN BEHIND THIS</span><span>↗</span>
      </div>
      <div class="profile-intro">
        <img
          :src="store.profile?.avatar || '/assets/avatar.gif'"
          alt="咕诗奈的头像"
          class="avatar-image"
          width="72"
          height="72"
        /><span class="profile-sticker">HELLO,<br />WORLD! ✳</span>
      </div>
      <h2>{{ store.profile?.nickname || "咕诗奈Gushiina" }}</h2>
      <p>{{ store.profile?.bio }}</p>
      <p class="profile-description">
        在数字世界里留下自己的坐标。<br />这里收集学习笔记，也存放一点好奇心。
      </p>
      <div class="social-links">
        <a
          v-if="store.profile?.social.github"
          :href="store.profile.social.github"
          target="_blank"
          rel="noopener noreferrer"
          >GitHub ↗</a
        ><a
          v-if="store.profile?.social.bilibili"
          :href="store.profile.social.bilibili"
          target="_blank"
          rel="noopener noreferrer"
          >Bilibili ↗</a
        ><a
          v-if="store.profile?.social.email"
          :href="'mailto:' + store.profile.social.email"
          >Email ↗</a
        >
      </div>
    </section>
    <section class="sidebar-section">
      <p class="eyebrow">EXPLORE BY TOPIC</p>
      <h3>电波分类 <span>✳</span></h3>
      <RouterLink
        v-for="item in store.tags"
        :key="item.tag"
        :to="{ path: '/', query: { tag: item.tag } }"
        class="topic-link"
        ><span># {{ item.tag }}</span
        ><span>{{ String(item.count).padStart(2, "0") }} ↗</span></RouterLink
      >
      <p v-if="!store.tags.length" class="muted">文章标签会出现在这里。</p>
    </section>
    <section class="sidebar-section">
      <p class="eyebrow">TIME CAPSULE</p>
      <h3>时间胶囊 <span>↶</span></h3>
      <RouterLink
        v-for="month in store.yearMonths"
        :key="month"
        :to="{ path: '/', query: { view: 'archive', month } }"
        class="topic-link"
        ><span>{{ month.replace("-", " / ") }}</span
        ><span>↗</span></RouterLink
      >
    </section>
    <div class="sidebar-note">
      <span>✧</span>
      <p>不必成为完美的信号。<br />持续发射就好。</p>
      <small>A SMALL CORNER OF THE INTERNET.</small>
    </div>
  </aside>
</template>
