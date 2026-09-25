import * as THREE from 'three';
import { materials } from '../materials';

/**
 * Photorealistic 3D Desk Diorama Environment (Cozy Modern Light Aesthetic)
 * Warm walnut desk, leather desk mat, brass lamp, coffee mug, succulent, digital clock, wall art, calendar.
 */
export class DeskDiorama {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.clockCanvas = null;
    this.clockTexture = null;
    this.lastTimeStr = '';

    this.build();
    this.scene.add(this.group);
  }

  build() {
    // 1. Honey Walnut Wooden Desk
    const deskGeo = new THREE.BoxGeometry(6.5, 0.16, 3.2);
    const deskMat = new THREE.MeshStandardMaterial({
      color: '#8b5a2b',
      roughness: 0.35,
      metalness: 0.08
    });
    const desk = new THREE.Mesh(deskGeo, deskMat);
    desk.position.set(0, -0.08, 0.4);
    desk.receiveShadow = true;
    desk.castShadow = true;
    this.group.add(desk);

    // Front bevel moulding on desk edge
    const bevelGeo = new THREE.BoxGeometry(6.52, 0.04, 0.04);
    const bevel = new THREE.Mesh(bevelGeo, deskMat);
    bevel.position.set(0, -0.02, 2.0);
    this.group.add(bevel);

    // 2. Warm Saddle-Brown / Charcoal Leather Desk Mat
    const matGeo = new THREE.BoxGeometry(3.6, 0.02, 1.8);
    const matMaterial = new THREE.MeshStandardMaterial({
      color: '#334155',
      roughness: 0.7,
      metalness: 0.05
    });
    const deskMatMesh = new THREE.Mesh(matGeo, matMaterial);
    deskMatMesh.position.set(0, 0.01, 0.45);
    deskMatMesh.receiveShadow = true;
    this.group.add(deskMatMesh);

    // 3. Cozy Warm Library Wall
    const wallGeo = new THREE.PlaneGeometry(16, 12);
    const wallMat = new THREE.MeshStandardMaterial({
      color: '#f5eee3',
      roughness: 0.9,
      metalness: 0.0
    });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set(0, 3.5, -1.2);
    wall.receiveShadow = true;
    this.group.add(wall);

    // 4. Framed "SHELF LIFE" Wall Sign
    this.buildFramedWallSign();

    // 5. Hanging Paper Calendar ("SEPTEMBER 2026")
    this.buildWallCalendar();

    // 6. Retro Mascot Sticker on Wall
    this.buildMascotSticker();

    // 7. Brass Desk Lamp with Glowing Light
    this.buildDeskLamp();

    // 8. Ceramic Coffee Mug on Cork Coaster
    this.buildCoffeeMug();

    // 9. Potted Succulent Plant on Coaster
    this.buildSucculent();

    // 10. Live Digital Desk Clock
    this.buildDigitalClock();
  }

  buildFramedWallSign() {
    // Outer wooden frame
    const frameGeo = new THREE.BoxGeometry(1.6, 1.0, 0.06);
    const frameMat = new THREE.MeshStandardMaterial({ color: '#543216', roughness: 0.45 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(-0.6, 2.8, -1.16);
    frame.castShadow = true;
    this.group.add(frame);

    // Sign poster canvas
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');

    // Warm cream background
    ctx.fillStyle = '#fdfaf5';
    ctx.fillRect(0, 0, 512, 320);

    // Retro border
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 8;
    ctx.strokeRect(16, 16, 480, 288);

    // Text: SHELF LIFE
    ctx.fillStyle = '#0284c7';
    ctx.font = '900 68px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SHELF', 256, 115);

    ctx.fillStyle = '#d97706';
    ctx.fillText('LIFE', 256, 190);

    // Subtitle
    ctx.fillStyle = '#78716c';
    ctx.font = 'bold 20px "JetBrains Mono", monospace';
    ctx.fillText('• READING STUDIO •', 256, 255);

    const posterTex = new THREE.CanvasTexture(canvas);
    posterTex.colorSpace = THREE.SRGBColorSpace;
    const posterMat = new THREE.MeshStandardMaterial({ map: posterTex, roughness: 0.6 });
    const poster = new THREE.Mesh(new THREE.PlaneGeometry(1.46, 0.86), posterMat);
    poster.position.set(-0.6, 2.8, -1.12);
    this.group.add(poster);
  }

  buildWallCalendar() {
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 384, 512);

    // Header: Month & Year
    ctx.fillStyle = '#292524';
    ctx.font = 'bold 30px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SEPTEMBER 2026', 192, 60);

    ctx.fillStyle = '#78716c';
    ctx.font = 'italic 15px Georgia, serif';
    ctx.fillText('Trust the shelf. Sink into each chapter.', 192, 95);

    // Day of week headers
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    ctx.font = 'bold 16px "JetBrains Mono", monospace';
    ctx.fillStyle = '#a8a29e';
    days.forEach((d, i) => {
      ctx.fillText(d, 54 + i * 46, 140);
    });

    // Calendar grid
    ctx.font = '16px "JetBrains Mono", monospace';
    let dayNum = 1;
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 7; col++) {
        if (dayNum > 30) break;
        const x = 54 + col * 46;
        const y = 185 + row * 45;

        // Red cross marks for completed reading days
        if (dayNum < 25) {
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(x - 9, y - 9);
          ctx.lineTo(x + 9, y + 9);
          ctx.moveTo(x + 9, y - 9);
          ctx.lineTo(x - 9, y + 9);
          ctx.stroke();
        } else if (dayNum === 25) {
          // Circle today
          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(x, y, 16, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = '#d97706';
          ctx.fillText(String(dayNum), x, y + 5);
        } else {
          ctx.fillStyle = '#78716c';
          ctx.fillText(String(dayNum), x, y + 5);
        }
        dayNum++;
      }
    }

    const calTex = new THREE.CanvasTexture(canvas);
    calTex.colorSpace = THREE.SRGBColorSpace;
    const calMat = new THREE.MeshStandardMaterial({ map: calTex, roughness: 0.8 });
    const calMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.35), calMat);
    calMesh.position.set(1.2, 2.7, -1.16);
    calMesh.castShadow = true;
    this.group.add(calMesh);

    // Brass pushpin at the top
    const pinGeo = new THREE.SphereGeometry(0.025, 12, 12);
    const pin = new THREE.Mesh(pinGeo, materials.brass);
    pin.position.set(1.2, 3.34, -1.14);
    this.group.add(pin);
  }

  buildMascotSticker() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');

    // Retro book character
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(48, 60, 160, 190);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(58, 70, 140, 170);

    // Eyes
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(100, 130, 8, 0, Math.PI * 2);
    ctx.arc(156, 130, 8, 0, Math.PI * 2);
    ctx.fill();

    // Smile
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(128, 155, 20, 0.2, Math.PI - 0.2);
    ctx.stroke();

    const mascotTex = new THREE.CanvasTexture(canvas);
    mascotTex.colorSpace = THREE.SRGBColorSpace;
    const mascotMat = new THREE.MeshStandardMaterial({
      map: mascotTex,
      transparent: true,
      roughness: 0.5
    });
    const mascot = new THREE.Mesh(new THREE.PlaneGeometry(0.65, 0.85), mascotMat);
    mascot.position.set(-1.8, 2.8, -1.17);
    this.group.add(mascot);
  }

  buildDeskLamp() {
    // Brass Base
    const baseGeo = new THREE.CylinderGeometry(0.2, 0.22, 0.04, 24);
    const base = new THREE.Mesh(baseGeo, materials.brass);
    base.position.set(1.45, 0.02, 0.1);
    base.castShadow = true;
    this.group.add(base);

    // Thin Brass Curved Stem
    const stemGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.9, 12);
    const stem = new THREE.Mesh(stemGeo, materials.brass);
    stem.position.set(1.45, 0.47, 0.1);
    stem.castShadow = true;
    this.group.add(stem);

    // Lamp Shade
    const shadeGeo = new THREE.ConeGeometry(0.26, 0.28, 24, 1, true);
    const shadeMat = new THREE.MeshStandardMaterial({
      color: '#1c1917',
      roughness: 0.35,
      metalness: 0.2
    });
    const shade = new THREE.Mesh(shadeGeo, shadeMat);
    shade.position.set(1.2, 0.88, 0.3);
    shade.rotation.z = -0.55;
    shade.rotation.x = 0.35;
    shade.castShadow = true;
    this.group.add(shade);

    // Emissive bulb inside
    const bulbGeo = new THREE.SphereGeometry(0.06, 16, 16);
    const bulbMat = new THREE.MeshBasicMaterial({ color: '#fffbeb' });
    const bulb = new THREE.Mesh(bulbGeo, bulbMat);
    bulb.position.set(1.2, 0.84, 0.3);
    this.group.add(bulb);

    // Warm Golden SpotLight
    const spot = new THREE.SpotLight('#fed7aa', 3.8, 6.0, Math.PI / 3, 0.5, 1.2);
    spot.position.set(1.2, 0.84, 0.3);
    spot.target.position.set(0.2, 0.0, 0.5);
    spot.castShadow = true;
    spot.shadow.mapSize.width = 1024;
    spot.shadow.mapSize.height = 1024;
    spot.shadow.bias = -0.001;
    this.group.add(spot);
    this.group.add(spot.target);
  }

  buildCoffeeMug() {
    // Cork Coaster
    const coasterGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.015, 24);
    const coasterMat = new THREE.MeshStandardMaterial({ color: '#b48a5c', roughness: 0.8 });
    const coaster = new THREE.Mesh(coasterGeo, coasterMat);
    coaster.position.set(1.5, 0.01, 1.0);
    coaster.receiveShadow = true;
    this.group.add(coaster);

    // White Ceramic Mug
    const mugGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.24, 24);
    const mugMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.15, metalness: 0.05 });
    const mug = new THREE.Mesh(mugGeo, mugMat);
    mug.position.set(1.5, 0.13, 1.0);
    mug.castShadow = true;
    this.group.add(mug);

    // Handle
    const handleGeo = new THREE.TorusGeometry(0.07, 0.02, 12, 16, Math.PI);
    const handle = new THREE.Mesh(handleGeo, mugMat);
    handle.position.set(1.63, 0.13, 1.0);
    handle.rotation.z = -Math.PI / 2;
    handle.rotation.y = Math.PI / 2;
    this.group.add(handle);

    // Coffee
    const coffeeGeo = new THREE.CircleGeometry(0.11, 24);
    const coffeeMat = new THREE.MeshStandardMaterial({ color: '#2a1608', roughness: 0.1 });
    const coffee = new THREE.Mesh(coffeeGeo, coffeeMat);
    coffee.position.set(1.5, 0.22, 1.0);
    coffee.rotation.x = -Math.PI / 2;
    this.group.add(coffee);
  }

  buildSucculent() {
    // Terracotta pot
    const potGeo = new THREE.CylinderGeometry(0.16, 0.11, 0.22, 20);
    const potMat = new THREE.MeshStandardMaterial({ color: '#c25835', roughness: 0.6 });
    const pot = new THREE.Mesh(potGeo, potMat);
    pot.position.set(1.15, 0.11, 0.95);
    pot.castShadow = true;
    this.group.add(pot);

    // Soil
    const soilGeo = new THREE.CircleGeometry(0.15, 20);
    const soilMat = new THREE.MeshStandardMaterial({ color: '#261b14', roughness: 0.9 });
    const soil = new THREE.Mesh(soilGeo, soilMat);
    soil.position.set(1.15, 0.21, 0.95);
    soil.rotation.x = -Math.PI / 2;
    this.group.add(soil);

    // Succulent leaves
    const petalGeo = new THREE.ConeGeometry(0.05, 0.16, 8);
    const petalMat = new THREE.MeshStandardMaterial({ color: '#2d6a4f', roughness: 0.4 });

    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2;
      const petal = new THREE.Mesh(petalGeo, petalMat);
      petal.position.set(
        1.15 + Math.cos(angle) * 0.08,
        0.28,
        0.95 + Math.sin(angle) * 0.08
      );
      petal.rotation.x = Math.sin(angle) * 0.45;
      petal.rotation.z = -Math.cos(angle) * 0.45;
      this.group.add(petal);
    }
  }

  buildDigitalClock() {
    // Rounded dark enclosure
    const clockGeo = new THREE.BoxGeometry(0.55, 0.26, 0.14);
    const clockBodyMat = new THREE.MeshStandardMaterial({ color: '#292524', roughness: 0.4 });
    const clock = new THREE.Mesh(clockGeo, clockBodyMat);
    clock.position.set(0.7, 0.13, 0.0);
    clock.rotation.y = -0.25;
    clock.castShadow = true;
    this.group.add(clock);

    // Live LED Face
    this.clockCanvas = document.createElement('canvas');
    this.clockCanvas.width = 256;
    this.clockCanvas.height = 128;
    this.clockTexture = new THREE.CanvasTexture(this.clockCanvas);
    this.clockTexture.colorSpace = THREE.SRGBColorSpace;

    const faceMat = new THREE.MeshBasicMaterial({ map: this.clockTexture });
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.22), faceMat);
    face.position.set(0.7, 0.13, 0.075);
    face.rotation.y = -0.25;
    this.group.add(face);

    this.updateClock();
  }

  updateClock() {
    if (!this.clockCanvas) return;
    const now = new Date();
    const hours = now.getHours();
    const mins = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const timeStr = `${displayHours}:${mins}`;

    if (timeStr === this.lastTimeStr) return;
    this.lastTimeStr = timeStr;

    const ctx = this.clockCanvas.getContext('2d');
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(0, 0, 256, 128);

    // Glowing cyan digits
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 56px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#0284c7';
    ctx.shadowBlur = 10;
    ctx.fillText(timeStr, 110, 64);

    ctx.font = 'bold 20px "JetBrains Mono", monospace';
    ctx.fillText(ampm, 215, 64);

    this.clockTexture.needsUpdate = true;
  }

  update() {
    this.updateClock();
  }
}
