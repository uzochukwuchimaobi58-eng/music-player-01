import React, { useState, useEffect } from 'react';
import {
  X,
  ShoppingBag,
  ExternalLink,
  Star,
  Tag,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  Link,
  DollarSign,
  Check,
  RotateCcw,
  SlidersHorizontal,
  Cloud,
  Globe2,
  RefreshCw,
} from 'lucide-react';
import { AffiliateProduct } from '../types';
import { saveAffiliateProducts, resetAffiliateProducts } from '../data/affiliateProducts';
import {
  saveProductToCloud,
  deleteProductFromCloud,
  updateGlobalAffiliateTag,
  seedDefaultProductsToCloud,
  getGlobalAffiliateTag,
} from '../services/affiliateService';

interface AffiliateDealsModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: AffiliateProduct[];
  onUpdateProducts: (products: AffiliateProduct[]) => void;
  selectedProduct?: AffiliateProduct | null;
  isCloudConnected?: boolean;
}

export const AffiliateDealsModal: React.FC<AffiliateDealsModalProps> = ({
  isOpen,
  onClose,
  products,
  onUpdateProducts,
  selectedProduct,
  isCloudConnected = true,
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'manage'>('catalog');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSavingCloud, setIsSavingCloud] = useState(false);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Management State
  const [affiliateTag, setAffiliateTag] = useState<string>('musicplayer-affiliate-20');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Headphones & ANC');
  const [newPrice, setNewPrice] = useState('$');
  const [newOriginalPrice, setNewOriginalPrice] = useState('$');
  const [newAffiliateUrl, setNewAffiliateUrl] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newBadge, setNewBadge] = useState('🔥 FEATURED');

  // Load cloud affiliate tag on open
  useEffect(() => {
    if (isOpen) {
      getGlobalAffiliateTag().then((cloudTag) => {
        if (cloudTag) setAffiliateTag(cloudTag);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const categories = ['All', 'Headphones & ANC', 'Audiophile DACs', 'Mics & Recording', 'In-Ear Monitors', 'Bluetooth Speakers', 'Accessories'];

  const filteredProducts = selectedCategory === 'All'
    ? products
    : products.filter((p) => p.category.toLowerCase().includes(selectedCategory.toLowerCase()));

  const showToast = (msg: string) => {
    setStatusNotification(msg);
    setTimeout(() => setStatusNotification(null), 4500);
  };

  const handleCopyLink = (prod: AffiliateProduct) => {
    navigator.clipboard.writeText(prod.affiliateUrl);
    setCopiedId(prod.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApplyTag = async () => {
    if (!affiliateTag.trim()) return;
    const cleanTag = affiliateTag.trim().replace(/^tag=/, '');
    setIsSavingCloud(true);

    const updated = products.map((p) => {
      let url = p.affiliateUrl;
      if (url.includes('tag=')) {
        url = url.replace(/tag=[^&]+/, `tag=${cleanTag}`);
      } else {
        url += (url.includes('?') ? '&' : '?') + `tag=${cleanTag}`;
      }
      return { ...p, affiliateUrl: url };
    });

    onUpdateProducts(updated);
    saveAffiliateProducts(updated);

    // Save to Cloud feed so all users' apps get this partner tag
    await updateGlobalAffiliateTag(cleanTag);
    setIsSavingCloud(false);
    showToast(`Cloud Feed Updated! All users will now redirect with your tag: ${cleanTag}`);
  };

  const handleAddNewProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newAffiliateUrl.trim()) return;

    setIsSavingCloud(true);
    const newProd: AffiliateProduct = {
      id: `aff-custom-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      price: newPrice.trim() || '$19.99',
      originalPrice: newOriginalPrice.trim() || undefined,
      discountPercent: newOriginalPrice.trim() ? '-25%' : undefined,
      rating: 4.9,
      reviewsCount: '1.2k',
      description: newDescription.trim() || 'High quality music gear chosen for passionate audio lovers.',
      affiliateUrl: newAffiliateUrl.trim(),
      imageUrl: newImageUrl.trim() || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80',
      badge: newBadge.trim() || '🔥 MY GEAR',
      isCustom: true,
    };

    const updated = [newProd, ...products];
    onUpdateProducts(updated);
    saveAffiliateProducts(updated);

    // Push to cloud feed
    await saveProductToCloud(newProd);
    setIsSavingCloud(false);
    setIsAddingNew(false);
    showToast(`Published to Cloud Feed! This product is now live on every user's billboard worldwide.`);

    // Reset form
    setNewTitle('');
    setNewAffiliateUrl('');
    setNewPrice('$');
    setNewOriginalPrice('$');
    setNewImageUrl('');
    setNewDescription('');
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Delete this product from the live cloud feed for all users?')) {
      setIsSavingCloud(true);
      const updated = products.filter((p) => p.id !== id);
      onUpdateProducts(updated);
      saveAffiliateProducts(updated);
      await deleteProductFromCloud(id);
      setIsSavingCloud(false);
      showToast('Product removed from cloud feed.');
    }
  };

  const handleResetDefaults = async () => {
    if (confirm('Reset and re-seed the cloud feed with default curated music gear?')) {
      setIsSavingCloud(true);
      const reset = resetAffiliateProducts();
      onUpdateProducts(reset);
      await seedDefaultProductsToCloud();
      setIsSavingCloud(false);
      showToast('Cloud feed restored to default curated products.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-zinc-100"
        id="affiliate-deals-modal"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ShoppingBag size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  Music Gear Billboard & Store
                </h3>
                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                  Affiliate Deals
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Trending audio equipment & music accessories listeners buy online
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 pt-3 pb-2 border-b border-zinc-800/80 flex items-center justify-between gap-2 bg-zinc-900/60">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'catalog'
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              Shop Featured Gear ({products.length})
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'manage'
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <SlidersHorizontal size={13} />
              My Affiliate Links & Tag
            </button>
          </div>

          {activeTab === 'manage' && (
            <button
              onClick={() => setIsAddingNew(true)}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1 transition-colors shadow-sm"
            >
              <Plus size={13} /> Add Product
            </button>
          )}
        </div>

        {/* Real-time Cloud Feed status notification */}
        {statusNotification && (
          <div className="px-5 py-2 bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between animate-in slide-in-from-top duration-150">
            <div className="flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
              <span className="font-medium">{statusNotification}</span>
            </div>
            <button onClick={() => setStatusNotification(null)} className="text-emerald-400 hover:text-emerald-200">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Cloud Broadcast Status Pill */}
        <div className="px-5 py-2 bg-zinc-950/60 border-b border-zinc-800/60 flex flex-wrap items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-2 text-zinc-400">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold text-[11px]">
              <Cloud className="w-3.5 h-3.5" />
              Live Cloud Feed Active
            </span>
            <span className="hidden sm:inline text-zinc-400 text-[11px]">
              Products you add or edit sync instantly to all app users worldwide.
            </span>
          </div>
          {isSavingCloud && (
            <span className="flex items-center gap-1.5 text-amber-400 text-xs animate-pulse">
              <RefreshCw className="w-3 h-3 animate-spin" /> Broadcasting to cloud...
            </span>
          )}
        </div>

        {/* TAB 1: CATALOG OF PRODUCTS */}
        {activeTab === 'catalog' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Category Filter Pills */}
            <div className="px-5 py-2.5 border-b border-zinc-800/60 overflow-x-auto flex gap-1.5 no-scrollbar bg-zinc-950/40">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 transition-colors ${
                    selectedCategory === cat
                      ? 'bg-zinc-100 text-zinc-900 font-bold'
                      : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Products List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="group bg-zinc-950/60 hover:bg-zinc-850/80 border border-zinc-800 hover:border-amber-500/50 rounded-xl p-3.5 transition-all duration-200 flex flex-col sm:flex-row gap-3.5 items-start sm:items-center"
                >
                  {/* Thumbnail */}
                  <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700/60 shadow-md">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-500">
                        <ShoppingBag size={28} />
                      </div>
                    )}
                    {product.discountPercent && (
                      <span className="absolute top-1 left-1 bg-red-600 text-white font-black text-[9px] px-1 py-0.5 rounded shadow">
                        {product.discountPercent}
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">
                        {product.badge || product.category}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] text-zinc-300">
                        <Star size={12} className="fill-amber-400 text-amber-400" />
                        <span className="font-semibold">{product.rating}</span>
                        {product.reviewsCount && (
                          <span className="text-zinc-500">({product.reviewsCount})</span>
                        )}
                      </div>
                    </div>

                    <h4 className="text-sm font-semibold text-zinc-100 group-hover:text-amber-300 transition-colors line-clamp-1">
                      {product.title}
                    </h4>

                    <p className="text-xs text-zinc-400 line-clamp-2 mt-0.5 leading-relaxed">
                      {product.description}
                    </p>

                    <div className="flex items-baseline gap-2 mt-1.5">
                      <span className="text-base font-bold text-emerald-400">
                        {product.price}
                      </span>
                      {product.originalPrice && (
                        <span className="text-xs text-zinc-500 line-through">
                          {product.originalPrice}
                        </span>
                      )}
                      <span className="text-[10px] text-zinc-500 ml-1">
                        Verified online deal
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="w-full sm:w-auto flex sm:flex-col gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800">
                    <a
                      href={product.affiliateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-transform active:scale-95"
                    >
                      Buy Online <ExternalLink size={13} />
                    </a>

                    <button
                      onClick={() => handleCopyLink(product)}
                      className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                      title="Copy affiliate link"
                    >
                      {copiedId === product.id ? (
                        <>
                          <Check size={13} className="text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Link size={13} />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: MANAGE AFFILIATE LINKS & TAG */}
        {activeTab === 'manage' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Global Cloud Broadcast Explainer */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-zinc-950 to-zinc-950 border border-amber-500/30">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 border border-amber-500/30">
                  <Globe2 size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    Global Cloud Broadcast Active
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      LIVE
                    </span>
                  </h4>
                  <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">
                    Whenever you add products, modify prices, or update your affiliate tag below, our Firebase Cloud database immediately broadcasts the changes to <strong>every user who installs the app</strong>. Users see your newest advertised products on their billboard within seconds!
                  </p>
                </div>
              </div>
            </div>

            {/* Affiliate Tag Form */}
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Tag className="text-amber-400" size={18} />
                <h4 className="text-sm font-bold text-white">Your Global Affiliate Tag / ID</h4>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Enter your Amazon Associates or affiliate partner tag here (e.g. <code className="bg-zinc-800 px-1 py-0.5 rounded text-amber-300">yourname-20</code>).
                When you click apply, all default product links will automatically redirect with your tracking tag so you earn commissions.
              </p>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={affiliateTag}
                    onChange={(e) => setAffiliateTag(e.target.value)}
                    placeholder="e.g. musicplayer-affiliate-20"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  onClick={handleApplyTag}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-lg transition-colors shadow"
                >
                  Apply to All
                </button>
              </div>
            </div>

            {/* Modal to add custom product */}
            {isAddingNew ? (
              <form
                onSubmit={handleAddNewProduct}
                className="bg-zinc-950 border border-amber-500/40 rounded-xl p-4 space-y-3 animate-in fade-in duration-150"
              >
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <h4 className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                    <Sparkles size={16} /> Add Your Own Affiliate Product
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="text-zinc-400 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                      Product Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bose QuietComfort Ultra"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                      Category
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      {categories.filter((c) => c !== 'All').map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                      Sale Price *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="$29.99"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                      Original Price (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="$49.99"
                      value={newOriginalPrice}
                      onChange={(e) => setNewOriginalPrice(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                    Your Affiliate URL / Product Link *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://www.amazon.com/dp/... or your store link"
                    value={newAffiliateUrl}
                    onChange={(e) => setNewAffiliateUrl(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                    Product Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/... or image link"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                    Short Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="What makes this music item awesome?"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors shadow"
                  >
                    Save & Add to Billboard
                  </button>
                </div>
              </form>
            ) : null}

            {/* Current Products Management List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Current Listed Products ({products.length})
                </h4>
                <button
                  onClick={handleResetDefaults}
                  className="text-[11px] text-zinc-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw size={12} /> Reset to Defaults
                </button>
              </div>

              <div className="space-y-2">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="bg-zinc-950/60 border border-zinc-800 rounded-lg p-2.5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.title}
                          className="w-10 h-10 rounded object-cover shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-zinc-800 flex items-center justify-center text-zinc-500 shrink-0">
                          <ShoppingBag size={16} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-zinc-100 truncate">{p.title}</p>
                        <p className="text-[11px] text-emerald-400 font-bold">{p.price}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <a
                        href={p.affiliateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-zinc-400 hover:text-amber-400 transition-colors"
                        title="Test link"
                      >
                        <ExternalLink size={14} />
                      </a>
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="p-1.5 text-zinc-400 hover:text-red-400 transition-colors"
                        title="Remove product"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-800/80 bg-zinc-950/90 flex items-center justify-between text-xs text-zinc-400">
          <span>💡 Billboard displays dynamically in your music player drawer</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
