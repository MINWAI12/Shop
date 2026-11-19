import { useMemo, useState } from 'react';
import { Download, Eye, Printer, RotateCcw, Search, X } from 'lucide-react';
import { PAYMENT_LABELS, PaymentMethod, SaleRecord, StoreSettings } from '../types/pos';
import { exportSalesToCSV, formatDateTime, formatMMK } from '../utils/format';
import { Receipt80mm } from './Receipt80mm';

interface SalesHistoryViewProps {
  sales: SaleRecord[];
  settings: StoreSettings;
  onVoidSale: (saleId: string) => void;
  onPrintReceipt: (sale: SaleRecord) => void;
}

const PAYMENT_KEYS: PaymentMethod[] = ['cash', 'kbzpay', 'wavepay', 'card'];

export function SalesHistoryView({
  sales,
  settings,
  onVoidSale,
  onPrintReceipt,
}: SalesHistoryViewProps) {
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | PaymentMethod>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'voided'>('all');
  const [viewingSale, setViewingSale] = useState<SaleRecord | null>(null);
  const [voidTarget, setVoidTarget] = useState<SaleRecord | null>(null);

  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let estimatedProfit = 0;
    let completedCount = 0;
    let voidedCount = 0;
    const byPayment: Record<PaymentMethod, { amount: number; count: number }> = {
      cash: { amount: 0, count: 0 },
      kbzpay: { amount: 0, count: 0 },
      wavepay: { amount: 0, count: 0 },
      card: { amount: 0, count: 0 },
    };

    for (const s of sales) {
      if (s.status === 'voided') {
        voidedCount += 1;
        continue;
      }
      completedCount += 1;
      totalRevenue += s.total;
      const netSalesExTax = s.subtotal - s.discountAmount;
      estimatedProfit += netSalesExTax - s.totalCost;
      byPayment[s.paymentMethod].amount += s.total;
      byPayment[s.paymentMethod].count += 1;
    }

    return { totalRevenue, estimatedProfit, completedCount, voidedCount, byPayment };
  }, [sales]);

  const filteredSales = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sales.filter((s) => {
      if (paymentFilter !== 'all' && s.paymentMethod !== paymentFilter) return false;
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (!q) return true;
      return (
        s.receiptNo.toLowerCase().includes(q) ||
        s.customerName.toLowerCase().includes(q) ||
        s.items.some((i) => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q))
      );
    });
  }, [sales, search, paymentFilter, statusFilter]);

  return (
    <div className="max-w-[1400px] mx-auto px-5 py-6 space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#111827]">
            အရောင်းမှတ်တမ်းနှင့် အစီရင်ခံစာ (Sales History)
          </h1>
          <p className="text-xs text-[#6B7280] mt-1">
            စုစုပေါင်းရောင်းရငွေ၊ ခန့်မှန်းအမြတ်ငွေ၊ ဘောင်ချာပြန်ထုတ်ခြင်းနှင့် Void စီမံခန့်ခွဲမှု
          </p>
        </div>

        <button
          type="button"
          disabled={filteredSales.length === 0}
          onClick={() => exportSalesToCSV(filteredSales, settings.storeName)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#D1D5DB] bg-white text-[#111827] text-sm font-medium hover:bg-[#F3F4F6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>CSV ထုတ်ယူမည်</span>
        </button>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
          <div className="text-xs text-[#6B7280]">စုစုပေါင်း ရောင်းရငွေ</div>
          <div className="mt-1.5 text-2xl font-bold font-mono-num text-[#111827]">
            {formatMMK(metrics.totalRevenue)}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
          <div className="text-xs text-[#6B7280]">ခန့်မှန်း အမြတ်ငွေ</div>
          <div className="mt-1.5 text-2xl font-bold font-mono-num text-[#16A34A]">
            {formatMMK(metrics.estimatedProfit)}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
          <div className="text-xs text-[#6B7280]">အောင်မြင်သော ဘောင်ချာ</div>
          <div className="mt-1.5 text-2xl font-bold font-mono-num text-[#111827]">
            {metrics.completedCount}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
          <div className="text-xs text-[#6B7280]">ပယ်ဖျက်ထားသော (Void)</div>
          <div className="mt-1.5 text-2xl font-bold font-mono-num text-[#DC2626]">
            {metrics.voidedCount}
          </div>
        </div>
      </div>

      {/* Payment Method Breakdown */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
        <div className="text-sm font-semibold text-[#111827] mb-3.5">
          ငွေချေစနစ်အလိုက် ခွဲခြမ်းစိတ်ဖြာချက်
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {PAYMENT_KEYS.map((key) => {
            const data = metrics.byPayment[key];
            const pct =
              metrics.totalRevenue > 0
                ? Math.round((data.amount / metrics.totalRevenue) * 100)
                : 0;
            return (
              <div key={key} className="space-y-2">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-medium text-[#4B5563]">
                    {PAYMENT_LABELS[key]}
                  </span>
                  <span className="text-xs text-[#6B7280] font-mono-num">{data.count} ခု</span>
                </div>
                <div className="text-base font-bold font-mono-num text-[#111827]">
                  {formatMMK(data.amount)}
                </div>
                <div className="w-full h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#111827] rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ဘောင်ချာနံပါတ်၊ ဝယ်သူအမည် သို့မဟုတ် ပစ္စည်းအမည် ရှာရန်..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:bg-white focus:border-[#111827]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as 'all' | PaymentMethod)}
            className="px-3 py-2 text-xs font-medium bg-white border border-[#E5E7EB] rounded-lg text-[#374151] focus:outline-none focus:border-[#111827]"
          >
            <option value="all">ငွေချေစနစ်အားလုံး</option>
            {PAYMENT_KEYS.map((k) => (
              <option key={k} value={k}>
                {PAYMENT_LABELS[k]}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 p-1 bg-[#F3F4F6] rounded-lg">
            {(
              [
                { key: 'all', label: 'အားလုံး' },
                { key: 'completed', label: 'အောင်မြင်' },
                { key: 'voided', label: 'ပယ်ဖျက်ပြီး' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setStatusFilter(opt.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  statusFilter === opt.key
                    ? 'bg-white text-[#111827] shadow-xs'
                    : 'text-[#4B5563] hover:text-[#111827]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-xs font-semibold text-[#4B5563]">
                <th className="py-3 px-4">ဘောင်ချာ / နေ့စွဲ</th>
                <th className="py-3 px-4">ဝယ်သူ / အထည်စာရင်း</th>
                <th className="py-3 px-4">ငွေချေစနစ်</th>
                <th className="py-3 px-4 text-right">ကျသင့်ငွေ</th>
                <th className="py-3 px-4">အခြေအနေ</th>
                <th className="py-3 px-4 text-right">လုပ်ဆောင်ချက်</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6] text-sm">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-[#6B7280]">
                    အရောင်းမှတ်တမ်း မရှိသေးပါ။
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const totalQty = sale.items.reduce((sum, i) => sum + i.quantity, 0);
                  const isVoid = sale.status === 'voided';
                  return (
                    <tr
                      key={sale.id}
                      className={`hover:bg-[#FAFAFA] transition-colors ${isVoid ? 'opacity-65' : ''}`}
                    >
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold font-mono-num text-[#111827]">
                          {sale.receiptNo}
                        </div>
                        <div className="text-xs text-[#6B7280] font-mono-num mt-0.5">
                          {formatDateTime(sale.createdAt)}
                        </div>
                      </td>

                      <td className="py-3 px-4 max-w-[280px]">
                        <div className="font-medium text-[#111827] text-xs">
                          {sale.customerName || 'Walk-in ဝယ်သူ'} · {totalQty} ထည်
                        </div>
                        <div className="text-xs text-[#6B7280] truncate mt-0.5">
                          {sale.items.map((i) => `${i.name} (${i.size}) ×${i.quantity}`).join(', ')}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-xs font-medium text-[#374151] whitespace-nowrap">
                        {PAYMENT_LABELS[sale.paymentMethod]}
                      </td>

                      <td className="py-3 px-4 text-right font-bold font-mono-num whitespace-nowrap">
                        <span className={isVoid ? 'line-through text-[#9CA3AF]' : 'text-[#111827]'}>
                          {formatMMK(sale.total)}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-xs font-medium">
                        {isVoid ? (
                          <span className="text-[#DC2626]">ပယ်ဖျက်ပြီး (Void)</span>
                        ) : (
                          <span className="text-[#16A34A]">အောင်မြင်</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingSale(sale)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-[#E5E7EB] bg-white text-xs font-medium text-[#374151] hover:border-[#111827] hover:text-[#111827] transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>ဘောင်ချာ</span>
                          </button>

                          {!isVoid && (
                            <button
                              type="button"
                              onClick={() => setVoidTarget(sale)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-[#E5E7EB] bg-white text-xs font-medium text-[#DC2626] hover:border-[#FECACA] hover:bg-[#FEF2F2] transition-colors"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Void</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Preview & Reprint Modal */}
      {viewingSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="bg-white rounded-xl border border-[#E5E7EB] w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
              <h3 className="text-sm font-semibold text-[#111827] font-mono-num">
                ဘောင်ချာ {viewingSale.receiptNo}
              </h3>
              <button
                type="button"
                onClick={() => setViewingSale(null)}
                className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]"
                aria-label="ပိတ်မည်"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto p-5 bg-[#F8F9FA] flex-1">
              <Receipt80mm sale={viewingSale} settings={settings} />
            </div>

            <div className="px-5 py-4 border-t border-[#E5E7EB] bg-white flex items-center gap-3">
              <button
                type="button"
                onClick={() => onPrintReceipt(viewingSale)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#111827] text-white text-sm font-medium hover:bg-[#1F2937]"
              >
                <Printer className="w-4 h-4" />
                <span>Print ပြန်ထုတ်မည်</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingSale(null)}
                className="px-4 py-2.5 rounded-lg border border-[#D1D5DB] text-sm font-medium text-[#374151] hover:bg-[#F3F4F6]"
              >
                ပိတ်မည်
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Void Confirmation Modal */}
      {voidTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="bg-white rounded-xl border border-[#E5E7EB] w-full max-w-md p-6 shadow-xl space-y-4">
            <h3 className="text-base font-semibold text-[#111827]">
              ဘောင်ချာပယ်ဖျက်ရန် (Void) အတည်ပြုပါ
            </h3>
            <p className="text-sm text-[#4B5563] leading-relaxed">
              ဘောင်ချာ <span className="font-semibold font-mono-num text-[#111827]">{voidTarget.receiptNo}</span>{' '}
              ({formatMMK(voidTarget.total)}) ကို ပယ်ဖျက်မည်လား? ဤဘောင်ချာပါ အဝတ်အထည်များကို
              သက်ဆိုင်ရာ Size လက်ကျန်စာရင်းထဲသို့ အလိုအလျောက် ပြန်ပေါင်းပေးမည် ဖြစ်ပါသည်။
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setVoidTarget(null)}
                className="px-4 py-2 rounded-lg border border-[#D1D5DB] text-sm font-medium text-[#374151] hover:bg-[#F3F4F6]"
              >
                မလုပ်တော့ပါ
              </button>
              <button
                type="button"
                onClick={() => {
                  onVoidSale(voidTarget.id);
                  setVoidTarget(null);
                }}
                className="px-4 py-2 rounded-lg bg-[#DC2626] text-white text-sm font-medium hover:bg-[#B91C1C]"
              >
                ပယ်ဖျက်ပြီး လက်ကျန်ပြန်ပေါင်းမည်
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
