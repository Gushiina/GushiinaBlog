<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useBlogStore } from '@/stores/blog'
import { storeToRefs } from 'pinia'
import * as d3 from 'd3'

const router = useRouter()
const blogStore = useBlogStore()
const { posts, searchParams } = storeToRefs(blogStore)

// 图表容器引用
const graphContainer = ref<HTMLDivElement | null>(null)

// 展开状态
const isExpanded = ref(true)

// 切换展开/收起
function toggleExpand() {
  isExpanded.value = !isExpanded.value
}

// 当前选中的标签
const selectedTag = ref<string | null>(null)

// 图表尺寸
const width = 280
const height = 280

// 计算星图数据
interface GraphNode {
  id: string
  name: string
  type: 'post' | 'tag'
  radius: number
  color: string
  post?: typeof posts.value[0]
  tag?: string
}

interface GraphLink {
  source: string
  target: string
}

const graphData = computed(() => {
  const nodes: GraphNode[] = []
  const links: GraphLink[] = []
  const tagSet = new Set<string>()

  // 创建文章节点
  posts.value.forEach((post) => {
    nodes.push({
      id: `post-${post.id}`,
      name: post.title.length > 6 ? post.title.slice(0, 6) + '...' : post.title,
      type: 'post',
      radius: 6,
      color: '#4a90e2',
      post
    })

    // 收集标签
    post.tags.forEach(tag => tagSet.add(tag))
  })

  // 创建标签节点
  const tagArray = Array.from(tagSet)
  tagArray.forEach((tag) => {
    const postCount = posts.value.filter(p => p.tags.includes(tag)).length
    nodes.push({
      id: `tag-${tag}`,
      name: tag.length > 4 ? tag.slice(0, 4) + '..' : tag,
      type: 'tag',
      radius: Math.max(10, Math.min(16, 10 + postCount)),
      color: selectedTag.value === tag ? '#e74c3c' : '#2ecc71',
      tag
    })
  })

  // 创建连接（文章到标签）
  posts.value.forEach(post => {
    post.tags.forEach(tag => {
      links.push({
        source: `post-${post.id}`,
        target: `tag-${tag}`
      })
    })
  })

  return { nodes, links }
})

