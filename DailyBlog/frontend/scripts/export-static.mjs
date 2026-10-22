import fs from "node:fs/promises";
import path from "node:path";
import { createServer, build } from "vite";
import { JSDOM } from "jsdom";
const environment = new JSDOM(
  '<!doctype html><html data-style="collage" data-theme="light"><body></body></html>',
  { url: "https://static.local/#/" },
);
Object.assign(globalThis, {
  window: environment.window,
  document: environment.window.document,
  Element: environment.window.Element,
  SVGElement: environment.window.SVGElement,
  HTMLElement: environment.window.HTMLElement,
  history: environment.window.history,
  location: environment.window.location,
});
const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
});
try {
  const { renderPage, content } = await server.ssrLoadModule(
    "/src/entry-server.ts",
  );
  const base = new JSDOM(
    "<!doctype html><html><head></head><body>" +
      (await renderPage("/")) +
      "</body></html>",
  );
  const document = base.window.document;
  document.documentElement.lang = "zh-CN";
  document.documentElement.dataset.style = "collage";
  const home = document.querySelector("main");
  home.dataset.page = "/";
  const shell = document.querySelector(".site-shell"),
    footer = shell.querySelector(":scope > .site-footer");
  async function addPage(route, key) {
    const page = new JSDOM(
      await renderPage(route),
    ).window.document.querySelector("main");
    page.dataset.page = key;
    page.hidden = true;
    page.removeAttribute("id");
    shell.insertBefore(document.importNode(page, true), footer);
  }
  await addPage("/?view=archive", "archive");
  for (const post of content.posts)
    await addPage("/post/" + encodeURIComponent(post.id), "/post/" + post.id);
  const notFound = document.createElement("main");
  notFound.hidden = true;
  notFound.className = "empty-state";
  notFound.dataset.page = "404";
  notFound.innerHTML =
    '<h1>这段信号暂时无法接收</h1><p>没有找到这篇文章。</p><a href="#/" class="text-link">返回文章列表 ↗</a>';
  shell.insertBefore(notFound, footer);
  const tags = [
    ...new Map(
      content.posts.flatMap((post) => post.tags.map((tag) => [tag, 0])),
    ).keys(),
  ].sort(
    (a, b) =>
      content.posts.filter((p) => p.tags.includes(b)).length -
      content.posts.filter((p) => p.tags.includes(a)).length,
  );
  document
    .querySelectorAll(".filter-tabs")
    .forEach((list) =>
      Array.from(list.querySelectorAll("button")).forEach(
        (button, index) => (button.dataset.tag = index ? tags[index - 1] : ""),
      ),
    );
  for (const link of document.querySelectorAll("a")) {
    const href = link.getAttribute("href") || "";
    if (href.startsWith("/")) link.setAttribute("href", "#" + href);
  }
  for (const row of document.querySelectorAll(".post-row,.archive-group>a")) {
    const href = (
      row.matches("a") ? row : row.querySelector(".post-title-link")
    ).getAttribute("href");
    row.dataset.postId = decodeURIComponent(href.slice("#/post/".length));
  }
  document.querySelectorAll(".reading-tools").forEach((tools) => {
    const buttons = tools.querySelectorAll("button");
    buttons[0].dataset.action = "text";
    buttons[buttons.length - 1].dataset.action = "share";
    const toggle = tools.querySelector(".mobile-toc-toggle");
    if (toggle) {
      toggle.dataset.action = "toc";
      const desktop = tools
        .closest(".reader-columns")
        .querySelector(".reader-aside nav");
      const toc = document.createElement("nav");
      toc.className = "mobile-toc";
      toc.setAttribute("aria-label", "文章目录");
      toc.hidden = true;
      toc.innerHTML = desktop.innerHTML;
      tools.parentElement.append(toc);
    }
  });
  // Keep every pre-rendered page's IDs unique, including search labels and footnotes.
  let pageNumber = 0;
  for (const page of document.querySelectorAll("main[data-page]")) {
    const prefix = "page" + pageNumber++ + "-";
    const mapping = new Map();
    for (const element of page.querySelectorAll("[id]")) {
      const original = element.id;
      mapping.set(original, prefix + original);
      element.dataset.anchor = original;
      element.id = prefix + original;
    }
    for (const element of page.querySelectorAll(
      "[for],[aria-labelledby],[aria-describedby]",
    ))
      for (const attribute of ["for", "aria-labelledby", "aria-describedby"]) {
        const value = element.getAttribute(attribute);
        if (value)
          element.setAttribute(
            attribute,
            value
              .split(" ")
              .map((id) => mapping.get(id) || id)
              .join(" "),
          );
      }
  }
  // Store the animated avatar once; all instances share the same CSS background.
  const avatar = content.profile.avatar;
  document.querySelectorAll("img").forEach((image) => {
    if (image.getAttribute("src") === avatar) {
      image.setAttribute(
        "src",
        "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
      );
      image.classList.add("shared-avatar");
    }
  });
  const vueHtml = await fs.readFile("dist-vue/index.html", "utf8");
  const built = new JSDOM(vueHtml);
  for (const style of built.window.document.querySelectorAll("style"))
    document.head.append(document.importNode(style, true));
  const shared = document.createElement("style");
  shared.textContent =
    ':root{--profile-image:url("' +
    avatar +
    '")} .shared-avatar{background-image:var(--profile-image);background-size:cover;background-position:center 35%} [hidden]{display:none!important}';
  document.head.append(shared);
  const initial = await fs.readFile("index.html", "utf8");
  const sourceHead = new JSDOM(initial).window.document.head;
  for (const node of sourceHead.querySelectorAll("meta,title,script"))
    document.head.append(document.importNode(node, true));
  const charset = document.createElement("meta");
  charset.setAttribute("charset", "utf-8");
  document.head.prepend(charset);
  const icon = document.createElement("link");
  icon.rel = "icon";
  icon.href =
    "data:image/svg+xml," +
    encodeURIComponent(await fs.readFile("public/favicon.svg", "utf8"));
  document.head.append(icon);
  const progress = document.createElement("div");
  progress.className = "reading-progress";
  progress.style.width = "0%";
  document.body.prepend(progress);
  const data = document.createElement("script");
  data.type = "application/json";
  data.id = "search-index";
  data.textContent = JSON.stringify(
    content.posts.map((post) => ({
      id: post.id,
      title: post.title,
      date: post.date,
      tags: post.tags,
      text: [post.title, post.content, ...post.tags].join(" ").toLowerCase(),
    })),
  ).replace(/</g, "\\u003c");
  document.body.append(data);
  const result = await build({
    configFile: false,
    logLevel: "warn",
    build: {
      write: false,
      minify: true,
      lib: {
        entry: path.resolve("src/static-client.ts"),
        formats: ["iife"],
        name: "GushiinaStatic",
      },
      rollupOptions: { output: { inlineDynamicImports: true } },
    },
  });
  const compiled = Array.isArray(result) ? result[0] : result;
  const code = compiled.output.find((output) => output.type === "chunk").code;
  const script = document.createElement("script");
  script.textContent = code.replace(/<\/script/gi, "<\\/script");
  document.body.append(script);
  const noScript = document.createElement("noscript");
  noScript.innerHTML =
    "<style>main[data-page]{display:block!important}.site-header .appearance-controls{display:none}</style><p>JavaScript 已关闭，文章全文仍可在本页阅读。</p>";
  document.body.append(noScript);
  await fs.mkdir("dist", { recursive: true });
  await fs.writeFile(
    "dist/index.html",
    "<!doctype html>\n" + document.documentElement.outerHTML,
  );
  await fs.copyFile("dist-vue/index.html", "dist/vue.html");
  await fs.writeFile("dist/.nojekyll", "");
  console.log(
    "Static HTML exported:",
    content.posts.length,
    "articles; Vue edition: dist/vue.html",
  );
} finally {
  await server.close();
  environment.window.close();
}
