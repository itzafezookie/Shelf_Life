import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import { DeskDiorama } from './DeskDiorama';
import { HeroBookObject } from './HeroBookObject';
import { LibraryShelvesModel } from './LibraryShelvesModel';

/**
 * Master Diorama Scene Manager (Cozy Light Aesthetic & Mobile-Optimized)
 * Warm studio lighting, cream paper background, responsive mobile framing.
 */
export class DioramaSceneManager {
  constructor(canvasContainer, onSelectVolume) {
    this.container = canvasContainer;
    this.onSelectVolume = onSelectVolume;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.deskDiorama = null;
    this.heroBook = null;
    this.libraryShelves = null;
    this.animationFrameId = null;

    this.currentTabIndex = 'current';
    this.selectedBookIndex = -1;
    this.hoveredBook = null;

    this.cameraTarget = new THREE.Vector3(0.0, 0.55, 0.4);
    this.mouse = new THREE.Vector2(-1000, -1000);
    this.mouseParallax = new THREE.Vector2(0, 0);
    this.raycaster = new THREE.Raycaster();

    this.init();
  }

  getWaypoints() {
    const width = this.container?.clientWidth || window.innerWidth;
    const height = this.container?.clientHeight || window.innerHeight;
    const aspect = width / height;

    // Mobile vertical framing optimization
    const isMobile = aspect < 1.0;
    const zMult = isMobile ? 1.55 : 1.0;
    const yOff = isMobile ? 0.35 : 0;

    return {
      current: {
        pos: new THREE.Vector3(0.0, 1.35 + yOff, 2.7 * zMult),
        target: new THREE.Vector3(0.0, 0.55, 0.4)
      },
      library: {
        pos: new THREE.Vector3(0.0, 4.4 + yOff, 3.2 * zMult),
        target: new THREE.Vector3(0.0, 4.25, 0.0)
      },
      analytics: {
        pos: new THREE.Vector3(1.4, 1.5 + yOff, 3.2 * zMult),
        target: new THREE.Vector3(0.2, 0.6, 0.4)
      },
      history: {
        pos: new THREE.Vector3(-1.4, 1.5 + yOff, 3.2 * zMult),
        target: new THREE.Vector3(-0.2, 0.6, 0.4)
      }
    };
  }

  init() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // 1. Warm Cream Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#fbf8f3');
    this.scene.fog = new THREE.FogExp2('#fbf8f3', 0.035);

