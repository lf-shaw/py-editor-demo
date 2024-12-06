/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as monaco from 'monaco-editor'
import { initServices } from 'monaco-languageclient/vscode/services'
import { LogLevel } from 'vscode/services'

import '@codingame/monaco-vscode-theme-defaults-default-extension'
import '@codingame/monaco-vscode-python-default-extension'
import getConfigurationServiceOverride from '@codingame/monaco-vscode-configuration-service-override'
import getThemeServiceOverride from '@codingame/monaco-vscode-theme-service-override'
import getTextmateServiceOverride from '@codingame/monaco-vscode-textmate-service-override'

import { MonacoLanguageClient } from 'monaco-languageclient'
import { WebSocketMessageReader, WebSocketMessageWriter, toSocket } from 'vscode-ws-jsonrpc'
import { CloseAction, ErrorAction, MessageTransports } from 'vscode-languageclient/browser.js'
import { configureMonacoWorkers } from './utils.js'
import { ConsoleLogger } from 'monaco-languageclient/tools'
import { updateUserConfiguration } from '@codingame/monaco-vscode-configuration-service-override'

export const runClient = async () => {
  const logger = new ConsoleLogger(LogLevel.Debug)
  const htmlContainer = document.getElementById('monaco-editor-root')!
  await initServices(
    {
      serviceOverrides: {
        ...getThemeServiceOverride(),
        ...getTextmateServiceOverride(),
        ...getConfigurationServiceOverride(),
      },
    },
    {
      htmlContainer,
      logger,
    },
  )

  updateUserConfiguration(
    JSON.stringify({
      'workbench.colorTheme': 'Default Dark Modern',
      'editor.guides.bracketPairsHorizontal': 'active',
      'editor.wordBasedSuggestions': 'off',
      'editor.experimental.asyncTokenization': true,
    }),
  )

  // register the JSON language with Monaco
  monaco.languages.register({
    id: 'python',
    extensions: ['.py'],
    aliases: ['PYTHON', 'python'],
    mimetypes: ['application/python'],
  })

  configureMonacoWorkers(logger)

  // create monaco editor
  monaco.editor.create(htmlContainer, {
    value: 'import os',
    language: 'python',
    automaticLayout: true,
    theme: 'vs-dark',
    wordBasedSuggestions: 'off',
  })
  initWebSocketAndStartClient('ws://localhost:30001/pyright?authorization=UserAuth')
}

/** parameterized version , support all languageId */
export const initWebSocketAndStartClient = (url: string): WebSocket => {
  const webSocket = new WebSocket(url)
  webSocket.onopen = () => {
    const socket = toSocket(webSocket)
    const reader = new WebSocketMessageReader(socket)
    const writer = new WebSocketMessageWriter(socket)
    const languageClient = createLanguageClient({
      reader,
      writer,
    })
    languageClient.start()
    reader.onClose(() => languageClient.stop())
  }
  return webSocket
}

export const createLanguageClient = (
  messageTransports: MessageTransports,
): MonacoLanguageClient => {
  return new MonacoLanguageClient({
    name: 'Sample Language Client',
    clientOptions: {
      // use a language id as a document selector
      documentSelector: ['python'],
      // disable the default error handler
      errorHandler: {
        error: () => ({ action: ErrorAction.Continue }),
        closed: () => ({ action: CloseAction.DoNotRestart }),
      },
    },
    // create a language client connection from the JSON RPC connection on demand
    messageTransports,
  })
}
