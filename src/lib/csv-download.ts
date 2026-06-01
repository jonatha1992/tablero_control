/** Escapa un valor para CSV y dispara la descarga en el navegador (BOM para Excel). */
export function downloadCsv(filename: string, rows: string[][]): void {
  const escape = (value: string) => {
    const cell = value ?? '';
    if (/[",\n\r]/.test(cell)) {
      return `"${cell.replace(/"/g, '""')}"`;
    }
    return cell;
  };

  const csv = rows.map((row) => row.map((c) => escape(String(c ?? ''))).join(',')).join('\r\n');
  const blob = new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
