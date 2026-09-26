'use client';

import { SafeImage } from '@/components/shared/SafeImage';
import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  Download,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  Printer,
  ShieldCheck,
  Layers,
  Palette,
  Eye,
  X,
  FileCode,
  Image as ImageIcon,
  CheckCircle2,
  Phone,
  Globe
} from 'lucide-react';
import { Product } from '@/types';
import { useToast } from '@/providers/ToastProvider';

interface QRCodeGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  defaultProduct?: Product | null;
  customDomain?: string;
}

export type LabelStyle = 'bottle_sticker' | 'minimal_qr' | 'premium_badge' | 'hanging_tag';

export const QRCodeGeneratorModal: React.FC<QRCodeGeneratorModalProps> = ({
  isOpen,
  onClose,
  products,
  defaultProduct = null,
  customDomain = 'https://albarakahpremium.com'
}) => {
  const showToast = useToast();

  // Preset Targets
  const mustardOilProduct = products.find(
    (p) =>
      p.id === 'prod-mustard-oil-5l' ||
      p.name.toLowerCase().includes('mustard') ||
      p.name.toLowerCase().includes('সরিষা')
  ) || products[0];

  const [selectedTargetType, setSelectedTargetType] = useState<'mustard_oil' | 'storefront' | 'product' | 'custom'>(
    defaultProduct ? 'product' : 'mustard_oil'
  );
  const [selectedProductId, setSelectedProductId] = useState<string>(
    defaultProduct ? defaultProduct.id : (mustardOilProduct?.id || '')
  );
  const [customUrl, setCustomUrl] = useState<string>('https://albarakahpremium.com/verify/mustard-oil');
  const [domainBase, setDomainBase] = useState<string>(customDomain || 'https://albarakahpremium.com');
  
  // Customization State
  const [labelStyle, setLabelStyle] = useState<LabelStyle>('bottle_sticker');
  const [qrColor, setQrColor] = useState<string>('#03251a'); // Dark Forest Green
  const [qrBgColor, setQrBgColor] = useState<string>('#ffffff');
  const [showCenterLogo, setShowCenterLogo] = useState<boolean>(true);
  const [brandTitle, setBrandTitle] = useState<string>('AL-BARAKAH PREMIUM');
  const [productTitle, setProductTitle] = useState<string>('১০০% খাঁটি কাঠের ঘানি ভাঙা দেশি সরিষার তেল');
  const [subText, setSubText] = useState<string>('Scan to Verify 100% Pure & Authentic Product');
  const [batchNo, setBatchNo] = useState<string>('BATCH-AB2026-MO');
  const [contactNo, setContactNo] = useState<string>('+880 1700-000000');
  const [includeBstiSeal, setIncludeBstiSeal] = useState<boolean>(true);
  const [qrResolution, setQrResolution] = useState<number>(1200); // 1200px print ready

  // Generated QR data URLs
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrSvgString, setQrSvgString] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const printContainerRef = useRef<HTMLDivElement | null>(null);

  // Compute Active URL
  const getActiveUrl = (): string => {
    const cleanDomain = domainBase.replace(/\/+$/, '');
    if (selectedTargetType === 'storefront') {
      return `${cleanDomain}/`;
    }
    if (selectedTargetType === 'mustard_oil') {
      const pId = mustardOilProduct?.id || 'prod-mustard-oil-5l';
      return `${cleanDomain}/?verify=${pId}#product-${pId}`;
    }
    if (selectedTargetType === 'product') {
      const p = products.find((x) => x.id === selectedProductId) || products[0];
      return `${cleanDomain}/?verify=${p?.id || 'product'}#product-${p?.id || ''}`;
    }
    return customUrl.trim() || cleanDomain;
  };

  // Sync selected product details when product or target type changes
  useEffect(() => {
    if (defaultProduct) {
      setSelectedTargetType('product');
      setSelectedProductId(defaultProduct.id);
      setProductTitle(defaultProduct.name);
      setSubText('Scan to Verify 100% Authentic Quality');
      setBatchNo(`BATCH-${defaultProduct.id.toUpperCase().slice(0, 10)}`);
    }
  }, [defaultProduct]);

  useEffect(() => {
    if (selectedTargetType === 'mustard_oil') {
      setProductTitle('১০০% খাঁটি কাঠের ঘানি ভাঙা দেশি সরিষার তেল');
      setSubText('Scan to Verify 100% Pure & Authentic Product');
      setBatchNo('BATCH-AB2026-MO');
    } else if (selectedTargetType === 'product') {
      const p = products.find((x) => x.id === selectedProductId);
      if (p) {
        setProductTitle(p.name);
        setSubText('Scan to Verify 100% Authentic Quality');
        setBatchNo(`BATCH-${p.id.toUpperCase().slice(0, 10)}`);
      }
    } else if (selectedTargetType === 'storefront') {
      setProductTitle('Al-Barakah Premium Official Store');
      setSubText('Scan to browse 100% Authentic & Halal Collection');
      setBatchNo('OFFICIAL-STORE');
    }
  }, [selectedTargetType, selectedProductId, products]);

  // Generate QR Code on any parameter change
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const generate = async () => {
      setIsGenerating(true);
      try {
        const targetUrl = getActiveUrl();

        // 1. Generate standard Data URL for PNG/Canvas
        const urlPng = await QRCode.toDataURL(targetUrl, {
          width: qrResolution,
          margin: 2,
          color: {
            dark: qrColor,
            light: qrBgColor
          },
          errorCorrectionLevel: 'H' // High recovery capacity for logo overlay
        });

        // 2. Generate SVG string
        const svgStr = await QRCode.toString(targetUrl, {
          type: 'svg',
          margin: 2,
          color: {
            dark: qrColor,
            light: qrBgColor
          },
          errorCorrectionLevel: 'H'
        });

        if (isMounted) {
          setQrDataUrl(urlPng);
          setQrSvgString(svgStr);
        }
      } catch (err) {
        if (isMounted) showToast(err instanceof Error ? err.message : 'QR কোড তৈরি করা যায়নি। আবার চেষ্টা করুন।', 'error');
      } finally {
        if (isMounted) setIsGenerating(false);
      }
    };

    generate();

    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedTargetType, selectedProductId, customUrl, domainBase, qrColor, qrBgColor, qrResolution]);

  if (!isOpen) return null;

  const currentUrl = getActiveUrl();

  // Copy Link Handler
  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download Standalone PNG
  const handleDownloadPng = () => {
    if (!qrDataUrl) return;

    // Create a temporary canvas if we need to overlay center logo
    if (showCenterLogo) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = qrResolution;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Draw Base QR
        ctx.drawImage(img, 0, 0, size, size);

        // Center Logo Circle & Sparkle/A-B Icon
        const centerSize = Math.round(size * 0.22);
        const centerPos = (size - centerSize) / 2;

        // White border circle
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, centerSize / 2 + size * 0.015, 0, 2 * Math.PI);
        ctx.fill();

        // Gold background circle
        ctx.fillStyle = '#D4AF37';
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, centerSize / 2, 0, 2 * Math.PI);
        ctx.fill();

        // Dark green inner circle
        ctx.fillStyle = '#03251a';
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, centerSize / 2 - size * 0.01, 0, 2 * Math.PI);
        ctx.fill();

        // Center text "AB" / "AL BARAKAH"
        ctx.fillStyle = '#D4AF37';
        ctx.font = `bold ${Math.round(size * 0.08)}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('AB', size / 2, size / 2);

        // Download trigger
        const finalUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `albarakah-qr-${selectedTargetType}-${Date.now()}.png`;
        link.href = finalUrl;
        link.click();
      };
      img.src = qrDataUrl;
    } else {
      const link = document.createElement('a');
      link.download = `albarakah-qr-${selectedTargetType}-${Date.now()}.png`;
      link.href = qrDataUrl;
      link.click();
    }
  };

  // Download Complete Bottle Sticker (Print Ready Canvas)
  const handleDownloadFullSticker = () => {
    const stickerCanvas = document.createElement('canvas');
    const width = 1200;
    const height = 1600;
    stickerCanvas.width = width;
    stickerCanvas.height = height;
    const ctx = stickerCanvas.getContext('2d');
    if (!ctx) return;

    // Background - Dark Forest Green
    ctx.fillStyle = '#03251a';
    ctx.fillRect(0, 0, width, height);

    // Gold Decorative Border
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 14;
    ctx.strokeRect(30, 30, width - 60, height - 60);

    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2;
    ctx.strokeRect(45, 45, width - 90, height - 90);

    // Header Tag
    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('★ 100% PURE & AUTHENTIC GUARANTEE ★', width / 2, 120);

    // Brand Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 64px serif';
    ctx.fillText(brandTitle, width / 2, 210);

    // Divider Line
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 250, 240);
    ctx.lineTo(width / 2 + 250, 240);
    ctx.stroke();

    // Product Title
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 42px sans-serif';
    ctx.fillText(productTitle.slice(0, 45), width / 2, 310);

    // White Card for QR Code
    const qrCardSize = 720;
    const qrCardX = (width - qrCardSize) / 2;
    const qrCardY = 370;

    ctx.fillStyle = '#ffffff';
    ctx.roundRect(qrCardX, qrCardY, qrCardSize, qrCardSize + 130, 30);
    ctx.fill();

    // Draw QR Code onto card
    const qrImg = new Image();
    qrImg.crossOrigin = 'anonymous';
    qrImg.onload = () => {
      ctx.drawImage(qrImg, qrCardX + 50, qrCardY + 40, qrCardSize - 100, qrCardSize - 100);

      // QR Center Logo
      if (showCenterLogo) {
        const cX = width / 2;
        const cY = qrCardY + 40 + (qrCardSize - 100) / 2;
        const cR = 60;

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cX, cY, cR + 8, 0, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = '#03251a';
        ctx.beginPath();
        ctx.arc(cX, cY, cR, 0, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = '#D4AF37';
        ctx.font = 'bold 46px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('AB', cX, cY);
      }

      // Instruction Text under QR inside white card
      ctx.fillStyle = '#03251a';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('মোবাইল ক্যামেরা দিয়ে স্ক্যান করুন', width / 2, qrCardY + qrCardSize - 20);

      ctx.fillStyle = '#059669';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('✓ আসল ও খাঁটি পণ্য তাৎক্ষণিক যাচাই', width / 2, qrCardY + qrCardSize + 25);

      ctx.fillStyle = '#64748b';
      ctx.font = '22px sans-serif';
      ctx.fillText(subText, width / 2, qrCardY + qrCardSize + 65);

      // Bottom Metadata Section
      ctx.fillStyle = '#D4AF37';
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`WEB: ${domainBase.replace(/^https?:\/\//, '')}`, width / 2, 1320);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '24px sans-serif';
      ctx.fillText(`ব্যাচ নম্বর: ${batchNo} | হেল্পলাইন: ${contactNo}`, width / 2, 1370);

      // BSTI & Halal Badge text
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText('★ BSTI & ল্যাব টেস্টে ১০০% খাঁটি প্রমাণিত ★', width / 2, 1440);

      ctx.fillStyle = '#6ee7b7';
      ctx.font = '20px sans-serif';
      ctx.fillText('কোল্ড-প্রেসড কাঠের ঘানি ভাঙা প্রাকৃতিক সরিষার তেল', width / 2, 1480);

      // Download
      const link = document.createElement('a');
      link.download = `albarakah-bottle-sticker-${Date.now()}.png`;
      link.href = stickerCanvas.toDataURL('image/png');
      link.click();
    };
    qrImg.src = qrDataUrl;
  };

  // Download SVG
  const handleDownloadSvg = () => {
    if (!qrSvgString) return;
    const blob = new Blob([qrSvgString], { type: 'image/svg+xml;charset=utf-8' });
    const link = document.createElement('a');
    link.download = `albarakah-qr-${selectedTargetType}-${Date.now()}.svg`;
    link.href = URL.createObjectURL(blob);
    link.click();
  };

  // Print Sticker
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col border border-stone-200 overflow-hidden my-auto">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#03251a] text-white flex items-center justify-between border-b border-emerald-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37] flex items-center justify-center text-stone-950 font-black shadow-md shrink-0">
              <QrCode className="w-6 h-6 text-stone-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#D4AF37] uppercase tracking-wider font-serif">
                  Official QR Code & Bottle Sticker Studio
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Print Ready (HD)
                </span>
              </div>
              <p className="text-xs text-stone-300">
                সরিষার তেলের বোতলের স্টিকার ও প্রোডাক্ট অথেন্টিসিটি ভেরিফিকেশন QR কোড জেনারেটর
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-2 rounded-full hover:bg-emerald-900/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - 2 Columns */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#f8fafc]">
          
          {/* LEFT COLUMN: Controls & Settings (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* 1. Target URL Type Selection */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
              <label className="text-xs font-black text-stone-700 uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-700" />
                ১. কিউআর কোডের গন্তব্য (QR Target Destination)
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTargetType('mustard_oil')}
                  className={`p-3 rounded-xl text-left border transition-all ${
                    selectedTargetType === 'mustard_oil'
                      ? 'bg-emerald-900 text-white border-emerald-950 ring-2 ring-emerald-600 shadow-sm'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                  }`}
                >
                  <div className="text-xs font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                    সরিষার তেল
                  </div>
                  <div className="text-[10px] opacity-80 mt-0.5">Mustard Oil Bottle</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTargetType('storefront')}
                  className={`p-3 rounded-xl text-left border transition-all ${
                    selectedTargetType === 'storefront'
                      ? 'bg-emerald-900 text-white border-emerald-950 ring-2 ring-emerald-600 shadow-sm'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                  }`}
                >
                  <div className="text-xs font-bold">মূল ওয়েবসাইট</div>
                  <div className="text-[10px] opacity-80 mt-0.5">Main Storefront</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTargetType('product')}
                  className={`p-3 rounded-xl text-left border transition-all ${
                    selectedTargetType === 'product'
                      ? 'bg-emerald-900 text-white border-emerald-950 ring-2 ring-emerald-600 shadow-sm'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                  }`}
                >
                  <div className="text-xs font-bold">নির্দিষ্ট পণ্য</div>
                  <div className="text-[10px] opacity-80 mt-0.5">Other Products</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTargetType('custom')}
                  className={`p-3 rounded-xl text-left border transition-all ${
                    selectedTargetType === 'custom'
                      ? 'bg-emerald-900 text-white border-emerald-950 ring-2 ring-emerald-600 shadow-sm'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                  }`}
                >
                  <div className="text-xs font-bold">কাস্টম লিংক</div>
                  <div className="text-[10px] opacity-80 mt-0.5">Custom URL</div>
                </button>
              </div>

              {/* Conditional Inputs */}
              {selectedTargetType === 'product' && (
                <div className="pt-2">
                  <label className="text-[11px] font-bold text-stone-600 block mb-1">
                    পণ্য নির্বাচন করুন (Select Product):
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700 outline-none"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.category}) - ৳{p.price}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedTargetType === 'custom' && (
                <div className="pt-2">
                  <label className="text-[11px] font-bold text-stone-600 block mb-1">
                    আপনার কাঙ্ক্ষিত লিংক (Destination URL):
                  </label>
                  <input
                    type="url"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://albarakahpremium.com/..."
                    className="w-full px-3 py-2 text-xs font-mono bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700 outline-none"
                  />
                </div>
              )}

              {/* Domain Config Bar */}
              <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-emerald-50/70 p-3 rounded-xl border border-emerald-200/60 text-xs">
                <div className="flex-1">
                  <span className="font-bold text-emerald-950">অফিসিয়াল ডোমেইন: </span>
                  <input
                    type="text"
                    value={domainBase}
                    onChange={(e) => setDomainBase(e.target.value)}
                    className="ml-1 px-2 py-1 bg-white border border-emerald-300 rounded text-emerald-900 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 w-52"
                    placeholder="https://albarakahpremium.com"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg font-bold text-[11px] transition-colors shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                </button>
              </div>

              <div className="text-[11px] font-mono text-stone-500 truncate bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200">
                <span className="text-stone-400 font-sans">Full Link: </span>{currentUrl}
              </div>
            </div>

            {/* 2. Sticker & Label Text Customization */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
              <label className="text-xs font-black text-stone-700 uppercase tracking-wider flex items-center gap-2">
                <Palette className="w-4 h-4 text-emerald-700" />
                ২. স্টিকার ও টেক্সট কাস্টমাইজেশন (Label Text & Badge)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-stone-600 block mb-1">
                    ব্র্যান্ডের নাম (Brand Name):
                  </label>
                  <input
                    type="text"
                    value={brandTitle}
                    onChange={(e) => setBrandTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-600 block mb-1">
                    ব্যাচ নম্বর (Batch Number):
                  </label>
                  <input
                    type="text"
                    value={batchNo}
                    onChange={(e) => setBatchNo(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700 outline-none font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-stone-600 block mb-1">
                    পণ্যের নাম / লেবেল টেক্সট (Product Title):
                  </label>
                  <input
                    type="text"
                    value={productTitle}
                    onChange={(e) => setProductTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-600 block mb-1">
                    নির্দেশনা টেক্সট (Scan Subtext):
                  </label>
                  <input
                    type="text"
                    value={subText}
                    onChange={(e) => setSubText(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-600 block mb-1">
                    কাস্টমার কেয়ার ফোন (Helpline):
                  </label>
                  <input
                    type="text"
                    value={contactNo}
                    onChange={(e) => setContactNo(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700 outline-none"
                  />
                </div>
              </div>

              {/* Color & Logo Toggles */}
              <div className="pt-2 grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-stone-100">
                <div>
                  <label className="text-[11px] font-bold text-stone-600 block mb-1">
                    কিউআর কালার (QR Color):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={qrColor}
                      onChange={(e) => setQrColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-stone-300 p-0.5"
                    />
                    <span className="text-xs font-mono text-stone-600">{qrColor}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="centerLogoToggle"
                    checked={showCenterLogo}
                    onChange={(e) => setShowCenterLogo(e.target.checked)}
                    className="w-4 h-4 text-emerald-700 rounded focus:ring-emerald-600"
                  />
                  <label htmlFor="centerLogoToggle" className="text-xs font-bold text-stone-700 cursor-pointer">
                    মাঝখানে AB লোগো দেখান
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="bstiSealToggle"
                    checked={includeBstiSeal}
                    onChange={(e) => setIncludeBstiSeal(e.target.checked)}
                    className="w-4 h-4 text-emerald-700 rounded focus:ring-emerald-600"
                  />
                  <label htmlFor="bstiSealToggle" className="text-xs font-bold text-stone-700 cursor-pointer">
                    BSTI / ল্যাব টেস্ট সিল
                  </label>
                </div>
              </div>
            </div>

            {/* 3. Action Buttons / Downloads */}
            <div className="bg-emerald-950 p-4 sm:p-5 rounded-2xl text-white space-y-3 shadow-md border border-emerald-900">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-[#D4AF37] uppercase tracking-wider flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    প্রিন্ট ও ডাউনলোড অপশন (Print & Download Ready)
                  </h3>
                  <p className="text-xs text-stone-300">
                    স্টিকার প্রেসে দেওয়ার জন্য ভেক্টর (SVG) বা আল্ট্রা-এইচডি (PNG) ফরম্যাটে ডাউনলোড করুন
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                {/* 1. Complete Bottle Sticker PNG */}
                <button
                  type="button"
                  onClick={handleDownloadFullSticker}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-[#D4AF37] hover:bg-[#c59f2e] text-stone-950 font-black text-xs rounded-xl shadow-md transition-transform active:scale-95 cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>সম্পূর্ণ বোতলের স্টিকার (PNG)</span>
                </button>

                {/* 2. Standalone QR PNG */}
                <button
                  type="button"
                  onClick={handleDownloadPng}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl border border-emerald-600 transition-all cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  <span>শুধুমাত্র QR কোড (PNG HD)</span>
                </button>

                {/* 3. SVG Vector for Press */}
                <button
                  type="button"
                  onClick={handleDownloadSvg}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-stone-900 hover:bg-stone-800 text-stone-200 font-bold text-xs rounded-xl border border-stone-700 transition-all cursor-pointer"
                >
                  <FileCode className="w-4 h-4 text-amber-400" />
                  <span>ভেক্টর ফাইল (SVG Vector)</span>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Realtime Visual Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col items-center">
              <div className="w-full flex items-center justify-between pb-3 border-b border-stone-100">
                <span className="text-xs font-black text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-emerald-700" />
                  লাইভ স্টিকার প্রিভিউ (Live Preview)
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Ready to Print
                </span>
              </div>

              {/* BOTTLE STICKER CARD PREVIEW */}
              <div 
                ref={printContainerRef}
                className="mt-4 w-full max-w-[340px] bg-[#03251a] text-white p-5 rounded-2xl border-4 border-[#D4AF37] shadow-xl relative overflow-hidden flex flex-col items-center text-center space-y-3"
              >
                {/* Top Corner Accents */}
                <div className="absolute top-2 left-2 text-[9px] text-[#D4AF37] font-serif">⚜</div>
                <div className="absolute top-2 right-2 text-[9px] text-[#D4AF37] font-serif">⚜</div>

                {/* Header Guarantee */}
                <div className="text-[9px] font-bold tracking-widest text-[#D4AF37] uppercase">
                  ★ 100% PURE & AUTHENTIC ★
                </div>

                {/* Brand Logo & Name */}
                <div className="space-y-0.5">
                  <h4 
                    className="text-base font-black text-white tracking-widest font-serif"
                    style={{ fontFamily: "'Cinzel', Georgia, serif" }}
                  >
                    {brandTitle}
                  </h4>
                  <div className="w-16 h-0.5 bg-[#D4AF37] mx-auto"></div>
                </div>

                {/* Product Name */}
                <p className="text-xs font-bold text-amber-200 leading-snug px-2">
                  {productTitle}
                </p>

                {/* QR Code Container with White Frame */}
                <div className="bg-white p-3.5 rounded-xl shadow-lg border-2 border-amber-300/40 relative">
                  {qrDataUrl ? (
                    <div className="relative">
                      <SafeImage
                        src={qrDataUrl}
                        alt="Product Verification QR Code"
                        className="w-44 h-44 object-contain mx-auto"
                      />
                      {showCenterLogo && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-11 h-11 rounded-full bg-[#03251a] border-2 border-[#D4AF37] shadow-md flex items-center justify-center text-[#D4AF37] font-black text-xs font-serif">
                            AB
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-44 h-44 bg-stone-100 flex items-center justify-center text-xs text-stone-400">
                      Generating...
                    </div>
                  )}

                  <div className="mt-2 text-[10px] font-bold text-[#03251a]">
                    মোবাইল ক্যামেরা দিয়ে স্ক্যান করুন
                  </div>
                </div>

                {/* Authenticity Message */}
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-emerald-300 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>১০০% খাঁটি পণ্য যাচাই করুন</span>
                  </div>
                  <p className="text-[9px] text-stone-300 leading-tight max-w-[240px]">
                    {subText}
                  </p>
                </div>

                {/* Bottom Footer Details */}
                <div className="pt-2 border-t border-emerald-900/80 w-full text-[9px] text-stone-400 space-y-0.5">
                  <div className="font-mono text-[#D4AF37]">
                    {domainBase.replace(/^https?:\/\//, '')}
                  </div>
                  <div>
                    ব্যাচ: <span className="font-mono text-stone-300">{batchNo}</span>
                  </div>
                  {includeBstiSeal && (
                    <div className="text-emerald-400 font-bold">
                      ✓ BSTI & ল্যাব টেস্টে খাঁটি প্রমাণিত
                    </div>
                  )}
                </div>
              </div>

              {/* Instruction Note */}
              <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 text-left space-y-1 w-full">
                <div className="font-bold flex items-center gap-1.5 text-amber-950">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  কীভাবে স্টিকারে বসাবেন?
                </div>
                <p className="text-[10px] text-amber-800 leading-relaxed">
                  ১. উপরে থাকা <strong>"সম্পূর্ণ বোতলের স্টিকার (PNG)"</strong> বাটনে ক্লিক করে ছবিটি সেভ করুন।
                  <br />
                  ২. অথবা <strong>"ভেক্টর ফাইল (SVG)"</strong> ডাউনলোড করে আপনার গ্রাফিক্স ডিজাইনার বা প্রিন্টিং প্রেসকে দিন।
                  <br />
                  ৩. ডোমেইন পরিবর্তন করতে চাইলে অফিসিয়াল ডোমেইন বক্সে আপনার লিংক বসিয়ে ডাউনলোড করুন।
                </p>
              </div>

            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-stone-100 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Al-Barakah Premium Security & Product Authenticity Verification System</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold rounded-lg transition-colors cursor-pointer"
          >
            বন্ধ করুন (Close)
          </button>
        </div>

      </div>
    </div>
  );
};