    // 2. Camera with Mobile-Optimized Framing
    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 30);
    const waypoints = this.getWaypoints();
    const startWp = waypoints.current;
    this.camera.position.copy(startWp.pos);
    this.cameraTarget.copy(startWp.target);
    this.camera.lookAt(this.cameraTarget);

    // 3. Renderer with Soft Shadows
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.container.appendChild(this.renderer.domElement);

    // 4. Warm Studio Lighting
    const ambientLight = new THREE.AmbientLight('#fffbf5', 1.8);
    this.scene.add(ambientLight);

    const studioKey = new THREE.SpotLight('#fed7aa', 3.2, 16, Math.PI / 3, 0.45, 1.2);
    studioKey.position.set(2.5, 5.2, 4.0);
    studioKey.target.position.set(0, 0.6, 0.4);
    studioKey.castShadow = true;
    studioKey.shadow.mapSize.width = 2048;
    studioKey.shadow.mapSize.height = 2048;
    studioKey.shadow.bias = -0.0008;
    studioKey.shadow.radius = 2.0;
    this.scene.add(studioKey);
    this.scene.add(studioKey.target);

    const fillLight = new THREE.DirectionalLight('#fef3c7', 0.7);
    fillLight.position.set(-3.5, 3.5, 2.5);
    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight('#e0f2fe', 0.5);
    rimLight.position.set(0, 4, -2.5);
    this.scene.add(rimLight);

    // 5. 3D Diorama Elements
    this.deskDiorama = new DeskDiorama(this.scene);
    this.heroBook = new HeroBookObject(this.scene);
    this.libraryShelves = new LibraryShelvesModel(this.scene);

    // 6. Bind Events
    this.bindEvents();

    // 7. Render Loop
    this.animate = this.animate.bind(this);
    this.animate();
  }

  bindEvents() {
    this.handleResize = () => {
      if (!this.container || !this.renderer || !this.camera) return;
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
      this.tweenToTab(this.currentTabIndex, 400);
    };
    window.addEventListener('resize', this.handleResize);

    this.handlePointerMove = (e) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.mouseParallax.x = this.mouse.x * 0.08;
      this.mouseParallax.y = this.mouse.y * 0.05;

      this.checkRaycast();
    };
    window.addEventListener('pointermove', this.handlePointerMove);

    this.handleClick = () => {
      if (this.hoveredBook) {
        this.selectVolume(this.hoveredBook);
      }
    };
    this.renderer.domElement.addEventListener('click', this.handleClick);
  }

  checkRaycast() {
    if (!this.libraryShelves) return;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const meshes = this.libraryShelves.books.map(b => b.bookMesh).filter(Boolean);
    const intersects = this.raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const hitObj = intersects[0].object.userData.bookObject;
      if (this.hoveredBook !== hitObj) {
        if (this.hoveredBook) this.hoveredBook.setHover(false);
        this.hoveredBook = hitObj;
        hitObj.setHover(true);
        document.body.style.cursor = 'pointer';
      }
    } else {
      if (this.hoveredBook) {
        this.hoveredBook.setHover(false);
        this.hoveredBook = null;
        document.body.style.cursor = 'default';
      }
    }
  }

  selectVolume(bookObj) {
    if (!bookObj) return;
    const idx = this.libraryShelves.books.indexOf(bookObj);
    this.libraryShelves.books.forEach(b => b.setSelected(false));
    this.selectedBookIndex = idx;
    bookObj.setSelected(true);

    if (this.onSelectVolume) {
      this.onSelectVolume(bookObj.bookData);
    }
  }

  selectVolumeByIndex(index) {
    if (!this.libraryShelves || this.libraryShelves.books.length === 0) return;
    const safeIdx = Math.max(0, Math.min(this.libraryShelves.books.length - 1, index));
    this.selectVolume(this.libraryShelves.books[safeIdx]);
  }

  nextVolume() {
    if (!this.libraryShelves || this.libraryShelves.books.length === 0) return;
    const nextIdx = (this.selectedBookIndex + 1) % this.libraryShelves.books.length;
    this.selectVolumeByIndex(nextIdx);
  }

  previousVolume() {
    if (!this.libraryShelves || this.libraryShelves.books.length === 0) return;
    const count = this.libraryShelves.books.length;
    const prevIdx = (this.selectedBookIndex - 1 + count) % count;
    this.selectVolumeByIndex(prevIdx);
  }

  tweenToTab(tabName, duration = 1100) {
    this.currentTabIndex = tabName;
    const waypoints = this.getWaypoints();
    const wp = waypoints[tabName] || waypoints.current;

    new TWEEN.Tween(this.camera.position)
      .to({ x: wp.pos.x, y: wp.pos.y, z: wp.pos.z }, duration)
      .easing(TWEEN.Easing.Cubic.InOut)
      .start();

    new TWEEN.Tween(this.cameraTarget)
      .to({ x: wp.target.x, y: wp.target.y, z: wp.target.z }, duration)
      .easing(TWEEN.Easing.Cubic.InOut)
      .onUpdate(() => {
        this.camera.lookAt(this.cameraTarget);
      })
      .start();
  }

  updateBooks(books) {
    if (this.libraryShelves) {
      this.libraryShelves.populate(books);
    }
  }

  updateCurrentBook(currentBook) {
    if (this.heroBook && currentBook) {
      this.heroBook.setBook(currentBook);
    }
  }

  animate(time) {
    this.animationFrameId = requestAnimationFrame(this.animate);
    TWEEN.update(time);

    if (this.deskDiorama) {
      this.deskDiorama.update();
    }
    if (this.heroBook) {
      this.heroBook.update(this.mouseParallax);
    }
    if (this.libraryShelves) {
      this.libraryShelves.update();
    }

    const currentCamTarget = this.cameraTarget.clone();
    currentCamTarget.x += this.mouseParallax.x;
    currentCamTarget.y += this.mouseParallax.y;
    this.camera.lookAt(currentCamTarget);

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('pointermove', this.handlePointerMove);
    if (this.renderer?.domElement) {
      this.renderer.domElement.removeEventListener('click', this.handleClick);
      if (this.container.contains(this.renderer.domElement)) {
        this.container.removeChild(this.renderer.domElement);
      }
    }
    this.renderer?.dispose();
  }
}
