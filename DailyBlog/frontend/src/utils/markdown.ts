import MarkdownIt from "markdown-it";
import footnote from "markdown-it-footnote";
import mark from "markdown-it-mark";
import taskLists from "markdown-it-task-lists";
import hljs from "highlight.js/lib/common";
import katex from "katex";
import DOMPurify from "dompurify";
import type { Post } from "@/types";

export interface Heading {
  id: string;
  text: string;
  level: number;
}
interface RenderEnv extends Record<PropertyKey, unknown> {
  posts: Post[];
  headings: Heading[];
  ids: Map<string, number>;
  noteId: string;
  attachments: Record<string, string>;
}
const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );
export function headingId(text: string) {
  return (
    text
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}_-]+/gu, "-")
      .replace(/^-|-$/g, "") || "section"
  );
}
const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
  typographer: false,
});
md.use(footnote).use(mark).use(taskLists, { enabled: false });

md.renderer.rules.fence = (tokens, index) => {
  const token = tokens[index];
  const language = token.info.trim().split(/\s+/)[0].toLowerCase();
  const aliases: Record<string, string> = {
    "c++": "cpp",
    "c#": "csharp",
    cs: "csharp",
    ts: "typescript",
    js: "javascript",
    py: "python",
    sh: "bash",
  };
  const lang = aliases[language] || language;
  const code = hljs.getLanguage(lang)
    ? hljs.highlight(token.content, { language: lang }).value
    : escape(token.content);
  return `<div class="code-block-container"><div class="code-block-header"><span>${escape(language || "TEXT")}</span><button type="button" class="copy-code" aria-label="复制代码">复制</button></div><pre><code class="hljs">${code}</code></pre></div>`;
};
md.renderer.rules.heading_open = (tokens, index, options, rawEnv, self) => {
  const env = rawEnv as RenderEnv;
  const text =
    tokens[index + 1]?.children?.map((t) => t.content).join("") ||
    tokens[index + 1]?.content ||
    "";
  const base = headingId(text);
  const count = env.ids.get(base) || 0;
  env.ids.set(base, count + 1);
  const id = count ? `${base}-${count}` : base;
  tokens[index].attrSet("id", id);
  env.headings.push({ id, text, level: Number(tokens[index].tag.slice(1)) });
  return self.renderToken(tokens, index, options);
};
md.renderer.rules.table_open = () =>
  '<div class="table-scroll" tabindex="0" role="region" aria-label="可横向滚动的表格"><table>';
