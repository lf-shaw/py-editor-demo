<script setup lang="ts">
import { reactive, ref, shallowRef } from "vue";
import { VueMonacoEditor } from "@guolao/vue-monaco-editor";
import { MonacoLanguageClient } from "monaco-languageclient";
import { CloseAction, ErrorAction } from "vscode-languageclient";
import {
  WebSocketMessageReader,
  WebSocketMessageWriter,
  toSocket
} from "vscode-ws-jsonrpc";
import { createConnection } from "vscode-ws-jsonrpc/server";
import * as monaco from "monaco-editor";

defineOptions({
  name: "Editor"
});

const state = reactive({
  connected: false,
  fooEvents: [],
  barEvents: []
});

// ref https://socket.io/how-to/use-with-vue
const URL = "ws://localhost:8000/ws";

// ls client
function connect_language_server() {
  return new Promise((resolve, reject) => {
    const webSocket = new WebSocket(URL);

    webSocket.onopen = () => {
      console.log("LS WebSocket connection Open");
      const socket = toSocket(webSocket);
      const reader = new WebSocketMessageReader(socket);
      const writer = new WebSocketMessageWriter(socket);
      const socketConnection = createConnection(reader, writer, () =>
        socket.dispose()
      );
      const languageClient = new MonacoLanguageClient({
        name: `Python Language Client`,
        clientOptions: {
          documentSelector: ["python"],
          errorHandler: {
            error: () => ({ action: ErrorAction.Continue }),
            closed: () => ({ action: CloseAction.DoNotRestart })
          }
        },
        connectionProvider: {
          get: () => Promise.resolve({ reader, writer })
        }
      });

      languageClient.start();
      reader.onClose(() => languageClient.stop());
      resolve(languageClient);
    };

    webSocket.onerror = error => {
      console.log("LS WebSocket connection Open");
      reject(error);
    };
  });
}

// editor

const MONACO_EDITOR_OPTIONS: monaco.editor.IEditorConstructionOptions = {
  autoIndent: "full", // 自动缩进
  automaticLayout: true, // 自动对齐
  contextmenu: true, // 右键菜单
  formatOnType: true, // 输入时格式化
  formatOnPaste: true, // 粘贴时格式化
  fontSize: 16, // 字体大小
  matchBrackets: "always",
  hideCursorInOverviewRuler: true,
  minimap: {
    enabled: true
  }
};

const code = ref("# add code here...");
const editorRef = shallowRef();
async function handleMount(editor) {
  console.log(editor, monaco);
  editorRef.value = editor;

  const htmlContainer = document.getElementById("monaco-editor-root")!;

  // await initServices({
  //   serviceConfig: {
  //     userServices: {
  //       ...getConfigurationServiceOverride(),
  //       ...getThemeServiceOverride(),
  //       ...getTextmateServiceOverride()
  //     },
  //     debugLogging: true
  //   }
  // });

  // 注册语言
  monaco.languages.register({
    id: "python",
    aliases: ["python", "py"],
    extensions: [".py"]
  });

  // 创建模型
  const model = monaco.editor.createModel("print('hello world')", "python");
  editor.setModel(model);

  connect_language_server();

  editor.focus();
}

// your action
function formatCode() {
  editorRef.value?.getAction("editor.action.formatDocument").run();
}
</script>

<template>
  <vue-monaco-editor
    v-model:value="code"
    theme="vs-dark"
    :options="MONACO_EDITOR_OPTIONS"
    height="600px"
    language="python"
    @mount="handleMount"
    @onChange="formatCode"
  />
</template>
