import * as THREE from 'three';
import { materials, shadowTexture } from './materials';
import { BookObject } from './BookObject';

/**
 * Architectural Library Bookshelf Model
 * Solid dark walnut ledge, brass bookends, warm library alcove, and contact shadows.
 */
export class BookshelfModel {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.books = [];

    this.buildShelfStructure();
    this.scene.add(this.group);
  }

  buildShelfStructure() {
    const shelfWidth = 7.5;
    const shelfDepth = 1.2;
    const shelfThickness = 0.14;

    // 1. Solid Dark Walnut Shelf Ledge
    const ledgeGeo = new THREE.BoxGeometry(shelfWidth, shelfThickness, shelfDepth);
    const ledgeMesh = new THREE.Mesh(ledgeGeo, materials.wood);
    ledgeMesh.position.set(0, 0, 0);
    ledgeMesh.receiveShadow = true;
    ledgeMesh.castShadow = true;
    this.group.add(ledgeMesh);

    // Front edge moulding bevel
    const lipGeo = new THREE.BoxGeometry(shelfWidth + 0.08, 0.06, 0.06);
    const lipMesh = new THREE.Mesh(lipGeo, materials.wood);
    lipMesh.position.set(0, 0.04, shelfDepth / 2);
    this.group.add(lipMesh);

    // 2. Brass Architectural Bookends
    const bookendGeo = new THREE.BoxGeometry(0.06, 0.9, 0.45);

    const leftBookend = new THREE.Mesh(bookendGeo, materials.brass);
    leftBookend.position.set(-shelfWidth / 2 + 0.35, 0.45, 0);
    leftBookend.castShadow = true;
    this.group.add(leftBookend);

    const rightBookend = new THREE.Mesh(bookendGeo, materials.brass);
    rightBookend.position.set(shelfWidth / 2 - 0.35, 0.45, 0);
    rightBookend.castShadow = true;
    this.group.add(rightBookend);

    // 3. Warm Library Alcove Wall
    const wallGeo = new THREE.PlaneGeometry(16, 12);
    const wallMat = new THREE.MeshStandardMaterial({
      color: '#f5eee3',
      roughness: 0.92,
      metalness: 0.0
    });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set(0, 2.5, -shelfDepth / 2 - 0.02);
    wall.receiveShadow = true;
    this.group.add(wall);

    // 4. Soft Shelf Shadow on Wall
    const wallShadowGeo = new THREE.PlaneGeometry(shelfWidth * 1.05, 0.4);
    const wallShadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      opacity: 0.4,
      depthWrite: false
    });
    const wallShadow = new THREE.Mesh(wallShadowGeo, wallShadowMat);
    wallShadow.position.set(0, -0.06, -shelfDepth / 2 + 0.01);
    this.group.add(wallShadow);
  }

  populate(booksList = []) {
    // Clear old books
    this.books.forEach(b => this.group.remove(b.group));
    this.books = [];

    // Fallback classics if user shelf has fewer than 7 books
    const booksToRender = [...booksList];
    if (booksToRender.length < 7) {
      const presets = [
        { id: 'p1', title: 'The Working Mind', author: 'E. Hemingway', pages_total: 280 },
        { id: 'p2', title: 'Atlas of Thought', author: 'V. Woolf', pages_total: 420 },
        { id: 'p3', title: 'The Silent Reader', author: 'I. Calvino', pages_total: 310 },
        { id: 'p4', title: 'Chronicles of Light', author: 'G. Marquez', pages_total: 510 },
        { id: 'p5', title: 'Quiet Architecture', author: 'J. Tanizaki', pages_total: 240 },
        { id: 'p6', title: 'Echoes of the Sea', author: 'H. Melville', pages_total: 620 },
        { id: 'p7', title: 'Winter Solitude', author: 'A. Camus', pages_total: 190 }
      ];
      booksToRender.push(...presets.slice(0, 7 - booksToRender.length));
    }

    // Calculate shelf alignment
    let totalSpan = 0;
    const bookObjects = booksToRender.map((b, i) => {
      const obj = new BookObject(b, i, booksToRender.length);
      totalSpan += obj.thickness + 0.025;
      return obj;
    });

    let currentX = -totalSpan / 2;

    bookObjects.forEach((bookObj) => {
      const x = currentX + bookObj.thickness / 2;
      const y = 0.07 + bookObj.height / 2;
      const z = 0;

      bookObj.setPosition(x, y, z);
      this.group.add(bookObj.group);
      this.books.push(bookObj);

      currentX += bookObj.thickness + 0.025;
    });
  }

  update() {
    this.books.forEach(b => b.update());
  }
}
