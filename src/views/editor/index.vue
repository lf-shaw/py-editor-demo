<script setup lang="ts">
import { onMounted } from 'vue'

import { runClient } from './client'

onMounted(() => {
  runClient()
})
</script>

<template>
  <div>
    <div id="monaco-editor-root" style="width: 90%; height: 600px; border: 1px solid grey" />
  </div>
</template>
