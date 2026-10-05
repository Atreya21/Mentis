import os
import subprocess

OUT_DIR = "/Users/atreyaghoshal/.gemini/antigravity/scratch/Mentis/legal/pdf"
BRAIN_DIR = "/Users/atreyaghoshal/.gemini/antigravity/brain/bbd28d30-549d-4943-9e39-d01249cf2f23"
os.makedirs(OUT_DIR, exist_ok=True)
CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

CSS = """
@page {
    size: A4;
    margin: 20mm 18mm 20mm 18mm;
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
    font-size: 10pt;
    margin: 0;
    padding: 0;
}
.header-bar {
    border-bottom: 2.5px solid #0f2b48;
    padding-bottom: 8px;
    margin-bottom: 18px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
}
.org-name {
    font-size: 13.5pt;
    font-weight: 800;
    letter-spacing: 0.6px;
    color: #0f2b48;
    text-transform: uppercase;
}
.doc-subtitle {
    font-size: 8.5pt;
    font-weight: 700;
    color: #4a5568;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
.title-cover {
    text-align: center;
    padding: 80px 20px 40px 20px;
}
.title-cover h1 {
    font-size: 24pt;
    font-weight: 900;
    color: #0f2b48;
    margin: 0 0 15px 0;
    line-height: 1.2;
    text-transform: uppercase;
    letter-spacing: 1px;
}
.title-cover .sub-title {
    font-size: 12pt;
    font-weight: 600;
    color: #2b6cb0;
    margin-bottom: 30px;
}
.title-cover .divider {
    width: 80px;
    height: 3px;
    background-color: #0f2b48;
    margin: 25px auto;
}
.meta-box {
    margin: 40px auto;
    max-width: 500px;
    background-color: #f7fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 20px;
    text-align: left;
    font-size: 9.5pt;
}
.meta-box table {
    margin: 0;
}
.meta-box td {
    border: none;
    padding: 5px 8px;
}
.meta-box td.label {
    font-weight: 700;
    color: #4a5568;
    width: 40%;
}
h1 {
    font-size: 16pt;
    font-weight: 800;
    color: #0f2b48;
    margin: 0 0 10px 0;
    line-height: 1.25;
}
h2 {
    font-size: 12.5pt;
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
    font-size: 10pt;
    font-weight: 700;
    color: #2d3748;
    margin: 10px 0 4px 0;
}
p {
    margin: 0 0 8px 0;
    text-align: justify;
}
.legal-body {
    font-family: "Georgia", "Times New Roman", serif;
    font-size: 9.8pt;
    line-height: 1.6;
}
.legal-clause {
    margin-bottom: 14px;
}
.clause-num {
    font-weight: 700;
    color: #0f2b48;
}
.highlight-box {
    background-color: #f7fafc;
    border-left: 4px solid #2b6cb0;
    padding: 10px 14px;
    margin: 12px 0;
    border-radius: 0 4px 4px 0;
    font-size: 9.2pt;
}
.alert-box {
    background-color: #fffaf0;
    border-left: 4px solid #dd6b20;
    padding: 10px 14px;
    margin: 12px 0;
    border-radius: 0 4px 4px 0;
    font-size: 9.2pt;
}
table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 8.8pt;
}
th {
    background-color: #edf2f7;
    color: #1a202c;
    font-weight: 700;
    text-align: left;
    padding: 6px 8px;
    border: 1px solid #cbd5e0;
}
td {
    padding: 5px 8px;
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
    margin-top: 35px;
    display: flex;
    justify-content: space-between;
}
.signature-col {
    width: 46%;
    border-top: 1px solid #4a5568;
    padding-top: 6px;
    text-align: center;
    font-size: 8.8pt;
}
.badge {
    display: inline-block;
    padding: 2px 6px;
    font-size: 7.8pt;
    font-weight: 700;
    border-radius: 3px;
    text-transform: uppercase;
}
.badge-blue { background-color: #ebf8ff; color: #2b6cb0; border: 1px solid #bee3f8; }
.badge-green { background-color: #f0fff4; color: #276749; border: 1px solid #c6f6d5; }
.badge-orange { background-color: #fffaf0; color: #c05621; border: 1px solid #feebc8; }
.footer-note {
    font-size: 7.8pt;
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
.hierarchy-card {
    border: 1px solid #cbd5e0;
    border-radius: 4px;
    padding: 10px 14px;
    margin-bottom: 10px;
    background-color: #ffffff;
}
.hierarchy-card.tier1 {
    border-left: 4px solid #0f2b48;
    background-color: #f7fafc;
}
.hierarchy-card.tier2 {
    border-left: 4px solid #2b6cb0;
}
.hierarchy-card.advisory {
    border-left: 4px solid #38a169;
}
"""

def render_html(title, subtitle, body_html):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{title}</title>
    <style>{CSS}</style>
</head>
<body>
    <div class="header-bar">
        <div class="org-name">Mentis Mathematics Foundation</div>
        <div class="doc-subtitle">{subtitle}</div>
    </div>
    {body_html}
    <div class="footer-note">
        Mentis Mathematics Foundation (Incorporation under Section 8, Companies Act, 2013 | West Bengal, India) • Confidential Legal Material
    </div>
</body>
</html>"""

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
        print(f"✅ Generated: {os.path.basename(output_pdf_path)} ({size:,} bytes)")
        # Also copy to brain directory for direct artifact access
        brain_copy = os.path.join(BRAIN_DIR, os.path.basename(output_pdf_path))
        with open(output_pdf_path, "rb") as src, open(brain_copy, "wb") as dst:
            dst.write(src.read())
    else:
        print(f"❌ Failed: {output_pdf_path}\n{res.stderr}")

# -------------------------------------------------------------
# 1. BRIEFING & INSTRUCTION MEMORANDUM TO LEGAL COUNSEL
# -------------------------------------------------------------
letter_body = """
<h1>Briefing & Instruction Memorandum for Legal Counsel</h1>
<div class="highlight-box">
    <strong>To:</strong> Legal Counsel / Practicing Company Secretary<br>
    <strong>From:</strong> Atreya Ghoshal, Founder & Proposed First Director<br>
    <strong>Date:</strong> October 5, 2026<br>
    <strong>Subject:</strong> Formal Instructions for Incorporation of Mentis Mathematics Foundation as a Section 8 Company in West Bengal
