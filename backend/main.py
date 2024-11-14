import json
import logging

from typing import Union

from fastapi import FastAPI
from pylsp_jsonrpc import dispatchers, endpoint

log = logging.getLogger(__name__)


class LanguageServer(dispatchers.MethodDispatcher):
    """Implement a JSON RPC method dispatcher for the language server protocol."""

    def __init__(self):
        # Endpoint is lazily set after construction
        self.endpoint = None

    def m_initialize(self, rootUri=None, **kwargs):

        return {
            "capabilities": {
                "textDocumentSync": {
                    "openClose": True,
                }
            }
        }

    def m_text_document__did_open(self, textDocument=None, **_kwargs):
        log.info("Opened text document %s", textDocument)
        self.endpoint.notify(
            "textDocument/publishDiagnostics",
            {
                "uri": textDocument["uri"],
                "diagnostics": [
                    {
                        "range": {
                            "start": {"line": 0, "character": 0},
                            "end": {"line": 1, "character": 0},
                        },
                        "message": "Some very bad Python code",
                        "severity": 1,  # DiagnosticSeverity.Error
                    }
                ],
            },
        )


class LanguageServerWebSocketHandler:
    """Setup tornado websocket handler to host language server."""

    def __init__(self, *args, **kwargs):
        # Create an instance of the language server used to dispatch JSON RPC methods
        langserver = LanguageServer()

        # Setup an endpoint that dispatches to the ls, and writes server->client messages
        # back to the client websocket
        self.endpoint = endpoint.Endpoint(
            langserver, lambda msg: self.write_message(json.dumps(msg))
        )

        # Give the language server a handle to the endpoint so it can send JSON RPC
        # notifications and requests.
        langserver.endpoint = self.endpoint

    def on_message(self, message):
        """Forward client->server messages to the endpoint."""
        self.endpoint.consume(json.loads(message))

    def check_origin(self, origin):
        return True


app = FastAPI()


ws_handler = LanguageServerWebSocketHandler()


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}


@app.websocket("/ws")
async def websocket_endpoint(websocket):
    await websocket.accept()
    while True:
        data = await websocket.receive_text()
        print(data)
        await websocket.send_text(f"Message text was: {data}")
