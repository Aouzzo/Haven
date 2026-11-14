"""Local static preview server; no database, API, or application backend."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlsplit
import argparse

ROOT = Path(__file__).resolve().parent / 'public'

class StaticHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        if urlsplit(self.path).path.rstrip('/') in ('', '/technology', '/login'):
            self.path = '/index.html'
        super().do_GET()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Run the offline SAFER prototype')
    parser.add_argument('--port', type=int, default=4173)
    args = parser.parse_args()
    with ThreadingHTTPServer(('127.0.0.1', args.port), StaticHandler) as server:
        print(f'SAFER is ready at http://127.0.0.1:{args.port}', flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
