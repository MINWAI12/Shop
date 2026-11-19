import { useMemo, useRef, useState } from 'react';
import { AlertTriangle, Edit3, Plus, Search, Trash2, Upload, X } from 'lucide-react';
import {
  CATEGORY_LABELS,
  CategoryKey,
  Product,
  SIZES,
  SizeStock,
} from '../types/pos';
import {
  compressImageFile,
  formatMMK,
  getTotalStock,
  hasLowStockSize,
} from '../utils/format';
import { ProductImage } from './ProductImage';

interface InventoryViewProps {
  products: Product[];
  onSaveProduct: (product: Product, isEdit: boolean) => void;
  onDeleteProduct: (id: string) => void;
}

type StockFilter = 'all' | 'low' | 'out';

const EMPTY_STOCK: SizeStock = { S: 0, M: 0, L: 0, XL: 0, Free: 0 };

export function InventoryView({
  products,
  onSaveProduct,
  onDeleteProduct,
}: InventoryViewProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | CategoryKey>('all');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');

  // Add/Edit Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState<CategoryKey>('tops');
  const [price, setPrice] = useState<string>('');
  const [cost, setCost] = useState<string>('');
  const [image, setImage] = useState<string>('');
  const [stock, setStock] = useState<SizeStock>({ ...EMPTY_STOCK });
  const [formError, setFormError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete confirmation modal
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const stats = useMemo(() => {
    let totalPieces = 0;
    let lowCount = 0;
    let outCount = 0;
    for (const p of products) {
      const total = getTotalStock(p.stock);
      totalPieces += total;
      if (total === 0) {
        outCount += 1;
      } else if (hasLowStockSize(p.stock, 3)) {
        lowCount += 1;
      }
    }
    return {
      totalSkus: products.length,
      totalPieces,
      lowCount,
      outCount,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      const total = getTotalStock(p.stock);
      if (stockFilter === 'out' && total !== 0) return false;
      if (stockFilter === 'low' && (total === 0 || !hasLowStockSize(p.stock, 3))) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    });
  }, [products, search, categoryFilter, stockFilter]);

  const openAddModal = () => {
    setEditingId(null);
    setName('');
    setSku('');
    setCategory('tops');
    setPrice('');
    setCost('');
    setImage('');
    setStock({ S: 0, M: 5, L: 5, XL: 0, Free: 0 });
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingId(product.id);
    setName(product.name);
    setSku(product.sku);
    setCategory(product.category);
    setPrice(String(product.price));
    setCost(String(product.cost));
    setImage(product.image);
    setStock({ ...product.stock });
    setFormError('');
    setModalOpen(true);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file, 640);
      setImage(dataUrl);
    } catch {
      setFormError('ဓာတ်ပုံဖတ်ရာတွင် အမှားဖြစ်ပွားပါသည်။');
    }
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedSku = sku.trim().toUpperCase();
    const numPrice = Number(price) || 0;
    const numCost = Number(cost) || 0;

    if (!trimmedName || !trimmedSku) {
      setFormError('အဝတ်အထည်အမည် နှင့် SKU ကုဒ်ကို မဖြစ်မနေ ဖြည့်သွင်းပါ။');
      return;
    }
    if (numPrice <= 0) {
      setFormError('ရောင်းဈေးသည် 0 ထက် ကြီးရပါမည်။');
      return;
    }

    const duplicateSku = products.some(
      (p) => p.sku.toLowerCase() === trimmedSku.toLowerCase() && p.id !== editingId
    );
    if (duplicateSku) {
      setFormError('ဤ SKU ကုဒ်သည် စာရင်းထဲတွင် ရှိပြီးသားဖြစ်ပါသည်။');
      return;
    }

    const savedProduct: Product = {
      id: editingId || `prod-${Date.now()}`,
      sku: trimmedSku,
      name: trimmedName,
      category,
      price: numPrice,
      cost: numCost,
      image,
      stock: {
        S: Math.max(0, Math.floor(stock.S || 0)),
        M: Math.max(0, Math.floor(stock.M || 0)),
        L: Math.max(0, Math.floor(stock.L || 0)),
        XL: Math.max(0, Math.floor(stock.XL || 0)),
        Free: Math.max(0, Math.floor(stock.Free || 0)),
      },
    };

    onSaveProduct(savedProduct, Boolean(editingId));
    setModalOpen(false);
  };

  return (
    <div className="max-w-[1400px] mx-auto px-5 py-6 space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#111827]">ကုန်ပစ္စည်းစာရင်း (Inventory)</h1>
          <p className="text-xs text-[#6B7280] mt-1">
            Size အလိုက် လက်ကျန်အရေအတွက် စီမံခန့်ခွဲခြင်းနှင့် ဈေးနှုန်းပြင်ဆင်ခြင်း
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#111827] text-white text-sm font-medium hover:bg-[#1F2937] transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>အဝတ်အထည်အသစ် ထည့်မည်</span>
        </button>
      </div>

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
          <div className="text-xs text-[#6B7280]">စုစုပေါင်း အမျိုးအမည် (SKUs)</div>
          <div className="mt-1.5 text-2xl font-bold font-mono-num text-[#111827]">
            {stats.totalSkus}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
          <div className="text-xs text-[#6B7280]">လက်ကျန် စုစုပေါင်းအထည်</div>
          <div className="mt-1.5 text-2xl font-bold font-mono-num text-[#111827]">
            {stats.totalPieces}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
          <div className="text-xs text-[#6B7280]">လက်ကျန်နည်း သတိပေး (≤ 3)</div>
          <div className="mt-1.5 text-2xl font-bold font-mono-num text-[#D97706]">
            {stats.lowCount}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
          <div className="text-xs text-[#6B7280]">လက်ကျန်ကုန် (0)</div>
          <div className="mt-1.5 text-2xl font-bold font-mono-num text-[#DC2626]">
            {stats.outCount}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="SKU သို့မဟုတ် အမည်ဖြင့် ရှာဖွေရန်..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:bg-white focus:border-[#111827]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as 'all' | CategoryKey)}
            className="px-3 py-2 text-xs font-medium bg-white border border-[#E5E7EB] rounded-lg text-[#374151] focus:outline-none focus:border-[#111827]"
          >
            <option value="all">အမျိုးအစားအားလုံး</option>
            <option value="tops">{CATEGORY_LABELS.tops}</option>
            <option value="bottoms">{CATEGORY_LABELS.bottoms}</option>
            <option value="outerwear">{CATEGORY_LABELS.outerwear}</option>
          </select>

          <div className="flex items-center gap-1 p-1 bg-[#F3F4F6] rounded-lg">
            {(
              [
                { key: 'all', label: 'အားလုံး' },
                { key: 'low', label: 'လက်ကျန်နည်း' },
                { key: 'out', label: 'လက်ကျန်ကုန်' },
              ] as { key: StockFilter; label: string }[]
            ).map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setStockFilter(opt.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  stockFilter === opt.key
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

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-xs font-semibold text-[#4B5563]">
                <th className="py-3 px-4">အဝတ်အထည်</th>
                <th className="py-3 px-4 text-right">အရင်း / ရောင်းဈေး</th>
                {SIZES.map((s) => (
                  <th key={s} className="py-3 px-2.5 text-center w-14">
                    {s}
                  </th>
                ))}
                <th className="py-3 px-4 text-right">စုစုပေါင်း</th>
                <th className="py-3 px-4 text-right">လုပ်ဆောင်ချက်</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6] text-sm">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-sm text-[#6B7280]">
                    ကိုက်ညီသော ကုန်ပစ္စည်း မရှိပါ။
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const total = getTotalStock(p.stock);
                  const low = total > 0 && hasLowStockSize(p.stock, 3);
                  return (
                    <tr key={p.id} className="hover:bg-[#FAFAFA] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3 min-w-[220px]">
                          <ProductImage
                            src={p.image}
                            alt={p.name}
                            className="w-11 h-11 rounded-lg border border-[#E5E7EB] shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-[#111827] text-sm truncate">
                              {p.name}
                            </div>
                            <div className="text-xs text-[#6B7280] font-mono-num mt-0.5">
                              {p.sku} · {CATEGORY_LABELS[p.category]}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono-num">
                        <div className="font-semibold text-[#111827]">{formatMMK(p.price)}</div>
                        <div className="text-xs text-[#6B7280]">အရင်း {formatMMK(p.cost)}</div>
                      </td>

                      {SIZES.map((s) => {
                        const qty = p.stock[s] || 0;
                        return (
                          <td key={s} className="py-3 px-2.5 text-center font-mono-num">
                            <span
                              className={`text-xs font-semibold ${
                                qty === 0
                                  ? 'text-[#D1D5DB]'
                                  : qty <= 3
                                    ? 'text-[#D97706]'
                                    : 'text-[#111827]'
                              }`}
                            >
                              {qty}
                            </span>
                          </td>
                        );
                      })}

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="font-bold font-mono-num text-[#111827]">{total}</div>
                        {total === 0 ? (
                          <div className="inline-flex items-center gap-1 text-[11px] font-medium text-[#DC2626]">
                            <AlertTriangle className="w-3 h-3" />
                            <span>လက်ကျန်ကုန်</span>
                          </div>
                        ) : low ? (
                          <div className="inline-flex items-center gap-1 text-[11px] font-medium text-[#D97706]">
                            <AlertTriangle className="w-3 h-3" />
                            <span>လက်ကျန်နည်း</span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-[#16A34A]">ပုံမှန်</div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-[#E5E7EB] bg-white text-xs font-medium text-[#374151] hover:border-[#111827] hover:text-[#111827] transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>ပြင်ဆင်</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(p)}
                            className="p-1.5 rounded-md border border-[#E5E7EB] bg-white text-[#6B7280] hover:text-[#DC2626] hover:border-[#FECACA] hover:bg-[#FEF2F2] transition-colors"
                            aria-label="ဖျက်မည်"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* Add / Edit Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="bg-white rounded-xl border border-[#E5E7EB] w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
              <h2 className="text-base font-semibold text-[#111827]">
                {editingId ? 'အဝတ်အထည် အချက်အလက် ပြင်ဆင်ရန်' : 'အဝတ်အထည်အသစ် ထည့်သွင်းရန်'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]"
                aria-label="ပိတ်မည်"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4">
              {formError && (
                <div className="px-3.5 py-2.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs font-medium text-[#DC2626]">
                  {formError}
                </div>
              )}

              {/* Photo Upload Row */}
              <div className="flex items-center gap-4">
                <ProductImage
                  src={image}
                  alt={name || 'Product preview'}
                  className="w-20 h-20 rounded-xl border border-[#E5E7EB] shrink-0"
                />
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-[#374151]">အဝတ်အထည် ဓာတ်ပုံ</div>
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#D1D5DB] bg-white text-xs font-medium text-[#111827] hover:bg-[#F3F4F6] transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>ဓာတ်ပုံတင်မည်</span>
                    </button>
                    {image && (
                      <button
                        type="button"
                        onClick={() => setImage('')}
                        className="px-2.5 py-1.5 rounded-md text-xs text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
                      >
                        ဖယ်ရှားမည်
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-[#4B5563] mb-1">
                    အဝတ်အထည်အမည် *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ဥပမာ - လိုင်နင် ရှပ်အင်္ကျီလက်ရှည်"
                    className="w-full px-3 py-2 text-sm border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#111827]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#4B5563] mb-1">
                    SKU / ဘားကုဒ် *
                  </label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="ဥပမာ - TOP-105"
                    className="w-full px-3 py-2 text-sm font-mono-num border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#111827]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#4B5563] mb-1">
                    အမျိုးအစား
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as CategoryKey)}
                    className="w-full px-3 py-2 text-sm border border-[#D1D5DB] rounded-lg bg-white focus:outline-none focus:border-[#111827]"
                  >
                    <option value="tops">{CATEGORY_LABELS.tops}</option>
                    <option value="bottoms">{CATEGORY_LABELS.bottoms}</option>
                    <option value="outerwear">{CATEGORY_LABELS.outerwear}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#4B5563] mb-1">
                    ရောင်းဈေး (Ks) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={500}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="35000"
                    className="w-full px-3 py-2 text-sm font-mono-num border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#111827]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#4B5563] mb-1">
                    အရင်းဈေး (Ks — အမြတ်တွက်ရန်)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="20000"
                    className="w-full px-3 py-2 text-sm font-mono-num border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#111827]"
                  />
                </div>
              </div>

              {/* Size Stock Inputs */}
              <div className="pt-2 border-t border-[#F3F4F6]">
                <label className="block text-xs font-medium text-[#4B5563] mb-2">
                  Size အလိုက် လက်ကျန်အရေအတွက်
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {SIZES.map((s) => (
                    <div key={s}>
                      <div className="text-[11px] font-semibold text-center text-[#4B5563] mb-1">
                        {s}
                      </div>
                      <input
                        type="number"
                        min={0}
                        value={stock[s]}
                        onChange={(e) =>
                          setStock((prev) => ({
                            ...prev,
                            [s]: Math.max(0, Number(e.target.value) || 0),
                          }))
                        }
                        className="w-full px-2 py-2 text-center text-sm font-mono-num border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#111827]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#D1D5DB] text-sm font-medium text-[#374151] hover:bg-[#F3F4F6]"
                >
                  မလုပ်တော့ပါ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#111827] text-white text-sm font-medium hover:bg-[#1F2937]"
                >
                  သိမ်းဆည်းမည်
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="bg-white rounded-xl border border-[#E5E7EB] w-full max-w-sm p-6 shadow-xl space-y-4">
            <h3 className="text-base font-semibold text-[#111827]">
              ကုန်ပစ္စည်း ဖျက်ရန် အတည်ပြုပါ
            </h3>
            <p className="text-sm text-[#4B5563]">
              <span className="font-semibold text-[#111827]">{deleteTarget.name}</span> (
              {deleteTarget.sku}) ကို စာရင်းထဲမှ အပြီးဖျက်မည်လား?
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg border border-[#D1D5DB] text-sm font-medium text-[#374151] hover:bg-[#F3F4F6]"
              >
                မဖျက်တော့ပါ
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteProduct(deleteTarget.id);
                  setDeleteTarget(null);
                }}
                className="px-4 py-2 rounded-lg bg-[#DC2626] text-white text-sm font-medium hover:bg-[#B91C1C]"
              >
                ဖျက်မည်
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
