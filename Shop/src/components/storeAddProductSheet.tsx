import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Image as ImageIcon,
  ChevronDown,
  Globe,
  Store,
  EyeOff
} from 'lucide-react';
import { MarketProduct } from '../types';
import { CATEGORIES, CONDITIONS } from './storeConstants';

interface AddProductSheetProps {
  onClose: () => void;
  onSubmit: (product: Omit<MarketProduct, 'id' | 'sellerUsername' | 'sellerName' | 'rating' | 'salesCount' | 'reviewsCount'>) => void;
  keepPrivate: boolean;
  setKeepPrivate: (v: boolean) => void;
  editingProduct?: MarketProduct | null;
  submitError?: string | null;
}

export default function AddProductSheet({ 
  onClose, 
  onSubmit, 
  keepPrivate, 
  setKeepPrivate, 
  editingProduct, 
  submitError 
}: AddProductSheetProps) {
  const [title, setTitle] = useState(editingProduct?.title || '');
  const [category, setCategory] = useState(editingProduct?.category || '');
  const [condition, setCondition] = useState<MarketProduct['condition']>(editingProduct?.condition || 'New');
  const [price, setPrice] = useState(editingProduct ? String(editingProduct.price) : '');
  const [image, setImage] = useState(editingProduct?.image || '');
  const [size, setSize] = useState(editingProduct?.specs?.Size || '');
  const [color, setColor] = useState(editingProduct?.specs?.Color || '');
  const [qty, setQty] = useState(editingProduct?.specs?.Qty || '1');
  const [deliveryFee, setDeliveryFee] = useState('');
  const [takeOffLocation, setTakeOffLocation] = useState('');
  const [publishOpenMarket, setPublishOpenMarket] = useState(true);
  const [publishMyStore, setPublishMyStore] = useState(true);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [conditionOpen, setConditionOpen] = useState(false);

  const canPublish = title.trim() && category && price;
  const isEditing = !!editingProduct;

  const handlePublish = () => {
    if (!canPublish) return;
    onSubmit({
      title: title.trim(),
      price: parseFloat(price) || 0,
      image: image || 'https://images.unsplash.com/photo-1587302912306-cf1ed9c33146?auto=format&fit=crop&q=80&w=400',
      category,
      condition,
      specs: {
        ...(size ? { Size: size } : {}),
        ...(color ? { Color: color } : {}),
        Qty: qty || '1'
      },
      description: `${title.trim()} — ${condition}. ${deliveryFee ? `Delivery fee ₦${deliveryFee}.` : ''} ${takeOffLocation ? `Take-off: ${takeOffLocation}.` : ''}`.trim()
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-xs">
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="bg-white w-full max-w-md rounded-t-3xl max-h-[90vh] overflow-y-auto no-scrollbar"
      >
        <div className="sticky top-0 bg-white px-4 pt-4 pb-3 border-b border-slate-100 flex items-center justify-between z-10">
          <h3 className="text-sm font-sans font-black text-slate-900">{isEditing ? 'Edit Product' : 'Add Product'}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer outline-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-4 space-y-4 font-sans">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Images</label>
            <button
              onClick={() => {
                const url = prompt('Paste an image URL for this product:');
                if (url) setImage(url);
              }}
              className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 hover:border-purple-300 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-purple-500 transition-colors cursor-pointer overflow-hidden outline-none"
            >
              {image ? (
                <img src={image} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <>
                  <ImageIcon className="w-4 h-4" />
                  <span className="text-[9px] font-bold">Tap to add photo</span>
                </>
              )}
            </button>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. iPhone 15 Pro Max"
              className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-purple-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Category</label>
              <button
                onClick={() => setCategoryOpen(!categoryOpen)}
                className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer bg-white outline-none"
              >
                <span className={category ? 'text-slate-800' : 'text-slate-400'}>{category || 'Select Category'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
              {categoryOpen && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-slate-100 rounded-xl shadow-xl max-h-40 overflow-y-auto">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setCategory(c);
                        setCategoryOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-purple-50 hover:text-purple-600 cursor-pointer outline-none"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Condition</label>
              <button
                onClick={() => setConditionOpen(!conditionOpen)}
                className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer bg-white outline-none"
              >
                <span className="text-slate-800">{condition}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
              {conditionOpen && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-slate-100 rounded-xl shadow-xl">
                  {CONDITIONS.map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setCondition(c);
                        setConditionOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-purple-50 hover:text-purple-600 cursor-pointer outline-none"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Specs</label>
            <div className="grid grid-cols-3 gap-2">
              <input
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="Size"
                className="text-xs px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-purple-300"
              />
              <input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Color"
                className="text-xs px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-purple-300"
              />
              <input
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                type="number"
                min={1}
                placeholder="Qty"
                className="text-xs px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-purple-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Delivery Fee (₦)</label>
            <input
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(e.target.value)}
              type="number"
              placeholder="0"
              className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-purple-300"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Take-off Location</label>
            <input
              value={takeOffLocation}
              onChange={(e) => setTakeOffLocation(e.target.value)}
              placeholder="e.g. Ikeja, Lagos"
              className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-purple-300"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Price (₦)</label>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              type="number"
              placeholder="e.g. 850000"
              className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-purple-300"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Publish to</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 p-2.5 border border-slate-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={publishOpenMarket}
                  onChange={(e) => setPublishOpenMarket(e.target.checked)}
                  className="accent-purple-600 w-3.5 h-3.5"
                />
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-700">Open Market</span>
              </label>
              <label className="flex items-center gap-2 p-2.5 border border-slate-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={publishMyStore}
                  onChange={(e) => setPublishMyStore(e.target.checked)}
                  className="accent-purple-600 w-3.5 h-3.5"
                />
                <Store className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-700">My Store</span>
              </label>
              <label className="flex items-center gap-2 p-2.5 border border-slate-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={keepPrivate}
                  onChange={(e) => setKeepPrivate(e.target.checked)}
                  className="accent-purple-600 w-3.5 h-3.5"
                />
                <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-700">Keep Private</span>
              </label>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white px-4 py-3 border-t border-slate-100 space-y-2">
          {submitError && (
            <div className="p-2.5 bg-red-50 text-red-700 rounded-lg border border-red-100 text-[11px] font-sans font-semibold">
              {submitError}
            </div>
          )}
          <button
            onClick={handlePublish}
            disabled={!canPublish}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-sans font-bold text-xs rounded-xl transition-all cursor-pointer outline-none"
          >
            {isEditing ? 'Save Changes' : 'Publish Product'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}