</div>

<p>Dear Counsel,</p>
<p>This memorandum conveys our finalized statutory drafting, governance architecture, and formal filing instructions for incorporating <strong>Mentis Mathematics Foundation</strong> as a non-profit company under Section 8 of the Companies Act, 2013 (read with Rule 19 of the Companies (Incorporation) Rules, 2014) under the jurisdiction of the Registrar of Companies (RoC), West Bengal, Kolkata.</p>

<h2>1. Core Filing Parameters & Statutory Boundaries</h2>
<table>
    <tr>
        <th style="width: 30%;">Statutory Parameter</th>
        <th>Filing Specification</th>
    </tr>
    <tr>
        <td><strong>Proposed Corporate Name</strong></td>
        <td><strong>MENTIS MATHEMATICS FOUNDATION</strong> (Section 8 Non-Profit Company)</td>
    </tr>
    <tr>
        <td><strong>Registered Office Jurisdiction</strong></td>
        <td><strong>State of West Bengal, India</strong> (Registrar of Companies, Kolkata)</td>
    </tr>
    <tr>
        <td><strong>Capital Structure</strong></td>
        <td>Company Limited by Shares / Guarantee (Nominal Authorized Capital: ₹1,00,000 / 10,000 equity shares of ₹10 each)</td>
    </tr>
    <tr>
        <td><strong>First Directors & Subscribers</strong></td>
        <td><strong>Strictly & Exclusively:</strong><br>
        1. <strong>Atreya Ghoshal</strong> (Founder & First Director)<br>
        2. <strong>Aritra Ghoshal</strong> (Co-Founder & First Director)</td>
    </tr>
    <tr>
        <td><strong>Digital Signature Certificates (DSC)</strong></td>
        <td>Class 3 DSCs to be procured and registered on MCA V3 for Atreya Ghoshal & Aritra Ghoshal.</td>
    </tr>
</table>

<h2>2. Strict Statutory Liability Insulation for Team Members & Advisors</h2>
<div class="alert-box">
    <strong>MANDATORY INSTRUCTION:</strong> Do <u>NOT</u> include Drashti Tailor, Navya Negi, Shail Raj Vardhan, Sarthak Sharma, or Dr. Kalpana Sharma as First Directors, Subscribers, or statutory signatories in Form INC-13, Form INC-31, or the SPICe+ webform.
</div>
<p>Our team includes distinguished student leaders and academic mentors who hold vital operational roles in our Foundation (as detailed in Document 3). However, to protect them from statutory liabilities, compliance obligations, regulatory filings, and director-level legal exposure, their appointments will be executed <strong>strictly post-incorporation through internal Board Resolutions and executive engagement charters</strong>. This ensures clean, swift MCA approval without delaying the incorporation process.</p>

<h2>3. Comprehensive Objects Clause Scope (Form INC-13, Clause III.A)</h2>
<p>We have drafted <strong>8 broad, future-proof Main Objects</strong> in Form INC-13. While mathematical sciences form our foundational anchor, our objects deliberately encompass:</p>
<ul>
    <li><strong>Advancement of Mathematical Sciences & Foundational Logic:</strong> Pure and applied math, theoretical statistics, and problem-solving.</li>
    <li><strong>Promotion of Natural & Fundamental Sciences:</strong> Physics, chemistry, biological and life sciences, earth and planetary sciences.</li>
    <li><strong>Interdisciplinary STEM Innovation:</strong> Computational biology, artificial intelligence, biophysics, and mathematical modeling.</li>
    <li><strong>Educational Programmes, Olympiads & Workshops:</strong> Academic competitions, symposia, bootcamps, and merit awards.</li>
    <li><strong>Collaborative Research Incubation & Fellowships:</strong> Independent scholar incubation, academic mentorship, and research publishing.</li>
    <li><strong>Digital Platforms & Open-Access Software:</strong> Interactive learning portals (Matrix, Curiofacts, VEX, Resource Hub) and community infrastructure.</li>
    <li><strong>Academic Publishing & Educational Media:</strong> Journals, monographs, curriculum materials, and video explainers.</li>
    <li><strong>Institutional Collaborations & Global Linkages:</strong> Academic MoUs with universities, scientific academies, and research bodies worldwide.</li>
</ul>

<h2>4. Mandatory Enabling Clauses in Articles of Association (Form INC-31 e-AOA)</h2>
<p>Please ensure that the Articles of Association (Form INC-31) explicitly incorporate the following enabling provisions:</p>
<ol>
    <li><strong>Advisory Council Clause:</strong> Empowering the Board of Directors to constitute an Academic Advisory Council, appoint distinguished scholars (such as Dr. Kalpana Sharma), and frame advisory guidelines.</li>
    <li><strong>Executive Operational Committees:</strong> Authorizing the Board to appoint non-director Executive Heads, Programme Coordinators, and operational leads without statutory director liabilities.</li>
    <li><strong>Remuneration for Actual Services Rendered:</strong> Enabling the Foundation, pursuant to Section 8(1) and the proviso to Clause IV of the MOA, to disburse reasonable and proper remuneration/salaries to directors for actual full-time executive, technological, and administrative services.</li>
</ol>

