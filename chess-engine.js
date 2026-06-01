/**
 * chess-engine.js
 * Three.js WebGL engine — 3D chess board, floating pieces, particle system
 * Paulo Maker — Experiência Imersiva
 */

export class ChessEngine {
  constructor(container) {
    this.container = container;
    this.width  = container.offsetWidth;
    this.height = container.offsetHeight;
    this.clock  = new THREE.Clock();
    this.mouse  = new THREE.Vector2(0, 0);
    this.targetRotation = new THREE.Vector2(0, 0);
    this.scrollProgress = 0;
    this.animFrame = null;
    this.pieces = [];
    this.glowCells = [];

    this.init();
  }

  init() {
    this._initRenderer();
    this._initScene();
    this._initCamera();
    this._initLights();
    this._buildBoard();
    this._buildParticles();
    this._buildPieces();
    this._bindEvents();
    this._animate();
  }

  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.container.appendChild(this.renderer.domElement);
  }

  _initScene() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x070707, 0.18);
  }

  _initCamera() {
    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 100);
    this.camera.position.set(0, 5.5, 7);
    this.camera.lookAt(0, 0, 0);
  }

  _initLights() {
    // Ambient
    const ambient = new THREE.AmbientLight(0x1a1208, 2.0);
    this.scene.add(ambient);

    // Main dramatic light — warm gold
    this.keyLight = new THREE.DirectionalLight(0xc9a84c, 3.5);
    this.keyLight.position.set(4, 8, 6);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.set(2048, 2048);
    this.keyLight.shadow.camera.near = 0.1;
    this.keyLight.shadow.camera.far = 30;
    this.keyLight.shadow.camera.left = -8;
    this.keyLight.shadow.camera.right = 8;
    this.keyLight.shadow.camera.top = 8;
    this.keyLight.shadow.camera.bottom = -8;
    this.scene.add(this.keyLight);

    // Fill light — cooler blue-grey
    const fillLight = new THREE.DirectionalLight(0x8090a0, 0.8);
    fillLight.position.set(-5, 3, -3);
    this.scene.add(fillLight);

    // Rim light — gold accent
    const rimLight = new THREE.PointLight(0xdfc278, 4, 8);
    rimLight.position.set(0, 6, -4);
    this.scene.add(rimLight);

    // Under glow — subtle
    this.underGlow = new THREE.PointLight(0xc9a84c, 1.2, 6);
    this.underGlow.position.set(0, -1, 0);
    this.scene.add(this.underGlow);

    // Volumetric spot
    this.spotLight = new THREE.SpotLight(0xdfc278, 5, 20, Math.PI / 5, 0.5, 1.5);
    this.spotLight.position.set(0, 12, 2);
    this.spotLight.castShadow = true;
    this.scene.add(this.spotLight);
  }

  _buildBoard() {
    this.boardGroup = new THREE.Group();
    this.scene.add(this.boardGroup);

    const cellSize = 1.0;
    const boardSize = 8;
    this.cellMeshes = [];

    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col < boardSize; col++) {
        const isLight = (row + col) % 2 === 0;

        const geo = new THREE.BoxGeometry(cellSize - 0.02, 0.08, cellSize - 0.02);
        const mat = new THREE.MeshStandardMaterial({
          color: isLight ? 0x1e1810 : 0x0a0806,
          roughness: isLight ? 0.4 : 0.7,
          metalness: isLight ? 0.3 : 0.1,
          envMapIntensity: 1.0
        });

        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(
          (col - 3.5) * cellSize,
          0,
          (row - 3.5) * cellSize
        );
        mesh.receiveShadow = true;
        mesh.userData = { row, col, isLight, baseMat: mat.clone(), glowing: false };

        this.boardGroup.add(mesh);
        this.cellMeshes.push(mesh);
      }
    }

    // Board frame / border
    const frameGeo = new THREE.BoxGeometry(8.4, 0.14, 8.4);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x0d0a06,
      roughness: 0.3,
      metalness: 0.7
    });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.y = -0.04;
    frame.receiveShadow = true;
    this.boardGroup.add(frame);

    // Inner gold edge inlay
    const inlayGeo = new THREE.BoxGeometry(8.2, 0.16, 8.2);
    const inlayMat = new THREE.MeshStandardMaterial({
      color: 0xc9a84c,
      roughness: 0.2,
      metalness: 0.9,
      emissive: 0xc9a84c,
      emissiveIntensity: 0.08
    });
    const inlay = new THREE.Mesh(inlayGeo, inlayMat);
    inlay.position.y = -0.03;
    this.boardGroup.add(inlay);

    // Base slab
    const baseGeo = new THREE.BoxGeometry(9.0, 0.3, 9.0);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x080604,
      roughness: 0.2,
      metalness: 0.8
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = -0.22;
    base.receiveShadow = true;
    this.boardGroup.add(base);

    // Reflection plane
    const refGeo = new THREE.PlaneGeometry(20, 20);
    const refMat = new THREE.MeshStandardMaterial({
      color: 0x050403,
      roughness: 0.05,
      metalness: 0.95,
      transparent: true,
      opacity: 0.4
    });
    const ref = new THREE.Mesh(refGeo, refMat);
    ref.rotation.x = -Math.PI / 2;
    ref.position.y = -0.4;
    this.scene.add(ref);

    // Tilt board for cinematic perspective
    this.boardGroup.rotation.x = -0.38;
    this.boardGroup.position.y = -1.0;
  }

  _buildParticles() {
    const count = 220;
    const positions = new Float32Array(count * 3);
    const sizes     = new Float32Array(count);
    const speeds    = new Float32Array(count);
    const colors    = new Float32Array(count * 3);

    const goldColor  = new THREE.Color(0xc9a84c);
    const goldLight  = new THREE.Color(0xdfc278);
    const whiteColor = new THREE.Color(0xf4f1eb);

    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 6;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;

      sizes[i]  = Math.random() * 4 + 1;
      speeds[i] = Math.random() * 0.6 + 0.2;

      const t = Math.random();
      const c = t < 0.5 ? goldColor.clone().lerp(goldLight, t * 2)
                        : goldColor.clone().lerp(whiteColor, (t - 0.5) * 2);
      colors[i * 3]     = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSize',    new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aSpeed',   new THREE.BufferAttribute(speeds, 1));
    geo.setAttribute('aColor',   new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime:       { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
      },
      vertexShader: `
        attribute float aSize;
        attribute float aSpeed;
        attribute vec3 aColor;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uTime;
        uniform float uPixelRatio;
        void main() {
          vColor = aColor;
          vec3 pos = position;
          pos.y += mod(aSpeed * uTime * 0.35, 6.0) - 3.0;
          pos.x += sin(uTime * aSpeed * 0.25 + position.z * 1.5) * 0.12;
          vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPos;
          float alpha = 1.0 - abs(pos.y / 3.2);
          vAlpha = clamp(alpha, 0.0, 1.0) * 0.65;
          gl_PointSize = aSize * uPixelRatio * (280.0 / -mvPos.z);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vec2 uv = gl_PointCoord - 0.5;
          float d = length(uv);
          float mask = 1.0 - smoothstep(0.3, 0.5, d);
          gl_FragColor = vec4(vColor, mask * vAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: false
    });

    this.particles = new THREE.Points(geo, mat);
    this.scene.add(this.particles);
  }

  _buildPieces() {
    // Abstract geometric chess piece representations
    // King
    this._addPiece('king',   -4.5, 0, -2,  0.9);
    // Queen
    this._addPiece('queen',   5.0, 0,  1,  0.7);
    // Knight
    this._addPiece('knight', -5.5, 0,  2,  0.5);
    // Rook
    this._addPiece('rook',    5.5, 0, -3,  0.45);
  }

  _addPiece(type, x, y, z, scale) {
    const group = new THREE.Group();
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xc9a84c,
      roughness: 0.15,
      metalness: 0.95,
      emissive: 0xc9a84c,
      emissiveIntensity: 0.04
    });

    let base, body, top;

    if (type === 'king') {
      // Tall tapered king
      base = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 0.15, 32), goldMat.clone());
      body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.5, 1.6, 24), goldMat.clone());
      top  = new THREE.Mesh(new THREE.SphereGeometry(0.28, 24, 24), goldMat.clone());
      // Cross top
      const cx = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.08), goldMat.clone());
      const cy = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 0.08), goldMat.clone());
      cx.position.y = 2.12;
      cy.position.y = 2.28;
      top.position.y = 1.85;
      body.position.y = 0.9;
      base.position.y = 0.05;
      group.add(base, body, top, cx, cy);

    } else if (type === 'queen') {
      base  = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.14, 32), goldMat.clone());
      body  = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.45, 1.4, 24), goldMat.clone());
      // Crown points
      for (let i = 0; i < 5; i++) {
        const spike = new THREE.Mesh(
          new THREE.ConeGeometry(0.07, 0.3, 8),
          goldMat.clone()
        );
        const angle = (i / 5) * Math.PI * 2;
        spike.position.set(Math.cos(angle) * 0.2, 1.7, Math.sin(angle) * 0.2);
        group.add(spike);
      }
      const crown = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.05, 8, 24), goldMat.clone());
      crown.position.y = 1.52;
      crown.rotation.x = Math.PI / 2;
      body.position.y = 0.8;
      base.position.y = 0.05;
      group.add(base, body, crown);

    } else if (type === 'knight') {
      base = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 0.12, 32), goldMat.clone());
      body = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.42, 1.1, 24), goldMat.clone());
      // Horse-head suggestion — angular geometry
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.45, 0.18), goldMat.clone());
      head.position.set(0.1, 1.45, 0);
      head.rotation.z = 0.3;
      const snout = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.14), goldMat.clone());
      snout.position.set(0.24, 1.3, 0);
      body.position.y = 0.67;
      base.position.y = 0.04;
      group.add(base, body, head, snout);

    } else if (type === 'rook') {
      base  = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.58, 0.12, 32), goldMat.clone());
      body  = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.44, 1.1, 32), goldMat.clone());
      const topRing = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.3, 0.22, 32), goldMat.clone());
      // Battlements
      for (let i = 0; i < 4; i++) {
        const bat = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.22, 0.14), goldMat.clone());
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        bat.position.set(Math.cos(a) * 0.28, 1.48, Math.sin(a) * 0.28);
        group.add(bat);
      }
      topRing.position.y = 1.35;
      body.position.y = 0.73;
      base.position.y = 0.04;
      group.add(base, body, topRing);
    }

    group.position.set(x, y + 0.06, z);
    group.scale.setScalar(scale);
    group.castShadow = true;

    // Individual float speed / offset
    group.userData = {
      floatSpeed: 0.35 + Math.random() * 0.3,
      floatOffset: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.004,
      baseY: y + 0.06,
      type
    };

    this.scene.add(group);
    this.pieces.push(group);
  }

  _bindEvents() {
    window.addEventListener('resize', () => this._onResize(), { passive: true });
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth)  * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    }, { passive: true });
  }

  _onResize() {
    this.width  = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  setScrollProgress(p) {
    this.scrollProgress = Math.max(0, Math.min(1, p));
  }

  _triggerGlowCell() {
    const idx = Math.floor(Math.random() * this.cellMeshes.length);
    const cell = this.cellMeshes[idx];
    if (!cell.userData.glowing) {
      cell.userData.glowing = true;
      cell.material.emissive.setHex(0xc9a84c);
      cell.material.emissiveIntensity = 0.55;
      setTimeout(() => {
        cell.material.emissive.setHex(0x000000);
        cell.material.emissiveIntensity = 0;
        cell.userData.glowing = false;
      }, 1600 + Math.random() * 800);
    }
  }

  _animate() {
    this.animFrame = requestAnimationFrame(() => this._animate());
    const elapsed = this.clock.getElapsedTime();
    const delta   = this.clock.getDelta();

    // Smooth mouse parallax on board
    this.targetRotation.x += (this.mouse.y * 0.12 - this.targetRotation.x) * 0.045;
    this.targetRotation.y += (this.mouse.x * 0.14 - this.targetRotation.y) * 0.045;

    if (this.boardGroup) {
      this.boardGroup.rotation.x = -0.38 + this.targetRotation.x;
      this.boardGroup.rotation.y = this.targetRotation.y;
      // Scroll drives camera + board push
      this.camera.position.y = 5.5 - this.scrollProgress * 2.5;
      this.camera.position.z = 7 + this.scrollProgress * 3;
      this.camera.lookAt(0, this.scrollProgress * -0.5, 0);
    }

    // Float pieces
    this.pieces.forEach(piece => {
      const { floatSpeed, floatOffset, rotSpeed, baseY } = piece.userData;
      piece.position.y = baseY + Math.sin(elapsed * floatSpeed + floatOffset) * 0.14;
      piece.rotation.y += rotSpeed;
    });

    // Animate particles
    if (this.particles) {
      this.particles.material.uniforms.uTime.value = elapsed;
    }

    // Under glow pulse
    if (this.underGlow) {
      this.underGlow.intensity = 0.8 + Math.sin(elapsed * 1.8) * 0.5;
    }

    // Spot light movement
    if (this.spotLight) {
      this.spotLight.position.x = Math.sin(elapsed * 0.25) * 3;
    }

    this.renderer.render(this.scene, this.camera);
  }

  startCellGlow(interval = 380) {
    this._glowInterval = setInterval(() => this._triggerGlowCell(), interval);
  }

  destroy() {
    cancelAnimationFrame(this.animFrame);
    clearInterval(this._glowInterval);
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
