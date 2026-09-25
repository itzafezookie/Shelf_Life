import * as THREE from 'three';
import { materials, createBookSpineTexture } from './materials';

export class LibraryShelvesArea {
  constructor(scene, onSelectBook) {
    this.scene = scene;
    this.onSelectBook = onSelectBook;
    this.group = new THREE.Group();
    this.group.position.set(-5.5, 0, -2);
    this.group.rotation.y = Math.PI / 4; // Angled gracefully towards the center

    this.interactiveBooks = [];
    this.hoveredBook = null;

    this.buildBookshelf();
    this.scene.add(this.group);
  }

  buildBookshelf() {
    // Bookshelf dimensions
    const width = 3.6;
    const height = 4.2;
    const depth = 0.55;

    // Upright side panels
    const sideGeo = new THREE.BoxGeometry(0.08, height, depth);
    const leftSide = new THREE.Mesh(sideGeo, materials.darkWood);
    leftSide.position.set(-width / 2, height / 2, 0);
    this.group.add(leftSide);

    const rightSide = new THREE.Mesh(sideGeo, materials.darkWood);
    rightSide.position.set(width / 2, height / 2, 0);
    this.group.add(rightSide);

    // Back board
    const backGeo = new THREE.BoxGeometry(width, height, 0.04);
    const backMesh = new THREE.Mesh(backGeo, materials.wood);
    backMesh.position.set(0, height / 2, -depth / 2);
    this.group.add(backMesh);

    // Shelves (4 levels)
    const shelfGeo = new THREE.BoxGeometry(width, 0.06, depth);
    this.shelfYLevels = [0.8, 1.7, 2.6, 3.5];

    this.shelfYLevels.forEach((y) => {
      const shelf = new THREE.Mesh(shelfGeo, materials.darkWood);
      shelf.position.set(0, y, 0);
      shelf.receiveShadow = true;
      this.group.add(shelf);
    });

    // Bookshelf crown moulding
    const crownGeo = new THREE.BoxGeometry(width + 0.16, 0.14, depth + 0.08);
    const crown = new THREE.Mesh(crownGeo, materials.darkWood);
    crown.position.set(0, height + 0.04, 0);
    this.group.add(crown);
  }

  populateBooks(booksList = []) {
    // Remove existing books
    this.interactiveBooks.forEach(b => this.group.remove(b.mesh));
    this.interactiveBooks = [];

    const spinePalette = [
      '#7c2d12', // Warm mahogany leather
      '#1e3a8a', // Midnight navy cloth
      '#065f46', // Deep forest emerald
      '#831843', // Royal burgundy
      '#312e81', // Oxford blue
      '#78350f', // Antique saddle brown
      '#1e293b'  // Charcoal slate
    ];

    // Distribute user books across shelf levels
    let currentShelfIdx = 0;
    let currentX = -1.5;

    const booksToDisplay = [...booksList];

    // If user has few books, add a few classic volumes to create a rich library shelf feel
    if (booksToDisplay.length < 15) {
      const decorative = [
        { id: 'dec_1', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', isDecor: true },
        { id: 'dec_2', title: 'Moby Dick', author: 'Herman Melville', isDecor: true },
        { id: 'dec_3', title: 'Pride and Prejudice', author: 'Jane Austen', isDecor: true },
        { id: 'dec_4', title: 'War and Peace', author: 'Leo Tolstoy', isDecor: true },
        { id: 'dec_5', title: 'The Odyssey', author: 'Homer', isDecor: true },
        { id: 'dec_6', title: 'Don Quixote', author: 'Cervantes', isDecor: true },
        { id: 'dec_7', title: 'Crime and Punishment', author: 'Dostoevsky', isDecor: true },
        { id: 'dec_8', title: 'Frankenstein', author: 'Mary Shelley', isDecor: true },
        { id: 'dec_9', title: 'Jane Eyre', author: 'Charlotte Brontë', isDecor: true },
        { id: 'dec_10', title: 'Brave New World', author: 'Aldous Huxley', isDecor: true }
      ];
      booksToDisplay.push(...decorative.slice(0, 18 - booksToDisplay.length));
    }

    booksToDisplay.forEach((book, idx) => {
      const shelfY = this.shelfYLevels[currentShelfIdx];
      const pages = book.pages_total || 320;

      // Realistic variation in thickness & height
      const thickness = Math.max(0.06, Math.min(0.18, 0.06 + (pages / 800) * 0.08));
      const height = 0.58 + (idx % 5) * 0.04;
      const depth = 0.38 + (idx % 3) * 0.03;

      const baseColor = spinePalette[idx % spinePalette.length];
      const spineTexture = createBookSpineTexture(book.title, baseColor);

      const spineMat = new THREE.MeshStandardMaterial({
        map: spineTexture,
        roughness: 0.6
      });

      const bookCoverMat = new THREE.MeshStandardMaterial({
        color: baseColor,
        roughness: 0.6
      });

      const materialsArray = [
        bookCoverMat,         // Right side
        bookCoverMat,         // Left side
        materials.paperEdge,  // Top
        materials.paperEdge,  // Bottom
        spineMat,             // Front spine facing viewer!
        materials.paperEdge   // Back inside
      ];

      const bookGeo = new THREE.BoxGeometry(thickness, height, depth);
      const bookMesh = new THREE.Mesh(bookGeo, materialsArray);

      const bookX = currentX + thickness / 2;
      const bookY = shelfY + height / 2 + 0.03;
      const bookZ = 0.05;

      bookMesh.position.set(bookX, bookY, bookZ);
      bookMesh.castShadow = true;
      bookMesh.receiveShadow = true;

      // Custom data for raycasting
      bookMesh.userData = {
        book,
        originZ: bookZ,
        shelfY
      };

      this.group.add(bookMesh);
      this.interactiveBooks.push({ mesh: bookMesh, book });

      currentX += thickness + 0.02;

      // Move to next shelf if reached right side
      if (currentX > 1.4) {
        currentX = -1.5;
        currentShelfIdx = (currentShelfIdx + 1) % this.shelfYLevels.length;
      }
    });
  }

  handleHover(intersectedMesh) {
    if (this.hoveredBook && this.hoveredBook !== intersectedMesh) {
      this.hoveredBook.position.z = this.hoveredBook.userData.originZ;
      this.hoveredBook = null;
    }

    if (intersectedMesh && intersectedMesh.userData?.book) {
      this.hoveredBook = intersectedMesh;
      // Gently pull book forward on shelf
      intersectedMesh.position.z = intersectedMesh.userData.originZ + 0.12;
      document.body.style.cursor = 'pointer';
    } else {
      document.body.style.cursor = 'default';
    }
  }

  handleClick(intersectedMesh) {
    if (intersectedMesh && intersectedMesh.userData?.book) {
      if (this.onSelectBook && !intersectedMesh.userData.book.isDecor) {
        this.onSelectBook(intersectedMesh.userData.book);
      }
    }
  }
}
