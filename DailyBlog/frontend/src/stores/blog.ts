import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Post, Profile, SearchParams, TagCount } from '@/types'

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
        // 安全地获取属性值，处理可能的 undefined
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

  async function fetchPosts() {
    loading.value = true
    try {
      const res = await fetch('/api/posts')
      posts.value = await res.json()
    } catch (err) {
      console.error('Failed to fetch posts:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchProfile() {
    try {
      const res = await fetch('/api/profile')
      profile.value = await res.json()
    } catch (err) {
      console.error('Failed to fetch profile:', err)
    }
  }

  async function fetchPost(id: string): Promise<Post | null> {
    try {
      const res = await fetch(`/api/posts/${id}`)
      if (res.ok) {
        return await res.json()
      }
    } catch (err) {
      console.error('Failed to fetch post:', err)
    }
    return null
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
