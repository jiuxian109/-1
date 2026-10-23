<script setup>
import { computed } from 'vue'
import { STATUS_LABEL } from '../data/constants'

const props = defineProps({ status: { type: String, default: '' } })
const label = computed(() => STATUS_LABEL[props.status] || props.status)
</script>

<template>
  <span class="status" :class="status">{{ label }}</span>
</template>
