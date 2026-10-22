<script setup lang="ts">
import type { Post } from "@/types";
defineProps<{ post: Post; index: number }>();
</script>
<template>
  <article v-reveal class="post-row">
    <span class="post-number">{{ String(index + 1).padStart(2, "0") }}</span>
    <div class="post-info">
      <div class="post-meta">
        <time>{{ post.date }}</time
        ><span>
          / {{ Math.max(1, Math.ceil(post.wordCount / 400)) }} MIN READ</span
        >
      </div>
      <RouterLink
        :to="'/post/' + encodeURIComponent(post.id)"
        class="post-title-link"
        ><h3>{{ post.title }}</h3></RouterLink
      >
      <p class="post-excerpt">{{ post.excerpt }}</p>
      <div class="tag-list">
        <RouterLink
          v-for="tag in post.tags"
          :key="tag"
          :to="{ path: '/', query: { tag } }"
          >#{{ tag }}</RouterLink
        >
      </div>
    </div>
    <RouterLink
      :to="'/post/' + encodeURIComponent(post.id)"
      class="post-arrow"
      :aria-label="'阅读 ' + post.title"
      >↗</RouterLink
    >
  </article>
</template>