<h2>5. Procedural Checklist & Next Steps</h2>
<ol>
    <li>Initiate Class 3 DSC issuance for Atreya Ghoshal and Aritra Ghoshal.</li>
    <li>File SPICe+ Part A for Name Reservation of <strong>MENTIS MATHEMATICS FOUNDATION</strong>.</li>
    <li>Integrate the 8 Main Object clauses into Form INC-13 e-MOA.</li>
    <li>Prepare the SPICe+ Part B incorporation dossier, including Form DIR-2, INC-9, and AGILE-PRO-S (PAN, TAN, EPFO, ESIC, Bank A/c).</li>
</ol>

<div class="signature-box">
    <div class="signature-col">
        <strong>ATREYA GHOSHAL</strong><br>
        Founder & Proposed First Director<br>
        Mentis Mathematics Foundation
    </div>
    <div class="signature-col">
        <strong>ARITRA GHOSHAL</strong><br>
        Co-Founder & Proposed First Director<br>
        Mentis Mathematics Foundation
    </div>
</div>
"""

doc1_html = render_html("Briefing Letter to Legal Counsel", "Formal Instructions", letter_body)
generate_pdf(doc1_html, os.path.join(OUT_DIR, "01_Briefing_Letter_to_Legal_Counsel.pdf"))

# -------------------------------------------------------------
# 2. STATUTORY FORM INC-13 (e-MOA)
# -------------------------------------------------------------
moa_body = """
<div style="text-align: center; margin-bottom: 25px;">
    <div style="font-size: 11pt; font-weight: 700; color: #4a5568; text-transform: uppercase;">Form No. INC-13</div>
    <div style="font-size: 8.5pt; color: #718096; margin-bottom: 8px;">[Pursuant to Section 4 and Section 8 of the Companies Act, 2013 and Rule 19(2) of the Companies (Incorporation) Rules, 2014]</div>
    <h1 style="font-size: 17pt; margin: 0; color: #0f2b48;">MEMORANDUM OF ASSOCIATION</h1>
    <div style="font-size: 12pt; font-weight: 800; color: #1a365d; margin-top: 4px;">OF</div>
    <div style="font-size: 15pt; font-weight: 900; color: #0f2b48; letter-spacing: 0.5px;">MENTIS MATHEMATICS FOUNDATION</div>
    <div style="font-size: 9pt; font-weight: 600; color: #2b6cb0; margin-top: 4px;">(A Company Licensed Under Section 8 of the Companies Act, 2013)</div>
</div>

<div class="legal-body">

<div class="legal-clause">
    <span class="clause-num">I. NAME CLAUSE:</span> The name of the company is <strong>MENTIS MATHEMATICS FOUNDATION</strong>.
</div>

<div class="legal-clause">
    <span class="clause-num">II. REGISTERED OFFICE CLAUSE:</span> The registered office of the Company will be situated in the <strong>State of West Bengal</strong>, India (under the jurisdiction of the Registrar of Companies, West Bengal, Kolkata).
</div>

<div class="legal-clause">
    <span class="clause-num">III. OBJECTS CLAUSE:</span>
    <p style="margin-top: 6px;"><strong>(A) THE OBJECTS FOR WHICH THE COMPANY IS ESTABLISHED (MAIN OBJECTS TO BE PURSUED UPON INCORPORATION):</strong></p>
    
    <ol style="padding-left: 20px;">
        <li><strong>Advancement of Mathematical Sciences & Foundational Logic:</strong> To promote, advance, encourage, develop, and disseminate the study, teaching, learning, and appreciation of pure and applied mathematics, mathematical logic, statistics, probability, and theoretical disciplines among students, researchers, educators, and the general public; and to cultivate analytical thinking, problem-solving proficiency, and quantitative reasoning across all tiers of society.</li>
        
        <li><strong>Promotion of Natural & Fundamental Sciences:</strong> To advance, promote, and facilitate education, literacy, and scientific inquiry in the natural and fundamental sciences—including <strong>physics, chemistry, biological and life sciences, earth and planetary sciences</strong>—emphasizing their mathematical foundations, experimental validation, theoretical modeling, and quantitative formulations.</li>
        
        <li><strong>Interdisciplinary STEM Innovation & Applied Scientific Disciplines:</strong> To foster and promote cross-disciplinary study, research, and applications at the intersection of mathematics, natural sciences, computer science, data science, artificial intelligence, biophysics, chemical physics, quantum information, mathematical biology, computational modeling, and engineering sciences, bridging foundational theory with real-world technological and scientific innovation.</li>
        
        <li><strong>Educational Programmes, Workshops, Seminars, Competitions & Olympiads:</strong> To design, organize, sponsor, and conduct educational initiatives, lecture series, workshops, winter and summer schools, bootcamps, symposia, seminars, conferences, academic exhibitions, and mathematical/scientific competitions or olympiads; and to recognize talent through academic awards, certificates, medals, fellowships, and scholarships to students, educators, and scholars.</li>
        
        <li><strong>Collaborative Research Incubation, Mentorship & Fellowships:</strong> To establish, operate, and maintain an academic and scientific research ecosystem and incubator wherein students, independent scholars, and researchers can formulate, conduct, and collaborate on scientific investigations, connect with experienced academic mentors, form research collectives, and publish or disseminate findings under the flagship and institutional backing of the Foundation.</li>
        
        <li><strong>Digital Infrastructure, Open-Access Platforms & Educational Software:</strong> To conceptualize, develop, operate, and maintain open-access digital platforms, web portals, mobile applications, software tools, knowledge hubs, and interactive community networks (including discussion forums, resource repositories, instructional video channels, reels, and peer-networking platforms) to democratize global access to mathematical, scientific, and educational resources.</li>
        
        <li><strong>Academic Publishing, Scientific Literature & Educational Media:</strong> To author, curate, edit, publish, print, and digitally distribute academic journals, research papers, monographs, newsletters, textbooks, study materials, problem collections, audio-visual educational content, and popular scientific literature in pure mathematics, natural sciences, and interdisciplinary fields.</li>
        
        <li><strong>Institutional Collaborations, Industry Linkages & Global Outreach:</strong> To establish academic linkages, consortia, partnerships, and Memoranda of Understanding (MoUs) with schools, colleges, universities, research institutes, scientific academies, government bodies, non-governmental organisations, and corporate entities in India and internationally to further collaborative scientific education and research.</li>
    </ol>

    <div class="page-break"></div>

    <p style="margin-top: 15px;"><strong>(B) MATTERS NECESSARY FOR FURTHERANCE OF THE OBJECTS SPECIFIED IN CLAUSE III(A) (ANCILLARY & OPERATIONAL POWERS):</strong></p>
    <ol style="padding-left: 20px;">
        <li><strong>Revenue, Subscriptions & Service Fees:</strong> To levy, collect, and receive reasonable subscription fees, admission fees, event registration charges, course fees, examination fees, and service charges for academic events, platforms, publications, and educational services provided by the Foundation.</li>
        <li><strong>Grants, Donations & Sponsorships:</strong> To receive, invite, and accept voluntary contributions, donations, gifts, sponsorships, bequests, legacies, endowments, institutional grants, and Corporate Social Responsibility (CSR) contributions from individuals, philanthropic trusts, corporates, and public/private institutions in India and abroad (subject to applicable laws including FCRA).</li>
        <li><strong>Intellectual Property Rights:</strong> To apply for, purchase, register, protect, license, and maintain patents, trademarks, copyrights, trade secrets, software licenses, domain names, and other intellectual property rights arising from or incidental to the Foundation’s activities.</li>
        <li><strong>Property Acquisition & Infrastructure:</strong> To purchase, lease, exchange, hire, construct, or otherwise acquire movable or immovable property, laboratories, libraries, offices, and digital server infrastructure necessary for the Foundation's activities.</li>
        <li><strong>Banking & Financial Operations:</strong> To open and maintain bank accounts (current, savings, fixed deposit), draw, make, accept, endorse, and discount cheques, bills of exchange, and promissory notes in the ordinary course of the Foundation's operations.</li>
        <li><strong>Employment & Professional Remuneration:</strong> To recruit, engage, employ, and remunerate executives, directors, educators, researchers, coordinators, legal and technical experts, and staff; and to pay reasonable and proper remuneration for actual services rendered in accordance with the provisions of the Companies Act, 2013.</li>
        <li><strong>Prudential Investment:</strong> To invest moneys of the Foundation not immediately required in recognized government securities, fixed deposits, or scheduled bank instruments, adhering strictly to non-profit and non-speculative guidelines.</li>
    </ol>
