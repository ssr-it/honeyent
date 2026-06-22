import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { loadCompany } from "./company";

export interface PdfOptions {
  title: string;
  subtitle?: string;
  filename: string;
  head: string[];
  body: (string | number)[][];
  totals?: { label: string; value: string }[];
}

function company() {
  return loadCompany();
}

export function generatePdf(opts: PdfOptions): void {
  const c = company();
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  // Sanitize body values: strip ₹ symbol for better PDF encoding
  const sanitizedBody = opts.body.map(row =>
    row.map(cell =>
      typeof cell === 'string' ? cell.replace('₹', '').trim() : cell
    )
  );

  // Header band
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageW, 70, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(c.name, 40, 32);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(c.tagline, 40, 48);
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, pageW - 40, 32, { align: "right" });

  // Title
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(opts.title, 40, 100);
  if (opts.subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(opts.subtitle, 40, 116);
  }

  autoTable(doc, {
    startY: opts.subtitle ? 130 : 115,
    head: [opts.head],
    body: sanitizedBody,
    theme: "striped",
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 40, right: 40 },
  });

  if (opts.totals && opts.totals.length) {
    // @ts-expect-error - lastAutoTable injected by autotable
    const y = (doc.lastAutoTable?.finalY ?? 200) + 16;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    opts.totals.forEach((t, i) => {
      doc.text(`${t.label}:`, pageW - 220, y + i * 16);
      // Strip ₹ symbol if present and render number with symbol separately for better encoding
      const cleanValue = t.value.replace('₹', '').trim();
      const displayValue = cleanValue.startsWith('₹') ? cleanValue : `₹${cleanValue}`;
      doc.text(displayValue, pageW - 40, y + i * 16, { align: "right" });
    });
  }

  // Footer
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `${c.name}  •  ${c.phone}  •  ${c.email}  —  Page ${p} of ${pages}`,
      pageW / 2,
      doc.internal.pageSize.getHeight() - 20,
      { align: "center" },
    );
  }

  doc.save(opts.filename);
}

export interface InvoicePdfOptions {
  type: "Tax Invoice" | "Purchase Bill" | "Delivery Challan" | "Weigh Slip" | "Trip Sheet";
  no: string;
  date: string;
  party?: string;
  rows: { label: string; value: string }[];
  lines?: { head: string[]; body: (string | number)[][] };
  totals?: { label: string; value: string }[];
  remark?: string;
  filename: string;
}

export function generateDocPdf(opts: InvoicePdfOptions): void {
  const c = company();
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageW, 80, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(c.name, 40, 36);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(c.tagline, 40, 54);
  doc.text(`GSTIN: ${c.gstin}  •  ${c.phone}  •  ${c.email}`, 40, 68);

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(opts.type.toUpperCase(), pageW - 40, 36, { align: "right" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`No: ${opts.no}`, pageW - 40, 54, { align: "right" });
  doc.text(`Date: ${opts.date}`, pageW - 40, 68, { align: "right" });

  // Party + meta
  doc.setTextColor(15, 23, 42);
  let y = 110;
  if (opts.party) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Bill To / Party", 40, y);
    doc.setFont("helvetica", "normal");
    doc.text(opts.party, 40, y + 14);
    y += 36;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  opts.rows.forEach((r) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${r.label}:`, 40, y);
    doc.setFont("helvetica", "normal");
    // Strip ₹ symbol for better encoding, then add back if it's a currency value
    const cleanValue = String(r.value).replace('₹', '').trim();
    const displayValue = /^\d+[\d,]*$/.test(cleanValue) ? `₹${cleanValue}` : cleanValue;
    doc.text(displayValue, 160, y);
    y += 14;
  });

  if (opts.lines) {
    // Sanitize body values: strip ₹ symbol for better PDF encoding
    const sanitizedLines = opts.lines.body.map(row =>
      row.map(cell =>
        typeof cell === 'string' ? cell.replace('₹', '').trim() : cell
      )
    );
    autoTable(doc, {
      startY: y + 8,
      head: [opts.lines.head],
      body: sanitizedLines,
      theme: "grid",
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 40, right: 40 },
    });
    // @ts-expect-error injected
    y = (doc.lastAutoTable?.finalY ?? y) + 16;
  }

  if (opts.totals?.length) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    opts.totals.forEach((t, i) => {
      doc.text(`${t.label}`, pageW - 220, y + i * 16);
      // Strip ₹ symbol and render number with symbol separately for better encoding
      const cleanValue = t.value.replace('₹', '').trim();
      const displayValue = cleanValue.startsWith('₹') ? cleanValue : `₹${cleanValue}`;
      doc.text(displayValue, pageW - 40, y + i * 16, { align: "right" });
    });
    y += opts.totals.length * 16 + 8;
  }

  if (opts.remark) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(180, 30, 30);
    doc.text(`Remark: ${opts.remark}`, 40, y + 10);
  }

  const pageH = doc.internal.pageSize.getHeight();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Bank: ${c.bank}   •   UPI: ${c.upi}`, 40, pageH - 38);
  doc.text(`${c.address}   •   ${c.phone}   •   ${c.email}`, 40, pageH - 26);
  doc.text("Computer-generated document. E.&O.E. Subject to local jurisdiction.", pageW / 2, pageH - 14, { align: "center" });

  doc.save(opts.filename);
}