md.renderer.rules.table_close = () => "</table></div>";
const defaultImage = md.renderer.rules.image!;
md.renderer.rules.image = (tokens, index, options, rawEnv, self) => {
  const env = rawEnv as RenderEnv;
  const token = tokens[index];
  const source = String(token.attrGet("src") || "");
  if (!/^(https?:\/\/|data:image\/)/i.test(source)) {
    const requested = decodeSafe(source)
      .replace(/\\/g, "/")
      .replace(/^\.?\//, "");
    const relative =
      "posts/" + env.noteId.split("/").slice(0, -1).concat(requested).join("/");
    const basename = requested.split("/").pop() || requested;
    const attachment =
      env.attachments[relative] ||
      env.attachments[requested] ||
      env.attachments["posts/" + requested] ||
      env.attachments[basename];
    const missing =
      '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="110"><rect width="100%" height="100%" rx="8" fill="#e8edf5"/><text x="20" y="45" fill="#526480" font-size="16">图片未随笔记发布</text><text x="20" y="76" fill="#526480" font-size="13">' +
      escape(basename) +
      "</text></svg>";
    token.attrSet(
      "src",
      attachment || "data:image/svg+xml," + encodeURIComponent(missing),
    );
  }
  const alt = token.content || "";
  const size = alt.match(/\|(\d+)(?:x(\d+))?$/);
  if (size) {
    token.attrSet("width", String(Math.min(1600, Number(size[1]))));
    if (size[2])
      token.attrSet("height", String(Math.min(1600, Number(size[2]))));
  }
  token.attrSet("loading", "lazy");
  return defaultImage(tokens, index, options, env, self);
};
function decodeSafe(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
const defaultLink =
  md.renderer.rules.link_open ||
  ((tokens, index, options, _env, self) =>
    self.renderToken(tokens, index, options));
md.renderer.rules.link_open = (tokens, index, options, env, self) => {
  if (/^https?:\/\//.test(String(tokens[index].attrGet("href") || ""))) {
    tokens[index].attrSet("target", "_blank");
    tokens[index].attrSet("rel", "noopener noreferrer");
  }
  return defaultLink(tokens, index, options, env, self);
};
// Inline rules run after code and escape handling; they never rewrite fenced or inline code.
md.inline.ruler.after("escape", "obsidian_link", (state, silent) => {
  const source = state.src.slice(state.pos);
  const match = source.match(/^(!?)\[\[([^\]\n]+)\]\]/);
  if (!match) return false;
  if (silent) return true;
  const env = state.env as RenderEnv;
  const [destination, ...labels] = match[2].split("|");
  const hashIndex = destination.indexOf("#");
  const note = (
    hashIndex >= 0 ? destination.slice(0, hashIndex) : destination
  ).replace(/\.md$/i, "");
  const anchor = hashIndex >= 0 ? destination.slice(hashIndex + 1) : "";
  const label = labels.join("|") || destination;
  if (match[1] && /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(destination)) {
    const token = state.push("image", "img", 0);
    token.attrSet("src", destination);
    token.attrSet("alt", "");
    token.content = label;
    const child = new state.Token("text", "", 0);
    child.content =
      labels.length && !/^\d+(x\d+)?$/.test(label)
        ? label
        : note.split("/").pop() || "";
    token.children = [child];
    if (/^\d+(x\d+)?$/.test(label)) token.content = "|" + label;
  } else {
    const candidates = env.posts.filter(
      (p) =>
        p.id === note || p.title === note || p.id.split("/").pop() === note,
    );
    const target = note
      ? candidates.length === 1
        ? candidates[0]
        : undefined
      : env.posts.find((p) => p.id === env.noteId);
    const href = !note
      ? "#/post/" + encodeURIComponent(env.noteId) + "#" + headingId(anchor)
      : target
        ? "#/post/" +
          encodeURIComponent(target.id) +
          (anchor ? "#" + headingId(anchor) : "")
        : "";
    const token = state.push("html_inline", "", 0);
    token.content = href
      ? `<a href="${escape(href)}"${match[1] ? ' class="note-embed"' : ""}>${match[1] ? "↗ 嵌入笔记：" : ""}${escape(label)}</a>`
      : `<span class="unresolved-link" title="未找到已发布的笔记">${escape(label)}（笔记未发布）</span>`;
  }
  state.pos += match[0].length;
  return true;
});
md.inline.ruler.after("obsidian_link", "obsidian_tag", (state, silent) => {
  if (
    state.linkLevel > 0 ||
    (state.pos > 0 && !/[\s（(]/.test(state.src[state.pos - 1]))
  )
    return false;
  const match = state.src
    .slice(state.pos)
    .match(/^#([\p{L}\p{N}_-]+(?:\/[\p{L}\p{N}_-]+)*)/u);
  if (!match || /^\d+$/.test(match[1])) return false;
  if (!silent) {
    const token = state.push("html_inline", "", 0);
    token.content = `<a class="obsidian-tag" href="#/?tag=${encodeURIComponent(match[1])}">${escape(match[0])}</a>`;
  }
  state.pos += match[0].length;
  return true;
});
md.inline.ruler.after("obsidian_tag", "math_inline", (state, silent) => {
  if (state.src[state.pos] !== "$" || state.src[state.pos + 1] === "$")
    return false;
  let end = state.pos + 1;
  while (
    (end = state.src.indexOf("$", end)) >= 0 &&
    state.src[end - 1] === "\\"
  )
    end++;
  if (end < 0 || /\n/.test(state.src.slice(state.pos + 1, end))) return false;
  const math = state.src.slice(state.pos + 1, end);
  if (!math.trim()) return false;
  if (!silent) {
    const token = state.push("html_inline", "", 0);
    token.content = katex.renderToString(math, {
      throwOnError: false,
      strict: false,
      trust: false,
    });
  }
  state.pos = end + 1;
  return true;
});
md.block.ruler.before(
  "fence",
  "math_block",
  (state, startLine, endLine, silent) => {
    const start = state.bMarks[startLine] + state.tShift[startLine];
    if (!state.src.slice(start, state.eMarks[startLine]).startsWith("$$"))
      return false;
    const close = state.src.indexOf("$$", start + 2);
    if (close < 0) return false;
    let next = startLine;
    while (next < endLine && state.eMarks[next] < close + 2) next++;
    if (
      next >= endLine ||
      state.src.slice(close + 2, state.eMarks[next]).trim()
    )
      return false;
    if (silent) return true;
    const token = state.push("html_block", "", 0);
    token.content = katex.renderToString(
      state.src.slice(start + 2, close).trim(),
      { displayMode: true, throwOnError: false, strict: false, trust: false },
    );
    state.line = next + 1;
    return true;
  },
);
md.core.ruler.after("inline", "callouts", (state) => {
  const stack: number[] = [];
  state.tokens.forEach((token, index) => {
    if (token.type === "blockquote_open") stack.push(index);
    if (token.type !== "blockquote_close") return;
    const open = stack.pop();
    if (open === undefined) return;
    const first = state.tokens[open + 2];
    if (first?.type !== "inline") return;
    const match = first.content.match(
      /^\[!([\w-]+)\]([+-])?(?:[ \t]+([^\n]*))?(?:\n|$)/,
    );
    if (!match) return;
    const names: Record<string, string> = {
      note: "笔记",
      info: "信息",
      tip: "提示",
      warning: "注意",
      danger: "警告",
      question: "问题",
      quote: "引用",
      example: "示例",
      abstract: "摘要",
      success: "完成",
      todo: "待办",
    };
    const title = match[3] || names[match[1].toLowerCase()] || match[1];
    const collapsible = !!match[2];
    state.tokens[open].type = "html_block";
    state.tokens[open].tag = "";
    state.tokens[open].nesting = 0;
    state.tokens[open].content = collapsible
      ? `<details class="callout"${match[2] === "+" ? " open" : ""}><summary class="callout-title">${escape(title)}</summary>`
      : `<aside class="callout"><div class="callout-title">${escape(title)}</div>`;
    token.type = "html_block";
    token.tag = "";
    token.nesting = 0;
    token.content = collapsible ? "</details>" : "</aside>";
    first.content = first.content.slice(match[0].length);
    first.children = md.parseInline(first.content, state.env)[0].children;
  });
});

export function renderMarkdown(
  content: string,
  posts: Post[] = [],
  noteId = "",
  attachments: Record<string, string> = {},
) {
  const env: RenderEnv = {
    posts,
    headings: [],
    ids: new Map(),
    noteId,
    attachments,
  };
  const html = md.render(content, env);
  const linkedHtml = html.replace(
    /href="#(?!\/)([^"]*)"/g,
    (_match, anchor: string) =>
      'href="#/post/' + encodeURIComponent(noteId) + "#" + anchor + '"',
  );
  return {
    html: DOMPurify.sanitize(linkedHtml, {
      ADD_TAGS: ["annotation", "semantics"],
      ADD_ATTR: ["encoding", "target"],
      FORBID_ATTR: ["onerror", "onclick", "onload"],
    }),
    headings: env.headings,
  };
}
export function parseMarkdown(content: string) {
  return renderMarkdown(content).html;
}
