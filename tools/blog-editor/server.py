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

    if tag == "mark":
        style = node.get("style", "")
        content = inner()
        bg_m = re.search(r"background-color:\s*([^;]+)", style)
        if bg_m:
            color = bg_m.group(1).strip()
            if color.startswith("rgb"):
                color = rgb_to_hex(color)
            return f'<mark style="background-color:{color}">{content}</mark>'
        return content

    if tag == "span":
        style = node.get("style", "")
        content = inner()

        color_m = re.search(r"(?<![a-z-])color:\s*(rgb\([^)]+\)|#[0-9a-fA-F]{3,6}|[a-z]+)", style)
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

    if tag in ("div", "body", "html", "section", "article", "[document]"):
        return inner()

    # 未知のタグ → 生のHTMLとして通す（MDXコンポーネント等）
    return str(node)


def html_to_markdown(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    result = convert_node(soup)
    result = re.sub(r"\n{3,}", "\n\n", result)
    return result.strip()


# ── Markdown → Quill HTML 変換（既存記事の読み込み用）─────────────────────

def inline_md_to_html(text: str) -> str:
    """インライン Markdown を Quill 互換 HTML に変換"""
    # コードを先に保護
    text = re.sub(r"`([^`]+)`", r"<code>\1</code>", text)
    # 太字
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    # 斜体
    text = re.sub(r"(?<!\*)\*([^*\n]+)\*(?!\*)", r"<em>\1</em>", text)
    # 取り消し線
    text = re.sub(r"~~(.+?)~~", r"<s>\1</s>", text)
    # リンク
    text = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2">\1</a>', text)
    # <mark> → Quill の background-color span に変換
    text = re.sub(
        r'<mark style="background-color:([^"]+)">(.*?)</mark>',
        r'<span style="background-color:\1">\2</span>',
        text, flags=re.DOTALL,
    )
    return text


def markdown_to_quill_html(md: str) -> str:
    """ブログ記事の Markdown+HTML を Quill が読み込める HTML に変換"""
    md = md.replace("\r\n", "\n").replace("\r", "\n")
    raw_blocks = re.split(r"\n{2,}", md.strip())
    html_parts = []

    for block in raw_blocks:
        block = block.strip()
        if not block:
            continue

        # コードブロック
        cb_m = re.match(r"^```(\w*)\n?([\s\S]*?)```$", block, re.DOTALL)
        if cb_m:
            code = cb_m.group(2).rstrip("\n")
            html_parts.append(f'<pre class="ql-syntax" spellcheck="false">{code}</pre>')
            continue

        # 見出し
        hm = re.match(r"^(#{1,6})\s+(.+)$", block)
        if hm:
            level = len(hm.group(1))
            html_parts.append(f"<h{level}>{inline_md_to_html(hm.group(2))}</h{level}>")
            continue

        # HR
        if re.match(r"^[-*_]{3,}$", block.strip()):
            html_parts.append("<p><br></p>")
            continue

        lines = block.split("\n")

        # 箇条書き（順不同）
        if all(re.match(r"^[-*+] ", l.strip()) for l in lines if l.strip()):
            items = "".join(
                f"<li>{inline_md_to_html(re.sub(r'^[-*+] ', '', l.strip()))}</li>"
                for l in lines if l.strip()
            )
            html_parts.append(f"<ul>{items}</ul>")
            continue

        # 箇条書き（順序付き）
        if all(re.match(r"^\d+\. ", l.strip()) for l in lines if l.strip()):
            items = "".join(
                f"<li>{inline_md_to_html(re.sub(r'^\d+\. ', '', l.strip()))}</li>"
                for l in lines if l.strip()
            )
            html_parts.append(f"<ol>{items}</ol>")
            continue

        # 引用
        if all(re.match(r"^> ?", l) or not l.strip() for l in lines):
            inner = "<br>".join(
                inline_md_to_html(re.sub(r"^> ?", "", l)) for l in lines
            )
            html_parts.append(f"<blockquote><p>{inner}</p></blockquote>")
            continue

        # 通常段落（インラインHTMLも含む）
        converted = "<br>".join(inline_md_to_html(l) for l in lines)
        html_parts.append(f"<p>{converted}</p>")

    return "\n".join(html_parts)


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


def parse_frontmatter(raw: str) -> tuple[dict, str]:
    """frontmatter と本文を分離してパース"""
    fm_m = re.match(r"^---\n(.*?)\n---\n?", raw, re.DOTALL)
    if not fm_m:
        return {}, raw

    fm_raw = fm_m.group(1)
    body = raw[fm_m.end():]

    def get(key, default=""):
        m = re.search(rf"^{key}:\s*(.+)$", fm_raw, re.MULTILINE)
        return m.group(1).strip().strip("\"'") if m else default

    tags_m = re.search(r"^tags:\s*\[(.+)\]$", fm_raw, re.MULTILINE)
    tags = [t.strip().strip("\"'") for t in tags_m.group(1).split(",")] if tags_m else []

    return {
        "title": get("title"),
        "description": get("description"),
        "slug": get("slug"),
        "pubDate": get("pubDate"),
        "author": get("author", "reiblast1123"),
        "draft": get("draft", "false").lower() == "true",
        "updatedDate": get("updatedDate"),
        "tags": tags,
    }, body


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
    original_path = data.get("originalPath", "").strip()

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

    # slug や日付が変わった場合は元ファイルを削除
    if original_path:
        orig_full = os.path.join(BLOG_DIR, original_path)
        new_rel_from_blog = os.path.relpath(save_path, BLOG_DIR)
        if orig_full != save_path and os.path.exists(orig_full):
            os.remove(orig_full)
            try:
                os.rmdir(os.path.dirname(orig_full))
            except OSError:
                pass

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


@app.route("/api/load", methods=["POST"])
def load_post():
    data = request.json
    rel_path = data.get("path", "")
    file_path = os.path.join(BLOG_DIR, rel_path)

    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404

    with open(file_path, encoding="utf-8") as f:
        raw = f.read()

    fm, body = parse_frontmatter(raw)
    ext = "mdx" if rel_path.endswith(".mdx") else "md"

    # MDX: 先頭の import 行を分離
    imports = ""
    if ext == "mdx":
        import_lines = []
        body_lines = body.lstrip("\n").split("\n")
        rest = []
        in_imports = True
        for line in body_lines:
            if in_imports and (line.startswith("import ") or line.strip() == ""):
                if line.startswith("import "):
                    import_lines.append(line)
            else:
                in_imports = False
                rest.append(line)
        imports = "\n".join(import_lines)
        body = "\n".join(rest)

    body_html = markdown_to_quill_html(body.strip())

    return jsonify({
        "success": True,
        "title": fm.get("title", ""),
        "description": fm.get("description", ""),
        "slug": fm.get("slug", ""),
        "pubDate": fm.get("pubDate", "")[:16],   # datetime-local 用に秒を省略
        "author": fm.get("author", "reiblast1123"),
        "tags": fm.get("tags", []),
        "draft": fm.get("draft", False),
        "updatedDate": fm.get("updatedDate", "")[:16],
        "ext": ext,
        "imports": imports,
        "bodyHtml": body_html,
    })


@app.route("/api/delete", methods=["POST"])
def delete_post():
    data = request.json
    rel_path = data.get("path", "")
    file_path = os.path.join(BLOG_DIR, rel_path)

    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404

    os.remove(file_path)

    # 親ディレクトリが空になったら削除
    parent = os.path.dirname(file_path)
    try:
        os.rmdir(parent)
    except OSError:
        pass

    return jsonify({"success": True})


if __name__ == "__main__":
    app.run(debug=True, port=5000, host="0.0.0.0")
