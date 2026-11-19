import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CartItem,
  DiscountType,
  HeldOrder,
  PaymentMethod,
  Product,
  SaleRecord,
  SizeKey,
  StoreSettings,
  TabKey,
} from './types/pos';
import { DEFAULT_SETTINGS, INITIAL_PRODUCTS, INITIAL_SALES } from './data/initialData';
import { generateReceiptNo } from './utils/format';
import { RegisterView } from './components/RegisterView';
import { InventoryView } from './components/InventoryView';
import { SalesHistoryView } from './components/SalesHistoryView';
import { SettingsView } from './components/SettingsView';
import { CheckoutModal } from './components/CheckoutModal';
import { HeldOrdersModal } from './components/HeldOrdersModal';
import { Receipt80mm } from './components/Receipt80mm';

const STORAGE_KEYS = {
  products: 'pos_clothing_products_v1',
  sales: 'pos_clothing_sales_v1',
  heldOrders: 'pos_clothing_held_v1',
  settings: 'pos_clothing_settings_v1',
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

const NAV_TABS: { key: TabKey; label: string }[] = [
  { key: 'register', label: 'အရောင်းကောင်တာ' },
  { key: 'inventory', label: 'ကုန်ပစ္စည်းစာရင်း' },
  { key: 'history', label: 'အရောင်းမှတ်တမ်း' },
  { key: 'settings', label: 'ဆိုင်အပြင်အဆင်' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('register');

  // Persistent domain state
  const [products, setProducts] = useState<Product[]>(() =>
    loadFromStorage<Product[]>(STORAGE_KEYS.products, INITIAL_PRODUCTS)
  );
  const [sales, setSales] = useState<SaleRecord[]>(() =>
    loadFromStorage<SaleRecord[]>(STORAGE_KEYS.sales, INITIAL_SALES)
  );
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>(() =>
    loadFromStorage<HeldOrder[]>(STORAGE_KEYS.heldOrders, [])
  );
  const [settings, setSettings] = useState<StoreSettings>(() =>
    loadFromStorage<StoreSettings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS)
  );

  // Active Register cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [note, setNote] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('fixed');
  const [discountValue, setDiscountValue] = useState<number>(0);

  // Modals & Printing state
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<SaleRecord | null>(null);
  const [heldModalOpen, setHeldModalOpen] = useState(false);
  const [printSale, setPrintSale] = useState<SaleRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Persist to localStorage automatically
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products));
    } catch {
      // Ignore storage quota errors
    }
  }, [products]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.sales, JSON.stringify(sales));
    } catch {
      // Ignore storage quota errors
    }
  }, [sales]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.heldOrders, JSON.stringify(heldOrders));
    } catch {
      // Ignore storage quota errors
    }
  }, [heldOrders]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
    } catch {
      // Ignore storage quota errors
    }
  }, [settings]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  // Cart calculations
  const cartSummary = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalCost = cart.reduce((sum, item) => sum + item.cost * item.quantity, 0);
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    let discountAmount = 0;
    if (discountValue > 0 && subtotal > 0) {
      discountAmount =
        discountType === 'percent'
          ? Math.round((subtotal * Math.min(100, discountValue)) / 100)
          : Math.min(subtotal, Math.round(discountValue));
    }
    const afterDiscount = Math.max(0, subtotal - discountAmount);
    const taxAmount =
      settings.taxRate > 0 ? Math.round((afterDiscount * settings.taxRate) / 100) : 0;
    const total = afterDiscount + taxAmount;
    return { subtotal, totalCost, itemCount, discountAmount, taxAmount, total };
  }, [cart, discountType, discountValue, settings.taxRate]);

  // Register Handlers
  const handleAddToCart = (product: Product, size: SizeKey) => {
    const available = product.stock[size] || 0;
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.productId === product.id && i.size === size);
      if (idx >= 0) {
        if (prev[idx].quantity >= available) return prev;
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      if (available <= 0) return prev;
      return [
        ...prev,
        {
          productId: product.id,
          sku: product.sku,
          name: product.name,
          size,
          price: product.price,
          cost: product.cost,
          quantity: 1,
          image: product.image,
        },
      ];
    });
  };

  const handleUpdateCartQty = (productId: string, size: SizeKey, delta: number) => {
    const prod = products.find((p) => p.id === productId);
    const maxStock = prod ? prod.stock[size] || 0 : 0;

    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId !== productId || item.size !== size) return item;
          const nextQty = Math.min(maxStock, item.quantity + delta);
          return { ...item, quantity: nextQty };
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveCartItem = (productId: string, size: SizeKey) => {
    setCart((prev) => prev.filter((i) => !(i.productId === productId && i.size === size)));
  };

  const handleClearCart = () => {
    setCart([]);
    setCustomerName('');
    setNote('');
    setDiscountValue(0);
  };

  // Hold Order Handlers
  const handleHoldOrder = () => {
    if (cart.length === 0) return;
    const newHeld: HeldOrder = {
      id: `hold-${Date.now()}`,
      createdAt: new Date().toISOString(),
      customerName: customerName.trim(),
      note: note.trim(),
      discountType,
      discountValue,
      items: cart,
    };
    setHeldOrders((prev) => [newHeld, ...prev]);
    handleClearCart();
    showToast('ဘောင်ချာကို ခဏဆိုင်းငံ့ထားလိုက်ပါပြီ');
  };

  const handleRestoreHeldOrder = (order: HeldOrder) => {
    // Clamp restored quantities to currently available stock
    const validatedItems: CartItem[] = [];
    for (const item of order.items) {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod) continue;
      const available = prod.stock[item.size] || 0;
      if (available <= 0) continue;
      validatedItems.push({
        ...item,
        price: prod.price,
        cost: prod.cost,
        quantity: Math.min(item.quantity, available),
      });
    }

    setCart(validatedItems);
    setCustomerName(order.customerName);
    setNote(order.note);
    setDiscountType(order.discountType);
    setDiscountValue(order.discountValue);
    setHeldOrders((prev) => prev.filter((o) => o.id !== order.id));
    setHeldModalOpen(false);
    setActiveTab('register');
    showToast('ဆိုင်းငံ့ဘောင်ချာကို ပြန်လည်ခေါ်ယူပြီးပါပြီ');
  };

  const handleDeleteHeldOrder = (id: string) => {
    setHeldOrders((prev) => prev.filter((o) => o.id !== id));
  };

  // Checkout Completion
  const handleCompletePayment = (
    paymentMethod: PaymentMethod,
    cashReceived?: number,
    changeDue?: number
  ) => {
    if (cart.length === 0) return;

    const newSale: SaleRecord = {
      id: `sale-${Date.now()}`,
      receiptNo: generateReceiptNo(sales.length),
      createdAt: new Date().toISOString(),
      items: cart.map((i) => ({
        productId: i.productId,
        sku: i.sku,
        name: i.name,
        size: i.size,
        price: i.price,
        cost: i.cost,
        quantity: i.quantity,
      })),
      subtotal: cartSummary.subtotal,
      discountType,
      discountValue,
      discountAmount: cartSummary.discountAmount,
      taxRate: settings.taxRate,
      taxAmount: cartSummary.taxAmount,
      total: cartSummary.total,
      totalCost: cartSummary.totalCost,
      paymentMethod,
      cashReceived,
      changeDue,
      customerName: customerName.trim(),
      note: note.trim(),
      status: 'completed',
    };

    // Deduct stock per size
    setProducts((prev) =>
      prev.map((prod) => {
        const boughtForProd = cart.filter((c) => c.productId === prod.id);
        if (boughtForProd.length === 0) return prod;
        const nextStock = { ...prod.stock };
        for (const item of boughtForProd) {
          nextStock[item.size] = Math.max(0, (nextStock[item.size] || 0) - item.quantity);
        }
        return { ...prod, stock: nextStock };
      })
    );

    setSales((prev) => [newSale, ...prev]);
    setCompletedSale(newSale);
    handleClearCart();
  };

  // Print 80mm Thermal Receipt
  const handlePrintReceipt = (sale: SaleRecord) => {
    setPrintSale(sale);
    window.setTimeout(() => {
      window.print();
    }, 60);
  };

  // Void Sale (auto-restores size stock)
  const handleVoidSale = (saleId: string) => {
    const target = sales.find((s) => s.id === saleId);
    if (!target || target.status === 'voided') return;

    setSales((prev) =>
      prev.map((s) =>
        s.id === saleId
          ? { ...s, status: 'voided', voidedAt: new Date().toISOString() }
          : s
      )
    );

    // Restore stock for each item's size
    setProducts((prev) =>
      prev.map((prod) => {
        const voidItems = target.items.filter((i) => i.productId === prod.id);
        if (voidItems.length === 0) return prod;
        const nextStock = { ...prod.stock };
        for (const item of voidItems) {
          nextStock[item.size] = (nextStock[item.size] || 0) + item.quantity;
        }
        return { ...prod, stock: nextStock };
      })
    );

    showToast(`ဘောင်ချာ ${target.receiptNo} ကို ပယ်ဖျက်ပြီး လက်ကျန်ပြန်ပေါင်းပြီးပါပြီ`);
  };

  // Inventory Handlers
  const handleSaveProduct = (product: Product, isEdit: boolean) => {
    setProducts((prev) => {
      if (isEdit) {
        return prev.map((p) => (p.id === product.id ? product : p));
      }
      return [product, ...prev];
    });
    showToast(isEdit ? 'ကုန်ပစ္စည်း အချက်အလက် ပြင်ဆင်ပြီးပါပြီ' : 'အဝတ်အထည်အသစ် ထည့်သွင်းပြီးပါပြီ');
  };

  const handleDeleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setCart((prev) => prev.filter((c) => c.productId !== id));
    showToast('ကုန်ပစ္စည်း ဖျက်ပြီးပါပြီ');
  };

  const handleResetDemoData = () => {
    setProducts(INITIAL_PRODUCTS);
    setSales(INITIAL_SALES);
    setHeldOrders([]);
    setSettings(DEFAULT_SETTINGS);
    handleClearCart();
    showToast('မူလနမူနာ အချက်အလက်အတိုင်း ပြန်လည်သတ်မှတ်ပြီးပါပြီ');
  };

  return (
    <>
      <div id="app-shell" className="min-h-screen flex flex-col bg-[#F8F9FA] text-[#111827]">
        {/* Top Bar Contract: 3 zones (Single-line Brand — 4 concise nav links — 1 primary CTA) */}
        <header className="sticky top-0 z-30 h-[61px] bg-white border-b border-[#E5E7EB] px-5 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand wordmark */}
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className="text-base font-bold tracking-tight text-[#111827] whitespace-nowrap shrink-0 truncate max-w-[220px] text-left"
          >
            {settings.storeName || 'အဝတ်အထည်ဆိုင် POS'}
          </button>

          {/* Zone 2: 4 concise single-line nav links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {NAV_TABS.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-1.5 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'border-[#111827] text-[#111827] font-semibold'
                      : 'border-transparent text-[#6B7280] hover:text-[#111827]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary contextual action */}
          <div className="shrink-0">
            {activeTab === 'register' ? (
              <button
                type="button"
                onClick={() => setHeldModalOpen(true)}
                className="px-3.5 py-2 rounded-lg bg-[#111827] text-white text-xs font-medium hover:bg-[#1F2937] transition-colors whitespace-nowrap shrink-0"
              >
                ဆိုင်းငံ့ဘောင်ချာ ({heldOrders.length})
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab('register')}
                className="px-3.5 py-2 rounded-lg bg-[#111827] text-white text-xs font-medium hover:bg-[#1F2937] transition-colors whitespace-nowrap shrink-0"
              >
                အရောင်းကောင်တာသို့
              </button>
            )}
          </div>
        </header>

        {/* Mobile Tab Strip (only visible on small screens) */}
        <nav className="flex md:hidden items-center gap-1 px-3 py-2 bg-white border-b border-[#E5E7EB] overflow-x-auto">
          {NAV_TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                  active ? 'bg-[#111827] text-white' : 'text-[#4B5563] hover:bg-[#F3F4F6]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Main Workspace */}
        <main className="flex-1 min-h-0">
          {activeTab === 'register' && (
            <RegisterView
              products={products}
              cart={cart}
              customerName={customerName}
              note={note}
              discountType={discountType}
              discountValue={discountValue}
              taxRate={settings.taxRate}
              heldOrdersCount={heldOrders.length}
              onAddToCart={handleAddToCart}
              onUpdateCartQty={handleUpdateCartQty}
              onRemoveCartItem={handleRemoveCartItem}
              onClearCart={handleClearCart}
              onCustomerNameChange={setCustomerName}
              onNoteChange={setNote}
              onDiscountTypeChange={setDiscountType}
              onDiscountValueChange={setDiscountValue}
              onHoldOrder={handleHoldOrder}
              onOpenHeldOrders={() => setHeldModalOpen(true)}
              onOpenCheckout={() => {
                setCompletedSale(null);
                setCheckoutOpen(true);
              }}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryView
              products={products}
              onSaveProduct={handleSaveProduct}
              onDeleteProduct={handleDeleteProduct}
            />
          )}

          {activeTab === 'history' && (
            <SalesHistoryView
              sales={sales}
              settings={settings}
              onVoidSale={handleVoidSale}
              onPrintReceipt={handlePrintReceipt}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              onUpdateSettings={setSettings}
              onResetDemoData={handleResetDemoData}
            />
          )}
        </main>

        {/* Checkout & Post-Sale 80mm Receipt Modal */}
        {checkoutOpen && (
          <CheckoutModal
            total={cartSummary.total}
            subtotal={cartSummary.subtotal}
            discountAmount={cartSummary.discountAmount}
            taxAmount={cartSummary.taxAmount}
            taxRate={settings.taxRate}
            itemCount={cartSummary.itemCount}
            settings={settings}
            completedSale={completedSale}
            onCompletePayment={handleCompletePayment}
            onPrintReceipt={handlePrintReceipt}
            onClose={() => {
              setCheckoutOpen(false);
              setCompletedSale(null);
            }}
          />
        )}

        {/* Held Orders Modal */}
        {heldModalOpen && (
          <HeldOrdersModal
            orders={heldOrders}
            onRestore={handleRestoreHeldOrder}
            onDelete={handleDeleteHeldOrder}
            onClose={() => setHeldModalOpen(false)}
          />
        )}

        {/* Subtle Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-lg bg-[#111827] text-white text-xs font-medium shadow-lg">
            {toastMessage}
          </div>
        )}
      </div>

      {/* Dedicated 80mm Thermal Print Root (visible only in @media print) */}
      <div id="thermal-print-area">
        {printSale && <Receipt80mm sale={printSale} settings={settings} />}
      </div>
    </>
  );
}
