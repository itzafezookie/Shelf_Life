import * as THREE from 'three';
import { materials } from '../materials';
import { BookObject } from '../BookObject';

/**
 * Architectural Library Shelves Model for Library View
 * Multi-book shelf with warm walnut ledge, brass bookends, and raycasting support.
 */
export class LibraryShelvesModel {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.position.set(0, 3.8, 0); // Positioned above the desk
    this.books = [];

    this.build();
    this.scene.add(this.group);
  }

  build() {
    const shelfWidth = 7.0;
    const shelfDepth = 1.0;
    const shelfThickness = 0.12;

    // Dark walnut shelf ledge
    const ledgeGeo = new THREE.BoxGeometry(shelfWidth, shelfThickness, shelfDepth);
    const ledge = new THREE.Mesh(ledgeGeo, materials.wood);
    ledge.position.set(0, 0, 0);
    ledge.receiveShadow = true;
    ledge.castShadow = true;
    this.group.add(ledge);

    // Front moulding lip
    const lipGeo = new THREE.BoxGeometry(shelfWidth + 0.06, 0.05, 0.05);
    const lip = new THREE.Mesh(lipGeo, materials.wood);
    lip.position.set(0, 0.03, shelfDepth / 2);
    this.group.add(lip);

    // Brass Bookends
    const bookendGeo = new THREE.BoxGeometry(0.06, 0.85, 0.4);
    const leftEnd = new THREE.Mesh(bookendGeo, materials.brass);
    leftEnd.position.set(-shelfWidth / 2 + 0.3, 0.42, 0);
    leftEnd.castShadow = true;
    this.group.add(leftEnd);

    const rightEnd = new THREE.Mesh(bookendGeo, materials.brass);
    rightEnd.position.set(shelfWidth / 2 - 0.3, 0.42, 0);
    rightEnd.castShadow = true;
    this.group.add(rightEnd);
  }

  populate(booksList = []) {
    this.books.forEach(b => this.group.remove(b.group));
    this.books = [];

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

    let totalSpan = 0;
    const bookObjects = booksToRender.map((b, i) => {
      const obj = new BookObject(b, i, booksToRender.length);
      totalSpan += obj.thickness + 0.025;
      return obj;
    });

    let currentX = -totalSpan / 2;

    bookObjects.forEach((bookObj) => {
      const x = currentX + bookObj.thickness / 2;
      const y = 0.06 + bookObj.height / 2;
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
