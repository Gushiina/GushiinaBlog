<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBlogStore } from '@/stores/blog'
import { storeToRefs } from 'pinia'
import TagGraph from './TagGraph.vue'

const blogStore = useBlogStore()
const { profile, tags, searchParams } = storeToRefs(blogStore)
const route = useRoute()
const router = useRouter()

// 筛选菜单展开状态
const isFilterExpanded = ref(false)

// 是否在文章详情页
const isPostView = computed(() => route.name === 'post')

// 搜索关键词本地状态
const searchKeyword = ref(searchParams.value.keyword || '')

// 防抖定时器
let searchTimeout: ReturnType<typeof setTimeout> | null = null

// 处理搜索输入
function handleSearchInput(e: Event) {
  const value = (e.target as HTMLInputElement).value
  searchKeyword.value = value
  
  // 清除之前的定时器
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  // 300ms 防抖
  searchTimeout = setTimeout(() => {
    blogStore.setSearchParams({ 
      keyword: value.trim() || undefined 
    })
  }, 300)
}

// 同步搜索参数变化到本地状态
watch(() => searchParams.value.keyword, (newKeyword) => {
  if (newKeyword !== searchKeyword.value) {
    searchKeyword.value = newKeyword || ''
  }
})

// 返回首页
function goHome() {
  router.push('/')
}

// 切换筛选菜单
function toggleFilter() {
  isFilterExpanded.value = !isFilterExpanded.value
}

// 处理标签点击
function handleTagClick(tag: string) {
  blogStore.setSearchParams({ 
    tag: searchParams.value.tag === tag ? undefined : tag 
  })
}

// 清除筛选
function clearFilters() {
  blogStore.clearSearch()
}

// 检查是否有活跃筛选
const hasActiveFilter = computed(() => {
  return !!(searchParams.value.tag || searchParams.value.yearMonth || searchParams.value.keyword)
})
</script>

