import { PAYMENT_LABELS, SaleRecord, StoreSettings } from '../types/pos';
import { formatDateTime, formatMMK } from '../utils/format';

interface Receipt80mmProps {
  sale: SaleRecord;
  settings: StoreSettings;
}

export function Receipt80mm({ sale, settings }: Receipt80mmProps) {
  return (
    <div className="w-[302px] mx-auto bg-white text-[#111827] font-mono text-[12px] leading-[1.45] px-4 py-5 border border-[#E5E7EB] print:border-0 print:w-full print:px-0 print:py-0">
      {/* Store Header */}
      <div className="text-center pb-3 border-b border-dashed border-[#9CA3AF]">
        <div className="text-[15px] font-bold tracking-tight text-[#111827]">
          {settings.storeName || 'အဝတ်အထည်ဆိုင်'}
        </div>
        {settings.address && (
          <div className="mt-1 text-[11px] text-[#374151] leading-snug">{settings.address}</div>
        )}
        {settings.phone && (
          <div className="mt-0.5 text-[11px] text-[#374151]">ဖုန်း - {settings.phone}</div>
        )}
      </div>

      {/* Void Watermark Notice if Voided */}
      {sale.status === 'voided' && (
        <div className="my-2 py-1 text-center font-bold text-[12px] border border-dashed border-[#DC2626] text-[#DC2626]">
          *** ပယ်ဖျက်ပြီး (VOIDED) ***
        </div>
      )}

      {/* Meta Info */}
      <div className="py-2.5 border-b border-dashed border-[#9CA3AF] space-y-1 text-[11px]">
        <div className="flex justify-between gap-2">
          <span className="text-[#4B5563]">ဘောင်ချာ:</span>
          <span className="font-semibold tabular-nums">{sale.receiptNo}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-[#4B5563]">နေ့စွဲ:</span>
          <span className="tabular-nums">{formatDateTime(sale.createdAt)}</span>
        </div>
        {sale.customerName && (
          <div className="flex justify-between gap-2">
            <span className="text-[#4B5563]">ဝယ်သူ:</span>
            <span className="text-right">{sale.customerName}</span>
          </div>
        )}
        <div className="flex justify-between gap-2">
          <span className="text-[#4B5563]">ငွေချေစနစ်:</span>
          <span>{PAYMENT_LABELS[sale.paymentMethod]}</span>
        </div>
      </div>

      {/* Items Table */}
      <div className="py-2.5 border-b border-dashed border-[#9CA3AF]">
        <div className="flex justify-between text-[11px] font-semibold text-[#4B5563] pb-1.5 border-b border-[#E5E7EB]">
          <span>အမည် / Size</span>
          <span>သင့်ငွေ</span>
        </div>
        <div className="mt-2 space-y-2">
          {sale.items.map((item, idx) => (
            <div key={`${item.productId}-${item.size}-${idx}`} className="text-[11.5px]">
              <div className="font-medium text-[#111827] leading-snug">
                {item.name} <span className="font-semibold">({item.size})</span>
              </div>
              <div className="flex justify-between text-[#4B5563] mt-0.5 tabular-nums">
                <span>
                  {item.quantity} × {formatMMK(item.price)}
                </span>
                <span className="text-[#111827] font-medium">
                  {formatMMK(item.price * item.quantity)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="py-2.5 border-b border-dashed border-[#9CA3AF] space-y-1 text-[11.5px] tabular-nums">
        <div className="flex justify-between">
          <span className="text-[#4B5563]">စုစုပေါင်း</span>
          <span>{formatMMK(sale.subtotal)}</span>
        </div>
        {sale.discountAmount > 0 && (
          <div className="flex justify-between">
            <span className="text-[#4B5563]">
              လျှော့ဈေး {sale.discountType === 'percent' ? `(${sale.discountValue}%)` : ''}
            </span>
            <span>-{formatMMK(sale.discountAmount)}</span>
          </div>
        )}
        {sale.taxAmount > 0 && (
          <div className="flex justify-between">
            <span className="text-[#4B5563]">အခွန် ({sale.taxRate}%)</span>
            <span>{formatMMK(sale.taxAmount)}</span>
          </div>
        )}
        <div className="flex justify-between pt-1.5 mt-1.5 border-t border-[#E5E7EB] text-[14px] font-bold text-[#111827]">
          <span>ကျသင့်ငွေ</span>
          <span>{formatMMK(sale.total)}</span>
        </div>

        {sale.paymentMethod === 'cash' && typeof sale.cashReceived === 'number' && (
          <div className="pt-1.5 space-y-1 text-[11.5px]">
            <div className="flex justify-between">
              <span className="text-[#4B5563]">လက်ခံငွေ</span>
              <span>{formatMMK(sale.cashReceived)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>ပြန်အမ်းငွေ</span>
              <span>{formatMMK(sale.changeDue || 0)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Note */}
      {sale.note && (
        <div className="py-2 border-b border-dashed border-[#9CA3AF] text-[11px] text-[#374151]">
          <span className="font-semibold">မှတ်ချက်: </span>
          {sale.note}
        </div>
      )}

      {/* Footer */}
      <div className="pt-3 text-center text-[11px] text-[#374151] leading-relaxed">
        {settings.receiptFooter || 'ဝယ်ယူအားပေးမှုအတွက် ကျေးဇူးတင်ပါသည်။'}
      </div>
    </div>
  );
}
