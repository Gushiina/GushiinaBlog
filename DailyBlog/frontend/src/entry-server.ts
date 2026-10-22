import { createSSRApp } from "vue";
import { createPinia } from "pinia";
import { createRouter, createMemoryHistory } from "vue-router";
import { renderToString } from "@vue/server-renderer";
import App from "./App.vue";
import HomeView from "./views/HomeView.vue";
import PostView from "./views/PostView.vue";
import { useBlogStore } from "./stores/blog";
import content from "virtual:blog-content";
export { content };
export async function renderPage(path: string) {
  const app = createSSRApp(App);
  const pinia = createPinia();
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", component: HomeView },
      { path: "/post/:id", component: PostView },
    ],
  });
  app.use(pinia);
  app.use(router);
  app.directive("reveal", { getSSRProps: () => ({}) });
  const store = useBlogStore(pinia);
  await store.fetchPosts();
  await store.fetchProfile();
  await router.push(path);
  await router.isReady();
  return renderToString(app);
}
