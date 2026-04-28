/**
 * 静态博客数据存储
 * 用于 GitHub Pages 静态部署，从 JSON 文件加载数据
 */

import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Post, Profile, BlogStats } from '@/types'

const BASE_URL = import.meta.env.BASE_URL || '/'

export const useStaticBlogStore = defineStore('staticBlog', () => {
  // State
  const posts = ref<Post[]>([])
  const profile = ref<Profile | null>(null)
  const stats = ref<BlogStats | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const currentPost = ref<Post | null>(null)

  // Search params
  const searchParams = ref({
    keyword: '',
    tag: '',
    yearMonth: ''
  })

  // Getters
  const filteredPosts = computed(() => {
    let result = posts.value

    if (searchParams.value.keyword) {
      const keyword = searchParams.value.keyword.toLowerCase()
      result = result.filter(post =>
        post.title.toLowerCase().includes(keyword) ||
        post.excerpt?.toLowerCase().includes(keyword) ||
        post.content.toLowerCase().includes(keyword)
      )
    }

    if (searchParams.value.tag) {
      result = result.filter(post =>
        post.tags.includes(searchParams.value.tag)
      )
    }

    if (searchParams.value.yearMonth) {
      result = result.filter(post =>
        post.date.startsWith(searchParams.value.yearMonth)
      )
    }

    return result
  })

  const allTags = computed(() => {
    const tagSet = new Set<string>()
    posts.value.forEach(post => {
      post.tags.forEach(tag => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  })

  const tagCounts = computed(() => {
    const counts = new Map<string, number>()
    posts.value.forEach(post => {
      post.tags.forEach(tag => {
        counts.set(tag, (counts.get(tag) || 0) + 1)
      })
    })
    return counts
  })

  const yearMonthCounts = computed(() => {
    const counts = new Map<string, number>()
    posts.value.forEach(post => {
      const yearMonth = post.date.substring(0, 7)
      counts.set(yearMonth, (counts.get(yearMonth) || 0) + 1)
    })
    return new Map([...counts.entries()].sort().reverse())
  })

  // Actions
  async function fetchPosts() {
    loading.value = true
    error.value = null
    try {
      const response = await fetch(`${BASE_URL}data/posts.json`)
      if (!response.ok) throw new Error('Failed to load posts')
      posts.value = await response.json()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      console.error('Error loading posts:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchProfile() {
    try {
      const response = await fetch(`${BASE_URL}data/profile.json`)
      if (!response.ok) throw new Error('Failed to load profile')
      profile.value = await response.json()
    } catch (err) {
      console.error('Error loading profile:', err)
    }
  }

  async function fetchStats() {
    try {
      const response = await fetch(`${BASE_URL}data/stats.json`)
      if (!response.ok) throw new Error('Failed to load stats')
      stats.value = await response.json()
    } catch (err) {
      console.error('Error loading stats:', err)
    }
  }

  async function fetchPost(id: string) {
    loading.value = true
    error.value = null
    try {
      // 从已加载的文章中查找
      let post = posts.value.find(p => p.id === id)

      // 如果没找到，先加载所有文章
      if (!post && posts.value.length === 0) {
        await fetchPosts()
        post = posts.value.find(p => p.id === id)
      }

      if (post) {
        currentPost.value = post
      } else {
        error.value = '文章不存在'
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
    } finally {
      loading.value = false
    }
  }

  function setSearchKeyword(keyword: string) {
    searchParams.value.keyword = keyword
  }

  function setSearchTag(tag: string) {
    searchParams.value.tag = tag
  }

  function setSearchYearMonth(yearMonth: string) {
    searchParams.value.yearMonth = yearMonth
  }

  function clearFilters() {
    searchParams.value = {
      keyword: '',
      tag: '',
      yearMonth: ''
    }
  }

  return {
    // State
    posts,
    profile,
    stats,
    loading,
    error,
    currentPost,
    searchParams,
    // Getters
    filteredPosts,
    allTags,
    tagCounts,
    yearMonthCounts,
    // Actions
    fetchPosts,
    fetchProfile,
    fetchStats,
    fetchPost,
    setSearchKeyword,
    setSearchTag,
    setSearchYearMonth,
    clearFilters
  }
})
