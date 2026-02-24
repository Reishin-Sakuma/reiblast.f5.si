"""
Blog Editor - Flask server
ローカルWYSIWYGエディタ。Quill.jsで書いた内容をMarkdown/MDXに変換して保存する。

起動:
  cd tools/blog-editor
  python3 -m venv .venv && source .venv/bin/activate
  pip install -r requirements.txt
  python server.py

ブラウザで http://localhost:5000 を開く（VS Code Remote SSHはポートを自動フォワード）
"""

import os
import re
from datetime import datetime
from flask import Flask, render_template, request, jsonify
from bs4 import BeautifulSoup, NavigableString, Tag

app = Flask(__name__)

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))
BLOG_DIR = os.path.join(PROJECT_ROOT, "src/content/blog")


# ── HTML → Markdown 変換 ───────────────────────────────────────────────────

def rgb_to_hex(rgb_str: str) -> str:
    """'rgb(r, g, b)' を '#rrggbb' に変換"""
    m = re.match(r"rgb\((\d+),\s*(\d+),\s*(\d+)\)", rgb_str.strip())
    if m:
        return "#{:02x}{:02x}{:02x}".format(int(m.group(1)), int(m.group(2)), int(m.group(3)))
    return rgb_str


def has_brackets(text: str) -> bool:
    """太字の中に括弧類がある場合は <strong> タグを使う必要がある"""
    return bool(re.search(r'[「」『』（）()\[\]]', text))


def convert_node(node) -> str:
    if isinstance(node, NavigableString):
        return str(node)
    if not isinstance(node, Tag):
        return ""

    tag = node.name

    def inner() -> str:
        return "".join(convert_node(c) for c in node.children)

    # ── ブロック要素 ──
    if tag == "p":
        content = inner()
        # 空段落 (<p><br></p>) は空行
        if content.strip() in ("", "\n"):
            return "\n"
        return content + "\n\n"

    if tag in ("h1", "h2", "h3", "h4", "h5", "h6"):
        return "#" * int(tag[1]) + " " + inner().strip() + "\n\n"

    if tag == "ul":
        items = []
        for li in node.find_all("li", recursive=False):
            items.append("- " + "".join(convert_node(c) for c in li.children).strip())
        return "\n".join(items) + "\n\n"

    if tag == "ol":
        items = []
        for i, li in enumerate(node.find_all("li", recursive=False), 1):
            items.append(f"{i}. " + "".join(convert_node(c) for c in li.children).strip())
        return "\n".join(items) + "\n\n"

    if tag == "blockquote":
        content = inner().strip()
        lines = content.split("\n")
        return "\n".join("> " + l for l in lines) + "\n\n"

    if tag == "pre":
        # Quill のコードブロック: <pre class="ql-syntax">
        code = node.find("code") or node
        lang = ""
        for cls in (code.get("class") or []):
            if cls.startswith("language-"):
                lang = cls[9:]
                break
        return f"```{lang}\n{code.get_text()}\n```\n\n"

    if tag == "hr":
        return "\n---\n\n"

    # ── インライン要素 ──
    if tag == "strong":
        content = inner()
        if has_brackets(content):
            return f"<strong>{content}</strong>"
        return f"**{content}**"

    if tag == "em":
        return f"*{inner()}*"

    if tag == "u":
        return f"<u>{inner()}</u>"

    if tag == "s":
        return f"~~{inner()}~~"

    if tag == "code":
        return f"`{node.get_text()}`"

    if tag == "a":
        href = node.get("href", "")
        return f"[{inner()}]({href})"

    if tag == "br":
        return "\n"

    if tag == "span":
        style = node.get("style", "")
        content = inner()

        # 文字色
        color_m = re.search(r"(?<![a-z-])color:\s*(rgb\([^)]+\)|#[0-9a-fA-F]{3,6}|[a-z]+)", style)
        # 背景色 → <mark>
        bg_m = re.search(r"background-color:\s*(rgb\([^)]+\)|#[0-9a-fA-F]{3,6}|[a-z]+)", style)

        if bg_m:
            color = bg_m.group(1)
            if color.startswith("rgb"):
                color = rgb_to_hex(color)
            content = f'<mark style="background-color:{color}">{content}</mark>'

        if color_m:
            color = color_m.group(1)
            if color.startswith("rgb"):
                color = rgb_to_hex(color)
            content = f'<span style="color:{color}">{content}</span>'

        return content

    # ── コンテナ（そのまま中身を処理） ──
    if tag in ("div", "body", "html", "section", "article", "[document]"):
        return inner()

    # 未知のタグ → 生のHTMLとして通す（MDXコンポーネント等）
    return str(node)


