import React from 'react';

interface LogoProps {
  className?: string;
  size?: number | string;
}

export const AlBarakahLogo: React.FC<LogoProps> = ({ className = "w-14 h-14", size }) => {
  return (
    <div 
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
      style={size ? { width: size, height: size } : undefined}
    >
      <svg
        viewBox="0 0 500 500"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Exact gold gradients with metallic lighting & depth */}
          <linearGradient id="abGoldMain" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="18%" stopColor="#F59E0B" />
            <stop offset="45%" stopColor="#B45309" />
            <stop offset="70%" stopColor="#FBBF24" />
            <stop offset="90%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#92400E" />
          </linearGradient>

          <linearGradient id="abGoldLight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FEF3C7" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>

          <linearGradient id="abGoldArch" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="30%" stopColor="#F59E0B" />
            <stop offset="70%" stopColor="#B45309" />
            <stop offset="100%" stopColor="#FBBF24" />
          </linearGradient>

          <linearGradient id="abGoldChamfer" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#B45309" />
            <stop offset="50%" stopColor="#FDE68A" />
            <stop offset="100%" stopColor="#FEF9C3" />
          </linearGradient>
        </defs>

        {/* 1. Crescent Moon at Top Apex */}
        <path
          d="M242 38
             C264 38 282 52 286 72
             C287 77 287 83 285 88
             C283 94 279 99 274 102
             C260 114 239 116 223 108
             C206 100 196 83 197 65
             C198 56 202 48 208 42
             C212 39 217 36 222 34
             C213 45 212 60 219 72
             C227 84 241 89 254 85
             C264 82 271 73 272 63
             C272 55 268 47 261 42
             C255 38 249 37 242 38 Z"
          fill="url(#abGoldMain)"
        />

        {/* 2. Outer Pointed Mosque Arch */}
        <path
          d="M242 130
             L248 136
             C286 172 340 212 376 250
             L376 257
             C370 258 362 255 356 249
             C322 214 276 180 242 153
             C208 180 162 214 128 249
             C122 255 119 264 119 274
             L119 400
             L102 408
             L102 274
             C102 256 108 243 118 232
             C154 194 204 158 236 136
             L242 130 Z"
          fill="url(#abGoldArch)"
        />

        {/* 3. Inner Pointed Mosque Arch */}
        <path
          d="M242 190
             L247 195
             C269 215 292 235 308 252
             L296 261
             C281 246 262 229 242 213
             C222 229 203 246 188 261
             C174 275 166 291 166 310
             L166 358
             L151 366
             L151 310
             C151 285 162 264 178 248
             C196 230 219 210 237 195
             L242 190 Z"
          fill="url(#abGoldArch)"
        />

        {/* 4. The Letter "A" */}
        {/* Slanted upward diagonal leg of "A" */}
        <path
          d="M62 448
             L92 448
             L256 270
             L256 296
             L116 448
             L62 448 Z"
          fill="url(#abGoldMain)"
        />

        {/* Horizontal crossbar of "A" */}
        <path
          d="M168 392
             L234 392
             L234 412
             L150 412
             L168 392 Z"
          fill="url(#abGoldMain)"
        />

        {/* Right vertical leg/pillar of "A" */}
        <path
          d="M230 366
             L256 366
             L256 448
             L230 448
             L230 366 Z"
          fill="url(#abGoldMain)"
        />

        {/* 5. The Letter "B" */}
        {/* Left vertical spine of B */}
        <path
          d="M270 268
             L292 242
             L292 448
             L270 448
             L270 268 Z"
          fill="url(#abGoldMain)"
        />

        {/* 3D Chamfered facet on top-left of B */}
        <path
          d="M270 268
             L292 242
             L315 265
             L292 265
             Z"
          fill="url(#abGoldChamfer)"
        />

        {/* Complete Letter "B" Loops (Top Loop & Bottom Loop) */}
        <path
          d="M292 242
             L350 242
             C378 242 396 256 396 280
             C396 302 378 316 352 318
             C384 322 406 340 406 376
             C406 418 376 448 328 448
             L292 448
             L292 242 Z
             M314 264
             L314 298
             L346 298
             C362 298 374 291 374 280
             C374 269 362 264 346 264
             L314 264 Z
             M314 322
             L314 426
             L336 426
             C364 426 384 406 384 376
             C384 346 364 322 336 322
             L314 322 Z"
          fill="url(#abGoldMain)"
        />
      </svg>
    </div>
  );
};
