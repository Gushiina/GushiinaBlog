import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Post, Profile, SearchParams, TagCount } from '@/types'

// 获取基础 URL，用于静态部署
const BASE_URL = import.meta.env.BASE_URL || '/'

export const useBlogStore = defineStore('blog', () => {
  const posts = ref<Post[]>([])
  const profile = ref<Profile | null>(null)
  const loading = ref(false)
  const searchParams = ref<SearchParams>({})

  const tags = computed<TagCount[]>(() => {
    const tagMap = new Map<string, number>()
    posts.value.forEach(post => {
      post.tags.forEach(tag => {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1)
      })
    })
    return Array.from(tagMap.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
  })

  const yearMonths = computed<string[]>(() => {
    const set = new Set<string>()
    posts.value.forEach(post => {
      const ym = post.date.substring(0, 7)
      set.add(ym)
    })
    return Array.from(set).sort((a, b) => b.localeCompare(a))
  })

  const filteredPosts = computed<Post[]>(() => {
    let result = [...posts.value]

    if (searchParams.value.keyword) {
      const kw = searchParams.value.keyword.toLowerCase()
      result = result.filter(p => {
        const title = (p.title || '').toLowerCase()
        const content = (p.content || '').toLowerCase()
        const tags = p.tags || []
        
        return title.includes(kw) ||
               content.includes(kw) ||
               tags.some(t => (t || '').toLowerCase().includes(kw))
      })
    }

    if (searchParams.value.tag) {
      result = result.filter(p => {
        const tags = p.tags || []
        return tags.includes(searchParams.value.tag!)
      })
    }

    if (searchParams.value.yearMonth) {
      result = result.filter(p => {
        const date = p.date || ''
        return date.startsWith(searchParams.value.yearMonth!)
      })
    }

    return result.sort((a, b) => {
      const dateA = a.date || ''
      const dateB = b.date || ''
      return dateB.localeCompare(dateA)
    })
  })

  // 从静态 JSON 文件加载数据
  async function loadStaticData() {
    try {
      const postsRes = await fetch(`${BASE_URL}data/posts.json`)
      if (postsRes.ok) {
        posts.value = await postsRes.json()
      }
    } catch (err) {
      console.error('Failed to load static posts:', err)
    }

    try {
      const profileRes = await fetch(`${BASE_URL}data/profile.json`)
      if (profileRes.ok) {
        profile.value = await profileRes.json()
      }
    } catch (err) {
      console.error('Failed to load static profile:', err)
    }
  }

  async function fetchPosts() {
    loading.value = true
    try {
      // 首先尝试从 API 获取
      const res = await fetch('/api/posts')
      if (res.ok) {
        posts.value = await res.json()
      } else {
        throw new Error('API failed')
      }
    } catch (err) {
      // 如果 API 失败，尝试从静态文件加载
      console.log('API failed, trying static data...')
      await loadStaticData()
    } finally {
      loading.value = false
    }
  }

  async function fetchProfile() {
    try {
      const res = await fetch('/api/profile')
      if (res.ok) {
        profile.value = await res.json()
      } else {
        throw new Error('API failed')
      }
    } catch (err) {
      // 如果 API 失败，尝试从静态文件加载
      console.log('API failed, trying static data...')
      await loadStaticData()
    }
  }

  async function fetchPost(id: string): Promise<Post | null> {
    try {
      // 首先尝试从 API 获取
      const res = await fetch(`/api/posts/${id}`)
      if (res.ok) {
        return await res.json()
      }
      throw new Error('API failed')
    } catch (err) {
      // 如果 API 失败，从已加载的文章中查找
      console.log('API failed, searching in loaded posts...')
      if (posts.value.length === 0) {
        await loadStaticData()
      }
      return posts.value.find(p => p.id === id) || null
    }
  }

  function setSearchParams(params: SearchParams) {
    searchParams.value = { ...searchParams.value, ...params }
  }

  function clearSearch() {
    searchParams.value = {}
  }

  return {
    posts,
    profile,
    loading,
    searchParams,
    tags,
    yearMonths,
    filteredPosts,
    fetchPosts,
    fetchProfile,
    fetchPost,
    setSearchParams,
    clearSearch
  }
})
