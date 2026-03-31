import io
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

class ExportEngine:
    """
    Phase 3: The Delivery Layer.
    Translates AI-generated markdown concepts into professional, firm-ready artifacts (.docx).
    """

    @staticmethod
    def generate_docx(title: str, content: str) -> io.BytesIO:
        """
        Creates an executive-level Word Document from raw AI text.
        """
        doc = Document()
        
        # Configure overall styles
        style = doc.styles['Normal']
        font = style.font
        font.name = 'Calibri'
        font.size = Pt(11)

        # 1. Add Professional Letterhead / Header
        header = doc.add_heading(level=0)
        run = header.add_run("JABARI INTELLIGENCE // BID PRODUCTION")
        run.font.name = 'Arial'
        run.font.size = Pt(8)
        run.font.color.rgb = RGBColor(128, 128, 128)
        header.alignment = WD_ALIGN_PARAGRAPH.RIGHT

        # 2. Add Title
        title_para = doc.add_paragraph()
        title_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        title_run = title_para.add_run(title.upper())
        title_run.font.name = 'Arial'
        title_run.font.size = Pt(16)
        title_run.bold = True
        
        doc.add_paragraph() # Spacer

        # 3. Process Content (Basic Markdown -> Word styling)
        lines = content.split('\n')
        in_table = False
        current_table = None
        
        for line in lines:
            line = line.strip()
            
            # Table handling
            if line.startswith('|') and line.endswith('|'):
                # Extract cells
                cells = [c.strip() for c in line.split('|')[1:-1]]
                
                # Check if it's a separator row (e.g. |---|---|)
                if all(c.replace('-', '').strip() == '' for c in cells):
                    continue # Skip separator
                
                if not in_table:
                    # Start a new table
                    in_table = True
                    current_table = doc.add_table(rows=1, cols=len(cells))
                    current_table.style = 'Table Grid'
                    row = current_table.rows[0]
                    for i, text in enumerate(cells):
                        if i < len(row.cells):
                            row.cells[i].text = text.replace('**', '') # Simple cleanup for header
                            if len(row.cells[i].paragraphs) > 0 and len(row.cells[i].paragraphs[0].runs) > 0:
                                row.cells[i].paragraphs[0].runs[0].bold = True
                else:
                    # Add row to existing table
                    row = current_table.add_row()
                    for i, text in enumerate(cells):
                        if i < len(row.cells):
                            # Bold parser for table cells
                            parts = text.split('**')
                            p = row.cells[i].paragraphs[0]
                            for j, part in enumerate(parts):
                                if j % 2 == 1:
                                    p.add_run(part).bold = True
                                else:
                                    p.add_run(part)
                continue
            else:
                if in_table:
                    # End table block
                    in_table = False
                    current_table = None
                    doc.add_paragraph() # Spacer after table
                
                if not line:
                    doc.add_paragraph()
                    continue
                
                # Headers
                if line.startswith('### '):
                    h = doc.add_heading(line[4:], level=3)
                    h.style.font.name = 'Arial'
                    h.style.font.color.rgb = RGBColor(0, 0, 0)
                elif line.startswith('## '):
                    h = doc.add_heading(line[3:], level=2)
                    h.style.font.name = 'Arial'
                    h.style.font.color.rgb = RGBColor(0, 0, 0)
                elif line.startswith('# '):
                    h = doc.add_heading(line[2:], level=1)
                    h.style.font.name = 'Arial'
                    h.style.font.color.rgb = RGBColor(0, 0, 0)
                
                # Bullet points
                elif line.startswith('- ') or line.startswith('* '):
                    p = doc.add_paragraph(style='List Bullet')
                    text = line[2:]
                    parts = text.split('**')
                    for i, part in enumerate(parts):
                        if i % 2 == 1:
                            p.add_run(part).bold = True
                        else:
                            p.add_run(part)
                else:
                    # Normal paragraph or blockquote
                    if line.startswith('> '):
                        p = doc.add_paragraph(style='Intense Quote')
                        line = line[2:]
                    else:
                        p = doc.add_paragraph()
                        
                    parts = line.split('**')
                    for i, part in enumerate(parts):
                        if i % 2 == 1:
                            p.add_run(part).bold = True
                        else:
                            p.add_run(part)

        # 4. Add Footer
        footer = doc.sections[0].footer
        f_para = footer.paragraphs[0]
        f_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        f_run = f_para.add_run("Generated by Jabari AI - Verify all technical claims before submission.")
        f_run.font.name = 'Arial'
        f_run.font.size = Pt(8)
        f_run.font.italic = True
        f_run.font.color.rgb = RGBColor(150, 150, 150)

        # 5. Save to memory stream
        file_stream = io.BytesIO()
        doc.save(file_stream)
        file_stream.seek(0)
        
        return file_stream
