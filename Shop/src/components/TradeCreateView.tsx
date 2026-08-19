import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Image as ImageIcon, Trash2, ShieldCheck, MapPin, Truck, Sparkles, Upload, X, CheckCircle2 } from 'lucide-react';
import { TradeType, TradeCategory } from '../types';
import * as tradeService from '../services/TradeService';
import { uploadImage } from '../services/UploadService';

interface TradeCreateViewProps {
  onCancel: () => void;
  onSubmit: (payload: tradeService.CreateTradePayload) => Promise<void>;
  onDone: () => void;
}

export default function TradeCreateView({ onCancel, onSubmit, onDone }: TradeCreateViewProps) {
  const [tradeType, setTradeType] = useState<TradeType>(TradeType.SUPPLY);
  const [tradeCategory, setTradeCategory] = useState<TradeCategory>(TradeCategory.PHYSICAL);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [condition, setCondition] = useState('New');
  const [specs, setSpecs] = useState<Array<{ key: string; value: string }>>([
    { key: 'Size', value: '' },
    { key: 'Color', value: '' },
    { key: 'Qty', value: '' }
  ]);
  const [deliveryFee, setDeliveryFee] = useState('0');
  const [deliveryTime, setDeliveryTime] = useState('e.g. 2-3 days');
  const [takeOffLocation, setTakeOffLocation] = useState('e.g. Ikeja, Lagos');
  const [deliveryLocation, setDeliveryLocation] = useState('');

  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleAddSpec = () => setSpecs([...specs, { key: '', value: '' }]);
  const handleRemoveSpec = (index: number) => setSpecs(specs.filter((_, i) => i !== index));
  const handleSpecChange = (index: number, field: 'key' | 'value', val: string) => {
    const updated = [...specs];
    updated[index][field] = val;
    setSpecs(updated);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setSubmitError(null);

    try {
      const uploaded = await Promise.all(Array.from(files).map((file) => uploadImage(file)));
      setUploadedImages((prev) => [...prev, ...uploaded]);
    } catch (err) {
      console.error(err);
      setSubmitError('Image upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index: number) => setUploadedImages(uploadedImages.filter((_, i) => i !== index));

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;

    const specRecord: Record<string, string> = {};
    specs.forEach((item) => {
      if (item.key && item.value) specRecord[item.key] = item.value;
    });

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await onSubmit({
        title,
        description: description || `Trade listing for ${title}`,
        amount: parseFloat(amount),
        type: tradeType,
        category: tradeCategory,
        condition,
        specs: specRecord,
        deliveryFee: parseFloat(deliveryFee) || 0,
        deliveryTime,
        takeOffLocation,
        deliveryLocation,
        image: uploadedImages.length > 0 ? uploadedImages[0] : undefined
      });
      setIsSubmitting(false);
      setShowSuccessModal(true);
    } catch (err) {
      console.error(err);
      setSubmitError('Could not create trade. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleFormSubmit} className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="sticky top-0 bg-white z-10 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-display font-bold text-slate-900">Create Trade</h2>
        <div className="w-8 h-8" />
      </div>

      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
        className="flex-1 overflow-y-auto px-5 py-4 space-y-5 no-scrollbar pb-28 bg-slate-50/50"
      >
        <motion.div
          variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
          className="grid grid-cols-2 gap-2 bg-slate-100/70 p-1.5 rounded-lg border border-slate-200/40"
        >
          <button
            type="button"
            onClick={() => setTradeType(TradeType.SUPPLY)}
            className={`py-2 text-xs font-sans font-bold rounded-md transition-all cursor-pointer ${
              tradeType === TradeType.SUPPLY ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'
            }`}
          >
            Purchase Order
          </button>
          <button
            type="button"
            onClick={() => setTradeType(TradeType.REQUEST)}
            className={`py-2 text-xs font-sans font-bold rounded-md transition-all cursor-pointer ${
              tradeType === TradeType.REQUEST ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'
            }`}
          >
            Sales Order
          </button>
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
          className="grid grid-cols-3 gap-2 bg-slate-100/70 p-1.5 rounded-lg border border-slate-200/40"
        >
          <button
            type="button"
            onClick={() => setTradeCategory(TradeCategory.PHYSICAL)}
            className={`py-2 text-[10px] font-sans font-bold rounded-md transition-all cursor-pointer ${
              tradeCategory === TradeCategory.PHYSICAL ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'
            }`}
          >
            Physical Product
          </button>
          <button
            type="button"
            onClick={() => setTradeCategory(TradeCategory.DIGITAL)}
            className={`py-2 text-[10px] font-sans font-bold rounded-md transition-all cursor-pointer ${
              tradeCategory === TradeCategory.DIGITAL ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'
            }`}
          >
            Digital Asset
          </button>
          <button
            type="button"
            onClick={() => setTradeCategory(TradeCategory.SERVICE)}
            className={`py-2 text-[10px] font-sans font-bold rounded-md transition-all cursor-pointer ${
              tradeCategory === TradeCategory.SERVICE ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'
            }`}
          >
            Service
          </button>
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
          <span className="block text-xs font-sans font-bold text-slate-500 uppercase mb-2">Images</span>
          <div className="grid grid-cols-3 gap-2">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square bg-white border-2 border-dashed border-slate-200 hover:border-purple-300 rounded-lg flex flex-col items-center justify-center text-slate-400 gap-1 cursor-pointer hover:bg-slate-50/50 transition-all relative"
            >
              {isUploading ? (
                <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span className="text-[9px] font-sans">Tap to upload</span>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {uploadedImages.map((img, index) => (
              <div key={index} className="aspect-square bg-slate-50 border border-slate-100 rounded-lg relative overflow-hidden group">
                <img src={img} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            {uploadedImages.length < 2 && (
              <div className="aspect-square bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-slate-300">
                <ImageIcon className="w-6 h-6" />
              </div>
            )}
            {uploadedImages.length < 1 && (
              <div className="aspect-square bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-slate-300">
                <ImageIcon className="w-6 h-6" />
              </div>
            )}
          </div>
          {uploadedImages.length > 0 && (
            <p className="text-[8px] text-slate-400 mt-1">{uploadedImages.length} image(s) uploaded</p>
          )}
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }} className="space-y-4">
          <div>
            <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-500 mb-1.5">Trade Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. iPhone 15 Pro Max 256GB"
              className="w-full font-sans text-sm px-4 py-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/15 focus:border-purple-600 transition-all shadow-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-500 mb-1.5">Amount (₦)</label>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 910000"
                className="w-full font-sans text-sm px-4 py-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/15 focus:border-purple-600 transition-all shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-500 mb-1.5">Item Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full font-sans text-sm px-4 py-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/15 focus:border-purple-600 transition-all shadow-xs"
              >
                <option value="New">New</option>
                <option value="Like New">Like New</option>
                <option value="Gently Used">Gently Used</option>
                <option value="Fair">Fair</option>
              </select>
            </div>
          </div>
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }} className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="block text-xs font-sans font-bold text-slate-500 uppercase">Specs</span>
            <button
              type="button"
              onClick={handleAddSpec}
              className="text-xs font-sans font-bold text-purple-600 hover:text-purple-700 flex items-center gap-0.5 cursor-pointer"
            >
              + Add Spec
            </button>
          </div>

          <div className="space-y-2">
            {specs.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Size, Color, etc."
                  value={item.key}
                  onChange={(e) => handleSpecChange(index, 'key', e.target.value)}
                  className="flex-1 font-sans text-xs px-3 py-2 bg-white border border-slate-200 rounded-md focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={item.value}
                  onChange={(e) => handleSpecChange(index, 'value', e.target.value)}
                  className="flex-1 font-sans text-xs px-3 py-2 bg-white border border-slate-200 rounded-md focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveSpec(index)}
                  className="p-1.5 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }} className="space-y-4 border-t border-slate-200/60 pt-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-500 mb-1.5">Delivery Fee (₦)</label>
              <div className="relative">
                <input
                  type="number"
                  required
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(e.target.value)}
                  placeholder="0"
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/15 focus:border-purple-600 transition-all shadow-xs"
                />
                <Truck className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-500 mb-1.5">Delivery Time</label>
              <input
                type="text"
                required
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                placeholder="e.g. 2-3 days"
                className="w-full font-sans text-sm px-4 py-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/15 focus:border-purple-600 transition-all shadow-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-500 mb-1.5">Take-off Location</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={takeOffLocation}
                  onChange={(e) => setTakeOffLocation(e.target.value)}
                  placeholder="e.g. Ikeja, Lagos"
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/15 focus:border-purple-600 transition-all shadow-xs"
                />
                <MapPin className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-500 mb-1.5">Delivery Destination</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={deliveryLocation}
                  onChange={(e) => setDeliveryLocation(e.target.value)}
                  placeholder="e.g. Lekki, Lagos"
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/15 focus:border-purple-600 transition-all shadow-xs"
                />
                <MapPin className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
          className="p-3 bg-purple-50 text-purple-800 rounded-lg border border-purple-100 flex items-start gap-2.5"
        >
          <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0 mt-0.5 animate-pulse" />
          <p className="text-[10px] font-sans leading-relaxed">
            As a verified trader on ShopAffair, your trade operates under multi-sig cryptographic protection. Buyers can check details and lock funds prior to inspection periods.
          </p>
        </motion.div>

        {submitError && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-100 text-xs font-sans font-semibold">
            {submitError}
          </div>
        )}
      </motion.div>

      <div className="sticky bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-sans font-bold text-sm rounded-lg shadow-lg shadow-purple-100 transition-colors cursor-pointer flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4 fill-white" /> {isSubmitting ? 'Creating...' : 'Create Market Trade'}
        </motion.button>
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl flex flex-col items-center text-center"
          >
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-base font-display font-bold text-slate-900 mb-1">Trade Created!</h3>
            <p className="text-xs font-sans text-slate-500 mb-6">
              "{title}" has been posted{tradeType === TradeType.SUPPLY && uploadedImages.length > 0 ? ' and is now visible on the Market too' : ''}.
            </p>
            <button
              type="button"
              onClick={onDone}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-sans font-bold text-sm rounded-lg transition-colors cursor-pointer"
            >
              Done
            </button>
          </motion.div>
        </div>
      )}
    </form>
  );
}