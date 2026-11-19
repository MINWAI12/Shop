import { useState } from 'react';
import { Banknote, CheckCircle2, CreditCard, Printer, Smartphone, Wallet, X } from 'lucide-react';
import { PAYMENT_LABELS, PaymentMethod, SaleRecord, StoreSettings } from '../types/pos';
import { formatMMK } from '../utils/format';
import { Receipt80mm } from './Receipt80mm';

interface CheckoutModalProps {
  total: number;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  taxRate: number;
  itemCount: number;
  settings: StoreSettings;
  completedSale: SaleRecord | null;
  onCompletePayment: (paymentMethod: PaymentMethod, cashReceived?: number, changeDue?: number) => void;
  onPrintReceipt: (sale: SaleRecord) => void;
  onClose: () => void;
}

const QUICK_NOTES = [10000, 20000, 50000, 100000];

const PAYMENT_OPTIONS: { key: PaymentMethod; label: string; icon: typeof Banknote }[] = [
  { key: 'cash', label: 'ငွေသား (Cash)', icon: Banknote },
  { key: 'kbzpay', label: 'KBZPay', icon: Smartphone },
  { key: 'wavepay', label: 'WavePay', icon: Wallet },
  { key: 'card', label: 'ဘဏ်ကတ်', icon: CreditCard },
];

export function CheckoutModal({
  total,
  subtotal,
  discountAmount,
  taxAmount,
  taxRate,
  itemCount,
  settings,
  completedSale,
  onCompletePayment,
  onPrintReceipt,
  onClose,
}: CheckoutModalProps) {
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [cashInput, setCashInput] = useState<string>(String(Math.round(total)));

  const cashReceived = Number(cashInput) || 0;
  const changeDue = cashReceived - Math.round(total);
  const canConfirm = method !== 'cash' || cashReceived >= Math.round(total);

  const handleConfirm = () => {
    if (!canConfirm) return;
    if (method === 'cash') {
      onCompletePayment('cash', cashReceived, Math.max(0, changeDue));
    } else {
      onCompletePayment(method);
    }
  };

  // Post-payment 80mm Thermal Receipt view
  if (completedSale) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
        <div className="bg-white rounded-xl border border-[#E5E7EB] w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden shadow-xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-2 text-[#16A34A] font-semibold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>ငွေရှင်းခြင်း အောင်မြင်ပါသည်</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors"
              aria-label="ပိတ်မည်"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-y-auto p-5 bg-[#F8F9FA] flex-1">
            <Receipt80mm sale={completedSale} settings={settings} />
          </div>

          <div className="px-5 py-4 border-t border-[#E5E7EB] bg-white flex items-center gap-3">
            <button
              type="button"
              onClick={() => onPrintReceipt(completedSale)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#111827] text-white text-sm font-medium hover:bg-[#1F2937] transition-colors whitespace-nowrap"
            >
              <Printer className="w-4 h-4" />
              <span>80mm ဘောင်ချာ Print ထုတ်မည်</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-[#D1D5DB] bg-white text-[#111827] text-sm font-medium hover:bg-[#F9FAFB] transition-colors whitespace-nowrap"
            >
              ပြီးပါပြီ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="bg-white rounded-xl border border-[#E5E7EB] w-full max-w-lg overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
          <div>
            <h2 className="text-base font-semibold text-[#111827]">ငွေပေးချေမှု အတည်ပြုရန်</h2>
            <p className="text-xs text-[#6B7280] mt-0.5 tabular-nums">
              အထည်အရေအတွက် {itemCount} ခု
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors"
            aria-label="ပိတ်မည်"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Amount Due Summary */}
          <div className="bg-[#F8F9FA] rounded-lg border border-[#E5E7EB] p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-[#4B5563]">စုစုပေါင်း ကျသင့်ငွေ</span>
              <span className="text-2xl font-bold text-[#111827] font-mono-num">
                {formatMMK(total)}
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#6B7280] tabular-nums">
              <span>မူရင်း {formatMMK(subtotal)}</span>
              {discountAmount > 0 && <span>လျှော့ဈေး -{formatMMK(discountAmount)}</span>}
              {taxAmount > 0 && <span>အခွန် ({taxRate}%) {formatMMK(taxAmount)}</span>}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-medium text-[#4B5563] mb-2">
              ငွေပေးချေမှု စနစ်ရွေးချယ်ပါ
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {PAYMENT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = method === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setMethod(opt.key)}
                    className={`flex items-center gap-2.5 px-3.5 py-3 rounded-lg border text-sm font-medium transition-colors whitespace-nowrap ${
                      active
                        ? 'border-[#111827] bg-[#111827] text-white'
                        : 'border-[#E5E7EB] bg-white text-[#374151] hover:border-[#9CA3AF]'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash Tendered & Quick Banknotes */}
          {method === 'cash' ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#4B5563] mb-1.5">
                  လက်ခံရရှိငွေ (Ks)
                </label>
                <input
                  type="number"
                  min={0}
                  step={500}
                  value={cashInput}
                  onChange={(e) => setCashInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D1D5DB] text-base font-semibold font-mono-num text-[#111827] focus:outline-none focus:border-[#111827]"
                  placeholder="0"
                />
              </div>

              {/* Quick Banknote Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCashInput(String(Math.round(total)))}
                  className="px-3 py-1.5 rounded-md border border-[#D1D5DB] bg-[#F8F9FA] text-xs font-medium text-[#111827] hover:bg-[#E5E7EB] transition-colors whitespace-nowrap"
                >
                  အတိအကျ ({formatMMK(total)})
                </button>
                {QUICK_NOTES.map((note) => (
                  <button
                    key={note}
                    type="button"
                    onClick={() => setCashInput(String(note))}
                    className="px-3 py-1.5 rounded-md border border-[#E5E7EB] bg-white text-xs font-medium font-mono-num text-[#374151] hover:border-[#111827] hover:text-[#111827] transition-colors whitespace-nowrap"
                  >
                    {note.toLocaleString('en-US')}
                  </button>
                ))}
              </div>

              {/* Change Due Box */}
              <div
                className={`flex items-center justify-between px-4 py-3 rounded-lg border ${
                  changeDue < 0
                    ? 'bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]'
                    : 'bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D]'
                }`}
              >
                <span className="text-sm font-medium">
                  {changeDue < 0 ? 'ငွေမလုံလောက်သေးပါ (လိုငွေ)' : 'ပြန်အမ်းငွေ (Change)'}
                </span>
                <span className="text-lg font-bold font-mono-num">
                  {formatMMK(Math.abs(changeDue))}
                </span>
              </div>
            </div>
          ) : (
            <div className="px-4 py-3 rounded-lg bg-[#F8F9FA] border border-[#E5E7EB] text-sm text-[#4B5563]">
              <span className="font-medium text-[#111827]">{PAYMENT_LABELS[method]}</span> ဖြင့်{' '}
              <span className="font-semibold text-[#111827] font-mono-num">{formatMMK(total)}</span>{' '}
              လက်ခံရရှိကြောင်း အတည်ပြုပါ။
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-[#D1D5DB] bg-white text-sm font-medium text-[#374151] hover:bg-[#F3F4F6] transition-colors whitespace-nowrap"
          >
            မလုပ်တော့ပါ
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={handleConfirm}
            className="px-5 py-2.5 rounded-lg bg-[#111827] text-white text-sm font-medium hover:bg-[#1F2937] disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            ငွေရှင်းပြီး ဘောင်ချာထုတ်မည်
          </button>
        </div>
      </div>
    </div>
  );
}
