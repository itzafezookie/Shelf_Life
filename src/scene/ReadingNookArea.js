import * as THREE from 'three';
import { materials, createBookCoverTexture } from './materials';

export class ReadingNookArea {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.position.set(0, 0, 0);

    this.bookMesh = null;
    this.bookCoverMaterial = null;

    this.build();
    this.scene.add(this.group);
  }

  build() {
    // 1. Reading Desk Table Top
    const tableTopGeo = new THREE.BoxGeometry(2.8, 0.1, 1.8);
    const tableTop = new THREE.Mesh(tableTopGeo, materials.wood);
    tableTop.position.set(0, 1.2, 0);
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    this.group.add(tableTop);

    // Table legs
    const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8);
    const legPositions = [
      [-1.3, 0.6, -0.8],
      [1.3, 0.6, -0.8],
      [-1.3, 0.6, 0.8],
      [1.3, 0.6, 0.8]
    ];
    legPositions.forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(legGeo, materials.darkWood);
      leg.position.set(x, y, z);
      leg.castShadow = true;
      this.group.add(leg);
    });

    // 2. Brass Bookstand
    const standBaseGeo = new THREE.BoxGeometry(0.8, 0.03, 0.5);
    const standBase = new THREE.Mesh(standBaseGeo, materials.brass);
    standBase.position.set(0, 1.27, 0);
    this.group.add(standBase);

    const standBackGeo = new THREE.BoxGeometry(0.7, 0.5, 0.02);
    const standBack = new THREE.Mesh(standBackGeo, materials.brass);
    standBack.position.set(0, 1.5, -0.15);
    standBack.rotation.x = -0.35;
    this.group.add(standBack);

    // 3. Featured Focus Book (Box geometry representing the book)
    const bookGeo = new THREE.BoxGeometry(0.7, 0.95, 0.14);

    // Initial placeholder cover
    const coverTex = createBookCoverTexture('Reading Nook', 'Shelf Life', '#0284c7');
    this.bookCoverMaterial = new THREE.MeshStandardMaterial({
      map: coverTex,
      roughness: 0.5
    });

    const bookMaterials = [
      materials.paperEdge,       // right edge (pages)
      materials.darkWood,        // left edge (spine)
      materials.paperEdge,       // top edge (pages)
      materials.paperEdge,       // bottom edge (pages)
      this.bookCoverMaterial,    // front cover
      materials.darkWood         // back cover
    ];

    this.bookMesh = new THREE.Mesh(bookGeo, bookMaterials);
    this.bookMesh.position.set(0, 1.58, -0.05);
    this.bookMesh.rotation.x = -0.35;
    this.bookMesh.castShadow = true;
    this.group.add(this.bookMesh);

    // 4. Cozy Ceramic Mug on the desk
    const mugGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.16, 16);
    const mugMat = new THREE.MeshStandardMaterial({ color: '#f5ebe0', roughness: 0.3 });
    const mug = new THREE.Mesh(mugGeo, mugMat);
    mug.position.set(0.9, 1.33, 0.3);
    this.group.add(mug);

    // 5. Warm Brass Reading Lamp with soft warm PointLight
    const lampBase = new THREE.CylinderGeometry(0.12, 0.14, 0.04, 16);
    const lampMesh = new THREE.Mesh(lampBase, materials.brass);
    lampMesh.position.set(-1.0, 1.27, -0.4);
    this.group.add(lampMesh);

    const lampPole = new THREE.CylinderGeometry(0.02, 0.02, 0.6, 8);
    const poleMesh = new THREE.Mesh(lampPole, materials.brass);
    poleMesh.position.set(-1.0, 1.57, -0.4);
    this.group.add(poleMesh);

    const lampShade = new THREE.ConeGeometry(0.18, 0.18, 16, 1, true);
    const shadeMesh = new THREE.Mesh(lampShade, materials.brass);
    shadeMesh.position.set(-0.85, 1.82, -0.25);
    shadeMesh.rotation.z = -0.6;
    shadeMesh.rotation.x = 0.4;
    this.group.add(shadeMesh);

    // Cozy Warm PointLight
    const lampLight = new THREE.PointLight('#fef08a', 1.8, 4.5, 1.5);
    lampLight.position.set(-0.85, 1.78, -0.25);
    lampLight.castShadow = true;
    this.group.add(lampLight);
  }

  updateBook(book) {
    if (!book || !this.bookMesh) return;

    const title = book.title || 'Untitled Book';
    const author = book.author || '';

    // Pick a cozy cover color based on genre or title
    const palette = ['#0284c7', '#d97706', '#059669', '#7c3aed', '#b91c1c', '#334155'];
    const colorIndex = Math.abs(title.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % palette.length;
    const baseColor = palette[colorIndex];

    const newCoverTex = createBookCoverTexture(title, author, baseColor);
    this.bookCoverMaterial.map = newCoverTex;
    this.bookCoverMaterial.needsUpdate = true;
  }
}
