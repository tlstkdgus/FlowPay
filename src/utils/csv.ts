const escape = (v: unknown): string => {
  const s = v === undefined || v === null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const toCsv = (headers: string[], rows: unknown[][]): string =>
  [headers, ...rows].map((r) => r.map(escape).join(',')).join('\n');

export const downloadFile = (filename: string, content: string, type = 'text/csv;charset=utf-8') => {
  // 엑셀에서 한글이 깨지지 않도록 CSV에는 BOM을 붙입니다.
  const body = type.startsWith('text/csv') ? `﻿${content}` : content;
  const url = URL.createObjectURL(new Blob([body], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
