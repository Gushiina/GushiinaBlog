import { test, expect } from "@playwright/test";
import path from "node:path";
import { readContent } from "../scripts/content";
for (const edition of [
  { name: "static", file: "/" },
  { name: "vue", file: "/vue.html" },
]) {
  test(edition.name + " defaults to fluorescent collage", async ({ page }) => {
    await page.goto(edition.file + "#/");
    await expect(page.locator("html")).toHaveAttribute("data-style", "collage");
    await expect(
      page.getByRole("button", { name: "切换 Aero 玻璃风格", exact: true }),
    ).toBeVisible();
  });
  test.describe(edition.name, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(edition.file + "#/");
      await expect(page.locator(".post-row").first()).toBeAttached();
      await page
        .getByRole("button", { name: "切换 Aero 玻璃风格", exact: true })
        .click();
      await expect(page.locator("html")).toHaveAttribute("data-style", "aero");
    });
    test("preserves control geometry, typography and theme preference", async ({
      page,
    }) => {
      const selectors = [
        ".style-button",
        ".theme-button",
        ".search-box",
        ".filter-tabs button:first-child",
        ".post-title-link h3",
        ".article-paper",
      ];
      const measure = () =>
        page.evaluate(
          (selectors) =>
            selectors.map((selector) => {
              const el = document.querySelector(selector);
              if (!el) return null;
              const rect = el.getBoundingClientRect();
              return {
                width: Math.round(rect.width),
                height: Math.round(rect.height),
                font: getComputedStyle(el).fontSize,
              };
            }),
          selectors,
        );
      const aero = await measure();
      await page
        .getByRole("button", { name: "切换荧光拼贴风格", exact: true })
        .click();
      await expect(page.locator("html")).toHaveAttribute(
        "data-style",
        "collage",
      );
      expect(await measure()).toEqual(aero);
      await page
        .getByRole("button", { name: "切换深色模式", exact: true })
        .click();
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
      await page.reload();
      await expect(page.locator("html")).toHaveAttribute(
        "data-style",
        "collage",
      );
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    });
    test("searches body text, handles empty results and tag URLs", async ({
      page,
    }) => {
      const search = page.getByRole("searchbox", { name: "搜索文章全文" });
      await search.fill("Quaternion.Slerp");
      await expect(page.locator(".post-row:visible")).toHaveCount(2);
      await expect(page.locator(".post-row:visible h3")).toContainText([
        "角色控制器",
        "Unity输入流水线知识模块",
      ]);
      await search.fill("zzzz-no-signal-1985");
      await expect(page.getByText(/这个频段暂时没有信号/)).toBeVisible();
      await page.goto(edition.file + "#/?tag=" + encodeURIComponent("链表"));
      await expect(page.locator(".post-row:visible")).toHaveCount(8);
    });
    test("renders real article, equations, code and updates navigation", async ({
      page,
    }) => {
      await page
        .getByRole("link", { name: "拆解2 角色控制器", exact: true })
        .click();
      await expect(page.locator(".article-header h1:visible")).toHaveText(
        "拆解2 角色控制器",
      );
      await expect(
        page.locator(".markdown-content .katex").first(),
      ).toBeAttached();
      await expect(page.locator(".copy-code").first()).toBeAttached();
      await page
        .getByRole("button", { name: "Aa 大字阅读", exact: true })
        .click();
      await expect(page.locator(".article-paper:visible")).toHaveClass(
        /large-text/,
      );
      await page.reload();
      await expect(page.locator(".article-header h1:visible")).toHaveText(
        "拆解2 角色控制器",
      );
      await page.getByRole("link", { name: "返回日志", exact: false }).click();
      await expect(page).toHaveTitle("咕诗奈的博客 · 不规则脑电波");
    });
    test("supports responsive reading without horizontal overflow", async ({
      page,
    }) => {
      for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        await page
          .getByRole("link", { name: "拆解1 输入与移动", exact: true })
          .click();
        await expect(page.locator(".article-header h1:visible")).toHaveText(
          "拆解1 输入与移动",
        );
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        if (width < 760) {
          await page
            .getByRole("button", { name: "目录 +", exact: true })
            .click();
          await expect(
            page.locator("main:not([hidden]) .mobile-toc"),
          ).toBeVisible();
          await page
            .locator("main:not([hidden]) .mobile-toc a")
            .first()
            .click();
          await expect(
            page.locator("main:not([hidden]) .mobile-toc"),
          ).toBeHidden();
        }
        await page
          .getByRole("link", { name: "返回日志", exact: false })
          .click();
      }
    });
    test("keeps all articles and supports archive filtering", async ({
      page,
    }) => {
      const { posts } = await readContent();
      expect(posts.length).toBeGreaterThan(0);
      await expect(page.locator(".post-row")).toHaveCount(posts.length);
      await expect(page.locator(".post-row h3")).toHaveText(
        posts.map((post) => post.title),
      );
      await page
        .getByRole("link", { name: "归档 ARCHIVE", exact: true })
        .click();
      await expect(page.getByRole("heading", { name: /所有存档/ })).toHaveText(
        /所有存档/,
      );
      await expect(page.locator(".archive-group>a:visible")).toHaveCount(posts.length);
    });
    test("runs without an API and preserves a repository subpath", async ({
      page,
    }) => {
      const requests: string[] = [];
      page.on("request", (request) => requests.push(request.url()));
      await page.goto(
        "/GushiinaBlog/" +
          (edition.name === "vue" ? "vue.html" : "") +
          "#/post/" +
          encodeURIComponent("拆解2 角色控制器"),
      );
      await expect(page.locator(".article-header h1:visible")).toHaveText(
        "拆解2 角色控制器",
      );
      await page.reload();
      await expect(page.locator(".article-header h1:visible")).toBeVisible();
      expect(requests.some((url) => url.includes("/api/"))).toBe(false);
    });
    test("renders liquid and pauses it in the collage theme", async ({
      page,
    }) => {
      await expect(page.locator("canvas.liquid-scene")).toHaveAttribute(
        "data-render-state",
        "running",
      );
      await page
        .getByRole("button", { name: "切换荧光拼贴风格", exact: true })
        .click();
      await expect(page.locator("canvas.liquid-scene")).toHaveAttribute(
        "data-render-state",
        "paused",
      );
      await page
        .getByRole("button", { name: "切换 Aero 玻璃风格", exact: true })
        .click();
      await expect(page.locator("canvas.liquid-scene")).toHaveAttribute(
        "data-render-state",
        "running",
      );
    });
    test("honors reduced motion", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.reload();
      expect(
        await page
          .locator(".anime-window")
          .evaluate((el) => getComputedStyle(el).animationName),
      ).toBe("none");
    });
    test("captures both themes and mobile reading", async ({ page }) => {
      test.skip(
        !process.env.BLOG_SCREENSHOTS,
        "Screenshots requested explicitly for delivery",
      );
      const directory = process.env.BLOG_SCREENSHOTS!;
      await page.screenshot({
        path: path.join(directory, edition.name + "-aero-desktop.png"),
      });
      await page
        .getByRole("button", { name: "切换荧光拼贴风格", exact: true })
        .click();
      await page.waitForTimeout(650);
      await page.screenshot({
        path: path.join(directory, edition.name + "-collage-desktop.png"),
      });
      await page.setViewportSize({ width: 390, height: 844 });
      await page
        .getByRole("link", { name: "拆解2 角色控制器", exact: true })
        .click();
      await expect(page.locator(".article-header h1:visible")).toBeVisible();
      await page.screenshot({
        path: path.join(directory, edition.name + "-mobile-reading.png"),
      });
    });
  });
}
