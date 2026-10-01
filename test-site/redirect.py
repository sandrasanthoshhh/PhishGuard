from http.server import HTTPServer, BaseHTTPRequestHandler


class RedirectHandler(BaseHTTPRequestHandler):

    def do_GET(self):

        print(f"[RedirectServer] Requested: {self.path}")
        
        if self.path == "/content-test.html":

            try:

                with open(
                    "content-test.html",
                    "rb"
                ) as file:

                    content = file.read()

                self.send_response(200)

                self.send_header(
                    "Content-Type",
                    "text/html"
                )

                self.send_header(
                    "Content-Length",
                    str(len(content))
                )

                self.send_header(
                    "Cache-Control",
                    "no-store"
                )

                self.end_headers()

                self.wfile.write(content)

                print(
                    "[RedirectServer] Served /content-test.html"
                )

            except Exception as error:

                print(
                    "[RedirectServer] ERROR:",
                    error
                )

                self.send_error(500)

            return
        if self.path == "/server-redirect":


            self.send_response(302)

            self.send_header(
                "Location",
                "http://127.0.0.1:8765/form-test.html"
            )

            self.send_header(
                "Cache-Control",
                "no-store, no-cache, must-revalidate"
            )

            self.send_header(
                "Content-Length",
                "0"
            )

            self.send_header(
                "Connection",
                "close"
            )

            self.end_headers()

            print(
                "[RedirectServer] Sent 302 -> /form-test.html"
            )

            return

        if self.path == "/form-test.html":

            try:

                with open("form-test.html", "rb") as file:
                    content = file.read()

                self.send_response(200)

                self.send_header(
                    "Content-Type",
                    "text/html"
                )

                self.send_header(
                    "Content-Length",
                    str(len(content))
                )

                self.send_header(
                    "Cache-Control",
                    "no-store, no-cache, must-revalidate"
                )

                self.end_headers()

                self.wfile.write(content)

                print(
                    "[RedirectServer] Served /form-test.html"
                )

            except Exception as error:

                print(
                    "[RedirectServer] ERROR:",
                    error
                )

                self.send_error(500)

            return

        self.send_error(404)


server = HTTPServer(
    ("127.0.0.1", 8765),
    RedirectHandler
)

print(
    "PhishGuard redirect server running on "
    "http://127.0.0.1:8765"
)

server.serve_forever()