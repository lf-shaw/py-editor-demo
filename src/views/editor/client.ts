/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as monaco from "monaco-editor";

import { initServices } from "monaco-languageclient/vscode/services";
import { LogLevel } from "vscode/services";
// monaco-editor does not supply json highlighting with the json worker,
// that's why we use the textmate extension from VSCode
import "@codingame/monaco-vscode-theme-defaults-default-extension";
import "@codingame/monaco-vscode-python-default-extension";
import getConfigurationServiceOverride from "@codingame/monaco-vscode-configuration-service-override";
import getThemeServiceOverride from "@codingame/monaco-vscode-theme-service-override";
import getTextmateServiceOverride from "@codingame/monaco-vscode-textmate-service-override";
import getKeybindingsServiceOverride from "@codingame/monaco-vscode-keybindings-service-override";

import { MonacoLanguageClient } from "monaco-languageclient";
import {
  WebSocketMessageReader,
  WebSocketMessageWriter,
  toSocket
} from "vscode-ws-jsonrpc";
import {
  CloseAction,
  ErrorAction,
  type MessageTransports
} from "vscode-languageclient/browser.js";
import { configureMonacoWorkers } from "./utils.js";
import { ConsoleLogger } from "monaco-languageclient/tools";
import { updateUserConfiguration } from "@codingame/monaco-vscode-configuration-service-override";

export const runClient = async () => {
  const logger = new ConsoleLogger(LogLevel.Debug);
  const htmlContainer = document.getElementById("monaco-editor-root")!;
  await initServices(
    {
      serviceOverrides: {
        ...getConfigurationServiceOverride(),
        ...getThemeServiceOverride(),
        ...getTextmateServiceOverride(),
        ...getKeybindingsServiceOverride()
      }
    },
    {
      htmlContainer,
      logger
    }
  );

  updateUserConfiguration(
    JSON.stringify({
      "workbench.colorTheme": "Default Dark Modern",
      "editor.guides.bracketPairsHorizontal": "active",
      "editor.wordBasedSuggestions": "off",
      "editor.experimental.asyncTokenization": true
    })
  );

  // register the JSON language with Monaco
  monaco.languages.register({
    id: "python",
    extensions: [".py", ".jsonc"],
    aliases: ["PYTHON", "python"],
    mimetypes: ["application/python"]
  });

  configureMonacoWorkers(logger);

  // create monaco editor
  const editor = monaco.editor.create(htmlContainer, {
    value: "import os\ndef main():\n\tprint('Hello World!')",
    language: "python",
    fontSize: 16,
    autoIndent: "full",
    formatOnPaste: true,
    formatOnType: true,
    matchBrackets: "always",
    hideCursorInOverviewRuler: true,
    // theme: "vs-dark",
    automaticLayout: true,
    // wordBasedSuggestions: "off",
    minimap: {
      enabled: false
    }
  });
  initWebSocketAndStartClient(
    "ws://localhost:30001/pyright?authorization=UserAuth"
  );

  return editor;
};

/** parameterized version , support all languageId */
export const initWebSocketAndStartClient = (url: string): WebSocket => {
  const webSocket = new WebSocket(url);
  webSocket.onopen = () => {
    const socket = toSocket(webSocket);
    const reader = new WebSocketMessageReader(socket);
    const writer = new WebSocketMessageWriter(socket);
    const languageClient = createLanguageClient({
      reader,
      writer
    });
    languageClient.start();
    reader.onClose(() => languageClient.stop());
  };
  return webSocket;
};

export const createLanguageClient = (
  messageTransports: MessageTransports
): MonacoLanguageClient => {
  return new MonacoLanguageClient({
    name: "Sample Language Client",
    clientOptions: {
      // use a language id as a document selector
      documentSelector: ["python"],
      // disable the default error handler
      errorHandler: {
        error: () => ({ action: ErrorAction.Continue }),
        closed: () => ({ action: CloseAction.DoNotRestart })
      }
    },
    // create a language client connection from the JSON RPC connection on demand
    messageTransports
  });
};
