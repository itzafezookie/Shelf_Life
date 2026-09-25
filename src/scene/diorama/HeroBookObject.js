import * as THREE from 'three';
import { materials, createFoilSpineTexture, createFoilCoverTexture, loadCoverTexture, shadowTexture } from '../materials';

/**
 * Photorealistic Hero 3D Book on Desk Stand
 * Centerpiece hero object featuring real cover art, textured pages, and silk ribbon bookmark.
 */
export class HeroBookObject {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.bookGroup = new THREE.Group();
    this.bookMesh = null;
    this.coverMaterial = null;
    this.currentBookData = null;

    // Interactive rotation targets
    this.targetRotation = new THREE.Euler(0.2, -0.15, 0);
    this.targetPosition = new THREE.Vector3(0, 0.45, 0.55);

    this.build();
    this.scene.add(this.group);
  }

  build() {
    this.group.position.set(0, 0, 0);

    // 1. Wooden Book Display Stand
    const standMat = new THREE.MeshStandardMaterial({ color: '#543216', roughness: 0.45 });

    // Stand base
    const baseGeo = new THREE.BoxGeometry(0.9, 0.04, 0.6);
    const baseMesh = new THREE.Mesh(baseGeo, standMat);
    baseMesh.position.set(0, 0.03, 0.55);
    baseMesh.receiveShadow = true;
    baseMesh.castShadow = true;
    this.group.add(baseMesh);

    // Angled backrest
    const backGeo = new THREE.BoxGeometry(0.82, 0.65, 0.03);
    const backMesh = new THREE.Mesh(backGeo, standMat);
    backMesh.position.set(0, 0.32, 0.38);
    backMesh.rotation.x = -0.32;
    backMesh.castShadow = true;
    this.group.add(backMesh);

    // Brass front lip
    const lipGeo = new THREE.BoxGeometry(0.82, 0.05, 0.03);
    const lipMesh = new THREE.Mesh(lipGeo, materials.brass);
    lipMesh.position.set(0, 0.07, 0.72);
    lipMesh.castShadow = true;
    this.group.add(lipMesh);

    // 2. The Hero Hardcover Book
    const bookWidth = 0.85;
    const bookHeight = 1.2;
    const bookThickness = 0.16;

    const bookGeo = new THREE.BoxGeometry(bookWidth, bookHeight, bookThickness);

    // Initial placeholder cover
    const defaultCover = createFoilCoverTexture('Shelf Life', 'Your Library', '#1b2a4a');
    this.coverMaterial = new THREE.MeshStandardMaterial({
      map: defaultCover,
      roughness: 0.35,
      metalness: 0.08
    });

    const spineTex = createFoilSpineTexture('Shelf Life', 'VOL. 01', '#1b2a4a');
    const spineMat = new THREE.MeshStandardMaterial({
      map: spineTex,
      roughness: 0.4,
      metalness: 0.12
    });

    const backMat = new THREE.MeshStandardMaterial({ color: '#1b2a4a', roughness: 0.45 });

    // Box faces:
    // 0: Right (+X): Fore-edge pages
    // 1: Left (-X): Spine
    // 2: Top (+Y): Top pages
    // 3: Bottom (-Y): Bottom pages
    // 4: Front (+Z): Front Cover (Viewer facing!)
    // 5: Back (-Z): Back Cover
    const bookMats = [
      materials.paperEdge, // +X: Right page edge
      spineMat,            // -X: Left spine
      materials.paperEdge, // +Y: Top page edge
      materials.paperEdge, // -Y: Bottom page edge
      this.coverMaterial,  // +Z: Front Cover
      backMat              // -Z: Back Cover
    ];

    this.bookMesh = new THREE.Mesh(bookGeo, bookMats);
    this.bookMesh.castShadow = true;
    this.bookMesh.receiveShadow = true;
    this.bookGroup.add(this.bookMesh);

    // 3. Golden Silk Ribbon Bookmark draped across the book
    const ribbonGeo = new THREE.PlaneGeometry(0.04, 0.95, 1, 8);
    const ribbonMat = new THREE.MeshStandardMaterial({
      color: '#f59e0b',
      roughness: 0.3,
      metalness: 0.25,
      side: THREE.DoubleSide
    });
    const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
    ribbon.position.set(0.12, -0.05, bookThickness / 2 + 0.005);
    ribbon.rotation.z = -0.08;
    this.bookGroup.add(ribbon);

    // 4. Contact Shadow on Desk Mat
    const shadowGeo = new THREE.PlaneGeometry(1.2, 0.8);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      opacity: 0.55,
      depthWrite: false
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0, 0.02, 0.55);
    this.group.add(shadow);

    // Position and angle the book on the stand
    this.bookGroup.position.copy(this.targetPosition);
    this.bookGroup.rotation.copy(this.targetRotation);
    this.group.add(this.bookGroup);
  }

  setBook(bookData) {
    if (!bookData) return;
    this.currentBookData = bookData;

    // Load real book cover image if available
    if (bookData.cover_url) {
      const texture = loadCoverTexture(bookData.cover_url);
      if (texture) {
        this.coverMaterial.map = texture;
        this.coverMaterial.needsUpdate = true;
      }
    } else {
      const fallbackTex = createFoilCoverTexture(
        bookData.title || 'Volume',
        bookData.author || '',
        '#1b2a4a'
      );
      this.coverMaterial.map = fallbackTex;
      this.coverMaterial.needsUpdate = true;
    }
  }

  update(mouseParallax) {
    if (!this.bookGroup) return;

    // Gentle breathing and mouse-tracking parallax
    const targetRotX = this.targetRotation.x + (mouseParallax?.y || 0) * 0.15;
    const targetRotY = this.targetRotation.y + (mouseParallax?.x || 0) * 0.2;

    this.bookGroup.rotation.x = THREE.MathUtils.lerp(this.bookGroup.rotation.x, targetRotX, 0.08);
    this.bookGroup.rotation.y = THREE.MathUtils.lerp(this.bookGroup.rotation.y, targetRotY, 0.08);
  }
}
