import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Clock,
  Minus,
  PauseCircle,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import {
  CATEGORY_LABELS,
  CartItem,
  CategoryKey,
  DiscountType,
  Product,
  SIZES,
  SizeKey,
} from '../types/pos';
import { formatMMK, getTotalStock } from '../utils/format';
import { ProductImage } from './ProductImage';

interface RegisterViewProps {
  products: Product[];
  cart: CartItem[];
  customerName: string;
  note: string;
  discountType: DiscountType;
  discountValue: number;
  taxRate: number;
  heldOrdersCount: number;
  onAddToCart: (product: Product, size: SizeKey) => void;
  onUpdateCartQty: (productId: string, size: SizeKey, delta: number) => void;
  onRemoveCartItem: (productId: string, size: SizeKey) => void;
  onClearCart: () => void;
  onCustomerNameChange: (val: string) => void;
  onNoteChange: (val: string) => void;
  onDiscountTypeChange: (val: DiscountType) => void;
  onDiscountValueChange: (val: number) => void;
  onHoldOrder: () => void;
  onOpenHeldOrders: () => void;
  onOpenCheckout: () => void;
}

const CATEGORY_TABS: { key: 'all' | CategoryKey; label: string }[] = [
  { key: 'all', label: 'အားလုံး' },
  { key: 'tops', label: CATEGORY_LABELS.tops },
  { key: 'bottoms', label: CATEGORY_LABELS.bottoms },
  { key: 'outerwear', label: CATEGORY_LABELS.outerwear },
];

