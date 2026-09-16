import os
import re
import base64
import subprocess
import markdown

PROJECT_DIR = r"c:\Users\anshu\OneDrive\Desktop\shieldApi"
MD_FILE = os.path.join(PROJECT_DIR, "USER_MANUAL.md")
HTML_FILE = os.path.join(PROJECT_DIR, "USER_MANUAL.html")
PDF_FILE = os.path.join(PROJECT_DIR, "ShieldAPI_User_Manual.pdf")

with open(MD_FILE, "r", encoding="utf-8") as f:
    md_content = f.read()

# Convert markdown alerts to clean styled blockquotes
md_content = re.sub(r'>\s*\[!NOTE\]\s*', '> **NOTE:** ', md_content)
md_content = re.sub(r'>\s*\[!TIP\]\s*', '> **TIP:** ', md_content)
md_content = re.sub(r'>\s*\[!WARNING\]\s*', '> **WARNING:** ', md_content)

# Replace any `<div style="page-break-after: always;"></div>` with `<div class="page-break"></div>`
md_content = md_content.replace('<div style="page-break-after: always;"></div>', '<div class="page-break"></div>')

# Resolve and embed images as Base64 Data URIs
def embed_img_tag(match):
    src = match.group(1)
    full_path = os.path.normpath(os.path.join(PROJECT_DIR, src))
    if os.path.exists(full_path):
        ext = os.path.splitext(full_path)[1].lower().replace('.', '')
        if ext == 'jpg':
            ext = 'jpeg'
        with open(full_path, "rb") as f_img:
            encoded = base64.b64encode(f_img.read()).decode("utf-8")
        return f'<img src="data:image/{ext};base64,{encoded}" style="max-width: 95%; border-radius: 8px; border: 1px solid #d0d7de; box-shadow: 0 4px 14px rgba(0,0,0,0.12); margin: 12px auto; display: block;"'
    return match.group(0)

# Replace HTML <img> tags: <img src="assets/..."
md_content = re.sub(r'<img\s+src=[\"\'](.*?)[\"\']', embed_img_tag, md_content)

# Parse Markdown to HTML with toc extension to create valid heading IDs
html_body = markdown.markdown(
    md_content,
    extensions=['tables', 'fenced_code', 'nl2br', 'toc']
)

# Post-process TOC: wrap the TOC <ul> inside <div class="table-of-contents">
# Locate <h2 id="table-of-contents">Table of Contents</h2>
parts = html_body.split('<h2 id="table-of-contents">Table of Contents</h2>', 1)
if len(parts) == 2:
    toc_section = parts[1]
    if '<hr />' in toc_section:
        toc_list, rest = toc_section.split('<hr />', 1)
        html_body = parts[0] + '<h2 id="table-of-contents">Table of Contents</h2>\n<div class="table-of-contents">\n' + toc_list.strip() + '\n</div>\n<hr />' + rest

