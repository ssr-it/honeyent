// View Report dialog — render report on screen, then Download PDF / share.

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, MessageCircle, Mail, FileSpreadsheet, FileText } from "lucide-react";
import { generatePdf } from "@/lib/pdf";
import { shareWhatsApp, shareEmail } from "@/lib/share";
import { exportCsv, exportExcel } from "@/lib/export";

export interface ReportData {
  title: string;
  subtitle?: string;
  head: string[];
  body: (string | number)[][];
  totals?: { label: string; value: string }[];
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  report: ReportData | null;
}

export function ReportView({ open, onOpenChange, report }: Props) {
  if (!report) return null;

  function pdf() {
    generatePdf({
      title: report!.title,
      subtitle: report!.subtitle,
      filename: `${report!.title.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.pdf`,
      head: report!.head,
      body: report!.body,
      totals: report!.totals,
    });
  }

  function wa() {
    const lines = [
      `*${report!.title}*`,
      report!.subtitle ?? "",
      ...(report!.totals ?? []).map((t) => `${t.label}: ${t.value}`),
      `Rows: ${report!.body.length}`,
    ].filter(Boolean);
    shareWhatsApp(lines.join("\n"));
  }

  function mail() {
    const body = [
      report!.subtitle ?? "",
      ...(report!.totals ?? []).map((t) => `${t.label}: ${t.value}`),
      `Rows: ${report!.body.length}`,
    ].filter(Boolean).join("\n");
    shareEmail(report!.title, body);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-hidden sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{report.title}</DialogTitle>
          {report.subtitle ? <DialogDescription>{report.subtitle}</DialogDescription> : null}
        </DialogHeader>

        <div className="max-h-[60vh] overflow-auto rounded-md border border-border">
          {report.body.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No records found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {report.head.map((h) => <TableHead key={h} className="whitespace-nowrap">{h}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.body.map((row, i) => (
                  <TableRow key={i}>
                    {row.map((cell, j) => (
                      <TableCell key={j} className="whitespace-nowrap text-xs tabular-nums">{cell}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {report.totals?.length ? (
          <div className="grid gap-1 rounded-md border border-border bg-muted/30 p-3 text-sm">
            {report.totals.map((t) => (
              <div key={t.label} className="flex items-center justify-between">
                <span className="text-muted-foreground">{t.label}</span>
                <span className="font-semibold tabular-nums">{t.value}</span>
              </div>
            ))}
          </div>
        ) : null}

        <DialogFooter className="flex-row flex-wrap gap-2 sm:justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={wa}><MessageCircle className="mr-1 h-4 w-4" />WhatsApp</Button>
            <Button variant="outline" onClick={mail}><Mail className="mr-1 h-4 w-4" />Email</Button>
            <Button variant="outline" onClick={() => exportCsv(report!.title, report!.head, report!.body)}>
              <FileText className="mr-1 h-4 w-4" />CSV
            </Button>
            <Button variant="outline" onClick={() => exportExcel(report!.title, report!.head, report!.body, report!.totals)}>
              <FileSpreadsheet className="mr-1 h-4 w-4" />Excel
            </Button>
            <Button onClick={pdf}><Download className="mr-1 h-4 w-4" />PDF</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