<template>
  <aside class="sidebar-container">
    <!-- 固定定位的侧栏内容 -->
    <div class="sidebar-fixed">
      <!-- 个人信息卡片 - 始终显示 -->
      <div class="floating-panel profile-panel">
        <div class="profile-container">
          <!-- 头像 -->
          <div class="avatar-wrapper">
            <img
              :src="profile?.avatar || '/default-avatar.png'"
              :alt="profile?.nickname"
              class="avatar-image"
            />
          </div>
          
          <!-- 昵称和简介 -->
          <div class="text-center profile-info">
            <h2 class="nickname">{{ profile?.nickname }}</h2>
            <p class="bio">{{ profile?.bio }}</p>
            <!-- 邮箱信息 - 显示在 bio 下方 -->
            <p v-if="profile?.social?.email" class="email-text">
              <svg class="email-icon" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
              <span>{{ profile.social.email }}</span>
            </p>
          </div>
          
          <!-- 社交链接按钮 - 仅显示 GitHub 和 Bilibili -->
          <div class="social-links">
            <a
              v-if="profile?.social?.github"
              :href="profile.social.github"
              target="_blank"
              rel="noopener noreferrer"
              class="social-btn"
            >
              <svg class="social-icon" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.529.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span>GitHub</span>
            </a>
            <a
              v-if="profile?.social?.bilibili"
              :href="profile.social.bilibili"
              target="_blank"
              rel="noopener noreferrer"
              class="social-btn"
            >
              <svg class="social-icon" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.813 4.653h.854c2.078 0 3.767 1.688 3.767 3.767v6.25c0 2.078-1.689 3.767-3.767 3.767H5.319c-2.078 0-3.766-1.689-3.766-3.767v-6.25c0-2.079 1.688-3.767 3.766-3.767h.796l-1.86-1.86 1.25-1.25 3.066 3.066h6.075l3.066-3.066 1.25 1.25-1.86 1.86zm-6.735 3.75c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25zm5.625 0c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25z"/>
              </svg>
              <span>Bilibili</span>
            </a>
          </div>

          <!-- 文章详情页的返回按钮 -->
          <div v-if="isPostView" class="post-controls">
            <button @click="goHome" class="control-btn primary">
              <svg class="control-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
              </svg>
              <span>返回首页</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 主页特有的面板：筛选菜单 + 标签系谱图 -->
      <!-- 使用 v-if 在文章页直接移除，不是隐藏 -->
      <div v-if="!isPostView" class="home-panels">
        <!-- 筛选菜单 - 浮动面板 -->
        <div class="floating-panel filter-panel">
          <!-- 筛选菜单头部 -->
          <button 
            @click="toggleFilter"
            class="filter-header"
            :class="{ 'rounded-b-xl': !isFilterExpanded }"
          >
            <div class="filter-title">
              <svg class="filter-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
              </svg>
              <span class="font-semibold text-gray-900">筛选文章</span>
              <span 
                v-if="hasActiveFilter" 
                class="filter-badge"
              >
                已启用
              </span>
            </div>
            <svg 
              class="chevron-icon"
              :class="{ 'rotate-180': isFilterExpanded }"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>

          <!-- 筛选内容 -->
          <div 
            v-show="isFilterExpanded"
            class="filter-content"
          >
            <!-- 搜索框 -->
            <div class="filter-section">
              <label class="filter-label">关键词搜索</label>
              <div class="search-input-wrapper">
                <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <input
                  type="text"
                  placeholder="搜索标题、内容、标签..."
                  class="filter-input with-icon"
                  v-model="searchKeyword"
                  @input="handleSearchInput"
                />
                <button
                  v-if="searchKeyword"
                  @click="searchKeyword = ''; blogStore.setSearchParams({ keyword: undefined })"
                  class="clear-search-btn"
                  title="清除搜索"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              <p class="search-hint">输入关键词实时搜索文章</p>
            </div>

            <!-- 标签筛选 -->
            <div v-if="tags.length > 0" class="filter-section">
              <label class="filter-label">标签筛选</label>
              <div class="tag-list">
                <button
                  v-for="tagInfo in tags"
                  :key="tagInfo.tag"
                  @click="handleTagClick(tagInfo.tag)"
                  :class="[
                    'tag-btn',
                    searchParams.tag === tagInfo.tag ? 'tag-btn-active' : 'tag-btn-default'
                  ]"
                >
                  {{ tagInfo.tag }} ({{ tagInfo.count }})
                </button>
              </div>
            </div>

            <!-- 清除筛选按钮 -->
            <button
              v-if="hasActiveFilter"
              @click="clearFilters"
              class="clear-btn"
            >
              清除所有筛选
            </button>
          </div>
        </div>

        <!-- 标签系谱图 - 浮动面板 -->
        <div class="floating-panel graph-panel">
          <TagGraph />
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
/* 侧边栏容器 - 固定宽度 */
.sidebar-container {
  width: 320px;
  flex-shrink: 0;
}

/* 固定定位的侧栏内容 */
.sidebar-fixed {
  position: fixed;
  top: 1.5rem;
  width: 320px;
  max-height: calc(100vh - 3rem);
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #d1d5db transparent;
}

.sidebar-fixed::-webkit-scrollbar {
  width: 4px;
}

.sidebar-fixed::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-fixed::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 2px;
}

/* 浮动面板样式 - 统一风格 */
.floating-panel {
  background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
  border: 1px solid #e1e4e8;
  border-radius: 16px;
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.06),
    0 1px 3px rgba(0, 0, 0, 0.02),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  overflow: hidden;
}

/* 个人信息面板 */
.profile-panel {
  margin-bottom: 1rem;
}

/* 主页面板容器 */
.home-panels {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* 筛选面板 */
.filter-panel {
  /* 继承浮动面板样式 */
}

/* 标签系谱图面板 */
.graph-panel {
  /* 继承浮动面板样式 */
}

/* 个人信息容器 */
.profile-container {
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
}

/* 头像样式 */
.avatar-wrapper {
  width: 6rem;
  height: 6rem;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid #e5e7eb;
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.1),
    inset 0 2px 4px rgba(255, 255, 255, 0.5);
  transition: all 0.3s ease;
}

