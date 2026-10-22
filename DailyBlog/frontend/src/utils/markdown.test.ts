import { describe, expect, it } from "vitest";
import { renderMarkdown } from "./markdown";
import type { Post } from "../types";
const notes: Post[] = [
  {
    id: "folder/测试笔记",
    title: "测试笔记",
    date: "2026-01-01",
    content: "",
    tags: [],
    excerpt: "",
    wordCount: 0,
  },
];
function dom(source: string) {
  const result = renderMarkdown(source, notes, "folder/测试笔记", {
    "附件/测试图.png": "data:image/png;base64,dGVzdA==",
    "附件/test.png": "data:image/png;base64,dGVzdA==",
  });
  const root = document.createElement("div");
  root.innerHTML = result.html;
  return { root, ...result };
}
describe("Obsidian publishing", () => {
  it("protects fenced and inline code from math, tags, images and links", () => {
    const code = "$price$ #标签 ![[photo.png]] [[测试笔记]] ==test==";
    const result = dom("```txt\n" + code + "\n```\n\n`" + code + "`");
    expect(
      result.root.querySelectorAll(".katex, .obsidian-tag, img, mark, a"),
    ).toHaveLength(0);
    expect(result.root.querySelector("pre code")?.textContent?.trim()).toBe(
      code,
    );
  });
  it("renders inline and multiline formulas including inside tables", () => {
    const result = dom(
      "$x^2$\n\n$$\n\\frac{a}{b}\n$$\n\n|公式|\n|---|\n|$O(n)$|",
    );
    expect(result.root.querySelectorAll(".katex")).toHaveLength(3);
    expect(result.root.querySelectorAll(".katex-display")).toHaveLength(1);
    expect(result.root.querySelector(".table-scroll table")).not.toBeNull();
  });
  it("resolves published wiki links and local headings, preserves missing notes visibly", () => {
    const result = dom("[[测试笔记#章节|别名]] [[不存在]] [[#章节]]");
    const links = result.root.querySelectorAll("a");
    expect(links[0].getAttribute("href")).toBe(
      "#/post/" + encodeURIComponent("folder/测试笔记") + "#章节",
    );
    expect(links[0].textContent).toBe("别名");
    expect(links[1].getAttribute("href")).toBe(
      "#/post/" + encodeURIComponent("folder/测试笔记") + "#章节",
    );
    expect(result.root.textContent).toContain("笔记未发布");
  });
  it("handles nested images, Obsidian dimensions and normal linked images", () => {
    const result = dom(
      "![[附件/测试图.png|240x120]]\n\n[![图片](附件/test.png)](https://example.com)",
    );
    const images = result.root.querySelectorAll("img");
    expect(images).toHaveLength(2);
    expect(images[0].getAttribute("src")).toBe(
      "data:image/png;base64,dGVzdA==",
    );
    expect(images[0].getAttribute("width")).toBe("240");
    expect(result.root.querySelector("a img")).not.toBeNull();
  });
  it("supports callouts with fold state, highlights, footnotes and tasks", () => {
    const result = dom(
      "> [!warning]- 注意事项\n> ==高亮==\n\n- [x] 完成\n\n正文[^1]\n\n[^1]: 脚注",
    );
    expect(result.root.querySelector("details.callout")).not.toBeNull();
    expect(result.root.querySelector("details")?.hasAttribute("open")).toBe(
      false,
    );
    expect(result.root.querySelector("summary")?.textContent).toBe("注意事项");
    expect(result.root.querySelector("mark")?.textContent).toBe("高亮");
    expect(result.root.querySelector("input")?.checked).toBe(true);
    expect(result.root.querySelector(".footnotes")).not.toBeNull();
  });
  it("does not turn URL fragments or code tags into inline hashtags", () => {
    const result = dom("#算法/链表 https://example.com/#fragment `#code`");
    expect(result.root.querySelectorAll(".obsidian-tag")).toHaveLength(1);
    expect(result.root.querySelector(".obsidian-tag")?.textContent).toBe(
      "#算法/链表",
    );
  });
  it("generates unique headings and strips executable input", () => {
    const result = dom(
      "## 同名\n\n## 同名\n\n<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n[x](javascript:alert(1))",
    );
    expect(result.headings.map((h) => h.id)).toEqual(["同名", "同名-1"]);
    expect(
      result.root.querySelector('script, [onerror], a[href^="javascript:"]'),
    ).toBeNull();
  });
});
