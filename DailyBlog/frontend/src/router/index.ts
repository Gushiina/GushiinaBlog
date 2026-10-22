import { createRouter, createWebHashHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import PostView from "../views/PostView.vue";
export const routes = [
  { path: "/", name: "home", component: HomeView },
  { path: "/post/:id", name: "post", component: PostView },
];
const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(to, from, saved) {
    if (saved) return saved;
    if (to.hash) {
      const el = document.getElementById(decodeURIComponent(to.hash.slice(1)));
      if (el)
        return {
          el,
          top: 24,
          behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
        };
    }
    if (to.path === from.path) return false;
    return { top: 0 };
  },
});
router.afterEach((to) => {
  if (to.path === "/")
    document.title =
      to.query.view === "archive"
        ? "归档 · 咕诗奈的博客"
        : "咕诗奈的博客 · 不规则脑电波";
});
export default router;
