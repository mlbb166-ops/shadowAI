#!/bin/bash
cd /home/mmm/shadow-agent
./venv/bin/python - << 'EOF'
from fpdf import FPDF
import sqlite3

pdf = FPDF()
pdf.add_page()
pdf.set_font("Helvetica", "B", 16)
pdf.cell(0, 10, "Laporan Diskusi Tim Shadow AI (SHIELD)", ln=True, align="C")
pdf.ln(5)

pdf.set_font("Helvetica", size=11)
pdf.multi_cell(0, 8, "Proyek: SHIELD (AI Assistant for Digital Safety & Stunting Prevention)\nTim: Hisyam & Salsa\n\nRangkuman Diskusi Terakhir:")
pdf.ln(3)

conn = sqlite3.connect('/home/mmm/shadow-agent/brainstorm_memory.db')
c = conn.cursor()
rows = c.execute('SELECT rowid, user, role, msg FROM chats WHERE rowid >= 39 ORDER BY rowid ASC').fetchall()
for r in rows:
    sender = f"{r[1]} ({r[2]}):"
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(0, 6, sender, ln=True)
    pdf.set_font("Helvetica", size=9)
    # clean non-latin1 chars for simple fpdf
    cleaned_msg = r[3].encode('latin-1', 'replace').decode('latin-1')
    pdf.multi_cell(0, 5, cleaned_msg[:500])
    pdf.ln(2)

pdf_path = "/home/mmm/shadow-agent/laporan_diskusi_shadow.pdf"
pdf.output(pdf_path)
print("PDF created successfully at:", pdf_path)
EOF
ls -la /home/mmm/shadow-agent/laporan_diskusi_shadow.pdf
