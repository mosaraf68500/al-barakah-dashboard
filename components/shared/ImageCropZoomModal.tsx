'use client';

import { SafeImage } from '@/components/shared/SafeImage';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Move, Check, X, Crop, RefreshCw } from 'lucide-react';

interface ImageCropZoomModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onApply: (croppedDataUrl: string) => void;
  aspectRatio?: number; // width / height, default 1:1
  outputWidth?: number; // default 700
  outputHeight?: number; // default 700
  title?: string;
}

export const ImageCropZoomModal: React.FC<ImageCropZoomModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onApply,
  aspectRatio = 1,
  outputWidth = 700,
  outputHeight = 700,
  title = 'ছবির পজিশন, জুম ও ক্রপ অ্যাডজাস্ট করুন'
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Reset state when a new image is loaded
  useEffect(() => {
    if (isOpen && imageSrc) {
      setZoom(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
      setImageLoaded(false);

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imageRef.current = img;
        setImageLoaded(true);
      };
      img.src = imageSrc;
    }
  }, [isOpen, imageSrc]);

  // Handle Drag / Pan (Mouse)
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - offset.x,
      y: e.clientY - offset.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle Drag / Pan (Touch)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - offset.x,
        y: e.touches[0].clientY - offset.y
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setOffset({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.002;
    setZoom((prev) => Math.min(Math.max(0.8, prev + delta), 4));
  };

  // Rotate clockwise by 90deg
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Reset to default
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  };

  // Export cropped canvas
  const handleExportCropped = useCallback(() => {
    if (!imageRef.current || !containerRef.current) return;

    const img = imageRef.current;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();

    const canvas = document.createElement('canvas');
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill background with clean white for JPEG
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, outputWidth, outputHeight);

    // Canvas center
    ctx.save();
    ctx.translate(outputWidth / 2, outputHeight / 2);
    ctx.rotate((rotation * Math.PI) / 180);

    // Scale calculation: how viewport relates to output canvas
    const scaleRatio = outputWidth / rect.width;
    
    // Scale the context based on user zoom and container-to-output scale
    const baseFitScale = Math.max(rect.width / img.naturalWidth, rect.height / img.naturalHeight);
    const finalScale = baseFitScale * zoom * scaleRatio;

    // Translation adjusted for rotation
    let drawX = offset.x * scaleRatio;
    let drawY = offset.y * scaleRatio;

    if (rotation === 90) {
      const temp = drawX;
      drawX = drawY;
      drawY = -temp;
    } else if (rotation === 180) {
      drawX = -drawX;
      drawY = -drawY;
    } else if (rotation === 270) {
      const temp = drawX;
      drawX = -drawY;
      drawY = temp;
    }

    ctx.translate(drawX, drawY);

    const drawW = img.naturalWidth * finalScale;
    const drawH = img.naturalHeight * finalScale;

    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    const croppedResult = canvas.toDataURL('image/jpeg', 0.85);
    onApply(croppedResult);
    onClose();
  }, [offset, zoom, rotation, outputWidth, outputHeight, onApply, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3 border-b border-stone-100 flex items-center justify-between bg-stone-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#0a5c36] flex items-center justify-center">
              <Crop className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-stone-900 leading-tight">
                {title}
              </h3>
              <p className="text-[10px] text-stone-500">
                ছবি টেনে মাঝখানে আনুন এবং জুম ইন/আউট করুন
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:bg-stone-200 hover:text-stone-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body / Viewport - Scrollable if screen height is small */}
        <div className="p-3 sm:p-4 flex flex-col items-center gap-3 select-none overflow-y-auto flex-1">
          {/* Cropping Viewport Container */}
          <div style={{ aspectRatio: String(aspectRatio) }}
            className="relative w-full max-w-[260px] sm:max-w-[300px] bg-stone-900 rounded-2xl overflow-hidden border-2 border-dashed border-emerald-500 shadow-inner flex items-center justify-center">
            {/* Guide Grid overlay */}
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 z-10 opacity-30 border border-white/20">
              <div className="border-r border-b border-white/40" />
              <div className="border-r border-b border-white/40" />
              <div className="border-b border-white/40" />
              <div className="border-r border-b border-white/40" />
              <div className="border-r border-b border-white/40" />
              <div className="border-b border-white/40" />
              <div className="border-r border-white/40" />
              <div className="border-r border-white/40" />
              <div />
            </div>

            {/* Hint Badge */}
            <div className="absolute top-2 left-2 z-20 pointer-events-none bg-stone-950/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-xs">
              <Move className="w-2.5 h-2.5 text-emerald-400" />
              <span>ড্র্যাগ করে বসান</span>
            </div>

            {/* Current Zoom Badge */}
            <div className="absolute top-2 right-2 z-20 pointer-events-none bg-stone-950/70 text-amber-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-xs">
              {Math.round(zoom * 100)}%
            </div>

            {/* Interactive Image Container */}
            <div
              ref={containerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onWheel={handleWheel}
              className="w-full h-full cursor-grab active:cursor-grabbing flex items-center justify-center relative touch-none"
            >
              {imageSrc && (
                <SafeImage
                  src={imageSrc}
                  alt="Crop preview"
                  draggable={false}
                  referrerPolicy="no-referrer"
                  style={{
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                    transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    userSelect: 'none'
                  }}
                  className="pointer-events-none"
                />
              )}
            </div>
          </div>

          {/* Controls Bar */}
          <div className="w-full max-w-[340px] space-y-3 bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
            {/* Zoom Slider Control */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                <span className="flex items-center gap-1">
                  <ZoomIn className="w-3.5 h-3.5 text-[#0a5c36]" />
                  <span>জুম ইন / জুম আউট (Zoom)</span>
                </span>
                <span className="font-mono text-emerald-800 text-[11px] font-black">
                  {zoom.toFixed(2)}x
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.8, Number((z - 0.1).toFixed(2))))}
                  className="p-1.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 cursor-pointer active:scale-95 transition-transform shadow-2xs"
                  title="Zoom Out (-)"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>

                <input
                  type="range"
                  min="0.8"
                  max="3.5"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="flex-1 accent-[#0a5c36] cursor-pointer h-2 bg-stone-200 rounded-lg appearance-none"
                />

                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(3.5, Number((z + 0.1).toFixed(2))))}
                  className="p-1.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 cursor-pointer active:scale-95 transition-transform shadow-2xs"
                  title="Zoom In (+)"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Actions: Rotate, Center Reset, Presets */}
            <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-stone-200/80">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleRotate}
                  className="px-2.5 py-1.5 rounded-xl bg-white border border-stone-200 hover:bg-emerald-50 hover:text-emerald-800 text-stone-700 text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1 shadow-2xs"
                  title="Rotate 90 degrees"
                >
                  <RotateCw className="w-3 h-3 text-[#0a5c36]" />
                  <span>ঘুরান</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="px-2.5 py-1.5 rounded-xl bg-white border border-stone-200 hover:bg-stone-100 text-stone-600 text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1 shadow-2xs"
                  title="Reset position and zoom"
                >
                  <RefreshCw className="w-3 h-3 text-stone-500" />
                  <span>রিসেট</span>
                </button>
              </div>

              {/* Quick Zoom presets */}
              <div className="flex items-center gap-1">
                {[1.0, 1.5, 2.0].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setZoom(preset)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                      Math.abs(zoom - preset) < 0.05
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {preset}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Always Sticky and Guaranteed Visible */}
        <div className="px-4 sm:px-5 py-3 border-t border-stone-200 bg-stone-50/95 backdrop-blur-xs flex flex-wrap items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              // Directly use original without crop if user wants original
              if (imageSrc) {
                onApply(imageSrc);
                onClose();
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-semibold cursor-pointer transition-colors"
            title="কোনো ক্রপ না করেই আসল ছবিটি সরাসরি ব্যবহার করুন"
          >
            আসল ছবি রাখুন (Original)
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-100 text-stone-600 text-xs font-semibold cursor-pointer transition-colors"
            >
              বাতিল
            </button>

            <button
              id="btn-confirm-crop-image"
              type="button"
              onClick={handleExportCropped}
              className="px-5 py-2 rounded-xl bg-[#0a5c36] hover:bg-[#08482a] active:scale-95 text-white text-xs sm:text-sm font-bold shadow-md cursor-pointer transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 text-emerald-300" />
              <span>ছবি সেভ ও নিশ্চিত করুন (Save Photo)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
