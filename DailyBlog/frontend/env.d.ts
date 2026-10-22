/// <reference types="vite/client" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
declare module "virtual:blog-content" {
  const content: {
    posts: import("./src/types").Post[];
    profile: import("./src/types").Profile;
    attachments: Record<string, string>;
  };
  export default content;
}
