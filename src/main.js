import { createApp } from "vue";
import App from "./App.vue";
import { installTableColumnResizer } from "./utils/tableColumnResizer";

createApp(App).mount("#app");
installTableColumnResizer();
