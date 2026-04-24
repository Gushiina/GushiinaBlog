<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useBlogStore } from '@/stores/blog'
import { storeToRefs } from 'pinia'
import Sidebar from '@/components/Sidebar.vue'
import PostCard from '@/components/PostCard.vue'

const blogStore = useBlogStore()
const { profile, loading, filteredPosts, searchParams } = storeToRefs(blogStore)

// 当前筛选状态文本
const filterStatusText = computed(() => {
  const filters: string[] = []
  
  if (searchParams.value.keyword) {
    filters.push(`关键词: "${searchParams.value.keyword}"`)
  }
  if (searchParams.value.tag) {
    filters.push(`标签: ${searchParams.value.tag}`)
  }
  if (searchParams.value.yearMonth) {
    filters.push(`时间: ${searchParams.value.yearMonth}`)
  }
  
  if (filters.length === 0) {
    return '显示所有文章'
  }
  
  return `筛选条件: ${filters.join(' + ')}`
})

onMounted(async () => {
  await blogStore.fetchProfile()
  await blogStore.fetchPosts()
})
</script>

<template>
  <div class="min-h-screen p-6">
    <div class="max-w-7xl mx-auto flex gap-6">
      <Sidebar />
      <main class="flex-1 space-y-6">
        <!-- 博客标题卡片 -->
        <div class="card p-6 mb-6">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ profile?.blog.title }}</h1>
          <p class="text-gray-600">{{ profile?.blog.description }}</p>
        </div>

        <!-- 筛选状态栏 -->
        <div class="card p-4 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <span class="text-gray-700">
              {{ filterStatusText }}
            </span>
            <span class="text-gray-500">
              ({{ filteredPosts.length }} 篇)
            </span>
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="flex justify-center items-center py-12">
          <div class="text-gray-600 text-lg">加载中...</div>
        </div>

        <!-- 空状态 -->
        <div v-else-if="filteredPosts.length === 0" class="card p-12 text-center">
          <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p class="text-gray-600 text-lg mb-2">没有找到符合条件的文章</p>
          <p class="text-gray-500 text-sm">尝试调整左侧的筛选条件</p>
        </div>

        <!-- 文章列表 -->
        <div v-else class="space-y-6">
          <PostCard v-for="post in filteredPosts" :key="post.id" :post="post" />
        </div>

        <!-- 页脚 -->
        <footer class="card p-6 text-center text-gray-500">
          {{ profile?.blog.footer }}
        </footer>
      </main>
    </div>
  </div>
</template>

<style scoped>
</style>
