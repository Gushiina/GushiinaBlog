<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { mountLiquid } from "@/utils/liquid";
const canvas = ref<HTMLCanvasElement>();
let cleanup: (() => void) | undefined;
onMounted(() => {
  if (canvas.value) cleanup = mountLiquid(canvas.value);
});
onUnmounted(() => cleanup?.());
</script>
<template>
  <canvas ref="canvas" class="liquid-scene" aria-hidden="true"></canvas>
</template>
