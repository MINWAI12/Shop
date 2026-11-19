import { Clock, RotateCcw, Trash2, X } from 'lucide-react';
import { HeldOrder } from '../types/pos';
import { formatDateTime, formatMMK } from '../utils/format';

interface HeldOrdersModalProps {
  orders: HeldOrder[];
  onRestore: (order: HeldOrder) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function HeldOrdersModal({ orders, onRestore, onDelete, onClose }: HeldOrdersModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="bg-white rounded-xl border border-[#E5E7EB] w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
          <div>
            <h2 className="text-base font-semibold text-[#111827]">
              ခဏဆိုင်းငံ့ထားသော ဘောင်ချာများ ({orders.length})
            </h2>
            <p className="text-xs text-[#6B7280] mt-0.5">
              အရောင်းကောင်တာသို့ ပြန်လည်ခေါ်ယူ၍ ငွေရှင်းနိုင်ပါသည်
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

        <div className="overflow-y-auto p-5 space-y-3 flex-1 bg-[#F8F9FA]">
          {orders.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#6B7280]">
              ခဏဆိုင်းငံ့ထားသော ဘောင်ချာ မရှိသေးပါ။
            </div>
          ) : (
            orders.map((order) => {
              const subtotal = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
              const count = order.items.reduce((sum, i) => sum + i.quantity, 0);
              return (
                <div
                  key={order.id}
                  className="bg-white rounded-lg border border-[#E5E7EB] p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold text-sm text-[#111827]">
                        {order.customerName || 'Walk-in ဝယ်သူ'}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#6B7280] mt-0.5 tabular-nums">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatDateTime(order.createdAt)}</span>
                        <span aria-hidden="true">·</span>
                        <span>{count} ထည်</span>
                      </div>
                    </div>
                    <div className="text-sm font-bold font-mono-num text-[#111827]">
                      {formatMMK(subtotal)}
                    </div>
                  </div>

                  <div className="text-xs text-[#4B5563] space-y-1 border-t border-[#F3F4F6] pt-2.5">
                    {order.items.map((item) => (
                      <div
                        key={`${item.productId}-${item.size}`}
                        className="flex justify-between gap-2 tabular-nums"
                      >
                        <span className="truncate">
                          {item.name} ({item.size}) × {item.quantity}
                        </span>
                        <span className="shrink-0 font-mono-num">
                          {formatMMK(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {order.note && (
                    <div className="text-xs text-[#6B7280] bg-[#F8F9FA] px-2.5 py-1.5 rounded">
                      မှတ်ချက်: {order.note}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onDelete(order.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#E5E7EB] text-xs font-medium text-[#DC2626] hover:bg-[#FEF2F2] transition-colors whitespace-nowrap"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ဖျက်မည်</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onRestore(order)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#111827] text-white text-xs font-medium hover:bg-[#1F2937] transition-colors whitespace-nowrap"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>ပြန်ခေါ်မည်</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
