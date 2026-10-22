import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import "./assets/main.css";
import "./assets/aero.css";
import "./assets/motion.css";
import "./assets/layout.css";
import { reveal } from "./utils/motion";

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.directive("reveal", reveal);

app.mount("#app");