// 初始化星图
function initGraph() {
  if (!graphContainer.value) return

  // 清除旧图表
  d3.select(graphContainer.value).selectAll('*').remove()

  // 创建SVG
  const svg = d3.select(graphContainer.value)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', [0, 0, width, height])
    .style('max-width', '100%')
    .style('height', 'auto')

  // 添加缩放行为
  const zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.5, 2])
    .on('zoom', (event) => {
      g.attr('transform', event.transform)
    })

  svg.call(zoom)

  // 创建主容器组
  const g = svg.append('g')

  const { nodes, links } = graphData.value

  // 创建力导向模拟
  const simulation = d3.forceSimulation<GraphNode>(nodes)
    .force('link', d3.forceLink<GraphNode, GraphLink>(links).id(d => d.id).distance(50))
    .force('charge', d3.forceManyBody().strength(-100))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide<GraphNode>().radius(d => d.radius + 3))

  // 创建连接线
  const link = g.append('g')
    .attr('stroke', '#cbd5e0')
    .attr('stroke-opacity', 0.6)
    .selectAll('line')
    .data(links)
    .join('line')
    .attr('stroke-width', 1)

  // 创建节点组
  const node = g.append('g')
    .selectAll('g')
    .data(nodes)
    .join('g')
    .style('cursor', 'pointer')
    .call(d3.drag<SVGGElement, GraphNode>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart()
        d.fx = d.x
        d.fy = d.y
      })
      .on('drag', (event, d) => {
        d.fx = event.x
        d.fy = event.y
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0)
        d.fx = null
        d.fy = null
      })
    )

  // 添加节点圆形
  node.append('circle')
    .attr('r', d => d.radius)
    .attr('fill', d => d.color)
    .attr('stroke', '#fff')
    .attr('stroke-width', 2)
    .style('filter', 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))')

  // 添加节点文字
  node.append('text')
    .text(d => d.name)
    .attr('x', d => d.radius + 2)
    .attr('y', 3)
    .attr('font-size', d => d.type === 'tag' ? '9px' : '8px')
    .attr('font-weight', d => d.type === 'tag' ? '600' : '400')
    .attr('fill', '#2d3748')
    .style('pointer-events', 'none')
    .style('text-shadow', '0 1px 2px rgba(255,255,255,0.8)')

  // 节点点击事件
  node.on('click', (event, d) => {
    event.stopPropagation()

    if (d.type === 'post' && d.post) {
      // 点击文章节点，跳转到文章详情
      router.push(`/post/${d.post.id}`)
    } else if (d.type === 'tag' && d.tag) {
      // 点击标签节点，筛选文章
      if (selectedTag.value === d.tag) {
        selectedTag.value = null
        blogStore.clearSearch()
      } else {
        selectedTag.value = d.tag
        blogStore.setSearchParams({ tag: d.tag })
      }
      updateHighlight()
    }
  })

  // 鼠标悬停效果
  node.on('mouseenter', function(event, d) {
    d3.select(this).select('circle')
      .transition()
      .duration(200)
      .attr('r', d.radius * 1.2)
      .style('filter', 'drop-shadow(0 3px 6px rgba(0,0,0,0.2))')

    // 高亮相关连接
    if (d.type === 'tag') {
      link.style('stroke-opacity', l =>
        (l.source as GraphNode).id === d.id || (l.target as GraphNode).id === d.id ? 1 : 0.1
      )
      link.style('stroke-width', l =>
        (l.source as GraphNode).id === d.id || (l.target as GraphNode).id === d.id ? 2 : 0.5
      )
    }
  })

  node.on('mouseleave', function(event, d) {
    d3.select(this).select('circle')
      .transition()
      .duration(200)
      .attr('r', d.radius)
      .style('filter', 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))')

    // 恢复连接线
    link.style('stroke-opacity', 0.6)
    link.style('stroke-width', 1)
  })

  // 更新位置
  simulation.on('tick', () => {
    link
      .attr('x1', d => (d.source as GraphNode).x!)
      .attr('y1', d => (d.source as GraphNode).y!)
      .attr('x2', d => (d.target as GraphNode).x!)
      .attr('y2', d => (d.target as GraphNode).y!)

    node.attr('transform', d => `translate(${d.x},${d.y})`)
  })

  // 高亮更新函数
  function updateHighlight() {
    node.select('circle')
      .transition()
      .duration(300)
      .attr('fill', d => {
        if (d.type === 'tag') {
          return selectedTag.value === d.tag ? '#e74c3c' : '#2ecc71'
        }
        // 文章节点：如果有关联标签被选中，高亮显示
        if (d.type === 'post' && d.post && selectedTag.value) {
          return d.post.tags.includes(selectedTag.value) ? '#3498db' : '#a0aec0'
        }
        return '#4a90e2'
      })
      .style('opacity', d => {
        if (d.type === 'post' && selectedTag.value && d.post) {
          return d.post.tags.includes(selectedTag.value) ? 1 : 0.3
        }
        return 1
      })

    // 更新连接线透明度
    link.transition()
      .duration(300)
      .style('stroke-opacity', d => {
        if (!selectedTag.value) return 0.6
        const sourceNode = d.source as GraphNode
        const targetNode = d.target as GraphNode
        if (sourceNode.type === 'tag' && sourceNode.tag === selectedTag.value) return 1
        if (targetNode.type === 'tag' && targetNode.tag === selectedTag.value) return 1
        return 0.1
      })
  }

  // 监听选中标签变化
  watch(() => selectedTag.value, updateHighlight)
  watch(() => searchParams.value.tag, (newTag) => {
    selectedTag.value = newTag || null
    updateHighlight()
  })
}

// 监听数据变化
watch(() => posts.value, () => {
  if (posts.value.length > 0 && isExpanded.value) {
    initGraph()
  }
}, { immediate: true })

// 监听展开状态
watch(() => isExpanded.value, (expanded) => {
  if (expanded && posts.value.length > 0) {
    setTimeout(initGraph, 100)
  }
})
</script>

<template>
  <div>
    <!-- 头部 -->
    <button
      @click="toggleExpand"
      class="graph-header"
      :class="{ 'rounded-b-xl': !isExpanded }"
    >
      <div class="graph-title">
        <svg class="graph-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
        </svg>
        <span class="font-semibold text-gray-900">标签系谱图</span>
        <span class="graph-count">({{ posts.length }}篇)</span>
      </div>
      <svg
        class="chevron-icon"
        :class="{ 'rotate-180': isExpanded }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
      </svg>
    </button>

    <!-- 星图内容区域 -->
    <div
      v-show="isExpanded"
      class="graph-content"
    >
      <p class="graph-hint">
        💡 滚轮缩放，点击标签筛选，点击文章跳转
      </p>
      <div
        ref="graphContainer"
        class="star-graph"
      ></div>
    </div>
  </div>
</template>

<style scoped>
.graph-header {
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

.graph-header:hover {
  background-color: rgba(243, 244, 246, 0.5);
}

.graph-header.rounded-b-xl {
  border-radius: 16px;
}

.graph-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.graph-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: #4b5563;
}

.graph-count {
  font-size: 0.75rem;
  color: #6b7280;
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

.graph-content {
  border-top: 1px solid #e5e7eb;
  padding: 1rem;
}

.graph-hint {
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.75rem;
  text-align: center;
}

.star-graph {
  width: 100%;
  height: 280px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-radius: 10px;
  overflow: hidden;
}

:deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
