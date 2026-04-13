import { useMemo, useState } from 'react';
import { Sample, FileItem } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

interface ReportsProps {
  samples: Sample[];
  files: FileItem[];
}

type ReportType = 'samples' | 'files' | 'div6';

type ExportFormat = 'csv' | 'xlsx' | 'pdf';

export function Reports({ samples, files }: ReportsProps) {
  const [reportType, setReportType] = useState<ReportType>('samples');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('xlsx');

  const dataRows = useMemo(() => {
    if (reportType === 'div6') {
      return samples.map(sample => ({
        'Sample ID': sample.sampleId,
        'Level': sample.level || '',
        'Area / Room': sample.area,
        'Material Description': sample.materialDescription || '',
        'Analysis Result': sample.status === 'positive' ? (sample.asbestosType || 'Asbestos Detected') : sample.status === 'negative' ? 'No Asbestos Detected' : sample.status.replace('-', ' '),
        'Condition': sample.condition || '',
        'Accessibility': sample.accessibility || '',
        'Amount / Quantity': sample.amount || '',
        'Risk Level': sample.riskLevel,
        'Notes': sample.notes || ''
      }));
    }

    if (reportType === 'samples') {
      return samples.map(sample => ({
        SampleID: sample.sampleId,
        Site: sample.site,
        Area: sample.area,
        Material: sample.materialDescription || '',
        Status: sample.status,
        Risk: sample.riskLevel,
        Date: sample.collectionDate,
        Collector: sample.collector
      }));
    }

    return files.map(file => ({
      FileName: file.name,
      Type: file.type,
      Size: file.size,
      UploadedBy: file.uploadedBy,
      UploadedAt: new Date(file.uploadedAt).toLocaleDateString(),
      Folder: file.folderPath || '/Projects'
    }));
  }, [reportType, samples, files]);

  const exportCsv = () => {
    if (dataRows.length === 0) return;
    const headers = Object.keys(dataRows[0]);
    const lines = [headers.join(',')];
    dataRows.forEach(row => {
      lines.push(headers.map(h => `"${String((row as any)[h] ?? '').replace(/"/g, '""')}"`).join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `${reportType}-report.csv`);
  };

  const exportExcel = () => {
    if (dataRows.length === 0) return;
    const worksheet = XLSX.utils.json_to_sheet(dataRows);
    
    // Set column widths for better readability
    const wscols = [
      {wch: 15}, // Sample ID
      {wch: 10}, // Level
      {wch: 20}, // Area
      {wch: 40}, // Material
      {wch: 25}, // Analysis
      {wch: 15}, // Condition
      {wch: 15}, // Accessibility
      {wch: 20}, // Amount
      {wch: 15}, // Risk
      {wch: 40}  // Notes
    ];
    worksheet['!cols'] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Div 6 Location Table');
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    downloadBlob(blob, `T_26_Location_Div_6_Export.xlsx`);
  };

  const exportPdf = () => {
    if (dataRows.length === 0) return;
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(14);
    doc.text(`AIMS Report: ${reportType.toUpperCase()}`, 14, 14);
    doc.setFontSize(9);
    const headers = Object.keys(dataRows[0]);
    const rows = dataRows.map(row => headers.map(h => String((row as any)[h] ?? '')));
    let y = 24;
    const colWidth = 260 / headers.length;
    headers.forEach((header, idx) => {
      doc.text(header, 14 + idx * colWidth, y);
    });
    y += 6;
    rows.slice(0, 30).forEach(row => {
      row.forEach((cell, idx) => {
        const text = cell.length > 25 ? `${cell.slice(0, 22)}...` : cell;
        doc.text(text, 14 + idx * colWidth, y);
      });
      y += 6;
      if (y > 190) {
        doc.addPage();
        y = 20;
      }
    });
    doc.save(`${reportType}-report.pdf`);
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  };

  const handleExport = () => {
    if (dataRows.length === 0) {
      toast.error('No data to export');
      return;
    }
    if (exportFormat === 'csv') exportCsv();
    if (exportFormat === 'xlsx') exportExcel();
    if (exportFormat === 'pdf') exportPdf();
    toast.success('Export generated');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-1">Reports & Export</h2>
        <p className="text-sm text-slate-500">
          Generate professional Div 6 compliance tables and data exports.
        </p>
      </div>

      <Card className="border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <CardTitle className="text-lg">Export Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Report Type</label>
              <Select value={reportType} onValueChange={(value: ReportType) => setReportType(value)}>
                <SelectTrigger className="h-11 bg-white border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="div6">Division 6 Location Table (Exact Format)</SelectItem>
                  <SelectItem value="samples">Raw Sample Data</SelectItem>
                  <SelectItem value="files">Project File Registry</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-slate-400 mt-1">
                {reportType === 'div6' ? 'Outputs the standard table required for final asbestos reports.' : 'General data export for analysis.'}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">File Format</label>
              <Select value={exportFormat} onValueChange={(value: ExportFormat) => setExportFormat(value)}>
                <SelectTrigger className="h-11 bg-white border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                  <SelectItem value="csv">CSV (.csv)</SelectItem>
                  <SelectItem value="pdf">PDF Document (.pdf)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleExport} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-base shadow-sm">
            <Download className="h-5 w-5 mr-2" />
            Generate & Download Export
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-200 bg-white">
          <CardContent className="pt-6 text-center">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 mb-1">Div 6 Compliance</h4>
            <p className="text-xs text-slate-500">Auto-formatted tables for location-based reporting.</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white">
          <CardContent className="pt-6 text-center">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Download className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 mb-1">Bulk Export</h4>
            <p className="text-xs text-slate-500">Download all project files and sample metadata at once.</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white">
          <CardContent className="pt-6 text-center">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 mb-1">Client PDF</h4>
            <p className="text-xs text-slate-500">Quick formatted summaries for external stakeholders.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