.avatar-wrapper:hover {
  transform: scale(1.05);
  box-shadow: 
    0 6px 20px rgba(0, 0, 0, 0.15),
    inset 0 2px 4px rgba(255, 255, 255, 0.5);
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 个人信息文字 */
.profile-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nickname {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.bio {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

/* 邮箱文本样式 */
.email-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #9ca3af;
  margin: 0.25rem 0 0 0;
  word-break: break-all;
}

.email-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  color: #9ca3af;
}

/* 社交链接按钮容器 */
.social-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  margin-top: 0.5rem;
}

/* 统一社交按钮样式 */
.social-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border: 1px solid #d1d5db;
  border-radius: 10px;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s ease;
  min-width: 100px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.social-btn:hover {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border-color: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
}

.social-icon {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

/* 文章详情页控制按钮 */
.post-controls {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  margin-top: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  width: 100%;
}

.control-btn.primary {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
}

.control-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
}

.control-icon {
  width: 1.25rem;
  height: 1.25rem;
}

/* 筛选菜单头部 */
.filter-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-radius: 16px 16px 0 0;
}

.filter-header:hover {
  background-color: rgba(243, 244, 246, 0.5);
}

.filter-header.rounded-b-xl {
  border-radius: 16px;
}

.filter-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: #4b5563;
}

.filter-badge {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1d4ed8;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  border: 1px solid #93c5fd;
}

.chevron-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: #6b7280;
  transition: transform 0.2s ease;
}

.chevron-icon.rotate-180 {
  transform: rotate(180deg);
}

/* 筛选内容区域 */
.filter-content {
  border-top: 1px solid #e5e7eb;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.filter-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.filter-input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  background-color: white;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  font-size: 0.875rem;
  color: #1f2937;
  transition: all 0.2s ease;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
}

.filter-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1), inset 0 1px 2px rgba(0, 0, 0, 0.05);
}

.filter-input::placeholder {
  color: #9ca3af;
}

/* 搜索输入框包装器 */
.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  width: 1.25rem;
  height: 1.25rem;
  color: #9ca3af;
  pointer-events: none;
}

.filter-input.with-icon {
  padding-left: 2.5rem;
  padding-right: 2.5rem;
}

.clear-search-btn {
  position: absolute;
  right: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  background: #e5e7eb;
  border: none;
  border-radius: 50%;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-search-btn:hover {
  background: #d1d5db;
  color: #374151;
}

.search-hint {
  font-size: 0.75rem;
  color: #9ca3af;
  margin-top: 0.25rem;
}

/* 标签列表 */
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag-btn {
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.tag-btn-default {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  color: #4b5563;
  border-color: #e5e7eb;
}

.tag-btn-default:hover {
  background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
  border-color: #d1d5db;
  transform: translateY(-1px);
}

.tag-btn-active {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1e40af;
  border-color: #60a5fa;
  box-shadow: 0 2px 4px rgba(37, 99, 235, 0.15);
}

/* 清除按钮 */
.clear-btn {
  width: 100%;
  padding: 0.625rem 1rem;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  border: 1px solid #d1d5db;
  border-radius: 10px;
  color: #4b5563;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.clear-btn:hover {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #dc2626;
  border-color: #f87171;
  transform: translateY(-1px);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .sidebar-container {
    width: 100%;
  }
  
  .sidebar-fixed {
    position: relative;
    top: 0;
    width: 100%;
    max-height: none;
  }
}

@media (max-width: 640px) {
  .profile-container {
    padding: 1.5rem 1rem;
  }
  
  .social-links {
    flex-direction: column;
  }
  
  .social-btn {
    width: 100%;
  }
  
  .post-controls {
    flex-direction: row;
    flex-wrap: wrap;
  }
  
  .control-btn {
    flex: 1;
    min-width: 120px;
  }
}
</style>
