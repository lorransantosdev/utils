<!-- City of Living Data — Vue 3 / Nuxt component. Nuxt: wrap it in <ClientOnly>. -->
<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { createCity } from './city-of-living-data.js';
import './city-of-living-data.css';
import defaultWorld from './world.json';

const props = defineProps({ world: { type: Object, default: () => defaultWorld }, options: { type: Object, default: () => ({}) } });
const emit = defineEmits(['ready']);
const host = ref(null);
let api = null;
const mount = () => { api?.destroy(); api = createCity(host.value, props.world, props.options); emit('ready', api); };
onMounted(mount);
watch(() => props.world, mount); // new world = rebuild; for live changes call api.update(patch)
onBeforeUnmount(() => { api?.destroy(); api = null; });
</script>

<template>
  <div ref="host" class="city-view" />
</template>

<style scoped>
.city-view { position: relative; width: 100%; height: 100%; min-height: 480px; }
</style>