# Full styled HTML
styled_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>ShieldAPI User Manual</title>
<style>
  @page {{
    size: A4;
    margin: 18mm 16mm 18mm 16mm;
    @bottom-right {{
      content: counter(page);
    }}
  }}
  body {{
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 10pt;
    line-height: 1.6;
    color: #1f2328;
    background: #ffffff;
    margin: 0;
    padding: 0;
  }}
  h1, h2, h3, h4, h5, h6 {{
    color: #0f172a;
    font-weight: 700;
    margin-top: 1.4em;
    margin-bottom: 0.5em;
    page-break-after: avoid;
  }}
  h1 {{
    font-size: 20pt;
    border-bottom: 2px solid #0284c7;
    padding-bottom: 6px;
    margin-top: 0;
    color: #0284c7;
  }}
  h2 {{
    font-size: 14pt;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 5px;
    margin-top: 1.6em;
  }}
  h3 {{
    font-size: 11.5pt;
    color: #1e293b;
  }}
  h4 {{
    font-size: 10.5pt;
    color: #334155;
  }}
  p, li {{
    color: #334155;
  }}
  a {{
    color: #0284c7;
    text-decoration: none;
  }}
  a:hover {{
    text-decoration: underline;
  }}
  
  /* Table of Contents - Book / Publication Style */
  .table-of-contents {{
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 22px 30px;
    margin: 16px 0 24px 0;
  }}
  .table-of-contents ul {{
    list-style: none !important;
    padding-left: 0 !important;
    margin: 0 !important;
  }}
  .table-of-contents ul ul {{
    padding-left: 22px !important;
    margin-top: 4px !important;
    margin-bottom: 8px !important;
    border-left: 1px solid #e2e8f0;
  }}
  .table-of-contents li {{
    margin: 5px 0 !important;
    line-height: 1.5 !important;
  }}
  .table-of-contents a {{
    color: #0f172a !important;
    text-decoration: none !important;
    display: inline-block;
    transition: color 0.15s ease;
  }}
  .table-of-contents > ul > li {{
    margin-top: 10px !important;
  }}
  .table-of-contents > ul > li:first-child {{
    margin-top: 0 !important;
  }}
  .table-of-contents > ul > li > a {{
    font-weight: 700 !important;
    font-size: 10pt !important;
    color: #0f172a !important;
  }}
  .table-of-contents ul ul li a {{
    font-weight: 400 !important;
    font-size: 9.5pt !important;
    color: #475569 !important;
  }}
  .table-of-contents a:hover {{
    color: #0284c7 !important;
    text-decoration: underline !important;
  }}

  /* Math & Formula Box */
  .formula-box {{
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-left: 4px solid #0284c7;
    border-radius: 8px;
    padding: 14px 18px;
    margin: 16px 0;
    box-shadow: 0 2px 6px rgba(0,0,0,0.04);
    page-break-inside: avoid;
  }}
  .formula-header {{
    font-size: 8pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #0284c7;
    margin-bottom: 8px;
  }}
  .formula-math {{
    font-family: 'Cambria Math', 'Latin Modern Math', 'Times New Roman', serif;
    font-size: 12.5pt;
    text-align: center;
    padding: 12px 16px;
    color: #0f172a;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    letter-spacing: 0.3px;
  }}
  .formula-var {{
    font-style: italic;
    font-weight: 600;
    color: #0f172a;
  }}
  .formula-op {{
    margin: 0 5px;
    font-weight: 400;
    color: #64748b;
  }}
  .formula-fn {{
    font-weight: 700;
    font-style: normal;
    color: #0369a1;
    margin-right: 3px;
  }}
  .formula-bracket {{
    font-size: 16pt;
    color: #475569;
    vertical-align: -1px;
  }}
  .formula-term {{
    font-style: italic;
    color: #1e293b;
  }}
  .formula-sym {{
    font-weight: 700;
    font-style: normal;
    color: #b91c1c;
  }}
  .formula-group {{
    color: #64748b;
  }}
  .formula-legend {{
    font-size: 9pt;
    color: #475569;
    margin-top: 8px;
    text-align: center;
    font-style: italic;
  }}

  /* Tables */
  table {{
    border-collapse: collapse;
    width: 100%;
    margin: 16px 0;
    font-size: 9pt;
    page-break-inside: avoid;
  }}
  th, td {{
    border: 1px solid #cbd5e1;
    padding: 8px 12px;
    text-align: left;
  }}
  th {{
    background-color: #f1f5f9;
    font-weight: 700;
    color: #0f172a;
  }}
  tr:nth-child(even) td {{
    background-color: #f8fafc;
  }}

  /* Code Blocks */
  pre {{
    background-color: #0d1117;
    color: #e6edf3;
    padding: 12px 16px;
    border-radius: 6px;
    font-family: "Cascadia Code", "Fira Code", Consolas, "Courier New", monospace;
    font-size: 8.5pt;
    line-height: 1.45;
    overflow-x: auto;
    page-break-inside: avoid;
    border: 1px solid #30363d;
  }}
  code {{
    font-family: "Cascadia Code", "Fira Code", Consolas, "Courier New", monospace;
    font-size: 8.5pt;
    background-color: #f1f5f9;
    color: #0f172a;
    padding: 2px 5px;
    border-radius: 4px;
    border: 1px solid #e2e8f0;
  }}
  pre code {{
    background-color: transparent;
    color: inherit;
    padding: 0;
    border: none;
  }}

  /* Blockquotes / Alerts */
  blockquote {{
    margin: 14px 0;
    padding: 10px 16px;
    border-left: 4px solid #0284c7;
    background-color: #f0f9ff;
    color: #0369a1;
    border-radius: 0 6px 6px 0;
    page-break-inside: avoid;
  }}
  blockquote p {{
    margin: 0;
    color: inherit;
  }}

  hr {{
    border: none;
    border-top: 1px solid #e2e8f0;
    margin: 20px 0;
  }}

  .page-break {{
    page-break-after: always;
  }}

  img {{
    page-break-inside: avoid;
  }}
</style>
</head>
<body>
{html_body}
</body>
</html>
"""

with open(HTML_FILE, "w", encoding="utf-8") as f:
    f.write(styled_html)

print("Generated HTML successfully.")

# Build PDF using Edge Headless
edge_paths = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
]
edge_path = next((p for p in edge_paths if os.path.exists(p)), None)

if not edge_path:
    print("ERROR: msedge.exe not found.")
    exit(1)

cmd = [
    edge_path,
    "--headless",
    "--disable-gpu",
    "--run-all-compositor-stages-before-draw",
    f"--print-to-pdf={PDF_FILE}",
    HTML_FILE
]

res = subprocess.run(cmd, capture_output=True, text=True)
if res.returncode == 0 and os.path.exists(PDF_FILE):
    size = os.path.getsize(PDF_FILE)
    print(f"SUCCESS: Generated PDF at {PDF_FILE} (Size: {size} bytes)")
else:
    print(f"ERROR: PDF generation failed. Return code: {res.returncode}")
    print(res.stderr)
