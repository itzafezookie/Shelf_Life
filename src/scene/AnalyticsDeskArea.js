import * as THREE from 'three';
import { materials } from './materials';

export class AnalyticsDeskArea {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.position.set(5.2, 0, -1.8);
    this.group.rotation.y = -Math.PI / 4; // Angled towards center

    this.build();
    this.scene.add(this.group);
  }

  build() {
    // 1. Study Desk
    const deskGeo = new THREE.BoxGeometry(2.6, 0.1, 1.6);
    const desk = new THREE.Mesh(deskGeo, materials.wood);
    desk.position.set(0, 1.2, 0);
    desk.castShadow = true;
    desk.receiveShadow = true;
    this.group.add(desk);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.08, 1.2, 0.08);
    const legPositions = [
      [-1.2, 0.6, -0.7],
      [1.2, 0.6, -0.7],
      [-1.2, 0.6, 0.7],
      [1.2, 0.6, 0.7]
    ];
    legPositions.forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(legGeo, materials.darkWood);
      leg.position.set(x, y, z);
      this.group.add(leg);
    });

    // 2. Open Reading Journal Ledger
    const leftPageGeo = new THREE.BoxGeometry(0.45, 0.04, 0.6);
    const rightPageGeo = new THREE.BoxGeometry(0.45, 0.04, 0.6);

    const journalMat = new THREE.MeshStandardMaterial({ color: '#fefcf8', roughness: 0.8 });
    const leftPage = new THREE.Mesh(leftPageGeo, journalMat);
    leftPage.position.set(-0.23, 1.27, 0.1);
    leftPage.rotation.y = 0.08;
    this.group.add(leftPage);

    const rightPage = new THREE.Mesh(rightPageGeo, journalMat);
    rightPage.position.set(0.23, 1.27, 0.1);
    rightPage.rotation.y = -0.08;
    this.group.add(rightPage);

    // Leather cover base under open pages
    const coverBaseGeo = new THREE.BoxGeometry(0.96, 0.02, 0.64);
    const coverMat = new THREE.MeshStandardMaterial({ color: '#573018', roughness: 0.5 });
    const coverBase = new THREE.Mesh(coverBaseGeo, coverMat);
    coverBase.position.set(0, 1.255, 0.1);
    this.group.add(coverBase);

    // Bookmark ribbon
    const ribbonGeo = new THREE.BoxGeometry(0.04, 0.01, 0.7);
    const ribbonMat = new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.6 });
    const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
    ribbon.position.set(0, 1.295, 0.1);
    this.group.add(ribbon);

    // 3. Stack of 3 Finished Volumes beside the ledger
    const bookColors = ['#1e3a8a', '#065f46', '#831843'];
    bookColors.forEach((color, i) => {
      const stackBookGeo = new THREE.BoxGeometry(0.5, 0.08, 0.65);
      const stackBookMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
      const stackBook = new THREE.Mesh(stackBookGeo, stackBookMat);
      stackBook.position.set(0.85, 1.29 + i * 0.085, -0.2);
      stackBook.rotation.y = 0.15 * (i - 1);
      stackBook.castShadow = true;
      this.group.add(stackBook);
    });

    // 4. Brass Armillary / Globe
    const globeStandGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.03, 16);
    const globeStand = new THREE.Mesh(globeStandGeo, materials.brass);
    globeStand.position.set(-0.85, 1.27, -0.3);
    this.group.add(globeStand);

    const globeRingGeo = new THREE.TorusGeometry(0.18, 0.015, 8, 24);
    const globeRing = new THREE.Mesh(globeRingGeo, materials.brass);
    globeRing.position.set(-0.85, 1.48, -0.3);
    globeRing.rotation.x = Math.PI / 4;
    this.group.add(globeRing);

    const globeSphereGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const globeSphereMat = new THREE.MeshStandardMaterial({ color: '#38bdf8', roughness: 0.5 });
    const globeSphere = new THREE.Mesh(globeSphereGeo, globeSphereMat);
    globeSphere.position.set(-0.85, 1.48, -0.3);
    this.group.add(globeSphere);

    // 5. Warm Study Lamp
    const lampLight = new THREE.PointLight('#fef08a', 1.5, 4.0, 1.5);
    lampLight.position.set(0, 2.0, 0);
    this.group.add(lampLight);
  }
}
