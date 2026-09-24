export interface VariantOption {
  label: string;
  weightGrams?: number;
  multiplier?: number;
  explicitPrice?: number;
}

// Helper to parse weight or volume in grams or milliliters
function parseWeightValue(str: string): number | null {
  const lower = str.toLowerCase().trim();
  const kgMatch = lower.match(/^([\d.]+)\s*kg/);
  if (kgMatch) return parseFloat(kgMatch[1]) * 1000;

  const gmMatch = lower.match(/^([\d.]+)\s*(gm|g|gram|grams)/);
  if (gmMatch) return parseFloat(gmMatch[1]);

  const lMatch = lower.match(/^([\d.]+)\s*(l|litre|liter|ltr)/);
  if (lMatch) return parseFloat(lMatch[1]) * 1000;

  const mlMatch = lower.match(/^([\d.]+)\s*(ml|millilitre|milliliter)/);
  if (mlMatch) return parseFloat(mlMatch[1]);

  const pcsMatch = lower.match(/^([\d.]+)\s*(pcs|piece|pieces|pack)/);
  if (pcsMatch) return parseFloat(pcsMatch[1]) * 1000; // treat 1 pcs as 1000 base

  return null;
}

export function parseVariantOptions(sizes: string[]): VariantOption[] {
  if (!sizes || sizes.length === 0) return [];

  return sizes.map((s) => {
    const raw = s.trim();
    // Check if explicit price is in parentheses or dash e.g. "1kg (1200)" or "1kg - ৳1200"
    const priceMatch = raw.match(/[-—(]\s*[৳$]?\s*(\d[\d,]*)/);
    let explicitPrice: number | undefined;
    if (priceMatch) {
      explicitPrice = parseInt(priceMatch[1].replace(/,/g, ''), 10);
    }

    const weightGrams = parseWeightValue(raw);

    return {
      label: raw,
      weightGrams: weightGrams || undefined,
      explicitPrice
    };
  });
}

export function getCalculatedPrice(
  basePrice: number,
  baseVariantStr: string,
  selectedVariantStr?: string
): number {
  if (!selectedVariantStr || selectedVariantStr === baseVariantStr) {
    return basePrice;
  }

  // Check explicit price in selected string
  const selectedPriceMatch = selectedVariantStr.match(/[-—(]\s*[৳$]?\s*(\d[\d,]*)/);
  if (selectedPriceMatch) {
    return parseInt(selectedPriceMatch[1].replace(/,/g, ''), 10);
  }

  const baseWeight = parseWeightValue(baseVariantStr);
  const selectedWeight = parseWeightValue(selectedVariantStr);

  if (baseWeight && selectedWeight && baseWeight > 0) {
    const ratio = selectedWeight / baseWeight;
    // Calculate and round to nearest 5 or 10
    const calculated = Math.round((basePrice * ratio) / 5) * 5;
    return calculated;
  }

  // Fallback heuristics for common strings
  const selLower = selectedVariantStr.toLowerCase();
  const baseLower = (baseVariantStr || '').toLowerCase();

  if (selLower.includes('2kg') && (baseLower.includes('1kg') || !baseLower)) return basePrice * 2;
  if (selLower.includes('5kg') && baseLower.includes('1kg')) return basePrice * 5;
  if (selLower.includes('500g') && baseLower.includes('1kg')) return Math.round(basePrice * 0.5);
  if (selLower.includes('250g') && baseLower.includes('1kg')) return Math.round(basePrice * 0.26);
  if (selLower.includes('1kg') && baseLower.includes('500g')) return basePrice * 2;
  if (selLower.includes('2kg') && baseLower.includes('500g')) return basePrice * 4;

  return basePrice;
}
