<script setup lang="ts">
import { computed } from 'vue'
import { useBlogStore } from '@/stores/blog'
import { storeToRefs } from 'pinia'
import type { Post } from '@/types'

const props = defineProps<{
  post: Post
}>()

const blogStore = useBlogStore()
const { searchParams } = storeToRefs(blogStore)

// 获取当前搜索关键词
const keyword = computed(() => searchParams.value.keyword?.trim() || '')

// 处理标题 - 去掉 .md 后缀
const cleanTitle = computed(() => {
  return props.post.title.replace(/\.md$/i, '')
})

// 高亮文本函数 - 将匹配的关键词用 span 包裹
function highlightText(text: string, kw: string): string {
  if (!kw) return text
  
  // 转义正则特殊字符
  const escapedKw = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escapedKw})`, 'gi')
  
  return text.replace(regex, '<span class="search-highlight">$1</span>')
}

// 高亮后的标题
const highlightedTitle = computed(() => {
  return highlightText(cleanTitle.value, keyword.value)
})
</script>

<template>
  <router-link :to="`/post/${post.id}`" class="block">
    <article class="card p-4 md:p-6 hover:transform hover:scale-[1.02] transition-all duration-300 cursor-pointer">
      <!-- 标题 - 使用 v-html 渲染高亮 -->
      <h3 class="text-lg md:text-xl font-bold text-gray-900 mb-2 leading-tight" v-html="highlightedTitle"></h3>
      
      <div class="flex flex-wrap items-center gap-2 md:gap-4 text-gray-600 text-xs md:text-sm mb-3">
        <span class="flex items-center gap-1">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
          </svg>
          {{ post.date }}
        </span>
        <span class="flex items-center gap-1">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
          </svg>
          {{ post.wordCount }} 字
        </span>
      </div>
      
      <!-- 摘要 - 不显示高亮 -->
      <p class="text-gray-700 mb-4 line-clamp-3">{{ post.excerpt }}</p>
      
      <div class="flex flex-wrap gap-2">
        <span
          v-for="tag in post.tags"
          :key="tag"
          class="tag"
        >
          {{ tag }}
        </span>
      </div>
    </article>
  </router-link>
</template>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 搜索高亮样式 - Sublime Text 风格 */
:deep(.search-highlight) {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1e40af;
  padding: 0 0.25rem;
  border-radius: 3px;
  border: 1px solid #60a5fa;
  font-weight: 600;
}
</style>
