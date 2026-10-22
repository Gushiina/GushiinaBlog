# 响应式与主题维护

两套主题共享 `DailyBlog/frontend/src/assets/layout.css` 内的字号、尺寸和网格。
`main.css` 提供基础样式和荧光拼贴材质，`aero.css` 只覆盖 Aero 外观，`motion.css` 提供动效。
修改按钮、输入框、文章宽度或字号时应修改共享布局，避免切换主题时发生跳动。

移动端断点为 760px；文章阅读页收起桌面侧栏，提供可展开目录。
代码、公式和表格在自身容器内横向滚动，不让整页横向溢出。

在 `DailyBlog/frontend` 内运行 `npm run test:e2e`，验证 320 / 390 / 768 / 1440 像素视口、风格尺寸一致性和两种构建版本。
