# 发布到 GitHub Pages

1. 将本次源码更新到 GitHub 仓库。
2. 打开仓库 Settings → Pages，把 Source 设为 **GitHub Actions**。
3. 推送到 `master` 或手动运行 **Build and publish blog** 工作流。
4. 构建完成后，工作流页面会给出实际发布网址。

首页是预渲染 HTML 版，网址末尾加 `/vue.html` 可打开 Vue 版。两版都内置风格切换、明暗切换、动画、搜索、目录和文章内容。

## 手动发布

在 `DailyBlog/frontend` 内运行 `npm ci` 与 `npm run build`。
将生成的 `dist/index.html` 放到 Pages 发布目录；若更喜欢 Vue 版，将 `dist/vue.html` 改名为 `index.html` 后上传。
两份都可以独立使用，无需上传附加脚本、CSS、头像或本地附件目录。

## 更新内容

笔记在 `DailyBlog/content/posts/`，个人信息在 `DailyBlog/content/config/profile.json`。
每次修改后重新构建或推送，由工作流重新生成 HTML。
文章内部采用 `#/post/文章ID`，兼容项目站点子路径与刷新，不需要重写路由或 404 页面。

外部图片仍由原网站提供；原仓库未包含的附件需要补齐后重新构建。
