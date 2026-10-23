<script setup>
import { computed } from 'vue'
import { ART } from '../lib/art'

const props = defineProps({
  type: { type: String, default: 'stage' },
  seed: { type: String, default: 'x' }
})

const html = computed(() => ART.scene(props.type, props.seed))
</script>

<template>
  <span class="art" v-html="html"></span>
</template>
