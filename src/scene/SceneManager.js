import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import { BookshelfModel } from './BookshelfModel';

/**
 * ThreeUI-Inspired Scene Manager
 * Controls camera waypoints, responsive framing, warm studio lighting, raycasting, and volume selection.
 */
export class SceneManager {
  constructor(canvasContainer, onSelectVolume) {
    this.container = canvasContainer;
    this.onSelectVolume = onSelectVolume;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.bookshelf = null;
    this.animationFrameId = null;

    // Active state
    this.currentTabIndex = 'current';
    this.selectedBookIndex = -1;
    this.hoveredBook = null;

    // Camera targets and waypoints
    this.cameraTarget = new THREE.Vector3(0, 0.65, 0);
    this.mouse = new THREE.Vector2(-1000, -1000);
    this.mouseParallax = new THREE.Vector2(0, 0);
    this.raycaster = new THREE.Raycaster();

    this.init();
  }

  getWaypoints() {
    const aspect = (this.container?.clientWidth || window.innerWidth) / (this.container?.clientHeight || window.innerHeight);
    const zMultiplier = aspect < 1.0 ? 1.45 : 1.0;
    const yOffset = aspect < 1.0 ? 0.15 : 0;

    return {
      library: {
        pos: new THREE.Vector3(0, 0.8 + yOffset, 3.4 * zMultiplier),
        target: new THREE.Vector3(0, 0.65, 0)
      },
      current: {
        pos: new THREE.Vector3(0, 0.75 + yOffset, 2.7 * zMultiplier),
        target: new THREE.Vector3(0, 0.65, 0)
      },
      analytics: {
        pos: new THREE.Vector3(1.6, 0.95 + yOffset, 3.6 * zMultiplier),
        target: new THREE.Vector3(0.3, 0.6, 0)
      },
      history: {
        pos: new THREE.Vector3(-1.6, 0.95 + yOffset, 3.6 * zMultiplier),
        target: new THREE.Vector3(-0.3, 0.6, 0)
      }
    };
  }

  init() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // 1. Scene & Warm Studio Environment
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#f5eee3');
    this.scene.fog = new THREE.FogExp2('#f5eee3', 0.05);

    // 2. Camera with Adaptive Framing
    const aspect = width / height;
    this.camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 30);
    const waypoints = this.getWaypoints();
    const startWp = waypoints.current;
    this.camera.position.copy(startWp.pos);
    this.cameraTarget.copy(startWp.target);
    this.camera.lookAt(this.cameraTarget);

    // 3. Renderer with High-Fidelity Soft Shadows
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    // 4. Multi-Point Warm Studio Lighting
    const ambientLight = new THREE.AmbientLight('#fff8ee', 1.8);
    this.scene.add(ambientLight);

    // Warm Key Spotlight
    const keySpot = new THREE.SpotLight('#fed7aa', 3.2, 14, Math.PI / 3.2, 0.5, 1.2);
    keySpot.position.set(2.5, 5, 4.5);
    keySpot.target.position.set(0, 0.6, 0);
    keySpot.castShadow = true;
    keySpot.shadow.mapSize.width = 2048;
    keySpot.shadow.mapSize.height = 2048;
    keySpot.shadow.bias = -0.0008;
    keySpot.shadow.radius = 2.5;
    this.scene.add(keySpot);
    this.scene.add(keySpot.target);

    // Soft Warm Fill Light
    const fillLight = new THREE.DirectionalLight('#fef3c7', 0.85);
    fillLight.position.set(-3.5, 3.5, 2.5);
    this.scene.add(fillLight);

    // Cool Rim Light for Edge Separation
    const rimLight = new THREE.DirectionalLight('#e0f2fe', 0.65);
    rimLight.position.set(0, 4, -2.5);
    this.scene.add(rimLight);

    // 5. Bookshelf Model
    this.bookshelf = new BookshelfModel(this.scene);

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

      // Subtle mouse parallax
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
    if (!this.bookshelf) return;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const meshes = this.bookshelf.books.map(b => b.bookMesh).filter(Boolean);
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

    const idx = this.bookshelf.books.indexOf(bookObj);
    if (this.selectedBookIndex === idx && bookObj.isSelected) {
      // Toggle off if already selected
      bookObj.setSelected(false);
      this.selectedBookIndex = -1;
      return;
    }

    // Reset others
    this.bookshelf.books.forEach(b => b.setSelected(false));

    this.selectedBookIndex = idx;
    bookObj.setSelected(true);

    if (this.onSelectVolume) {
      this.onSelectVolume(bookObj.bookData);
    }
  }

  selectVolumeByIndex(index) {
    if (!this.bookshelf || this.bookshelf.books.length === 0) return;
    const safeIdx = Math.max(0, Math.min(this.bookshelf.books.length - 1, index));
    this.selectVolume(this.bookshelf.books[safeIdx]);
  }

  nextVolume() {
    if (!this.bookshelf || this.bookshelf.books.length === 0) return;
    const nextIdx = (this.selectedBookIndex + 1) % this.bookshelf.books.length;
    this.selectVolumeByIndex(nextIdx);
  }

  previousVolume() {
    if (!this.bookshelf || this.bookshelf.books.length === 0) return;
    const count = this.bookshelf.books.length;
    const prevIdx = (this.selectedBookIndex - 1 + count) % count;
    this.selectVolumeByIndex(prevIdx);
  }

  tweenToTab(tabName, duration = 1000) {
    this.currentTabIndex = tabName;
    const waypoints = this.getWaypoints();
    const wp = waypoints[tabName] || waypoints.library;

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
    if (this.bookshelf) {
      this.bookshelf.populate(books);
    }
  }

  updateCurrentBook(currentBook) {
    // Only update reference, do NOT forcefully rotate book on load
    if (!this.bookshelf || !currentBook) return;
    const matchIdx = this.bookshelf.books.findIndex(b => b.bookData?.id === currentBook.id);
    if (matchIdx !== -1) {
      this.selectedBookIndex = matchIdx;
    }
  }

  animate(time) {
    this.animationFrameId = requestAnimationFrame(this.animate);
    TWEEN.update(time);

    if (this.bookshelf) {
      this.bookshelf.update();
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
