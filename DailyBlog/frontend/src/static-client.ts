import { mountLiquid } from "./utils/liquid";
import { transitionAppearance } from "./utils/motion";
interface SearchNote {
  id: string;
  title: string;
  tags: string[];
  date: string;
  text: string;
}
const notes: SearchNote[] = JSON.parse(
  document.getElementById("search-index")?.textContent || "[]",
);
const root = document.documentElement;
const sections = Array.from(
  document.querySelectorAll<HTMLElement>("main[data-page]"),
);
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const home = document.querySelector<HTMLElement>('main[data-page="/"]')!;
const archive = document.querySelector<HTMLElement>(
  'main[data-page="archive"]',
)!;
let active = home;
const themeButton = document.querySelector<HTMLButtonElement>(".theme-button")!;
const styleButton = document.querySelector<HTMLButtonElement>(".style-button")!;
function syncAppearance() {
  const dark = root.dataset.theme === "dark",
    aero = root.dataset.style === "aero";
  themeButton.setAttribute(
    "aria-label",
    dark ? "切换浅色模式" : "切换深色模式",
  );
  themeButton.setAttribute("aria-pressed", String(dark));
  themeButton.children[0].textContent = dark ? "☼" : "◐";
  themeButton.children[1].textContent = dark ? "LIGHT" : "DARK";
  styleButton.setAttribute(
    "aria-label",
    aero ? "切换荧光拼贴风格" : "切换 Aero 玻璃风格",
  );
  styleButton.children[0].textContent = aero ? "✧" : "✳";
  styleButton.children[1].textContent = aero ? "AERO" : "COLLAGE";
}
function saveAppearance(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}
styleButton.addEventListener("click", () =>
  transitionAppearance(() => {
    root.dataset.style = root.dataset.style === "aero" ? "collage" : "aero";
    saveAppearance("gushiina-style", root.dataset.style);
    syncAppearance();
  }),
);
themeButton.addEventListener("click", () =>
  transitionAppearance(() => {
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
    saveAppearance("gushiina-theme", root.dataset.theme);
    syncAppearance();
  }),
);
function filter(container: HTMLElement, params: URLSearchParams) {
  const keyword = (params.get("q") || "").toLowerCase(),
    tag = params.get("tag"),
    month = params.get("month");
  const matches = notes.filter(
    (note) =>
      (!keyword || note.text.includes(keyword)) &&
      (!tag || note.tags.includes(tag)) &&
      (!month || note.date.startsWith(month)),
  );
  const ids = new Set(matches.map((note) => note.id));
  container
    .querySelectorAll<HTMLElement>("[data-post-id]")
    .forEach((element) => {
      element.hidden = !ids.has(element.dataset.postId!);
    });
  container.querySelectorAll<HTMLElement>(".archive-group").forEach((group) => {
    group.hidden = !Array.from(
      group.querySelectorAll<HTMLElement>("[data-post-id]"),
    ).some((el) => !el.hidden);
  });
  container
    .querySelectorAll<HTMLButtonElement>(".filter-tabs button")
    .forEach((button) =>
      button.classList.toggle(
        "selected",
        (button.dataset.tag || "") === (tag || ""),
      ),
    );
  const input = container.querySelector<HTMLInputElement>(
    'input[type="search"]',
  );
  if (input && input.value !== (params.get("q") || ""))
    input.value = params.get("q") || "";
  const picked = container.querySelector<HTMLElement>(".featured-note");
  if (picked) picked.hidden = !!(keyword || tag || month);
  let empty = container.querySelector<HTMLElement>("[data-empty]");
  if (!empty) {
    empty = document.createElement("div");
    empty.className = "empty-state";
    empty.dataset.empty = "";
    empty.textContent = "这个频段暂时没有信号。试试其他关键词或全部文章。";
    container.querySelector(".journal-main")?.append(empty);
  }
  empty.hidden = matches.length > 0;
  const end = container.querySelector<HTMLElement>(".list-end");
  if (end) {
    end.textContent =
      "— 已收到 " + matches.length + " 段信号 / END OF TRANSMISSION —";
    end.hidden = !matches.length;
  }
}
function navigate() {
  const raw = location.hash.slice(1) || "/";
  const anchorIndex = raw.indexOf("#"),
    address = anchorIndex >= 0 ? raw.slice(0, anchorIndex) : raw,
    anchor =
      anchorIndex >= 0 ? decodeURIComponent(raw.slice(anchorIndex + 1)) : "";
  const queryIndex = address.indexOf("?"),
    path = queryIndex >= 0 ? address.slice(0, queryIndex) : address,
    params = new URLSearchParams(
      queryIndex >= 0 ? address.slice(queryIndex + 1) : "",
    );
  const previous = active;
  active =
    path === "/post/" || path.startsWith("/post/")
      ? sections.find(
          (section) => section.dataset.page === decodeURIComponent(path),
        ) || document.querySelector<HTMLElement>('[data-page="404"]')!
      : params.get("view") === "archive"
        ? archive
        : home;
  sections.forEach((section) => {
    section.hidden = section !== active;
    section.removeAttribute("id");
  });
  active.id = "main";
  if (active === home || active === archive) filter(active, params);
  const article = notes.find(
    (note) => "/post/" + note.id === decodeURIComponent(path),
  );
  document.title = article
    ? article.title + " · 咕诗奈的博客"
    : active === archive
      ? "归档 · 咕诗奈的博客"
      : "咕诗奈的博客 · 不规则脑电波";
  document
    .querySelectorAll<HTMLElement>(".site-header nav a")
    .forEach((link, index) =>
      link.classList.toggle(
        "active",
        index === 0
          ? active === home
          : index === 1
            ? active === archive
            : false,
      ),
    );
  if (anchor) {
    const target =
      anchor === "main"
        ? active
        : active.querySelector<HTMLElement>(
            '[data-anchor="' + CSS.escape(anchor) + '"]',
          );
    requestAnimationFrame(() =>
      target?.scrollIntoView({ behavior: reduced.matches ? "auto" : "smooth" }),
    );
  } else if (previous !== active)
    window.scrollTo({ top: 0, behavior: "instant" });
  updateProgress();
}
function routeQuery(
  change: Record<string, string | undefined>,
  replace = false,
) {
  const raw = location.hash.slice(1) || "/";
  const base = raw.split("#")[0];
  const [path, query] = base.split("?");
  const params = new URLSearchParams(query || "");
  Object.entries(change).forEach(([key, value]) =>
    value ? params.set(key, value) : params.delete(key),
  );
  const target = "#" + (path || "/") + (params.size ? "?" + params : "");
  if (replace) {
    history.replaceState(null, "", target);
    navigate();
  } else location.hash = target;
}
for (const container of [home, archive]) {
  const input = container.querySelector<HTMLInputElement>(
    'input[type="search"]',
  )!;
  input.addEventListener("input", () =>
    routeQuery({ q: input.value || undefined }, true),
  );
  container.querySelector("form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    routeQuery({ q: input.value || undefined }, true);
  });
  container
    .querySelectorAll<HTMLButtonElement>(".filter-tabs button")
    .forEach((button) =>
      button.addEventListener("click", () =>
        routeQuery({ tag: button.dataset.tag || undefined }),
      ),
    );
}
async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
document.addEventListener("click", async (event) => {
  const target = event.target as Element;
  const code = target.closest<HTMLButtonElement>(".copy-code");
  if (code) {
    code.textContent = (await copy(
      code.closest(".code-block-container")?.querySelector("code")
        ?.textContent || "",
    ))
      ? "已复制"
      : "请手动复制";
    return;
  }
  const tool = target.closest<HTMLButtonElement>(".reading-tools button");
  if (tool) {
    const action = tool.dataset.action;
    if (action === "text") {
      const paper = tool.closest(".article-paper")!;
      const large = paper.classList.toggle("large-text");
      tool.setAttribute("aria-pressed", String(large));
      tool.textContent = large ? "Aa 标准字号" : "Aa 大字阅读";
    }
    if (action === "toc") {
      const toc = tool
        .closest(".article-header")
        ?.querySelector<HTMLElement>(".mobile-toc");
      if (toc) {
        toc.hidden = !toc.hidden;
        tool.setAttribute("aria-expanded", String(!toc.hidden));
        tool.textContent = toc.hidden ? "目录 +" : "目录 −";
      }
    }
    if (action === "share") {
      const ok = await copy(location.href);
      let status = tool
        .closest(".article-header")
        ?.querySelector<HTMLElement>("[data-share-status]");
      if (!status) {
        status = document.createElement("p");
        status.dataset.shareStatus = "";
        status.setAttribute("role", "status");
        tool.closest(".article-header")?.append(status);
      }
      status.textContent = ok ? "文章链接已复制。" : "请从地址栏复制文章链接。";
    }
  }
  const tocLink = target.closest(".mobile-toc a");
  if (tocLink) {
    const toc = tocLink.closest<HTMLElement>(".mobile-toc")!;
    toc.hidden = true;
    const button = toc
      .closest(".article-header")
      ?.querySelector<HTMLButtonElement>('[data-action="toc"]');
    button?.setAttribute("aria-expanded", "false");
    if (button) button.textContent = "目录 +";
  }
});
function updateProgress() {
  const progress = document.querySelector<HTMLElement>(".reading-progress");
  if (!progress) return;
  const distance = document.documentElement.scrollHeight - innerHeight;
  progress.style.width =
    active.querySelector("article") && distance > 0
      ? Math.min(100, (scrollY / distance) * 100) + "%"
      : "0%";
}
window.addEventListener("scroll", updateProgress, { passive: true });
window.addEventListener("hashchange", navigate);
window.addEventListener(
  "pointermove",
  (event) => {
    if (event.pointerType !== "mouse" || reduced.matches) return;
    const surface = (event.target as Element).closest<HTMLElement>(
      ".hero,.signal-art,.profile-panel",
    );
    if (surface) {
      const rect = surface.getBoundingClientRect();
      surface.style.setProperty(
        "--light-x",
        ((event.clientX - rect.left) / rect.width) * 100 + "%",
      );
      surface.style.setProperty(
        "--light-y",
        ((event.clientY - rect.top) / rect.height) * 100 + "%",
      );
    }
  },
  { passive: true },
);
if ("IntersectionObserver" in window && !reduced.matches) {
  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }),
    { threshold: 0.06 },
  );
  document.querySelectorAll<HTMLElement>(".post-row").forEach((row) => {
    row.classList.add("reveal-ready");
    observer.observe(row);
  });
}
syncAppearance();
navigate();
document
  .querySelectorAll<HTMLCanvasElement>("canvas.liquid-scene")
  .forEach((canvas) => mountLiquid(canvas));
