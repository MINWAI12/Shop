import { useState } from 'react';
import { Check, RotateCcw } from 'lucide-react';
import { SaleRecord, StoreSettings } from '../types/pos';
import { Receipt80mm } from './Receipt80mm';

interface SettingsViewProps {
  settings: StoreSettings;
  onUpdateSettings: (next: StoreSettings) => void;
  onResetDemoData: () => void;
}

const PREVIEW_SAMPLE_SALE: SaleRecord = {
  id: 'preview',
  receiptNo: 'INV-261118-0099',
  createdAt: new Date().toISOString(),
  items: [
    {
      productId: 'prod-1',
      sku: 'TOP-101',
      name: 'လိုင်နင် ရှပ်အင်္ကျီလက်ရှည် (Ivory)',
      size: 'M',
      price: 38500,
      cost: 22000,
      quantity: 1,
    },
    {
      productId: 'prod-2',
      sku: 'TOP-102',
      name: 'ချည်သား Oversized တီရှပ် (Sage)',
      size: 'L',
      price: 24000,
      cost: 13500,
      quantity: 1,
    },
  ],
  subtotal: 62500,
  discountType: 'fixed',
  discountValue: 2500,
  discountAmount: 2500,
  taxRate: 0,
  taxAmount: 0,
  total: 60000,
  totalCost: 35500,
  paymentMethod: 'cash',
  cashReceived: 100000,
  changeDue: 40000,
  customerName: 'မစုစု',
  note: '',
  status: 'completed',
};

export function SettingsView({
  settings,
  onUpdateSettings,
  onResetDemoData,
}: SettingsViewProps) {
  const [savedNotice, setSavedNotice] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);

  const handleFieldChange = <K extends keyof StoreSettings>(
    key: K,
    value: StoreSettings[K]
  ) => {
    onUpdateSettings({ ...settings, [key]: value });
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 1800);
  };

  const previewTaxAmount =
    settings.taxRate > 0 ? Math.round((60000 * settings.taxRate) / 100) : 0;
  const previewSale: SaleRecord = {
    ...PREVIEW_SAMPLE_SALE,
    taxRate: settings.taxRate,
    taxAmount: previewTaxAmount,
    total: 60000 + previewTaxAmount,
    changeDue: Math.max(0, 100000 - (60000 + previewTaxAmount)),
  };

  return (
    <div className="max-w-[1200px] mx-auto px-5 py-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#111827]">ဆိုင်အပြင်အဆင် (Store Settings)</h1>
        <p className="text-xs text-[#6B7280] mt-1">
          ပြင်ဆင်မှုအားလုံးကို Browser ထဲတွင် အလိုအလျောက် သိမ်းဆည်းပေးထားပါသည်
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Form */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#111827]">
                ဆိုင်အချက်အလက်နှင့် ဘောင်ချာဆက်တင်
              </h2>
              {savedNotice && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-[#16A34A]">
                  <Check className="w-3.5 h-3.5" />
                  <span>သိမ်းဆည်းပြီး</span>
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4B5563] mb-1.5">
                ဆိုင်အမည်
              </label>
              <input
                type="text"
                value={settings.storeName}
                onChange={(e) => handleFieldChange('storeName', e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#111827]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4B5563] mb-1.5">
                ဆိုင်လိပ်စာ
              </label>
              <textarea
                rows={2}
                value={settings.address}
                onChange={(e) => handleFieldChange('address', e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#111827] resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#4B5563] mb-1.5">
                  ဖုန်းနံပါတ်
                </label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm font-mono-num border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#111827]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4B5563] mb-1.5">
                  အခွန်နှုန်းထား (Tax %)
                </label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  step={0.5}
                  value={settings.taxRate}
                  onChange={(e) =>
                    handleFieldChange(
                      'taxRate',
                      Math.min(50, Math.max(0, Number(e.target.value) || 0))
                    )
                  }
                  className="w-full px-3.5 py-2.5 text-sm font-mono-num border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#111827]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4B5563] mb-1.5">
                ဘောင်ချာအောက်ခြေ စာသား
              </label>
              <textarea
                rows={3}
                value={settings.receiptFooter}
                onChange={(e) => handleFieldChange('receiptFooter', e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#111827] resize-none"
              />
            </div>
          </div>

          {/* Data Reset Card */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-[#111827]">
                Browser အချက်အလက် ပြန်လည်သတ်မှတ်ရန်
              </h3>
              <p className="text-xs text-[#6B7280] mt-1">
                ကုန်ပစ္စည်းစာရင်း၊ အရောင်းမှတ်တမ်းနှင့် ဆိုင်အပြင်အဆင်ကို မူလနမူနာအတိုင်း ပြန်ထားနိုင်ပါသည်
              </p>
            </div>
            <button
              type="button"
              onClick={() => setResetModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#FECACA] bg-[#FEF2F2] text-xs font-medium text-[#DC2626] hover:bg-[#FEE2E2] transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>မူလအတိုင်း ပြန်ထားမည်</span>
            </button>
          </div>
        </div>

        {/* Right: Live 80mm Thermal Receipt Preview */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-[#E5E7EB] p-6">
          <div className="text-sm font-semibold text-[#111827] mb-1">
            80mm Thermal ဘောင်ချာ နမူနာ
          </div>
          <p className="text-xs text-[#6B7280] mb-5">
            ဘယ်ဘက်တွင် ပြင်ဆင်သည်နှင့် ဘောင်ချာပုံစံကို တိုက်ရိုက်ကြည့်ရှုနိုင်ပါသည်
          </p>
          <div className="bg-[#F8F9FA] rounded-lg p-4 border border-[#E5E7EB]">
            <Receipt80mm sale={previewSale} settings={settings} />
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="bg-white rounded-xl border border-[#E5E7EB] w-full max-w-sm p-6 shadow-xl space-y-4">
            <h3 className="text-base font-semibold text-[#111827]">
              မူလအတိုင်း ပြန်ထားမည်လား?
            </h3>
            <p className="text-sm text-[#4B5563]">
              လက်ရှိသိမ်းဆည်းထားသော အရောင်းမှတ်တမ်းများနှင့် ကုန်ပစ္စည်းပြင်ဆင်မှုများ ပျောက်သွားပြီး
              မူလနမူနာစာရင်းအတိုင်း ပြန်လည်စတင်ပါမည်။
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-[#D1D5DB] text-sm font-medium text-[#374151] hover:bg-[#F3F4F6]"
              >
                မလုပ်တော့ပါ
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetDemoData();
                  setResetModalOpen(false);
                }}
                className="px-4 py-2 rounded-lg bg-[#DC2626] text-white text-sm font-medium hover:bg-[#B91C1C]"
              >
                ပြန်လည်သတ်မှတ်မည်
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
