import * as THREE from 'three';
import { materials } from './materials';

export class HistoryArchiveArea {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.position.set(0, 0, -5.5);

    this.build();
    this.scene.add(this.group);
  }

  build() {
    // 1. Archive Cabinet Table
    const cabinetGeo = new THREE.BoxGeometry(2.4, 1.2, 0.9);
    const cabinet = new THREE.Mesh(cabinetGeo, materials.darkWood);
    cabinet.position.set(0, 0.6, 0);
    cabinet.castShadow = true;
    cabinet.receiveShadow = true;
    this.group.add(cabinet);

    // Card Catalog Drawers front styling
    const drawerMat = new THREE.MeshStandardMaterial({ color: '#573018', roughness: 0.6 });
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        const drawerGeo = new THREE.BoxGeometry(0.5, 0.3, 0.02);
        const drawer = new THREE.Mesh(drawerGeo, drawerMat);
        drawer.position.set(-0.75 + col * 0.5, 0.95 - row * 0.32, 0.46);
        this.group.add(drawer);

        // Brass drawer handle
        const handleGeo = new THREE.BoxGeometry(0.12, 0.04, 0.03);
        const handle = new THREE.Mesh(handleGeo, materials.brass);
        handle.position.set(-0.75 + col * 0.5, 0.95 - row * 0.32, 0.48);
        this.group.add(handle);
      }
    }

    // 2. Stacks of Archived Reading Books on top of the cabinet
    const archiveColors = ['#1e293b', '#7c2d12', '#065f46', '#312e81', '#78350f'];

    // Left stack
    for (let i = 0; i < 4; i++) {
      const bookGeo = new THREE.BoxGeometry(0.52, 0.09, 0.65);
      const bookMat = new THREE.MeshStandardMaterial({
        color: archiveColors[i % archiveColors.length],
        roughness: 0.7
      });
      const bookMesh = new THREE.Mesh(bookGeo, bookMat);
      bookMesh.position.set(-0.6, 1.25 + i * 0.095, 0.05);
      bookMesh.rotation.y = (i * 0.08) - 0.12;
      bookMesh.castShadow = true;
      this.group.add(bookMesh);
    }

    // Right stack
    for (let i = 0; i < 5; i++) {
      const bookGeo = new THREE.BoxGeometry(0.55, 0.08, 0.68);
      const bookMat = new THREE.MeshStandardMaterial({
        color: archiveColors[(i + 2) % archiveColors.length],
        roughness: 0.7
      });
      const bookMesh = new THREE.Mesh(bookGeo, bookMat);
      bookMesh.position.set(0.6, 1.25 + i * 0.085, 0);
      bookMesh.rotation.y = (i * -0.06) + 0.1;
      bookMesh.castShadow = true;
      this.group.add(bookMesh);
    }

    // 3. Overhead Warm Pendant Light
    const light = new THREE.PointLight('#fed7aa', 1.8, 5.0, 1.8);
    light.position.set(0, 2.5, 0);
    light.castShadow = true;
    this.group.add(light);
  }
}
