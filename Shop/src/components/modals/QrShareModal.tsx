import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Download, Copy, Share2, Check,
  Store as StoreIcon, Package, User as UserIcon, Shield, MessageCircle
} from 'lucide-react';
import QRCode from 'qrcode';

export type QrShareKind = 'trader' | 'store' | 'product' | 'trade';

export interface QrShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  kind: QrShareKind;
  title: string;
  subtitle?: string;
  url: string;
  imageUrl?: string | null;
  badgeText?: string;
}

const loadCanvasImage = (src: string): Promise<HTMLImageElement | null> =>
  new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });

const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
};

export default function QrShareModal({
  isOpen,
  onClose,
  kind,
  title,
  subtitle,
  url,
  imageUrl,
  badgeText,
}: QrShareModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!isOpen || !url) return;
    let cancelled = false;
    QRCode.toDataURL(url, {
      width: 560,
      margin: 2,
      // High ('H') error correction keeps the QR reliably scannable even with a centered photo/logo badge
      errorCorrectionLevel: 'H',
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((dataUrl) => {
        if (!cancelled) setQrDataUrl(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl('');
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, url]);

  const kindHeading =
    kind === 'trader'
      ? 'Scan to View Trader'
      : kind === 'store'
      ? 'Scan to Visit Store'
      : kind === 'trade'
      ? 'Scan to View Trade Escrow'
      : 'Scan to View Product';

  const defaultBadge =
    badgeText ||
    (kind === 'trader'
      ? 'TRADER'
      : kind === 'store'
      ? 'VERIFIED STORE'
      : kind === 'trade'
      ? 'ESCROW TRADE'
      : 'PRODUCT');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert(url);
    }
  };

  const handleWhatsAppShare = () => {
    const text = `Check out "${title}"${subtitle ? ` (${subtitle})` : ''} on ShopAffair:\n${url}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: `${title}${subtitle ? ` (${subtitle})` : ''} on ShopAffair`,
          url,
        });
        return;
      } catch {
        // user cancelled or unsupported
      }
    }
    handleCopy();
  };

  const handleDownloadCard = async () => {
    if (!qrDataUrl) return;
    setDownloading(true);
    try {
      const width = 760;
      const height = 1040;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Purple full background
      const grad = ctx.createLinearGradient(0, 130, 0, height);
      grad.addColorStop(0, '#7c3aed');
      grad.addColorStop(1, '#5b21b6');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Top white ShopAffair logo header bar
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, 130);

      const logoImg = await loadCanvasImage('/Image/logo.png');
      if (logoImg) {
        ctx.drawImage(logoImg, 44, 34, 62, 62);
      } else {
        ctx.fillStyle = '#7c3aed';
        drawRoundedRect(ctx, 44, 34, 62, 62, 16);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 34px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('S', 75, 65);
      }

      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 34px system-ui, -apple-system, sans-serif';
      ctx.fillText('ShopAffair', 124, 75);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#7c3aed';
      ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
      ctx.fillText(defaultBadge.toUpperCase(), width - 44, 73);

      // Headline on purple background
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 38px system-ui, -apple-system, sans-serif';
      ctx.fillText(kindHeading, width / 2, 206);

      // Center white QR container card
      const cardX = 95;
      const cardY = 248;
      const cardW = width - 190;
      const cardH = 650;
      ctx.fillStyle = '#ffffff';
      drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 34);
      ctx.fill();

      // QR code inside white card
      const qrSize = 440;
      const qrX = (width - qrSize) / 2;
      const qrY = cardY + 42;
      const qrImg = await loadCanvasImage(qrDataUrl);
      if (qrImg) {
        ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
      }

      // Centered photo/logo/product badge inside QR code (~18% of QR size)
      const badgeSize = 86;
      const badgeX = (width - badgeSize) / 2;
      const badgeY = qrY + (qrSize - badgeSize) / 2;
      ctx.save();
      ctx.fillStyle = '#ffffff';
      drawRoundedRect(ctx, badgeX - 7, badgeY - 7, badgeSize + 14, badgeSize + 14, 18);
      ctx.fill();
      drawRoundedRect(ctx, badgeX, badgeY, badgeSize, badgeSize, 14);
      ctx.clip();

      const loadedThumb = imageUrl ? await loadCanvasImage(imageUrl) : null;
      if (loadedThumb) {
        ctx.drawImage(loadedThumb, badgeX, badgeY, badgeSize, badgeSize);
      } else {
        ctx.fillStyle = '#f3e8ff';
        ctx.fillRect(badgeX, badgeY, badgeSize, badgeSize);
        ctx.fillStyle = '#7c3aed';
        ctx.font = 'bold 38px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText((title || 'S').charAt(0).toUpperCase(), width / 2, badgeY + badgeSize / 2);
      }
      ctx.restore();

      // Name + Store/Subtitle inside white card under QR
      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 30px system-ui, -apple-system, sans-serif';
      const displayTitle = title.length > 30 ? `${title.slice(0, 29)}…` : title;
      ctx.fillText(displayTitle, width / 2, qrY + qrSize + 56);

      if (subtitle) {
        ctx.fillStyle = '#64748b';
        ctx.font = '600 22px system-ui, -apple-system, sans-serif';
        const displaySub = subtitle.length > 38 ? `${subtitle.slice(0, 37)}…` : subtitle;
        ctx.fillText(displaySub, width / 2, qrY + qrSize + 96);
      }

      // Bottom scan footer on purple background
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
      ctx.fillText('Scan with Google Lens or Camera', width / 2, 974);

      const safeSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || kind;
      const link = document.createElement('a');
      link.download = `shopfair-${kind}-${safeSlug}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 12 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-100 relative"
          >
            {/* Top white ShopAffair logo bar */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-2">
                <img
                  src="/Image/logo.png"
                  alt="ShopAffair"
                  className="w-7 h-7 rounded-lg object-contain"
                />
                <span className="text-sm font-display font-bold text-slate-900">ShopAffair</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                  {defaultBadge}
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close QR card"
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Purple body with white rounded QR card */}
            <div className="bg-gradient-to-b from-purple-600 to-purple-800 px-5 pt-4 pb-5 text-center space-y-3">
              <h3 className="text-base font-display font-bold text-white tracking-tight">
                {kindHeading}
              </h3>

              <div className="bg-white rounded-2xl p-4 shadow-lg mx-auto">
                <div className="relative w-48 h-48 mx-auto">
                  {qrDataUrl ? (
                    <>
                      <img
                        src={qrDataUrl}
                        alt={`QR code for ${title}`}
                        className="w-full h-full rounded-lg"
                      />
                      {/* Centered avatar / store logo / product thumbnail inside QR */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-11 h-11 rounded-xl bg-white p-1 shadow-md border border-slate-100 overflow-hidden flex items-center justify-center">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={title}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-full h-full bg-purple-100 text-purple-700 rounded-lg flex items-center justify-center">
                              {kind === 'store' ? (
                                <StoreIcon className="w-5 h-5" />
                              ) : kind === 'product' ? (
                                <Package className="w-5 h-5" />
                              ) : kind === 'trade' ? (
                                <Shield className="w-5 h-5" />
                              ) : (
                                <UserIcon className="w-5 h-5" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                      Generating QR...
                    </div>
                  )}
                </div>

                {/* Title + Store / Subtitle inside white card below QR */}
                <div className="mt-3 pt-2.5 border-t border-slate-100">
                  <p className="text-sm font-display font-bold text-slate-900 leading-tight truncate">
                    {title}
                  </p>
                  {subtitle && (
                    <p className="text-[11px] font-sans font-medium text-slate-500 mt-0.5 truncate">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>

              {/* Share to WhatsApp Button */}
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="w-full py-2.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-sans font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-colors"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                Share to WhatsApp
              </button>

              {/* Additional Action buttons */}
              <div className="grid grid-cols-3 gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={handleDownloadCard}
                  disabled={!qrDataUrl || downloading}
                  className="py-2 px-1.5 bg-white hover:bg-purple-50 disabled:opacity-50 text-purple-700 rounded-xl text-[10px] font-sans font-bold flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  {downloading ? 'Saving...' : 'Save Card'}
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="py-2 px-1.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-[10px] font-sans font-bold flex items-center justify-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="py-2 px-1.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-[10px] font-sans font-bold flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  More Apps
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
