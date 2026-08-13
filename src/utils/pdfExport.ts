/**
 * Utility functions for exporting CSV and opening clean printable views
 */

export const ExportUtils = {
  // Export array of objects as a downloadable CSV file
  exportToCSV: (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // Trigger browser print window with custom printable styling
  triggerPrint: () => {
    window.print();
  },
};