</div>

<div class="legal-clause">
    <span class="clause-num">IV. NON-PROFIT & DIVIDEND PROHIBITION CLAUSE:</span>
    <ol style="padding-left: 20px;">
        <li>The profits, if any, or other income and property of the Company, whenever derived, shall be applied <strong>solely for the promotion of its objects</strong> as set forth in this Memorandum.</li>
        <li><strong>No portion of the profits, income, or property shall be paid, transferred, or distributed, directly or indirectly, by way of dividend, bonus, or otherwise by way of profit, to any members or directors of the Company.</strong></li>
        <li>Nothing herein contained shall prevent the payment in good faith of reasonable and proper remuneration to any officer or servant of the Company, or to any member or director, in return for any actual services rendered to the Company.</li>
    </ol>
</div>

<div class="legal-clause">
    <span class="clause-num">V. ALTERATION OF MEMORANDUM:</span> No alteration shall be made to this Memorandum of Association or to the Articles of Association of the Company which is inconsistent with or contrary to the requirements of Section 8 of the Companies Act, 2013, without the prior approval of the Registrar of Companies / Central Government.
</div>

<div class="legal-clause">
    <span class="clause-num">VI. WINDING UP & DISSOLUTION CLAUSE:</span> If upon the winding up or dissolution of the Company there remains, after the satisfaction of all debts and liabilities, any property whatsoever, the same shall not be distributed among the members of the Company, but shall be given or transferred to some other institution or company registered under Section 8 of the Companies Act, 2013, having objects similar to the objects of this Company, to be determined by the members of the Company at or before the time of dissolution, or in default thereof, by the National Company Law Tribunal.
</div>

