import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import type { Plugin } from "vite";
const frontend = fileURLToPath(new URL("../", import.meta.url));
const content = path.resolve(frontend, "../content");
async function files(directory: string): Promise<string[]> {
  const entries = await fs
    .readdir(directory, { withFileTypes: true })
    .catch(() => []);
  return (
    await Promise.all(
      entries
        .filter((e) => !e.name.startsWith("."))
        .map((e) =>
          e.isDirectory()
            ? files(path.join(directory, e.name))
            : [path.join(directory, e.name)],
        ),
    )
  ).flat();
}
const normalized = (value: string) => value.replace(/\\/g, "/");
const mime: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
};
function plainText(source: string) {
  return source
    .replace(/```[\s\S]*?```|~~~[\s\S]*?~~~/g, " ")
    .replace(/!\[\[[^\]]+\]\]|!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, "$2 $1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#*`>~=$|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
// First publication is stable across checkouts and later edits.
function firstPublished(file: string): Date | undefined {
  try {
    const dates = execFileSync("git", ["log", "--follow", "--diff-filter=A", "--format=%cI", "--", file], {
      cwd: frontend, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"],
    }).trim().split("\n").filter(Boolean);
    const date = new Date(dates[dates.length - 1] || "");
    return Number.isNaN(date.getTime()) ? undefined : date;
  } catch {
    return undefined;
  }
}
export async function readContent() {
  const all = await files(content);
  const markdown = all.filter(
    (f) =>
      normalized(path.relative(content, f)).startsWith("posts/") &&
      /\.md$/i.test(f),
  );
  const posts = await Promise.all(
    markdown.map(async (file) => {
      const { data, content: body } = matter(await fs.readFile(file, "utf8"));
      const id = normalized(
        path.relative(path.join(content, "posts"), file),
      ).replace(/\.md$/i, "");
      const prose = body.replace(
        /```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`|\[[^\]]*\]\([^)]+\)/g,
        " ",
      );
      const inlineTags = [
        ...prose.matchAll(/(?:^|\s)#([\p{L}\p{N}_-]+(?:\/[\p{L}\p{N}_-]+)*)/gu),
      ]
        .map((m) => m[1])
        .filter((t) => !/^\d+$/.test(t));
      const frontTags = Array.isArray(data.tags)
        ? data.tags
        : typeof data.tags === "string"
          ? data.tags.split(/[,，\s]+/)
          : [];
      const tags = [
        ...new Set(
          [
            ...frontTags.map(String).map((t) => t.replace(/^#/, "")),
            ...inlineTags,
          ].filter(Boolean),
        ),
      ];
      const stat = await fs.stat(file);
      const published = firstPublished(file) || stat.birthtime;
      const candidate = data.publishedAt || data.date || data.created;
      const parsedDate = candidate ? new Date(candidate) : published;
      const date = Number.isNaN(parsedDate.getTime()) ? published : parsedDate;
      // Date-only metadata must not put a newer post behind same-day uploads.
      const dateOnly = typeof candidate === "string"
        ? /^\d{4}-\d{2}-\d{2}$/.test(candidate)
        : candidate instanceof Date && candidate.toISOString().endsWith("T00:00:00.000Z");
      const publicationTime = dateOnly && date.toISOString().slice(0, 10) === published.toISOString().slice(0, 10)
        ? published.getTime() : date.getTime();
      const text = plainText(body);
      return {
        id,
        title: String(data.title || id.split("/").pop()),
        publishedAt: publicationTime,
        firstPublishedAt: published.getTime(),
        date: (Number.isNaN(date.getTime()) ? stat.mtime : date)
          .toISOString()
          .slice(0, 10),
        tags,
        content: body.trim(),
        wordCount: text.replace(/\s/g, "").length,
        excerpt: text.slice(0, 140) + (text.length > 140 ? "…" : ""),
      };
    }),
  );
  posts.sort(
    (a, b) =>
      b.publishedAt - a.publishedAt ||
      b.firstPublishedAt - a.firstPublishedAt ||
      a.title.localeCompare(b.title, "zh-CN"),
  );
  const profile = JSON.parse(
    await fs.readFile(path.join(content, "config/profile.json"), "utf8"),
  );
  const publicDir = path.join(frontend, "public");
  const images = [
    ...all,
    ...(await files(path.join(publicDir, "ReferencePicture"))),
    ...(await files(path.join(publicDir, "assets"))),
  ].filter((f) => mime[path.extname(f).toLowerCase()]);
  const attachments: Record<string, string> = {};
  const basenames = new Map<string, string[]>();
  for (const image of images) {
    const key = normalized(
      path.relative(image.startsWith(publicDir) ? publicDir : content, image),
    );
    const data =
      "data:" +
      mime[path.extname(image).toLowerCase()] +
      ";base64," +
      (await fs.readFile(image)).toString("base64");
    attachments[key] = data;
    const basename = path.basename(image);
    basenames.set(basename, [...(basenames.get(basename) || []), key]);
  }
  for (const [name, keys] of basenames)
    if (keys.length === 1) attachments[name] = attachments[keys[0]];
  if (profile.avatar)
    profile.avatar =
      attachments[String(profile.avatar).replace(/^\//, "")] || profile.avatar;
  return { posts, profile, attachments };
}
function serializeContent(data: Awaited<ReturnType<typeof readContent>>) {
  const assets = [...new Set(Object.values(data.attachments))];
  const indices = new Map(assets.map((value, index) => [value, index]));
  const encode = (value: unknown) =>
    JSON.stringify(value).replace(/</g, "\\u003c");
  const links = Object.entries(data.attachments).map(([key, value]) => [
    key,
    indices.get(value),
  ]);
  const profile = { ...data.profile, avatar: undefined };
  const avatar = indices.get(data.profile.avatar);
  return (
    "const assets=" +
    encode(assets) +
    ";export default {posts:" +
    encode(data.posts) +
    ",profile:{..." +
    encode(profile) +
    ",avatar:" +
    (avatar === undefined
      ? encode(data.profile.avatar)
      : "assets[" + avatar + "]") +
    "},attachments:Object.fromEntries(" +
    encode(links) +
    ".map(([key,index])=>[key,assets[index]]))}"
  );
}
export function contentPlugin(): Plugin {
  return {
    name: "obsidian-static-content",
    resolveId(id) {
      if (id === "virtual:blog-content") return "\0virtual:blog-content";
    },
    async load(id) {
      if (id === "\0virtual:blog-content") {
        const data = await readContent();
        return serializeContent(data);
      }
    },
    configureServer(server) {
      server.watcher.add(content);
      server.watcher.on("all", (_event, file) => {
        if (normalized(file).startsWith(normalized(content))) {
          const module = server.moduleGraph.getModuleById(
            "\0virtual:blog-content",
          );
          if (module) server.moduleGraph.invalidateModule(module);
          server.ws.send({ type: "full-reload" });
        }
      });
    },
  };
}
