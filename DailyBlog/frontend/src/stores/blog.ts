import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { Post, Profile, SearchParams, TagCount } from "@/types";
import content from "virtual:blog-content";
export const useBlogStore = defineStore("blog", () => {
  const posts = ref<Post[]>(content.posts);
  const profile = ref<Profile | null>(content.profile);
  const attachments = content.attachments;
  const loading = ref(false);
  const error = ref("");
  const searchParams = ref<SearchParams>({});
  const tags = computed<TagCount[]>(() => {
    const map = new Map<string, number>();
    posts.value.forEach((post) =>
      post.tags.forEach((tag) => map.set(tag, (map.get(tag) || 0) + 1)),
    );
    return [...map]
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  });
  const yearMonths = computed(() =>
    [...new Set(posts.value.map((post) => post.date.slice(0, 7)))]
      .sort()
      .reverse(),
  );
  const filteredPosts = computed(() =>
    posts.value.filter((post) => {
      const { keyword, tag, yearMonth } = searchParams.value;
      const keywordMatches =
        !keyword ||
        [post.title, post.content, ...post.tags].some((value) =>
          value.toLowerCase().includes(keyword.toLowerCase()),
        );
      return (
        keywordMatches &&
        (!tag || post.tags.includes(tag)) &&
        (!yearMonth || post.date.startsWith(yearMonth))
      );
    }),
  );
  async function fetchPosts() {
    posts.value = content.posts;
    loading.value = false;
  }
  async function fetchProfile() {
    profile.value = content.profile;
  }
  async function fetchPost(id: string) {
    return content.posts.find((post) => post.id === id) || null;
  }
  function setSearchParams(params: SearchParams) {
    searchParams.value = { ...searchParams.value, ...params };
  }
  function clearSearch() {
    searchParams.value = {};
  }
  return {
    posts,
    profile,
    attachments,
    loading,
    error,
    searchParams,
    tags,
    yearMonths,
    filteredPosts,
    fetchPosts,
    fetchProfile,
    fetchPost,
    setSearchParams,
    clearSearch,
  };
});
