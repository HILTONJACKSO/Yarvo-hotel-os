export function downloadCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    alert('No data available to export');
    return;
  }

  // Extract headers
  const headers = Object.keys(data[0]);
  
  // Format rows
  const csvRows = [];
  // Add header row
  csvRows.push(headers.join(','));
  
  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header];
      // Escape strings containing commas or quotes
      if (typeof val === 'string') {
        const escaped = val.replace(/"/g, '""');
        return `"${escaped}"`;
      }
      return val !== null && val !== undefined ? val : '';
    });
    csvRows.push(values.join(','));
  }
  
  // Create Blob and download
  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
