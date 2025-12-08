export const parseRevenue = (rev?: string): number => {
  if (!rev) return 0;
  
  // Remove symbols
  const clean = rev.replace(/[$,]/g, '').trim().toUpperCase();
  
  let multiplier = 1;
  if (clean.endsWith('K')) multiplier = 1000;
  else if (clean.endsWith('M')) multiplier = 1000000;
  else if (clean.endsWith('B')) multiplier = 1000000000;
  
  const numPart = parseFloat(clean.replace(/[KMB]/g, ''));
  return isNaN(numPart) ? 0 : numPart * multiplier;
};

export const formatRevenue = (num: number): string => {
  if (num >= 1000000000) return `$${(num / 1000000000).toFixed(1)}B`;
  if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(0)}k`;
  return `$${num}`;
};

export const parseCSV = (text: string): any[] => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentVal = '';
  let inQuote = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuote) {
      if (char === '"') {
        if (nextChar === '"') {
          currentVal += '"';
          i++; // Skip escaped quote
        } else {
          inQuote = false;
        }
      } else {
        currentVal += char;
      }
    } else {
      if (char === '"') {
        inQuote = true;
      } else if (char === ',') {
        currentRow.push(currentVal);
        currentVal = '';
      } else if (char === '\r' || char === '\n') {
        if (currentVal || currentRow.length > 0) {
            currentRow.push(currentVal);
            rows.push(currentRow);
        }
        currentRow = [];
        currentVal = '';
        // Handle CRLF
        if (char === '\r' && nextChar === '\n') i++;
      } else {
        currentVal += char;
      }
    }
  }
  // Add last item/row if exists
  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal);
    rows.push(currentRow);
  }
  
  // First row is header
  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.trim());
  const data = rows.slice(1).map(row => {
    const obj: any = {};
    headers.forEach((header, index) => {
       // Handle cases where row might be shorter than headers
       obj[header] = row[index] !== undefined ? row[index].trim() : '';
    });
    return obj;
  });
  
  return data;
};