import { PAYMENT_LABELS, SaleRecord, SizeStock, SIZES } from '../types/pos';

export function formatMMK(amount: number): string {
  const rounded = Math.round(amount);
  return `${rounded.toLocaleString('en-US')} Ks`;
}

export function formatDateTime(isoString: string): string {
  const d = new Date(isoString);
  const pad = (n: number) => String(n).padStart(2, '0');
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = pad(d.getMinutes());
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${day}/${month}/${year} ${pad(hours)}:${minutes} ${ampm}`;
}

export function getTotalStock(stock: SizeStock): number {
  return SIZES.reduce((sum, size) => sum + (stock[size] || 0), 0);
}

export function getLowestActiveStock(stock: SizeStock): number {
  const values = SIZES.map((s) => stock[s] || 0);
  const total = values.reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  const nonZero = values.filter((v) => v > 0);
  return Math.min(...nonZero);
}

export function hasLowStockSize(stock: SizeStock, threshold = 3): boolean {
  return SIZES.some((s) => {
    const qty = stock[s] || 0;
    return qty > 0 && qty <= threshold;
  });
}

export function generateReceiptNo(existingCount: number): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const seq = String(existingCount + 1).padStart(4, '0');
  return `INV-${yy}${mm}${dd}-${seq}`;
}

export function exportSalesToCSV(sales: SaleRecord[], storeName: string): void {
  const headers = [
    'ဘောင်ချာနံပါတ် (Receipt No)',
    'နေ့စွဲနှင့်အချိန် (Date/Time)',
    'အခြေအနေ (Status)',
    'ဝယ်သူအမည် (Customer)',
    'ငွေချေစနစ် (Payment)',
    'အထည်အရေအတွက် (Items)',
    'စုစုပေါင်း (Subtotal)',
    'လျှော့ဈေး (Discount)',
    'အခွန် (Tax)',
    'ကျသင့်ငွေ (Total MMK)',
    'ခန့်မှန်းအမြတ် (Est. Profit MMK)',
    'မှတ်ချက် (Note)',
  ];

  const escapeCell = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = sales.map((sale) => {
    const itemCount = sale.items.reduce((sum, i) => sum + i.quantity, 0);
    const estProfit = sale.status === 'voided' ? 0 : Math.round(sale.subtotal - sale.discountAmount - sale.totalCost);
    return [
      sale.receiptNo,
      formatDateTime(sale.createdAt),
      sale.status === 'completed' ? 'အောင်မြင်' : 'ပယ်ဖျက်ပြီး (Void)',
      sale.customerName || 'Walk-in',
      PAYMENT_LABELS[sale.paymentMethod],
      itemCount,
      Math.round(sale.subtotal),
      Math.round(sale.discountAmount),
      Math.round(sale.taxAmount),
      Math.round(sale.total),
      estProfit,
      sale.note || '',
    ].map(escapeCell);
  });

  const csvContent = '\uFEFF' + [headers.map(escapeCell).join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStamp = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `${storeName.replace(/\s+/g, '_')}_sales_${dateStamp}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function compressImageFile(file: File, maxDim = 640): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
}
