/**
 * Generate placeholder images for SEO/social sharing
 * Creates: og-image.png, favicon.ico, apple-touch-icon.png
 * 
 * Run: node scripts/generateImages.js
 * Requires: npm install canvas
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// North Dakota state outline (simplified polygon)
const ND_COORDS = [
  [-104.0489, 45.9443],
  [-104.0445, 48.9999],
  [-96.5543, 49.0000],
  [-96.5617, 45.9351],
  [-104.0489, 45.9443]
];

// Convert geo coordinates to canvas coordinates
function geoToCanvas(coords, width, height, padding = 0) {
  const lngs = coords.map(c => c[0]);
  const lats = coords.map(c => c[1]);
  
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  
  const scaleX = (width - padding * 2) / (maxLng - minLng);
  const scaleY = (height - padding * 2) / (maxLat - minLat);
  const scale = Math.min(scaleX, scaleY);
  
  const offsetX = (width - (maxLng - minLng) * scale) / 2;
  const offsetY = (height - (maxLat - minLat) * scale) / 2;
  
  return coords.map(([lng, lat]) => ({
    x: (lng - minLng) * scale + offsetX,
    y: height - ((lat - minLat) * scale + offsetY) // Flip Y axis
  }));
}

function drawNDSilhouette(ctx, canvasCoords, fillColor, strokeColor, strokeWidth = 2) {
  ctx.beginPath();
  ctx.moveTo(canvasCoords[0].x, canvasCoords[0].y);
  for (let i = 1; i < canvasCoords.length; i++) {
    ctx.lineTo(canvasCoords[i].x, canvasCoords[i].y);
  }
  ctx.closePath();
  
  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();
  }
}

function generateOGImage() {
  const width = 1200;
  const height = 630;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Background gradient (dark blue)
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#1e3a5f');
  gradient.addColorStop(1, '#0f1f33');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // Draw ND silhouette
  const coords = geoToCanvas(ND_COORDS, width * 0.6, height * 0.7, 20);
  // Center the silhouette
  const offsetX = width * 0.35;
  const offsetY = height * 0.15;
  const centeredCoords = coords.map(c => ({ x: c.x + offsetX, y: c.y + offsetY }));
  
  // Glow effect
  ctx.shadowColor = '#3b82f6';
  ctx.shadowBlur = 30;
  drawNDSilhouette(ctx, centeredCoords, '#2563eb', null, 0);
  ctx.shadowBlur = 0;
  
  // Main shape
  drawNDSilhouette(ctx, centeredCoords, 'rgba(59, 130, 246, 0.3)', '#60a5fa', 3);
  
  // Add some dots to represent schools
  const dotPositions = [
    { x: 0.3, y: 0.4 }, { x: 0.5, y: 0.3 }, { x: 0.7, y: 0.45 },
    { x: 0.4, y: 0.6 }, { x: 0.6, y: 0.55 }, { x: 0.35, y: 0.35 },
    { x: 0.55, y: 0.5 }, { x: 0.45, y: 0.45 }, { x: 0.65, y: 0.35 },
  ];
  
  dotPositions.forEach(pos => {
    const x = offsetX + (width * 0.6 * pos.x);
    const y = offsetY + (height * 0.7 * pos.y);
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#f97316';
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
  });
  
  // Title text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ND Class B', 60, 100);
  
  // Subtitle
  ctx.font = '28px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('Basketball Schools', 60, 145);
  
  // Year range
  ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#60a5fa';
  ctx.fillText('1972 - 2012', 60, 550);
  
  // Description
  ctx.font = '22px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText('Interactive timeline & map', 60, 590);
  
  return canvas.toBuffer('image/png');
}

function generateFavicon() {
  const size = 32;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = '#2563eb';
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
  ctx.fill();
  
  // ND silhouette (small)
  const coords = geoToCanvas(ND_COORDS, size * 0.7, size * 0.6, 2);
  const offsetX = size * 0.15;
  const offsetY = size * 0.2;
  const centeredCoords = coords.map(c => ({ x: c.x + offsetX, y: c.y + offsetY }));
  
  drawNDSilhouette(ctx, centeredCoords, '#ffffff', null, 0);
  
  return canvas.toBuffer('image/png');
}

function generateAppleTouchIcon() {
  const size = 180;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#3b82f6');
  gradient.addColorStop(1, '#1d4ed8');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  
  // ND silhouette
  const coords = geoToCanvas(ND_COORDS, size * 0.75, size * 0.65, 5);
  const offsetX = size * 0.125;
  const offsetY = size * 0.175;
  const centeredCoords = coords.map(c => ({ x: c.x + offsetX, y: c.y + offsetY }));
  
  drawNDSilhouette(ctx, centeredCoords, '#ffffff', null, 0);
  
  return canvas.toBuffer('image/png');
}

// Main
async function main() {
  const publicDir = path.join(__dirname, '..', 'public');
  
  // Ensure public directory exists
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  console.log('Generating images...');
  
  // Generate OG image
  const ogImage = generateOGImage();
  fs.writeFileSync(path.join(publicDir, 'og-image.png'), ogImage);
  console.log('✓ Created og-image.png (1200x630)');
  
  // Generate favicon (PNG - you can convert to ICO online if needed)
  const favicon = generateFavicon();
  fs.writeFileSync(path.join(publicDir, 'favicon.png'), favicon);
  console.log('✓ Created favicon.png (32x32) - rename to favicon.ico or convert');
  
  // Generate Apple touch icon
  const appleTouchIcon = generateAppleTouchIcon();
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouchIcon);
  console.log('✓ Created apple-touch-icon.png (180x180)');
  
  console.log('\nDone! Images saved to public/');
  console.log('\nNote: For favicon.ico, you can either:');
  console.log('  1. Rename favicon.png to favicon.ico (works in most browsers)');
  console.log('  2. Convert at https://favicon.io/favicon-converter/');
}

main().catch(console.error);
