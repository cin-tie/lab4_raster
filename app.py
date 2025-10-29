from flask import Flask, render_template, send_from_directory
import time

app = Flask(__name__, static_folder="static", template_folder="templates")

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/health")
def health():
    return {"status": "ok", "time": time.time()}

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
