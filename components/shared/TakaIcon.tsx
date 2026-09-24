import React from 'react';

interface TakaIconProps {
  className?: string;
  size?: number | string;
  color?: string;
}

/**
 * Authentic Bengali Taka (৳) Symbol Component matching Ghorer Bazar typography
 */
export const TakaIcon: React.FC<TakaIconProps> = ({ 
  className = "inline-block", 
  size, 
  color 
}) => {
  return (
    <span 
      className={`font-bengali font-bold select-none leading-none inline-flex items-center ${className}`}
      style={{
        fontSize: size ? (typeof size === 'number' ? `${size}px` : size) : undefined,
        color: color || undefined,
      }}
    >
      ৳
    </span>
  );
};

interface PriceTagProps {
  amount: number | string;
  originalAmount?: number | string;
  className?: string;
  takaClassName?: string;
  colorClass?: string;
  sizeClass?: string;
  showOriginal?: boolean;
}

export const PriceTag: React.FC<PriceTagProps> = ({
  amount,
  originalAmount,
  className = '',
  colorClass = 'text-[#f38018]',
  sizeClass = 'text-base font-bold',
  showOriginal = true,
}) => {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
  const numericOriginal = typeof originalAmount === 'string' ? parseFloat(originalAmount) || 0 : originalAmount;

  return (
    <div className={`inline-flex items-baseline gap-1.5 font-bengali ${className}`}>
      <span className={`${sizeClass} ${colorClass} tracking-tight select-none`}>
        ৳{numericAmount.toLocaleString()}
      </span>
      {showOriginal && numericOriginal && numericOriginal > numericAmount && (
        <span className="text-xs text-stone-400 line-through font-bengali select-none">
          ৳{numericOriginal.toLocaleString()}
        </span>
      )}
    </div>
  );
};

export default TakaIcon;