<div class="legal-clause">
    <span class="clause-num">VII. SUBSCRIBERS & FIRST DIRECTORS SHEET:</span>
    <p>We, the several persons whose names and addresses are subscribed, are desirous of being formed into a Company not for profit in pursuance of this Memorandum of Association:</p>
    
    <table>
        <tr>
            <th style="width: 6%;">S.No.</th>
            <th style="width: 38%;">Name, Father's Name & Residential Address</th>
            <th style="width: 22%;">Occupation & DIN</th>
            <th style="width: 20%;">Statutory Role</th>
            <th style="width: 14%;">Signature</th>
        </tr>
        <tr>
            <td style="text-align: center;"><strong>1.</strong></td>
            <td><strong>ATREYA GHOSHAL</strong><br>Son of [Father's Name]<br>Address: [Permanent Residential Address, West Bengal]</td>
            <td>Student / Researcher / Founder<br>DIN: [To be obtained via SPICe+]</td>
            <td><strong>Founder & First Director</strong><br><em>(Subscriber)</em></td>
            <td style="vertical-align: middle; text-align: center;"><br>[Sign]<br>&nbsp;</td>
        </tr>
        <tr>
            <td style="text-align: center;"><strong>2.</strong></td>
            <td><strong>ARITRA GHOSHAL</strong><br>Son of [Father's Name]<br>Address: [Permanent Residential Address, West Bengal]</td>
            <td>IT Specialist / Technologist<br>DIN: [To be obtained via SPICe+]</td>
            <td><strong>Co-Founder & First Director</strong><br><em>(Subscriber)</em></td>
            <td style="vertical-align: middle; text-align: center;"><br>[Sign]<br>&nbsp;</td>
        </tr>
    </table>
    
    <div style="margin-top: 15px; font-size: 8.8pt;">
        <strong>Dated this _______ day of ___________________, 2026</strong><br>
        <strong>Witness to the above signatures:</strong><br>
        Name: __________________________________________________________________<br>
        Address & Membership No: ________________________________________________ (Practicing CS / CA / Advocate)
    </div>
</div>

</div>
"""

doc2_html = render_html("Form INC-13 Statutory e-MOA", "Statutory Filing Text", moa_body)
generate_pdf(doc2_html, os.path.join(OUT_DIR, "02_Form_INC-13_Statutory_MOA_Draft.pdf"))

# -------------------------------------------------------------
# 3. INSTITUTIONAL GOVERNANCE & ORGANIZATIONAL FRAMEWORK
# -------------------------------------------------------------
gov_body = """
<h1>Institutional Governance & Organizational Framework</h1>
<div class="highlight-box">
    <strong>Charter Purpose:</strong> Internal operational governance blueprint defining the two-tier organizational model, executive role allocations, and senior academic advisory body. All operational titles remain insulated from statutory board liabilities.
</div>

<h2>1. The Two-Tier Governance Architecture</h2>
<p>Mentis Mathematics Foundation operates under a strict two-tier governance model designed to balance legal compliance, academic excellence, and dynamic operational execution:</p>

<div class="hierarchy-card tier1">
    <div style="display: flex; justify-content: space-between; align-items: center;">
        <strong style="color: #0f2b48; font-size: 11pt;">TIER I: STATUTORY GOVERNING BOARD</strong>
        <span class="badge badge-blue">Statutory / MCA Signatories</span>
    </div>
    <p style="margin: 6px 0 0 0; font-size: 9.2pt;">
        <strong>Members:</strong> Atreya Ghoshal (Founder & Director) &amp; Aritra Ghoshal (Co-Founder & Director)<br>
        <strong>Jurisdiction:</strong> Legal stewardship, regulatory compliance, MCA filings, banking authority, and ultimate institutional vision. Only these two individuals carry director liabilities under the Companies Act, 2013.
    </p>
</div>

<div style="display: flex; justify-content: space-between; gap: 15px; margin-top: 10px;">
    <div class="hierarchy-card advisory" style="width: 48%;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="color: #276749; font-size: 10pt;">ACADEMIC ADVISORY BODY</strong>
            <span class="badge badge-green">Honorary / Advisory</span>
        </div>
        <p style="margin: 6px 0 0 0; font-size: 9pt;">
            <strong>Dr. Kalpana Sharma</strong><br>
            <em>Founding Academic Advisor & Chair of Advisory Council</em><br>
            Curricular integrity, academic ethics, senior university linkages, and peer review oversight. (Zero legal liability).
        </p>
    </div>
    <div class="hierarchy-card tier2" style="width: 48%;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="color: #2b6cb0; font-size: 10pt;">OPERATIONAL EXECUTIVE WING</strong>
            <span class="badge badge-orange">Executive / Non-Statutory</span>
        </div>
        <p style="margin: 6px 0 0 0; font-size: 9pt;">
            <strong>Executive Leadership Team:</strong><br>
            Drashti Tailor, Navya Negi, Shail Raj Vardhan, Sarthak Sharma, and Digital Platform Leads. (Appointed post-incorporation).
        </p>
    </div>
</div>

<h2>2. Detailed Roster of Operational Executive Leadership</h2>
<p>The following executive appointments will be executed post-incorporation via formal Board Resolutions:</p>

<table>
    <tr>
        <th style="width: 25%;">Leader</th>
        <th style="width: 32%;">Designation</th>
        <th>Operational Jurisdiction & Portfolio</th>
    </tr>
    <tr>
        <td><strong>Drashti Tailor</strong></td>
        <td><strong>Co-Founder & Programme Coordinator</strong></td>
        <td>Assisting with workshop management, student registrations, event operations, academic logistics, and community outreach. (Focuses strictly on operational execution, insulated from statutory board liability).</td>
    </tr>
    <tr>
        <td><strong>Navya Negi</strong></td>
        <td><strong>Founding Head of Management & Operations</strong></td>
        <td>Day-to-day administrative management, operational systems, internal communications, cross-functional team coordination, and workflow execution.</td>
    </tr>
    <tr>
        <td><strong>Shail Raj Vardhan</strong></td>
        <td><strong>Founding Head of Execution & Strategic Initiatives</strong></td>
        <td>Translating foundation strategies into actionable projects, launching outreach initiatives, establishing student chapters, and executing organizational partnerships.</td>
    </tr>
    <tr>
        <td><strong>Sarthak Sharma</strong></td>
        <td><strong>Founding Head of Events, External Relations & Data Management</strong></td>
        <td>Planning and coordinating academic conferences, workshops, and guest lectures; speaker coordination; institutional networking; and maintaining participant/member databases.</td>
    </tr>
</table>

<h2>3. Digital Platforms & Media Squad (Web & App Architecture)</h2>
<p>Tailored specifically to the live architecture of <strong>mentismathematicsfoundation.com</strong>:</p>
<table>
    <tr>
        <th style="width: 30%;">Platform Role</th>
        <th>Operational Scope & Responsibilities</th>
    </tr>
    <tr>
        <td><strong>1. Head of Digital Content & Community Platform</strong></td>
        <td>Directing editorial pipelines across <em>Resource Hub</em>, <em>Curiofacts</em>, and <em>VEX</em>; user moderation; community safety; managing editorial review calendars.</td>
    </tr>
    <tr>
        <td><strong>2. Academic Resource Curator</strong></td>
        <td>Vetting, classifying, and structuring pure mathematics and science lecture notes, syllabi, and problem sets; authoring weekly <em>Curiofacts</em> discoveries.</td>
    </tr>
    <tr>
        <td><strong>3. Digital Media & Video Production Lead</strong></td>
        <td>Producing, editing, and moderating mathematical concept explainers, visualizations, and short-form video reels for <em>VEX</em>, YouTube, and Instagram.</td>
    </tr>
    <tr>
        <td><strong>4. Digital Marketing, Growth & Ads Specialist</strong></td>
        <td>Managing targeted digital ad campaigns (Meta, Google Ads) for events and platform signups; driving student acquisition into <em>Matrix</em> and <em>Mathmate</em>.</td>
    </tr>
</table>

<h2>4. Senior Academic Advisory Structure</h2>
<div class="highlight-box">
    <strong>Dr. Kalpana Sharma — Founding Academic Advisor</strong><br>
    <em>Status:</em> Honorary Senior Academic Appointment (Appointed via Board Resolution post-incorporation)<br>
    <em>Scope of Counsel:</em> Senior academic mentorship, vetting educational curricula, ensuring scientific research integrity, facilitating institutional linkages with universities and established mathematical bodies, and presiding as patron/chair of the future <em>Mentis Academic Advisory Council</em>.
</div>

<h2>5. Specimen Board Resolution for Operational Appointments (Post-Incorporation)</h2>
<div style="background-color: #f7fafc; border: 1px solid #cbd5e0; padding: 12px; font-family: 'Georgia', serif; font-size: 8.8pt; border-radius: 4px;">
    <strong>"RESOLVED THAT</strong> pursuant to Article [X] of the Articles of Association of the Company, the Board hereby approves the constitution of the Operational Executive Wing and Academic Advisory Council of the Company.<br><br>
    <strong>RESOLVED FURTHER THAT</strong> Dr. Kalpana Sharma be and is hereby appointed as Founding Academic Advisor, Ms. Drashti Tailor as Co-Founder & Programme Coordinator, Ms. Navya Negi as Founding Head of Management & Operations, Mr. Shail Raj Vardhan as Founding Head of Execution, and Mr. Sarthak Sharma as Founding Head of Events, External Relations & Data Management, to hold office on such terms of engagement and responsibilities as decided by the Board.<br><br>
    <strong>RESOLVED FURTHER THAT</strong> the aforesaid appointees shall act strictly in an executive, operational, or advisory capacity and shall not be deemed to be Directors of the Company under the Companies Act, 2013, nor shall they carry any statutory director liabilities."
</div>
"""

doc3_html = render_html("Institutional Governance Framework", "Governance Blueprint", gov_body)
generate_pdf(doc3_html, os.path.join(OUT_DIR, "03_Institutional_Governance_Framework.pdf"))

# -------------------------------------------------------------
# 4. STATUTORY CHECKLIST, FINANCIAL PROJECTIONS & COMPLIANCE ROADMAP
# -------------------------------------------------------------
checklist_body = """
<h1>Statutory Checklist, Financial Projections & Compliance Roadmap</h1>
<div class="highlight-box">
    <strong>Document Purpose:</strong> Comprehensive procedural guide for legal counsel, detailing required KYC documents, 3-year Section 8 financial projections model, and post-incorporation compliance milestones.
</div>

<h2>1. Pre-Incorporation KYC Checklist for Directors & Subscribers</h2>
<p>The following documents must be compiled for <strong>Atreya Ghoshal</strong> and <strong>Aritra Ghoshal</strong>:</p>
<table>
    <tr>
        <th style="width: 28%;">Document Type</th>
        <th style="width: 42%;">Validity & Specification Requirements</th>
        <th style="width: 30%;">Status / Action</th>
    </tr>
    <tr>
        <td><strong>PAN Card</strong></td>
        <td>Permanent Account Number card. Name and Date of Birth must match official records exactly.</td>
        <td><span class="badge badge-green">Available</span> Self-attested copy</td>
    </tr>
    <tr>
        <td><strong>Identity Proof</strong></td>
        <td>Aadhaar Card / Valid Passport / Voter ID Card.</td>
        <td><span class="badge badge-green">Available</span> Self-attested copy</td>
    </tr>
    <tr>
        <td><strong>Residential Address Proof</strong></td>
        <td>Bank Account Statement / Electricity Bill / Telephone Bill in the applicant's name (<strong>Must not be older than 2 months</strong>).</td>
        <td><span class="badge badge-green">Available</span> Latest statement required</td>
    </tr>
    <tr>
        <td><strong>Class 3 DSC</strong></td>
        <td>Digital Signature Certificate on USB token for signing MCA V3 webforms.</td>
        <td><span class="badge badge-orange">To Be Generated</span> Counsel to initiate</td>
    </tr>
    <tr>
        <td><strong>Passport Photographs</strong></td>
        <td>Recent color passport photograph against a white background.</td>
        <td><span class="badge badge-green">Available</span> High-res digital copy</td>
    </tr>
</table>

<h2>2. Registered Office Proof (West Bengal Address)</h2>
<table>
    <tr>
        <th style="width: 28%;">Document Type</th>
        <th>Specification Requirements</th>
    </tr>
    <tr>
        <td><strong>Utility Bill</strong></td>
        <td>Electricity bill / Gas bill / Telephone bill for the premises in West Bengal (<strong>Must not be older than 2 months</strong>).</td>
    </tr>
    <tr>
        <td><strong>Ownership Proof</strong></td>
        <td>Title Deed / Municipal Tax Receipt / Property Tax Receipt in the name of the property owner.</td>
    </tr>
    <tr>
        <td><strong>No Objection Certificate (NOC)</strong></td>
        <td>Formal NOC signed by the property owner granting permission to use the premises as the registered office of Mentis Mathematics Foundation.</td>
    </tr>
    <tr>
        <td><strong>Rent Agreement</strong></td>
        <td>Notarized rent agreement between property owner and promoters (if premises are rented).</td>
    </tr>
</table>

<h2>3. Statutory Declarations & Attachments (SPICe+ Part B)</h2>
<ul>
    <li><strong>Form DIR-2:</strong> Consent to act as Director by Atreya Ghoshal & Aritra Ghoshal.</li>
    <li><strong>Form INC-9:</strong> Declaration by First Subscribers and Directors that they have not been convicted of any offense and that all documents are correct.</li>
    <li><strong>Form INC-14:</strong> Declaration by an advocate, chartered accountant, or company secretary in practice that all Section 8 requirements have been complied with.</li>
    <li><strong>Form INC-15:</strong> Declaration by each applicant promoting the Section 8 company.</li>
</ul>

<div class="page-break"></div>

<h2>4. Three-Year Financial Projections Model (Section 8 Requirement)</h2>
<p>MCA Section 8 license applications require an estimate of future annual income and expenditure for the next 3 years:</p>

<table>
    <tr>
        <th>Particulars (₹ in Lakhs)</th>
        <th style="text-align: right;">Year 1 (2026-27)</th>
        <th style="text-align: right;">Year 2 (2027-28)</th>
        <th style="text-align: right;">Year 3 (2028-29)</th>
    </tr>
    <tr style="background-color: #edf2f7; font-weight: 700;">
        <td colspan="4">A. ESTIMATED RECEIPTS / INCOME</td>
    </tr>
    <tr>
        <td>1. Voluntary Contributions & Philanthropic Grants</td>
        <td style="text-align: right;">₹ 3.50</td>
        <td style="text-align: right;">₹ 8.00</td>
        <td style="text-align: right;">₹ 15.00</td>
    </tr>
    <tr>
        <td>2. Educational Workshop & Seminar Fees</td>
        <td style="text-align: right;">₹ 1.20</td>
        <td style="text-align: right;">₹ 3.50</td>
        <td style="text-align: right;">₹ 6.50</td>
    </tr>
    <tr>
        <td>3. Platform Subscriptions & Publications</td>
        <td style="text-align: right;">₹ 0.80</td>
        <td style="text-align: right;">₹ 2.50</td>
        <td style="text-align: right;">₹ 5.00</td>
    </tr>
    <tr>
        <td>4. Institutional Sponsorships & CSR Grants</td>
        <td style="text-align: right;">₹ 1.50</td>
        <td style="text-align: right;">₹ 5.00</td>
        <td style="text-align: right;">₹ 10.00</td>
    </tr>
    <tr style="font-weight: 700; background-color: #f1f5f9;">
        <td>TOTAL ESTIMATED RECEIPTS (A)</td>
        <td style="text-align: right;">₹ 7.00</td>
        <td style="text-align: right;">₹ 19.00</td>
        <td style="text-align: right;">₹ 36.50</td>
    </tr>
    <tr style="background-color: #edf2f7; font-weight: 700;">
        <td colspan="4">B. ESTIMATED EXPENDITURE (FOR PROMOTION OF OBJECTS)</td>
    </tr>
    <tr>
        <td>1. Educational Workshops, Olympiads & Guest Lectures</td>
        <td style="text-align: right;">₹ 2.20</td>
        <td style="text-align: right;">₹ 5.50</td>
        <td style="text-align: right;">₹ 10.00</td>
    </tr>
    <tr>
        <td>2. Digital Infrastructure, Web & App Hosting (Server costs)</td>
        <td style="text-align: right;">₹ 0.90</td>
        <td style="text-align: right;">₹ 2.50</td>
        <td style="text-align: right;">₹ 4.50</td>
    </tr>
    <tr>
        <td>3. Research Fellowships, Mentorship & Student Awards</td>
        <td style="text-align: right;">₹ 1.00</td>
        <td style="text-align: right;">₹ 3.50</td>
        <td style="text-align: right;">₹ 8.00</td>
    </tr>
    <tr>
        <td>4. Academic Publications & Educational Literature</td>
        <td style="text-align: right;">₹ 0.60</td>
        <td style="text-align: right;">₹ 1.80</td>
        <td style="text-align: right;">₹ 3.50</td>
    </tr>
    <tr>
        <td>5. Administrative, Legal & Regulatory Compliance Costs</td>
        <td style="text-align: right;">₹ 1.80</td>
        <td style="text-align: right;">₹ 4.20</td>
        <td style="text-align: right;">₹ 8.00</td>
    </tr>
    <tr style="font-weight: 700; background-color: #f1f5f9;">
        <td>TOTAL ESTIMATED EXPENDITURE (B)</td>
        <td style="text-align: right;">₹ 6.50</td>
        <td style="text-align: right;">₹ 17.50</td>
        <td style="text-align: right;">₹ 34.00</td>
    </tr>
    <tr style="font-weight: 700; background-color: #e2e8f0;">
        <td>NET SURPLUS APPLIED TO OBJECTS (A - B)</td>
        <td style="text-align: right;">₹ 0.50</td>
        <td style="text-align: right;">₹ 1.50</td>
        <td style="text-align: right;">₹ 2.50</td>
    </tr>
</table>
<p style="font-size: 8.5pt; color: #718096; font-style: italic;">*Note: All surpluses are ploughed back solely into the non-profit objects of the Foundation in accordance with Section 8(1)(b) of the Companies Act, 2013.</p>

<h2>5. Post-Incorporation Compliance Calendar</h2>
<table>
    <tr>
        <th style="width: 22%;">Timeline</th>
        <th style="width: 38%;">Regulatory Requirement</th>
        <th>Statutory Authority</th>
    </tr>
    <tr>
        <td><strong>Day 1 - 7</strong></td>
        <td>Receipt of Certificate of Incorporation (COI), PAN, and TAN.</td>
        <td>MCA / Income Tax Dept</td>
    </tr>
    <tr>
        <td><strong>Day 7 - 30</strong></td>
        <td>Opening Scheduled Commercial Bank Current Account & depositing subscriber share capital.</td>
        <td>Scheduled Bank</td>
    </tr>
    <tr>
        <td><strong>Day 30 - 60</strong></td>
        <td>Filing <strong>Form 10A</strong> for Provisional <strong>Section 12A & 80G</strong> Tax Exemption registration.</td>
        <td>Income Tax Portal</td>
    </tr>
    <tr>
        <td><strong>Within 180 Days</strong></td>
        <td>Filing <strong>Form INC-20A</strong> (Declaration of Commencement of Business).</td>
        <td>RoC West Bengal (MCA)</td>
    </tr>
    <tr>
        <td><strong>Post-Launch</strong></td>
        <td>Trademark Application Filing for "MENTIS" in <strong>Class 41</strong> (Education) & <strong>Class 42</strong> (Software/Science).</td>
        <td>Trade Marks Registry</td>
    </tr>
    <tr>
        <td><strong>Annual Filings</strong></td>
        <td>Filing <strong>Form AOC-4</strong> (Financial Statements) & <strong>Form MGT-7A</strong> (Annual Return).</td>
        <td>RoC West Bengal (MCA)</td>
    </tr>
</table>
"""

doc4_html = render_html("Statutory Checklist & Roadmap", "MCA Filing Blueprint", checklist_body)
generate_pdf(doc4_html, os.path.join(OUT_DIR, "04_Statutory_Checklist_and_Compliance_Roadmap.pdf"))

# -------------------------------------------------------------
# 5. UNIFIED COMPLETE MASTER DOSSIER (ALL-IN-ONE)
# -------------------------------------------------------------
master_body = f"""
<div class="title-cover">
    <div style="font-size: 13pt; font-weight: 700; color: #4a5568; letter-spacing: 2px; text-transform: uppercase;">Statutory Incorporation &amp; Governance Dossier</div>
    <div class="divider"></div>
    <h1>Mentis Mathematics Foundation</h1>
    <div class="sub-title">A Company to be Incorporated Under Section 8 of the Companies Act, 2013<br>(Not For Profit)</div>
    
    <div class="meta-box">
        <table>
            <tr>
                <td class="label">Jurisdiction:</td>
                <td>State of West Bengal, India (RoC Kolkata)</td>
            </tr>
            <tr>
                <td class="label">Statutory Directors:</td>
                <td>Atreya Ghoshal &amp; Aritra Ghoshal</td>
            </tr>
            <tr>
                <td class="label">Document Scope:</td>
                <td>Complete MOA (INC-13), Governance Blueprint, Checklist &amp; Legal Letter</td>
            </tr>
            <tr>
                <td class="label">Version &amp; Date:</td>
                <td>Final Executive Master Copy • October 5, 2026</td>
            </tr>
        </table>
    </div>
</div>

<div class="page-break"></div>

<h2>Table of Contents</h2>
<table>
    <tr>
        <th style="width: 15%;">Section</th>
        <th style="width: 65%;">Document Title &amp; Description</th>
        <th style="width: 20%; text-align: right;">Target Audience</th>
    </tr>
    <tr>
        <td><strong>PART I</strong></td>
        <td><strong>Formal Instruction &amp; Briefing Memorandum for Legal Counsel</strong><br>
        Statutory parameters, jurisdiction, liability insulation, and procedural directives.</td>
        <td style="text-align: right;">Legal Counsel / CS</td>
    </tr>
    <tr>
        <td><strong>PART II</strong></td>
        <td><strong>Form INC-13: Statutory Memorandum of Association (e-MOA)</strong><br>
        Full statutory text with 8 comprehensive Main Objects, non-profit covenants, and subscriber sheet.</td>
        <td style="text-align: right;">MCA SPICe+ Filing</td>
    </tr>
    <tr>
        <td><strong>PART III</strong></td>
        <td><strong>Institutional Governance &amp; Organizational Framework</strong><br>
        Two-tier structure, Senior Academic Advisory Council, Operational Executive Wing, and squad allocations.</td>
        <td style="text-align: right;">Internal Board / Counsel</td>
    </tr>
    <tr>
        <td><strong>PART IV</strong></td>
        <td><strong>Statutory Checklist, Financial Projections &amp; Compliance Roadmap</strong><br>
        KYC guidelines, 3-year estimated receipts/expenditures, and post-incorporation calendar.</td>
        <td style="text-align: right;">CS / Promoters</td>
    </tr>
</table>

<div class="page-break"></div>

<div style="font-size: 11pt; font-weight: 800; color: #2b6cb0; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">PART I</div>
{letter_body}

<div class="page-break"></div>

<div style="font-size: 11pt; font-weight: 800; color: #2b6cb0; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">PART II</div>
{moa_body}

<div class="page-break"></div>

<div style="font-size: 11pt; font-weight: 800; color: #2b6cb0; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">PART III</div>
{gov_body}

<div class="page-break"></div>

<div style="font-size: 11pt; font-weight: 800; color: #2b6cb0; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">PART IV</div>
{checklist_body}
"""

master_html = render_html("Complete Legal Incorporation Dossier", "Master Incorporation Dossier", master_body)
generate_pdf(master_html, os.path.join(OUT_DIR, "Mentis_Mathematics_Foundation_Complete_Legal_Dossier.pdf"))

print("\n🚀 All 5 PDF documents have been successfully compiled!")
