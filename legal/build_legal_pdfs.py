import os
import subprocess

OUT_DIR = "/Users/atreyaghoshal/.gemini/antigravity/scratch/Mentis/legal/pdf"
os.makedirs(OUT_DIR, exist_ok=True)
CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

CSS_BASE = """
@page {
    size: A4;
    margin: 22mm 18mm 22mm 18mm;
}
* {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
}
body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #1a202c;
    line-height: 1.55;
    font-size: 10.5pt;
    margin: 0;
    padding: 0;
}
.header-bar {
    border-bottom: 2px solid #0f2b48;
    padding-bottom: 8px;
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
}
.org-name {
    font-size: 14pt;
    font-weight: 800;
    letter-spacing: 0.5px;
    color: #0f2b48;
    text-transform: uppercase;
}
.doc-subtitle {
    font-size: 8.5pt;
    font-weight: 600;
    color: #4a5568;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
h1 {
    font-size: 17pt;
    font-weight: 800;
    color: #0f2b48;
    margin: 0 0 10px 0;
    line-height: 1.25;
}
h2 {
    font-size: 13pt;
    font-weight: 700;
    color: #1a365d;
    margin: 18px 0 8px 0;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 4px;
}
h3 {
    font-size: 11pt;
    font-weight: 700;
    color: #2b6cb0;
    margin: 14px 0 6px 0;
}
h4 {
    font-size: 10.5pt;
    font-weight: 700;
    color: #2d3748;
    margin: 12px 0 4px 0;
}
p {
    margin: 0 0 9px 0;
    text-align: justify;
}
.legal-text {
    font-family: "Georgia", "Times New Roman", serif;
    font-size: 10pt;
    line-height: 1.6;
}
.highlight-box {
    background-color: #f7fafc;
    border-left: 4px solid #2b6cb0;
    padding: 10px 14px;
    margin: 12px 0;
    border-radius: 0 4px 4px 0;
    font-size: 9.5pt;
}
.alert-box {
    background-color: #fffaf0;
    border-left: 4px solid #dd6b20;
    padding: 10px 14px;
    margin: 12px 0;
    border-radius: 0 4px 4px 0;
    font-size: 9.5pt;
}
table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 9pt;
}
th {
    background-color: #edf2f7;
    color: #1a202c;
    font-weight: 700;
    text-align: left;
    padding: 7px 9px;
    border: 1px solid #cbd5e0;
}
td {
    padding: 6px 9px;
    border: 1px solid #cbd5e0;
    vertical-align: top;
}
tr:nth-child(even) td {
    background-color: #f8fafc;
}
.page-break {
    page-break-before: always;
}
.signature-box {
    margin-top: 30px;
    display: flex;
    justify-content: space-between;
}
.signature-line {
    width: 45%;
    border-top: 1px solid #718096;
    padding-top: 6px;
    text-align: center;
    font-size: 9pt;
}
.badge {
    display: inline-block;
    padding: 2px 7px;
    font-size: 8pt;
    font-weight: 700;
    border-radius: 3px;
    text-transform: uppercase;
}
.badge-blue { background-color: #ebf8ff; color: #2b6cb0; border: 1px solid #bee3f8; }
.badge-green { background-color: #f0fff4; color: #276749; border: 1px solid #c6f6d5; }
.badge-orange { background-color: #fffaf0; color: #c05621; border: 1px solid #feebc8; }
.footer-note {
    font-size: 8pt;
    color: #718096;
    border-top: 1px solid #e2e8f0;
    padding-top: 6px;
    margin-top: 25px;
    text-align: center;
}
ol, ul {
    margin: 0 0 10px 0;
    padding-left: 20px;
}
li {
    margin-bottom: 5px;
    text-align: justify;
}
"""

def generate_pdf(html_content, output_pdf_path):
    temp_html = output_pdf_path.replace(".pdf", ".html")
    with open(temp_html, "w", encoding="utf-8") as f:
        f.write(html_content)
    cmd = [
        CHROME_PATH,
        "--headless",
        "--disable-gpu",
        "--no-pdf-header-footer",
        "--run-all-compositor-stages-before-draw",
        f"--print-to-pdf={output_pdf_path}",
        temp_html
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if os.path.exists(temp_html):
        os.remove(temp_html)
    if os.path.exists(output_pdf_path):
        size = os.path.getsize(output_pdf_path)
        print(f"✅ Generated: {os.path.basename(output_pdf_path)} ({size} bytes)")
    else:
        print(f"❌ Failed: {output_pdf_path}\n{res.stderr}")

print("PDF Generator Script Ready")
