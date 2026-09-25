import * as THREE from 'three';
import { materials, createFoilSpineTexture, createFoilCoverTexture, loadCoverTexture, shadowTexture } from './materials';

/**
 * Photorealistic Hardcover Volume Mesh with Recessed Text Block
 * Features realistic cover boards, gold-foil spine, real cover art, and contact shadows.
 */
export class BookObject {
  constructor(bookData, index = 0, totalBooks = 1) {
    this.bookData = bookData;
    this.index = index;

    // Curated rich cloth/leather bindings
    const palette = [
      '#1b2a4a', // Oxford Navy
      '#7c2214', // Morocco Crimson
      '#164e3b', // Deep Forest
      '#4c1d7a', // Imperial Aubergine
      '#6b3a16', // Rich Cognac
      '#0e625d', // Aegean Teal
      '#232b38'  // Dark Charcoal
    ];

    this.baseColor = palette[index % palette.length];

    // Proportional physical dimensions
    const pages = Math.max(100, bookData.pages_total || 300);
    this.thickness = Math.max(0.1, Math.min(0.26, 0.09 + (pages / 800) * 0.12));
    this.height = 1.1 + ((index * 7) % 5) * 0.04;
    this.depth = 0.72;

    this.group = new THREE.Group();
    this.bookMesh = null;
    this.shadowMesh = null;

    // Animation targets
    this.targetPos = new THREE.Vector3();
    this.targetRot = new THREE.Euler();
    this.isHovered = false;
    this.isSelected = false;

    this.build();
  }

  build() {
    // 1. Hardcover Outer Casing
    const casingGeo = new THREE.BoxGeometry(this.thickness, this.height, this.depth);

    // Spine (+Z)
    const volumeNo = `VOL. 0${this.index + 1}`;
    const spineTexture = createFoilSpineTexture(this.bookData.title, volumeNo, this.baseColor);
    const spineMat = new THREE.MeshStandardMaterial({
      map: spineTexture,
      roughness: 0.42,
      metalness: 0.12
    });

    // Front Cover (+X)
    let coverMat;
    const realCoverTexture = loadCoverTexture(this.bookData.cover_url);
    if (realCoverTexture) {
      coverMat = new THREE.MeshStandardMaterial({
        map: realCoverTexture,
        roughness: 0.35,
        metalness: 0.05
      });
    } else {
      const fallbackCoverTexture = createFoilCoverTexture(
        this.bookData.title,
        this.bookData.author,
        this.baseColor
      );
      coverMat = new THREE.MeshStandardMaterial({
        map: fallbackCoverTexture,
        roughness: 0.42,
        metalness: 0.12
      });
    }

    // Back Cover (-X) & Book Board Edges
    const backCoverMat = new THREE.MeshStandardMaterial({
      color: this.baseColor,
      roughness: 0.45,
      metalness: 0.1
    });

    // 6 Box materials:
    // 0: +X (Front cover when standing on shelf)
    // 1: -X (Back cover)
    // 2: +Y (Top board edge)
    // 3: -Y (Bottom board edge)
    // 4: +Z (Spine facing the viewer!)
    // 5: -Z (Fore-edge)
    const casingMats = [
      coverMat,             // +X: Front Cover
      backCoverMat,         // -X: Back Cover
      materials.paperEdge,  // +Y: Top Pages
      materials.paperEdge,  // -Y: Bottom Pages
      spineMat,             // +Z: Spine (Viewer facing)
      materials.paperEdge   // -Z: Fore-edge Pages
    ];

    this.bookMesh = new THREE.Mesh(casingGeo, casingMats);
    this.bookMesh.castShadow = true;
    this.bookMesh.receiveShadow = true;
    this.bookMesh.userData = { bookObject: this, bookData: this.bookData };
    this.group.add(this.bookMesh);

    // 2. Soft Contact Shadow under book
    const shadowGeo = new THREE.PlaneGeometry(this.thickness * 1.6, this.depth * 1.2);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      opacity: 0.45,
      depthWrite: false
    });
    this.shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowMesh.rotation.x = -Math.PI / 2;
    this.shadowMesh.position.y = -this.height / 2 + 0.005;
    this.group.add(this.shadowMesh);
  }

  setPosition(x, y, z) {
    this.group.position.set(x, y, z);
    this.targetPos.set(0, 0, 0);
    this.targetRot.set(0, 0, 0);
  }

  setHover(hover) {
    if (this.isSelected) return;
    this.isHovered = hover;
    if (hover) {
      // Smoothly pull forward
      this.targetPos.set(0, 0.02, 0.18);
    } else {
      this.targetPos.set(0, 0, 0);
    }
  }

  setSelected(selected) {
    this.isSelected = selected;
    if (selected) {
      // Pull forward and rotate Front Cover (+X) to face the camera (+Z)
      this.targetPos.set(0, 0.06, 0.42);
      this.targetRot.set(0, Math.PI * 0.48, 0);
      if (this.shadowMesh) this.shadowMesh.material.opacity = 0.2;
    } else {
      this.targetPos.set(0, 0, 0);
      this.targetRot.set(0, 0, 0);
      if (this.shadowMesh) this.shadowMesh.material.opacity = 0.45;
    }
  }

  update() {
    if (!this.bookMesh) return;

    // Smooth lerp physics
    this.bookMesh.position.lerp(this.targetPos, 0.14);
    this.bookMesh.rotation.y = THREE.MathUtils.lerp(this.bookMesh.rotation.y, this.targetRot.y, 0.14);
  }
}
