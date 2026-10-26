import argparse
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
import os
import re

class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        self.send_header('Accept-Ranges', 'bytes')
        super().end_headers()

    def send_head(self):
        self._byte_range = None
        header = self.headers.get('Range')
        path = self.translate_path(self.path)
        if not header or not os.path.isfile(path):
            return super().send_head()
        size = os.path.getsize(path)
        match = re.fullmatch(r'bytes=(\d*)-(\d*)', header.strip())
        if not match or not any(match.groups()):
            self.send_error(416, 'Unsupported byte range')
            return None
        left, right = match.groups()
        if left:
            start, end = int(left), int(right) if right else size - 1
        else:
            start, end = max(0, size - int(right)), size - 1
        if start >= size or start < 0 or end < start or size == 0:
            self.send_response(416)
            self.send_header('Content-Range', f'bytes */{size}')
            self.send_header('Content-Length', '0')
            self.end_headers()
            return None
        end = min(end, size - 1)
        stream = open(path, 'rb')
        stream.seek(start)
        self._byte_range = (start, end)
        self.send_response(206)
        self.send_header('Content-Type', self.guess_type(path))
        self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
        self.send_header('Content-Length', str(end - start + 1))
        self.send_header('Last-Modified', self.date_time_string(os.path.getmtime(path)))
        self.end_headers()
        return stream

    def copyfile(self, source, outputfile):
        if self._byte_range is None:
            return super().copyfile(source, outputfile)
        remaining = self._byte_range[1] - self._byte_range[0] + 1
        while remaining:
            block = source.read(min(65536, remaining))
            if not block:
                break
            outputfile.write(block)
            remaining -= len(block)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=4341)
    args = parser.parse_args()
    print(f'http://127.0.0.1:{args.port}/', flush=True)
    ThreadingHTTPServer(('127.0.0.1', args.port), partial(Handler, directory=str(Path(__file__).resolve().parent / 'site'))).serve_forever()