def html_to_markdown(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    result = convert_node(soup)
    # 3つ以上の連続改行を2つに圧縮
    result = re.sub(r"\n{3,}", "\n\n", result)
    return result.strip()


# ── Frontmatter ───────────────────────────────────────────────────────────

def build_frontmatter(data: dict) -> str:
    title = data.get("title", "")
    description = data.get("description", "")
    slug = data.get("slug", "")
    author = data.get("author", "reiblast1123")
    tags = data.get("tags", [])
    pub_date = data.get("pubDate", datetime.now().strftime("%Y-%m-%dT%H:%M:%S"))
    draft = data.get("draft", False)
    updated_date = data.get("updatedDate", "")

    tags_str = "[" + ", ".join(f'"{t}"' for t in tags) + "]"

    fm = (
        f'---\n'
        f'title: "{title}"\n'
        f'description: "{description}"\n'
        f'pubDate: {pub_date}\n'
        f'slug: {slug}\n'
        f'author: {author}\n'
        f'tags: {tags_str}\n'
        f'draft: {str(draft).lower()}'
    )
    if updated_date:
        fm += f"\nupdatedDate: {updated_date}"
    fm += "\n---"
    return fm


# ── Routes ────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("editor.html")


@app.route("/api/convert", methods=["POST"])
def convert():
    html = request.json.get("html", "")
    return jsonify({"markdown": html_to_markdown(html)})


@app.route("/api/save", methods=["POST"])
def save():
    data = request.json

    slug = data.get("slug", "untitled").strip()
    pub_date = data.get("pubDate", datetime.now().strftime("%Y-%m-%dT%H:%M:%S"))
    file_ext = data.get("ext", "md")
    imports = data.get("imports", "").strip()
    body_html = data.get("body", "")

    if not slug:
        return jsonify({"error": "slug が空です"}), 400

    try:
        dt = datetime.fromisoformat(pub_date)
    except Exception:
        dt = datetime.now()

    fm = build_frontmatter(data)
    body_md = html_to_markdown(body_html)

    parts = [fm, ""]
    if file_ext == "mdx" and imports:
        parts.append(imports)
        parts.append("")
    parts.append(body_md)

    content = "\n".join(parts)

    date_path = dt.strftime("%Y/%m/%d")
    save_dir = os.path.join(BLOG_DIR, date_path, slug)
    os.makedirs(save_dir, exist_ok=True)
    save_path = os.path.join(save_dir, f"index.{file_ext}")

    with open(save_path, "w", encoding="utf-8") as f:
        f.write(content)

    rel = os.path.relpath(save_path, PROJECT_ROOT)
    return jsonify({"success": True, "path": rel})


@app.route("/api/posts")
def list_posts():
    posts = []
    for root, _, files in os.walk(BLOG_DIR):
        for f in files:
            if f in ("index.md", "index.mdx"):
                full = os.path.join(root, f)
                rel = os.path.relpath(full, BLOG_DIR)
                try:
                    with open(full, encoding="utf-8") as fh:
                        raw = fh.read()
                    m = re.search(r'^title:\s*["\']?(.+?)["\']?\s*$', raw, re.MULTILINE)
                    title = m.group(1) if m else "Untitled"
                    ext = os.path.splitext(f)[1]
                    posts.append({"path": rel, "title": title, "ext": ext})
                except Exception:
                    pass
    return jsonify(sorted(posts, key=lambda x: x["path"], reverse=True))


if __name__ == "__main__":
    app.run(debug=True, port=5000, host="0.0.0.0")
