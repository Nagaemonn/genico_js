import http.server
import socketserver
import os
import sys
from io import BytesIO
from PIL import Image

PORT = 23479
if len(sys.argv) > 1:
    try:
        PORT = int(sys.argv[1])
    except ValueError:
        print('Usage: python server.py [PORT]')
        sys.exit(1)
TEMPLATE_DIR = 'templates'

def render_template(name, context=None):
    path = os.path.join(TEMPLATE_DIR, name)
    with open(path, encoding='utf-8') as f:
        html = f.read()
    if context:
        for k, v in context.items():
            html = html.replace('{{ ' + k + ' }}', str(v))
    return html.encode('utf-8')

def parse_multipart(headers, rfile):
    content_type = headers.get('Content-Type')
    if not content_type or 'multipart/form-data' not in content_type:
        return None, None
    boundary = content_type.split('boundary=')[-1].encode()
    remainbytes = int(headers.get('Content-Length'))
    data = rfile.read(remainbytes)
    parts = data.split(b'--' + boundary)
    for part in parts:
        if b'Content-Disposition' in part and b'name="file"' in part:
            header, filedata = part.split(b'\r\n\r\n', 1)
            for line in header.split(b'\r\n'):
                if b'filename=' in line:
                    filename = line.split(b'filename=')[1].strip().strip(b'"').decode(errors='ignore')
                    break
            else:
                filename = 'uploaded.png'
            filedata = filedata.rstrip(b'\r\n').rstrip(b'--')
            return filename, filedata
    return None, None

class SimpleHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html; charset=utf-8')
            self.end_headers()
            self.wfile.write(render_template('index.html'))
        elif self.path.startswith('/templates/'):
            file_path = self.path.lstrip('/')
            if os.path.exists(file_path):
                self.send_response(200)
                if file_path.endswith('.css'):
                    self.send_header('Content-type', 'text/css; charset=utf-8')
                else:
                    self.send_header('Content-type', 'application/octet-stream')
                self.end_headers()
                with open(file_path, 'rb') as f:
                    self.wfile.write(f.read())
            else:
                self.send_error(404, 'File Not Found')
        else:
            self.send_error(404, 'Not Found')

    def do_POST(self):
        filename, filedata = parse_multipart(self.headers, self.rfile)
        if filename and filedata:
            try:
                im = Image.open(BytesIO(filedata))
                warnings = []
                if not filename.lower().endswith('.png') or im.format != 'PNG':
                    warnings.append('PNGファイルのみ対応しています。')
                if im.width != im.height:
                    warnings.append('画像は正方形（1:1）でアップロードしてください。')
                if im.width < 256 or im.height < 256:
                    warnings.append('画像サイズは256px以上を推奨します。')
                if warnings:
                    html = render_template('error.html', {'error_message': '<br>'.join(warnings)})
                    self.send_response(200)
                    self.send_header('Content-type', 'text/html; charset=utf-8')
                    self.end_headers()
                    self.wfile.write(html)
                else:
                    sizes = [(256,256), (128,128), (48,48), (32,32), (16,16)]
                    if im.mode != 'RGBA':
                        im = im.convert('RGBA')
                    ico_data = BytesIO()
                    im.save(ico_data, format='ICO', sizes=sizes)
                    ico_data.seek(0)
                    ico_name = os.path.splitext(filename)[0] + '.ico'
                    self.send_response(200)
                    self.send_header('Content-type', 'image/x-icon')
                    self.send_header('Content-Disposition', f'attachment; filename="{ico_name}"')
                    self.end_headers()
                    self.wfile.write(ico_data.getvalue())
            except Exception as e:
                html = render_template('error.html', {'error_message': str(e)})
                self.send_response(200)
                self.send_header('Content-type', 'text/html; charset=utf-8')
                self.end_headers()
                self.wfile.write(html)
            return
        html = render_template('error.html', {'error_message': 'Bad Request'})
        self.send_response(400)
        self.send_header('Content-type', 'text/html; charset=utf-8')
        self.end_headers()
        self.wfile.write(html)

if __name__ == '__main__':
    with socketserver.TCPServer(("", PORT), SimpleHTTPRequestHandler) as httpd:
        print(f"Serving at http://localhost:{PORT}")
        httpd.serve_forever() 