export function RegisterView({
  products,
  cart,
  customerName,
  note,
  discountType,
  discountValue,
  taxRate,
  heldOrdersCount,
  onAddToCart,
  onUpdateCartQty,
  onRemoveCartItem,
  onClearCart,
  onCustomerNameChange,
  onNoteChange,
  onDiscountTypeChange,
  onDiscountValueChange,
  onHoldOrder,
  onOpenHeldOrders,
  onOpenCheckout,
}: RegisterViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | CategoryKey>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: press '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInputFocused =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        target?.isContentEditable;

      if (e.key === '/' && !isInputFocused) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        setSearchQuery('');
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
      if (!matchesCat) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    });
  }, [products, searchQuery, selectedCategory]);

  // Helper: remaining stock for a product+size after subtracting current cart quantity
  const getRemainingStock = (product: Product, size: SizeKey): number => {
    const inCart =
      cart.find((c) => c.productId === product.id && c.size === size)?.quantity || 0;
    return Math.max(0, (product.stock[size] || 0) - inCart);
  };

  // Exact SKU Enter key quick-add (picks first available size)
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const exactMatch = products.find((p) => p.sku.toLowerCase() === q);
      if (exactMatch) {
        const firstAvailableSize = SIZES.find((s) => getRemainingStock(exactMatch, s) > 0);
        if (firstAvailableSize) {
          onAddToCart(exactMatch, firstAvailableSize);
          setSearchQuery('');
        }
      }
    }
  };

  // Totals calculation
  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const discountAmount = useMemo(() => {
    if (discountValue <= 0 || subtotal <= 0) return 0;
    if (discountType === 'percent') {
      const clamped = Math.min(100, Math.max(0, discountValue));
      return Math.round((subtotal * clamped) / 100);
    }
    return Math.min(subtotal, Math.round(discountValue));
  }, [subtotal, discountType, discountValue]);

  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const taxAmount = useMemo(
    () => (taxRate > 0 ? Math.round((afterDiscount * taxRate) / 100) : 0),
    [afterDiscount, taxRate]
  );
  const grandTotal = afterDiscount + taxAmount;
  const totalCartItems = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-61px)] overflow-hidden">
      {/* Left: Catalog Pane */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F8F9FA]">
        {/* Search & Category Filter Toolbar */}
        <div className="px-5 py-4 bg-white border-b border-[#E5E7EB] flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="SKU / ဘားကုဒ် သို့မဟုတ် အဝတ်အထည်အမည် ရှာရန်..."
              className="w-full pl-10 pr-16 py-2.5 text-sm bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:bg-white focus:border-[#111827] transition-colors"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#6B7280] hover:text-[#111827]"
                aria-label="ရှင်းလင်းမည်"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 text-[11px] font-mono text-[#6B7280] bg-white border border-[#D1D5DB] rounded absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                /
              </kbd>
            )}
          </div>

          <div className="flex items-center gap-1 p-1 bg-[#F3F4F6] rounded-lg overflow-x-auto shrink-0">
            {CATEGORY_TABS.map((tab) => {
              const active = selectedCategory === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSelectedCategory(tab.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-white text-[#111827] shadow-xs'
                      : 'text-[#4B5563] hover:text-[#111827]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16">
              <p className="text-sm font-medium text-[#374151]">
                ရှာဖွေထားသော အဝတ်အထည် မတွေ့ပါ
              </p>
              <p className="text-xs text-[#6B7280] mt-1">
                အမည် သို့မဟုတ် SKU ကုဒ်ကို ပြန်လည်စစ်ဆေးကြည့်ပါ
              </p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="mt-4 px-3.5 py-2 text-xs font-medium rounded-lg border border-[#D1D5DB] bg-white text-[#111827] hover:bg-[#F3F4F6] transition-colors"
                >
                  အားလုံးပြန်ကြည့်မည်
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredProducts.map((product) => {
                const totalStock = getTotalStock(product.stock);
                const isOutOfStock = totalStock === 0;

                return (
                  <div
                    key={product.id}
                    className={`bg-white rounded-xl border border-[#E5E7EB] overflow-hidden flex flex-col transition-colors ${
                      isOutOfStock ? 'opacity-65' : 'hover:border-[#9CA3AF]'
                    }`}
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden bg-[#F1F3F5] relative">
                      <ProductImage
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full"
                      />
                    </div>

                    <div className="p-4 flex flex-col flex-1">
                      {/* Unboxed Metadata */}
                      <div className="flex items-center justify-between gap-2 text-xs text-[#6B7280]">
                        <span className="font-mono-num truncate">
                          {product.sku} · {CATEGORY_LABELS[product.category]}
                        </span>
                        <span
                          className={`shrink-0 tabular-nums font-medium ${
                            totalStock === 0
                              ? 'text-[#DC2626]'
                              : totalStock <= 5
                                ? 'text-[#D97706]'
                                : 'text-[#4B5563]'
                          }`}
                        >
                          {totalStock === 0 ? 'ကုန်ပြီ' : `လက်ကျန် ${totalStock}`}
                        </span>
                      </div>

                      <h3 className="mt-1.5 text-sm font-semibold text-[#111827] leading-snug line-clamp-2">
                        {product.name}
                      </h3>

                      <div className="mt-2 text-base font-bold font-mono-num text-[#111827]">
                        {formatMMK(product.price)}
                      </div>

                      {/* Direct Size Selector Buttons */}
                      <div className="mt-3.5 pt-3 border-t border-[#F3F4F6]">
                        <div className="text-[11px] text-[#6B7280] mb-2">
                          Size နှိပ်၍ စာရင်းထဲထည့်ပါ
                        </div>
                        <div className="grid grid-cols-5 gap-1.5">
                          {SIZES.map((size) => {
                            const remaining = getRemainingStock(product, size);
                            const disabled = remaining <= 0;
                            return (
                              <button
                                key={size}
                                type="button"
                                disabled={disabled}
                                onClick={() => onAddToCart(product, size)}
                                title={
                                  disabled
                                    ? `${size} လက်ကျန်မရှိပါ`
                                    : `${product.name} (${size}) ထည့်မည် — လက်ကျန် ${remaining}`
                                }
                                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-md border text-center transition-colors ${
                                  disabled
                                    ? 'border-[#F3F4F6] bg-[#F9FAFB] text-[#9CA3AF] cursor-not-allowed'
                                    : remaining <= 2
                                      ? 'border-[#FDE68A] bg-[#FFFBEB] text-[#92400E] hover:border-[#111827] hover:bg-[#111827] hover:text-white'
                                      : 'border-[#E5E7EB] bg-white text-[#111827] hover:border-[#111827] hover:bg-[#111827] hover:text-white'
                                }`}
                              >
                                <span className="text-[11px] font-semibold leading-none">
                                  {size}
                                </span>
                                <span className="text-[10px] font-mono-num mt-1 leading-none opacity-80">
                                  {remaining}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart & Checkout Panel */}
      <aside className="w-full lg:w-[410px] xl:w-[430px] shrink-0 bg-white border-t lg:border-t-0 lg:border-l border-[#E5E7EB] flex flex-col max-h-[52vh] lg:max-h-none">
        {/* Cart Header */}
        <div className="px-5 py-3.5 border-b border-[#E5E7EB] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-sm font-semibold text-[#111827] whitespace-nowrap">
              အရောင်းစာရင်း
            </h2>
            <span className="text-xs text-[#6B7280] font-mono-num">
              ({totalCartItems} ထည်)
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onOpenHeldOrders}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-colors whitespace-nowrap ${
                heldOrdersCount > 0
                  ? 'border-[#D97706] bg-[#FFFBEB] text-[#B45309] hover:bg-[#FEF3C7]'
                  : 'border-[#E5E7EB] bg-white text-[#4B5563] hover:bg-[#F9FAFB]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>ဆိုင်းငံ့ ({heldOrdersCount})</span>
            </button>

            {cart.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={onHoldOrder}
                  title="လက်ရှိဘောင်ချာကို ခဏဆိုင်းငံ့ထားမည်"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-[#E5E7EB] bg-white text-xs font-medium text-[#374151] hover:bg-[#F3F4F6] transition-colors whitespace-nowrap"
                >
                  <PauseCircle className="w-3.5 h-3.5" />
                  <span>Hold</span>
                </button>
                <button
                  type="button"
                  onClick={onClearCart}
                  title="စာရင်းရှင်းလင်းမည်"
                  className="p-1.5 rounded-md text-[#6B7280] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
                  aria-label="စာရင်းရှင်းလင်းမည်"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#F3F4F6] px-5">
          {cart.length === 0 ? (
            <div className="h-full min-h-[180px] flex flex-col items-center justify-center text-center py-8">
              <ShoppingBag className="w-8 h-8 text-[#D1D5DB] stroke-[1.5]" />
              <p className="mt-3 text-sm font-medium text-[#4B5563]">
                အရောင်းစာရင်းထဲတွင် ပစ္စည်းမရှိသေးပါ
              </p>
              <p className="mt-1 text-xs text-[#9CA3AF]">
                ဘယ်ဘက်မှ အဝတ်အထည် Size ကိုနှိပ်၍ ထည့်သွင်းပါ
              </p>
            </div>
          ) : (
            cart.map((item) => {
              const prod = products.find((p) => p.id === item.productId);
              const maxStock = prod ? prod.stock[item.size] || 0 : item.quantity;
              const atMax = item.quantity >= maxStock;

              return (
                <div key={`${item.productId}-${item.size}`} className="py-3.5 flex gap-3">
                  <ProductImage
                    src={item.image}
                    alt={item.name}
                    className="w-12 h-12 rounded-lg shrink-0 border border-[#E5E7EB]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[#111827] truncate">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-[#6B7280] mt-0.5 font-mono-num">
                          Size {item.size} · {formatMMK(item.price)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveCartItem(item.productId, item.size)}
                        className="p-1 text-[#9CA3AF] hover:text-[#DC2626] transition-colors shrink-0"
                        aria-label="ဖယ်ရှားမည်"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <div className="inline-flex items-center border border-[#E5E7EB] rounded-md bg-white">
                        <button
                          type="button"
                          onClick={() => onUpdateCartQty(item.productId, item.size, -1)}
                          className="w-7 h-7 flex items-center justify-center text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6] rounded-l-md transition-colors"
                          aria-label="လျှော့မည်"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-xs font-semibold font-mono-num text-[#111827]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          disabled={atMax}
                          onClick={() => onUpdateCartQty(item.productId, item.size, 1)}
                          className="w-7 h-7 flex items-center justify-center text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6] disabled:opacity-35 disabled:cursor-not-allowed rounded-r-md transition-colors"
                          aria-label="တိုးမည်"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-xs font-bold font-mono-num text-[#111827]">
                        {formatMMK(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Customer Info, Discount & Checkout Footer */}
        <div className="border-t border-[#E5E7EB] bg-[#FAFAFA] px-5 py-4 space-y-3.5">
          {/* Customer Name & Note */}
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={customerName}
              onChange={(e) => onCustomerNameChange(e.target.value)}
              placeholder="ဝယ်သူအမည် (ရွေးချယ်)"
              className="px-3 py-2 text-xs bg-white border border-[#E5E7EB] rounded-lg text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#111827]"
            />
            <input
              type="text"
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="မှတ်ချက် (ဥပမာ - လက်ဆောင်)"
              className="px-3 py-2 text-xs bg-white border border-[#E5E7EB] rounded-lg text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#111827]"
            />
          </div>

          {/* Discount Input */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-[#4B5563] whitespace-nowrap">
              လျှော့ဈေး (Discount)
            </span>
            <div className="flex items-center gap-1.5">
              <div className="inline-flex p-0.5 bg-[#E5E7EB] rounded-md">
                <button
                  type="button"
                  onClick={() => onDiscountTypeChange('percent')}
                  className={`px-2 py-1 text-[11px] font-semibold rounded transition-colors ${
                    discountType === 'percent'
                      ? 'bg-white text-[#111827]'
                      : 'text-[#4B5563] hover:text-[#111827]'
                  }`}
                >
                  %
                </button>
                <button
                  type="button"
                  onClick={() => onDiscountTypeChange('fixed')}
                  className={`px-2 py-1 text-[11px] font-semibold rounded transition-colors ${
                    discountType === 'fixed'
                      ? 'bg-white text-[#111827]'
                      : 'text-[#4B5563] hover:text-[#111827]'
                  }`}
                >
                  Ks
                </button>
              </div>
              <input
                type="number"
                min={0}
                max={discountType === 'percent' ? 100 : undefined}
                value={discountValue === 0 ? '' : discountValue}
                onChange={(e) => onDiscountValueChange(Math.max(0, Number(e.target.value) || 0))}
                placeholder="0"
                className="w-24 px-2.5 py-1.5 text-right text-xs font-mono-num bg-white border border-[#E5E7EB] rounded-md text-[#111827] focus:outline-none focus:border-[#111827]"
              />
            </div>
          </div>

          {/* Calculation Breakdown */}
          <div className="space-y-1.5 pt-2.5 border-t border-[#E5E7EB] text-xs tabular-nums">
            <div className="flex justify-between text-[#4B5563]">
              <span>စုစုပေါင်း</span>
              <span className="font-mono-num">{formatMMK(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-[#DC2626]">
                <span>
                  လျှော့ဈေး {discountType === 'percent' ? `(${discountValue}%)` : ''}
                </span>
                <span className="font-mono-num">-{formatMMK(discountAmount)}</span>
              </div>
            )}
            {taxRate > 0 && (
              <div className="flex justify-between text-[#4B5563]">
                <span>အခွန် ({taxRate}%)</span>
                <span className="font-mono-num">{formatMMK(taxAmount)}</span>
              </div>
            )}
            <div className="flex items-baseline justify-between pt-2 border-t border-[#E5E7EB]">
              <span className="text-sm font-semibold text-[#111827]">ကျသင့်ငွေ</span>
              <span className="text-xl font-bold font-mono-num text-[#111827]">
                {formatMMK(grandTotal)}
              </span>
            </div>
          </div>

          {/* Primary Checkout CTA */}
          <button
            type="button"
            disabled={cart.length === 0}
            onClick={onOpenCheckout}
            className="w-full py-3 px-4 rounded-lg bg-[#111827] text-white text-sm font-semibold hover:bg-[#1F2937] disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            ငွေရှင်းမည် ({formatMMK(grandTotal)})
          </button>
        </div>
      </aside>
    </div>
  );
}
