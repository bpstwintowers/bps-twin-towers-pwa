import type { BuilderReview } from '../types/builderFeedback';

interface RenderCardOptions {
  theme?: 'google-light' | 'modern-dark' | 'gold-luxury';
  includePhotos?: boolean;
}

// Helper to draw rounded rectangle in Canvas
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Helper to wrap text cleanly
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number = 6
): number {
  const words = text.split(' ');
  let line = '';
  let currentY = y;
  let linesCount = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      if (linesCount >= maxLines - 1) {
        ctx.fillText(line.trim() + '...', x, currentY);
        return currentY + lineHeight;
      }
      ctx.fillText(line.trim(), x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
      linesCount++;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, currentY);
  return currentY + lineHeight;
}

// Helper to load image object from URL
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

export async function generateReviewCardCanvas(
  review: BuilderReview,
  options: RenderCardOptions = {}
): Promise<HTMLCanvasElement> {
  const { theme = 'google-light', includePhotos = true } = options;
  const canvas = document.createElement('canvas');
  const width = 1080;
  const height = 1080;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2D canvas context');

  // Background Styles
  if (theme === 'modern-dark') {
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
  } else if (theme === 'gold-luxury') {
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#1c1917');
    bgGrad.addColorStop(1, '#292524');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
  } else {
    // Default Google Light
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Subtle background mesh/card border
    ctx.fillStyle = '#f8fafc';
    roundRect(ctx, 40, 40, width - 80, height - 80, 24);
    ctx.fill();

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    roundRect(ctx, 40, 40, width - 80, height - 80, 24);
    ctx.stroke();
  }

  // Header Banner: Google Review Accent
  const cardX = 80;
  let curY = 100;

  // Google 4-Color Stripe or Logo Header
  const stripeColors = ['#4285F4', '#EA4335', '#FBBC05', '#34A853'];
  const stripeW = 120;
  stripeColors.forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.fillRect(cardX + i * (stripeW / 4), curY, stripeW / 4, 6);
  });

  curY += 28;

  // "GOOGLE VERIFIED RESIDENT REVIEW" Badge
  ctx.font = 'bold 16px "Inter", -apple-system, sans-serif';
  ctx.letterSpacing = '1px';
  ctx.fillStyle = theme === 'google-light' ? '#4285F4' : '#60a5fa';
  ctx.fillText('GOOGLE VERIFIED RESIDENT REVIEW', cardX, curY);

  curY += 45;

  // Resident Profile Section (Avatar circle + Name + Flat)
  const avatarSize = 72;
  const avatarX = cardX;
  const avatarY = curY;

  // Draw Avatar circle
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  // Gradient Avatar background
  const avatarGrad = ctx.createLinearGradient(avatarX, avatarY, avatarX + avatarSize, avatarY + avatarSize);
  avatarGrad.addColorStop(0, '#3b82f6');
  avatarGrad.addColorStop(1, '#8b5cf6');
  ctx.fillStyle = avatarGrad;
  ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);

  // Avatar Initials
  const initials = review.residentName
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
  ctx.font = 'bold 28px "Inter", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials || 'R', avatarX + avatarSize / 2, avatarY + avatarSize / 2);
  ctx.restore();

  // Resident Name & Flat Badge
  const nameX = cardX + avatarSize + 24;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = 'bold 30px "Inter", sans-serif';
  ctx.fillStyle = theme === 'google-light' ? '#0f172a' : '#f8fafc';
  ctx.fillText(review.residentName, nameX, curY + 32);

  // Flat & Tower Pill
  ctx.font = '500 18px "Inter", sans-serif';
  ctx.fillStyle = theme === 'google-light' ? '#64748b' : '#94a3b8';
  const subText = `${review.tower} • Flat ${review.flatNo} ${review.handoverYear ? `(Handover: ${review.handoverYear})` : ''}`;
  ctx.fillText(subText, nameX, curY + 62);

  curY += avatarSize + 35;

  // Star Rating Bar (5 Gold Stars)
  const starSize = 34;
  const starGap = 8;
  for (let s = 0; s < 5; s++) {
    const starX = cardX + s * (starSize + starGap);
    const isFilled = s < review.rating;
    ctx.font = `${starSize}px sans-serif`;
    ctx.fillStyle = isFilled ? '#f59e0b' : '#cbd5e1';
    ctx.fillText('★', starX, curY + 28);
  }

  // Rating label (e.g. 5.0 • Verified Buyer)
  ctx.font = 'bold 22px "Inter", sans-serif';
  ctx.fillStyle = theme === 'google-light' ? '#0f172a' : '#f8fafc';
  ctx.fillText(`${review.rating}.0 / 5.0`, cardX + 5 * (starSize + starGap) + 16, curY + 26);

  curY += 60;

  // Review Headline
  if (review.headline) {
    ctx.font = 'bold 26px "Inter", sans-serif';
    ctx.fillStyle = theme === 'google-light' ? '#1e293b' : '#f1f5f9';
    curY = wrapText(ctx, `"${review.headline}"`, cardX, curY, width - 160, 36, 2);
    curY += 12;
  }

  // Review Comment
  ctx.font = 'normal 21px "Inter", sans-serif';
  ctx.fillStyle = theme === 'google-light' ? '#334155' : '#cbd5e1';
  const remainingCommentSpace = includePhotos && review.photos && review.photos.length > 0 ? 4 : 8;
  curY = wrapText(ctx, review.comment, cardX, curY, width - 160, 32, remainingCommentSpace);

  curY += 20;

  // Tags pill row
  if (review.tags && review.tags.length > 0) {
    let tagX = cardX;
    ctx.font = '600 15px "Inter", sans-serif';
    for (const tag of review.tags.slice(0, 4)) {
      const tagMetrics = ctx.measureText(tag);
      const pillW = tagMetrics.width + 24;
      const pillH = 32;

      ctx.fillStyle = theme === 'google-light' ? '#e0f2fe' : '#1e3a8a';
      roundRect(ctx, tagX, curY, pillW, pillH, 16);
      ctx.fill();

      ctx.fillStyle = theme === 'google-light' ? '#0369a1' : '#93c5fd';
      ctx.fillText(tag, tagX + 12, curY + 21);
      tagX += pillW + 10;
    }
    curY += 45;
  }

  // Photos Grid (if attached)
  if (includePhotos && review.photos && review.photos.length > 0) {
    const photoH = 220;
    const photoCount = Math.min(review.photos.length, 2);
    const photoW = photoCount === 1 ? width - 160 : (width - 180) / 2;

    for (let i = 0; i < photoCount; i++) {
      const pX = cardX + i * (photoW + 20);
      try {
        const img = await loadImage(review.photos[i]);
        ctx.save();
        roundRect(ctx, pX, curY, photoW, photoH, 16);
        ctx.clip();

        // Cover fit
        const scale = Math.max(photoW / img.width, photoH / img.height);
        const nw = img.width * scale;
        const nh = img.height * scale;
        const nx = pX + (photoW - nw) / 2;
        const ny = curY + (photoH - nh) / 2;
        ctx.drawImage(img, nx, ny, nw, nh);
        ctx.restore();

        // Border around photo
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        roundRect(ctx, pX, curY, photoW, photoH, 16);
        ctx.stroke();
      } catch {
        // Draw placeholder if image fails to load (e.g. CORS)
        ctx.fillStyle = '#f1f5f9';
        roundRect(ctx, pX, curY, photoW, photoH, 16);
        ctx.fill();
        ctx.fillStyle = '#64748b';
        ctx.font = '16px sans-serif';
        ctx.fillText('Flat / Handover Photo', pX + 20, curY + photoH / 2);
      }
    }
  }

  // Footer: Society Branding & Verification Seal
  const footerY = height - 90;
  ctx.strokeStyle = theme === 'google-light' ? '#e2e8f0' : '#334155';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cardX, footerY - 20);
  ctx.lineTo(width - cardX, footerY - 20);
  ctx.stroke();

  // Society Logo/Text
  ctx.font = 'bold 22px "Inter", sans-serif';
  ctx.fillStyle = theme === 'google-light' ? '#0f172a' : '#f8fafc';
  ctx.fillText('BPS Twin Towers', cardX, footerY + 14);

  ctx.font = '15px "Inter", sans-serif';
  ctx.fillStyle = theme === 'google-light' ? '#64748b' : '#94a3b8';
  ctx.fillText('Official Resident Community & Builder Review', cardX, footerY + 36);

  // Right Badge: Verified Badge
  ctx.font = 'bold 16px "Inter", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillStyle = '#10b981';
  ctx.fillText('✓ 100% VERIFIED RESIDENT', width - cardX, footerY + 22);

  return canvas;
}

export async function downloadReviewCardAsPng(
  review: BuilderReview,
  options: RenderCardOptions = {}
): Promise<void> {
  const canvas = await generateReviewCardCanvas(review, options);
  const dataUrl = canvas.toDataURL('image/png', 1.0);
  const cleanName = review.residentName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const filename = `builder_google_review_${review.flatNo}_${cleanName}.png`;

  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
