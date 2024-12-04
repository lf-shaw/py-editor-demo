<script setup lang="ts">
import { onMounted, shallowRef } from "vue";
import * as monaco from "monaco-editor";
import { runClient } from "./client";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import "@codingame/monaco-vscode-python-default-extension";
defineOptions({
  name: "Editor"
});

//解决 Monaco Editor 无法正确加载其所需的 Web Worker
self.MonacoEnvironment = {
  getWorker(workerId, label) {
    return new editorWorker();
  }
};

onMounted(() => {
  runClient();
});

const editorRef = shallowRef<monaco.editor.IStandaloneCodeEditor>();

function click() {
  console.log("editorRef", editorRef.value);
  console.log("@@@ ", editorRef.value.getValue);
}
</script>

<template>
  <div>
    <div
      id="monaco-editor-root"
      ref="editorRef"
      style="width: 90%; height: 600px; border: 1px solid grey"
    />
    <div>
      <el-button type="primary" @click="click">Primary</el-button>
    </div>
  </div>
</template>
