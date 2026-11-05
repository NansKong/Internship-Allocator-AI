from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path

from allocator import allocate

ROOT = Path(__file__).resolve().parent


class Handler(BaseHTTPRequestHandler):
    def respond(self, status, content_type, body):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        pages = {"/": ("index.html", "text/html; charset=utf-8"),
                 "/example.json": ("example.json", "application/json")}
        if self.path not in pages:
            self.send_error(404)
            return
        filename, mime = pages[self.path]
        self.respond(200, mime, (ROOT / filename).read_bytes())

    def do_POST(self):
        if self.path != "/api/allocate":
            self.send_error(404)
            return
        try:
            size = int(self.headers.get("Content-Length", "0"))
            if not 0 < size <= 1_000_000:
                raise ValueError("Provide a JSON scenario smaller than 1 MB.")
            result = allocate(**json.loads(self.rfile.read(size)))
            status = 200
        except (TypeError, ValueError, KeyError, OverflowError, AttributeError) as error:
            result, status = {"error": f"Invalid scenario. {error}"}, 400
        self.respond(status, "application/json", json.dumps(result).encode())


if __name__ == "__main__":
    print("AllocateAI is running at http://127.0.0.1:8765", flush=True)
    ThreadingHTTPServer(("127.0.0.1", 8765), Handler).serve_forever()
