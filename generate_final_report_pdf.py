import os
import re
import base64
import subprocess
import markdown
import PyPDF2

PROJECT_DIR = r"c:\Users\anshu\OneDrive\Desktop\shieldApi"
MD_FILE = os.path.join(PROJECT_DIR, "FINAL_PROJECT_REPORT.md")
HTML_FILE = os.path.join(PROJECT_DIR, "FINAL_PROJECT_REPORT.html")
PDF_FILE = os.path.join(PROJECT_DIR, "ShieldAPI_Final_Project_Report.pdf")

with open(MD_FILE, "r", encoding="utf-8") as f:
    md_content = f.read()

# Convert markdown alerts to clean styled blockquotes
md_content = re.sub(r'>\s*\[!NOTE\]\s*', '> **NOTE:** ', md_content)
md_content = re.sub(r'>\s*\[!TIP\]\s*', '> **TIP:** ', md_content)
md_content = re.sub(r'>\s*\[!WARNING\]\s*', '> **WARNING:** ', md_content)

# Clean up any leftover LaTeX math syntax into natural typography
md_content = md_content.replace(r'$\rightarrow$', '→')
md_content = md_content.replace(r'\rightarrow', '→')
md_content = re.sub(r'\$\\text\{([^}]+)\}\$', r'\1', md_content)
md_content = re.sub(r'\$([^$]+)\$', lambda m: m.group(1).replace(r'\text', '').replace('{', '').replace('}', '').strip(), md_content)

# Resolve and embed images as Base64 Data URIs preserving custom inline styles
def embed_img_tag(match):
    src = match.group(1)
    attrs = match.group(2)
    full_path = os.path.normpath(os.path.join(PROJECT_DIR, src))
    if os.path.exists(full_path):
        ext = os.path.splitext(full_path)[1].lower().replace('.', '')
        if ext == 'jpg':
            ext = 'jpeg'
        with open(full_path, "rb") as f_img:
            encoded = base64.b64encode(f_img.read()).decode("utf-8")
        style_match = re.search(r'style=[\"\'](.*?)[\"\']', attrs)
        if style_match:
            custom_style = style_match.group(1)
            style_str = f'style="{custom_style} border-radius: 5px; border: 1px solid #d0d7de; box-shadow: 0 2px 7px rgba(0,0,0,0.08);"'
        else:
            style_str = 'style="max-height: 155px; max-width: 95%; border-radius: 5px; border: 1px solid #d0d7de; box-shadow: 0 2px 7px rgba(0,0,0,0.08); margin: 3px auto; display: block;"'
        return f'<img src="data:image/{ext};base64,{encoded}" {style_str} />'
    return match.group(0)

md_content = re.sub(r'<img\s+src=[\"\'](.*?)[\"\']([^>]*)/?>', embed_img_tag, md_content)

# Parse Markdown to HTML
html_body = markdown.markdown(
    md_content,
    extensions=['tables', 'fenced_code', 'nl2br', 'toc']
)

