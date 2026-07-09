'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

function toCsvValue(value: unknown) {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function CsvExportButton({
  rows,
  columns,
  filename,
}: {
  rows: Record<string, unknown>[];
  columns: { key: string; label: string }[];
  filename: string;
}) {
  function handleExport() {
    const header = columns.map((c) => toCsvValue(c.label)).join(',');
    const lines = rows.map((row) => columns.map((c) => toCsvValue(row[c.key])).join(','));
    const csv = [header, ...lines].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={rows.length === 0}>
      <Download className="h-4 w-4" />
      Export CSV
    </Button>
  );
}
