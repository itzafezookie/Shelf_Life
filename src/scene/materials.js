import * as THREE from 'three';

/**
 * High-Fidelity Materials & Textures for 3D Library Shelf
 * Realistic book cloth, gold foil embossing, paper deckle edges, and lustrous walnut.
 */

// Texture loader singleton
const textureLoader = new THREE.TextureLoader();
const coverTextureCache = new Map();

export function loadCoverTexture(url) {
  if (!url) return null;
  if (coverTextureCache.has(url)) return coverTextureCache.get(url);

  const texture = textureLoader.load(
    url,
    () => {
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.colorSpace = THREE.SRGBColorSpace;
    },
    undefined,
    () => {
      // Fallback if image fails to load
      coverTextureCache.delete(url);
    }
  );
  texture.colorSpace = THREE.SRGBColorSpace;
  coverTextureCache.set(url, texture);
  return texture;
}

// Procedural rich walnut wood
export function createFineWoodTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // Rich dark walnut gradient base
  const grad = ctx.createLinearGradient(0, 0, 1024, 0);
  grad.addColorStop(0, '#2e1c10');
  grad.addColorStop(0.3, '#3d2617');
  grad.addColorStop(0.6, '#321e12');
  grad.addColorStop(1, '#29180e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);

  // Subtle natural wood grain lines
  for (let i = 0; i < 1024; i += 2) {
    const alpha = 0.05 + Math.sin(i * 0.03) * 0.04 + Math.random() * 0.05;
    ctx.fillStyle = `rgba(18, 9, 4, ${alpha})`;
    ctx.fillRect(0, i, 1024, 1.5 + Math.random() * 2);
  }

  // Soft wood pores
  for (let x = 0; x < 1024; x += 32) {
    for (let y = 0; y < 1024; y += 8) {
      if (Math.random() > 0.6) {
        ctx.fillStyle = 'rgba(10, 5, 2, 0.08)';
        ctx.fillRect(x + (Math.random() * 10), y, 20 + Math.random() * 30, 1.5);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Procedural realistic paper edge (warm cream with page grooves)
export function createPaperEdgeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#f8f4ec';
  ctx.fillRect(0, 0, 256, 256);

  // Fine stratified page lines
  for (let y = 0; y < 256; y += 2) {
    const alpha = 0.12 + Math.random() * 0.15;
    ctx.fillStyle = `rgba(165, 142, 115, ${alpha})`;
    ctx.fillRect(0, y, 256, 1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Procedural soft contact shadow texture
export function createContactShadowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createRadialGradient(64, 64, 10, 64, 64, 64);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
  grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.25)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  return new THREE.CanvasTexture(canvas);
}

// High-DPI Foil Spine Texture
export function createFoilSpineTexture(title = 'Volume', volumeNo = '', baseColor = '#1e293b') {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // Rich cloth/leather base
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 256, 1024);

  // Cloth grain weave texture
  for (let x = 0; x < 256; x += 4) {
    for (let y = 0; y < 1024; y += 4) {
      if ((x + y) % 8 === 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.fillRect(x, y, 2, 2);
      } else if ((x - y) % 8 === 0) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.fillRect(x, y, 2, 2);
      }
    }
  }

  // Double gold-foil embossed perimeter borders
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 4;
  ctx.strokeRect(20, 36, 216, 952);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(26, 42, 204, 940);

  // Ornamental header banner
  if (volumeNo) {
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 26px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(volumeNo, 128, 80);
  }

  // Gold embossed filigree dividing lines
  ctx.fillStyle = '#d4af37';
  ctx.fillRect(60, 115, 136, 3);
  ctx.fillRect(80, 122, 96, 1.5);
  ctx.fillRect(60, 910, 136, 3);

  // Vertical spine title in Fraunces/Georgia serif
  ctx.save();
  ctx.translate(128, 512);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px Georgia, "Fraunces", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowOffsetY = 2;
  ctx.shadowBlur = 4;

  const cleanTitle = title.length > 28 ? title.substring(0, 26) + '…' : title;
  ctx.fillText(cleanTitle, 0, 0);
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// High-DPI Foil Cover Texture (Fallback when no image cover exists)
export function createFoilCoverTexture(title = 'Volume', author = '', baseColor = '#1e293b') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 768;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 512, 768);

  // Cloth grain
  for (let x = 0; x < 512; x += 4) {
    for (let y = 0; y < 768; y += 4) {
      if ((x + y) % 8 === 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.fillRect(x, y, 2, 2);
      }
    }
  }

  // Gold foil ornamental framing
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 5;
  ctx.strokeRect(36, 36, 440, 696);
  ctx.lineWidth = 2;
  ctx.strokeRect(46, 46, 420, 676);

  // Spine hinge crease
  const spineGrad = ctx.createLinearGradient(0, 0, 35, 0);
  spineGrad.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
  spineGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = spineGrad;
  ctx.fillRect(0, 0, 35, 768);

  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 38px Georgia, "Fraunces", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const words = title.split(' ');
  const line1 = words.slice(0, 3).join(' ');
  const line2 = words.slice(3, 7).join(' ');

  ctx.fillText(line1, 256, 290);
  if (line2) {
    ctx.fillText(line2, 256, 345);
  }

  // Gold filigree divider
  ctx.fillStyle = '#d4af37';
  ctx.fillRect(160, 400, 192, 2);

  // Author
  if (author) {
    ctx.fillStyle = '#fef08a';
    ctx.font = '500 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(author, 256, 445);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export const woodTexture = createFineWoodTexture();
export const paperTexture = createPaperEdgeTexture();
export const shadowTexture = createContactShadowTexture();

export const materials = {
  wood: new THREE.MeshStandardMaterial({
    map: woodTexture,
    roughness: 0.35,
    metalness: 0.08,
    color: '#3d2516'
  }),
  paperEdge: new THREE.MeshStandardMaterial({
    map: paperTexture,
    roughness: 0.85,
    metalness: 0.0,
    color: '#f8f4ec'
  }),
  brass: new THREE.MeshStandardMaterial({
    color: '#d4af37',
    metalness: 0.88,
    roughness: 0.22
  })
};