# Full styled HTML
styled_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>ShieldAPI — Final Project Report</title>
<style>
  @page {{
    size: A4;
    margin: 11mm 13mm 11mm 13mm;
    @bottom-right {{
      content: counter(page);
    }}
  }}
  body {{
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 8.4pt;
    line-height: 1.38;
    color: #1f2328;
    background: #ffffff;
    margin: 0;
    padding: 0;
  }}
  h1, h2, h3, h4, h5, h6 {{
    color: #0f172a;
    font-weight: 700;
    margin-top: 0.8em;
    margin-bottom: 0.3em;
    page-break-after: avoid;
  }}
  h1 {{
    font-size: 16pt;
    border-bottom: 2px solid #0284c7;
    padding-bottom: 3px;
    margin-top: 0;
    color: #0284c7;
  }}
  h2 {{
    font-size: 11.8pt;
    border-bottom: 1.5px solid #e2e8f0;
    padding-bottom: 2.5px;
    margin-top: 0.9em;
    color: #0369a1;
  }}
  h3 {{
    font-size: 9.8pt;
    color: #1e293b;
    margin-top: 0.7em;
  }}
  h4 {{
    font-size: 8.8pt;
    color: #334155;
  }}
  p {{
    margin-top: 0.25em;
    margin-bottom: 0.4em;
  }}
  table {{
    width: 100%;
    border-collapse: collapse;
    margin: 6px 0;
    font-size: 7.9pt;
    page-break-inside: avoid;
  }}
  th, td {{
    border: 1px solid #d0d7de;
    padding: 3.5px 6.5px;
    text-align: left;
  }}
  th {{
    background-color: #f6f8fa;
    font-weight: 600;
    color: #24292f;
  }}
  tr:nth-child(even) {{
    background-color: #fbfcfd;
  }}
  code {{
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
    font-size: 7.9pt;
    background-color: #f1f5f9;
    padding: 1.5px 3.5px;
    border-radius: 3px;
    color: #0f172a;
  }}
  pre {{
    background-color: #0f172a;
    color: #f8fafc;
    padding: 6px 9px;
    border-radius: 5px;
    overflow-x: auto;
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
    font-size: 7.3pt;
    line-height: 1.3;
    margin: 5px 0;
    page-break-inside: avoid;
  }}
  pre code {{
    background-color: transparent;
    color: inherit;
    padding: 0;
    border-radius: 0;
    font-size: inherit;
  }}
  ul, ol {{
    margin-top: 0.2em;
    margin-bottom: 0.35em;
    padding-left: 18px;
  }}
  li {{
    margin-bottom: 0.15em;
  }}
  a {{
    color: #0284c7;
    text-decoration: none;
    font-weight: 500;
  }}
  blockquote {{
    margin: 5px 0;
    padding: 5px 10px;
    border-left: 3px solid #0284c7;
    background-color: #f0f9ff;
    color: #0369a1;
    border-radius: 0 4px 4px 0;
    page-break-inside: avoid;
  }}
  blockquote p {{
    margin: 0;
    color: inherit;
  }}
  hr {{
    border: none;
    border-top: 1px solid #e2e8f0;
    margin: 10px 0;
  }}
  .page-break {{
    page-break-after: always;
  }}
  img {{
    page-break-inside: avoid;
  }}

  /* Clickable Table of Contents Box */
  .toc-box {{
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-left: 3.5px solid #0284c7;
    border-radius: 6px;
    padding: 8px 12px;
    margin: 8px 0;
    box-shadow: 0 1px 3px rgba(0,0,0,0.03);
  }}
  .toc-title {{
    font-size: 9pt;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 3px;
  }}
  .toc-grid {{
    display: flex;
    justify-content: space-between;
    gap: 16px;
  }}
  .toc-col {{
    flex: 1;
  }}
  .toc-row {{
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: 2.2px 0;
    font-size: 8pt;
    border-bottom: 1px dotted #cbd5e1;
  }}
  .toc-row a {{
    color: #0369a1;
    text-decoration: none;
    font-weight: 600;
  }}
  .toc-row a:hover {{
    text-decoration: underline;
    color: #0284c7;
  }}
  .toc-page {{
    color: #64748b;
    font-size: 7.6pt;
    font-weight: 500;
    margin-left: 6px;
    white-space: nowrap;
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
    "--no-pdf-header-footer",
    "--run-all-compositor-stages-before-draw",
    f"--print-to-pdf={PDF_FILE}",
    HTML_FILE
]

res = subprocess.run(cmd, capture_output=True, text=True)
if res.returncode == 0 and os.path.exists(PDF_FILE):
    size = os.path.getsize(PDF_FILE)
    reader = PyPDF2.PdfReader(PDF_FILE)
    num_pages = len(reader.pages)
    print(f"SUCCESS: Generated 10-Page Master PDF at {PDF_FILE}")
    print(f"File Size: {size} bytes | Page Count: {num_pages} pages")

    # Generate Extended Appendix Edition (Master + Full User Manual + Full UML Doc)
    extended_pdf = os.path.join(PROJECT_DIR, "ShieldAPI_Final_Project_Report_Extended_Appendix.pdf")
    manual_pdf = os.path.join(PROJECT_DIR, "ShieldAPI_User_Manual.pdf")
    uml_pdf = os.path.join(PROJECT_DIR, "ShieldAPI_UML.pdf")

    merger = PyPDF2.PdfMerger()
    merger.append(PDF_FILE)
    if os.path.exists(manual_pdf):
        merger.append(manual_pdf)
    if os.path.exists(uml_pdf):
        merger.append(uml_pdf)
    merger.write(extended_pdf)
    merger.close()

    ext_reader = PyPDF2.PdfReader(extended_pdf)
    print(f"SUCCESS: Generated Extended Appendix PDF at {extended_pdf} ({len(ext_reader.pages)} pages)")
else:
    print(f"ERROR: PDF generation failed. Return code: {res.returncode}")
    print(res.stderr)
