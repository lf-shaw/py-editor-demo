<script setup lang="ts">
import { onMounted, reactive, ref, shallowRef } from "vue";
import { VueMonacoEditor } from "@guolao/vue-monaco-editor";
import { io } from "socket.io-client";
import { MonacoLanguageClient } from "monaco-languageclient";

defineOptions({
  name: "Editor"
});

const state = reactive({
  connected: false,
  fooEvents: [],
  barEvents: []
});

// ref https://socket.io/how-to/use-with-vue
const URL = "http://localhost:8000/ws";
const socket = io(URL);

const MONACO_EDITOR_OPTIONS = {
  automaticLayout: true,
  formatOnType: true,
  formatOnPaste: true
};

const code = ref("# add code here...");
const editorRef = shallowRef();
const handleMount = editor => (editorRef.value = editor);

// your action
function formatCode() {
  editorRef.value?.getAction("editor.action.formatDocument").run();
}

function saveDocument() {
  console.log("saved");
}

onMounted(() => {
  // socket.value.onopen = () => {
  //   console.log("WebSocket connected");
  // };
});
</script>

<template>
  <vue-monaco-editor
    v-model:value="code"
    theme="vs-dark"
    :options="MONACO_EDITOR_OPTIONS"
    height="300px"
    language="python"
    @mount="handleMount"
    @onChange="formatCode"
  />
</template>
