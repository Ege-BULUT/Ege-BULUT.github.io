let scene, camera, renderer, cssRenderer, controls;
let htmlCube, metalCube;
let contentWidth = 250;
let contentHeight = 270;
let contentBorder = 2;
let depthScale = 5.5;
let rotationSpeed = 0.125;
let isRotating = true;
let showMetalCube = true;

init();
animate();

function init() {
  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a2a);

  // Camera
  camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 300, 300);
  camera.lookAt(0, 0, 0);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.getElementById('container').appendChild(renderer.domElement);

  // CSS3DRenderer
  cssRenderer = new THREE.CSS3DRenderer();
  cssRenderer.setSize(window.innerWidth, window.innerHeight);
  cssRenderer.domElement.style.position = 'absolute';
  cssRenderer.domElement.style.top = '0';
  cssRenderer.domElement.style.pointerEvents = 'none';
  document.getElementById('container').appendChild(cssRenderer.domElement);

  // Controls
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);

  const pointLight = new THREE.PointLight(0xffffff, 1, 300);
  pointLight.position.set(100, 100, 100);
  scene.add(pointLight);

  // Küpleri oluştur
  createCubes();

  // Kontrolleri ayarla
  setupControls();

  // Events
  window.addEventListener('resize', onWindowResize);
}

function setupControls() {
  // Content width slider
  const widthSlider = document.getElementById('contentWidth');
  const widthValue = document.getElementById('widthValue');
  
  widthSlider.addEventListener('input', function() {
    contentWidth = parseInt(this.value);
    widthValue.textContent = contentWidth;
    updateCubes();
  });

  // Content height slider
  const heightSlider = document.getElementById('contentHeight');
  const heightValue = document.getElementById('heightValue');
  
  heightSlider.addEventListener('input', function() {
    contentHeight = parseInt(this.value);
    heightValue.textContent = contentHeight;
    updateCubes();
  });

  // Content border slider
  const borderSlider = document.getElementById('contentBorder');
  const borderValue = document.getElementById('borderValue');
  
  borderSlider.addEventListener('input', function() {
    contentBorder = parseInt(this.value);
    borderValue.textContent = contentBorder;
    updateContentStyles();
  });

  // Depth scale slider
  const depthSlider = document.getElementById('depthScale');
  const depthValue = document.getElementById('depthValue');
  
  depthSlider.addEventListener('input', function() {
    depthScale = parseFloat(this.value);
    depthValue.textContent = depthScale.toFixed(1);
    updateCubes();
  });

  // Rotation speed slider
  const speedSlider = document.getElementById('rotationSpeed');
  const speedValue = document.getElementById('speedValue');
  
  speedSlider.addEventListener('input', function() {
    rotationSpeed = parseFloat(this.value);
    speedValue.textContent = rotationSpeed.toFixed(1);
  });

  // Toggle metal cube button
  const toggleMetalBtn = document.getElementById('toggleMetalCube');
  toggleMetalBtn.addEventListener('click', function() {
    showMetalCube = !showMetalCube;
    if (metalCube) {
      metalCube.visible = showMetalCube;
    }
    this.textContent = showMetalCube ? 'Metal Küpü Gizle' : 'Metal Küpü Göster';
  });

  // Reset camera button
  document.getElementById('resetCamera').addEventListener('click', function() {
    camera.position.set(0, 150, 150);
    camera.lookAt(0, 0, 0);
    controls.reset();
  });

  // Toggle rotation button
  const toggleBtn = document.getElementById('toggleRotation');
  toggleBtn.addEventListener('click', function() {
    isRotating = !isRotating;
    this.textContent = isRotating ? 'Dönmeyi Durdur' : 'Dönmeyi Başlat';
  });
}

function createMetalCube() {
  // Küp boyutlarını içerikten hesapla
  const width = contentWidth;
  const height = contentHeight;
  const depth = Math.max(20, Math.min(width, height) * 0.2 * depthScale); // Minimum 20, orantılı derinlik
  
  const geometry = new THREE.BoxGeometry(width, height, depth);
  
  // Metalik gri malzeme
  const material = new THREE.MeshPhysicalMaterial({
    color: 0x888888,
    metalness: 0.8,
    roughness: 0.2,
    clearcoat: 0.5,
    clearcoatRoughness: 0.1,
    reflectivity: 0.9
  });
  
  metalCube = new THREE.Mesh(geometry, material);
  scene.add(metalCube);
}

function createHTMLFace(content, width, height, bgColor = 'rgba(0,0,0,0.8)') {
  const element = document.createElement('div');
  element.className = 'css3d-element';
  element.style.width = width + 'px';
  element.style.height = height + 'px';
  element.style.background = bgColor;
  element.style.border = `${contentBorder}px solid rgba(255, 255, 255, 0.5)`;
  element.innerHTML = content;
  element.style.pointerEvents = 'auto';
  
  const object = new THREE.CSS3DObject(element);
  return object;
}

function createHTMLCube() {
  htmlCube = new THREE.Group();

  // Küp boyutlarını içerikten hesapla
  const width = contentWidth;
  const height = contentHeight;
  const depth = Math.max(20, Math.min(width, height) * 0.2 * depthScale);
  
  // Ön yüz (front) - Mavi tema
  const frontFace = createHTMLFace(`
    <h2>🌟 Ön Yüz</h2>
    <p>Normal HTML içerik!</p>
    <button onclick="alert('Ön yüz butonuna tıkladın!')">Tıkla</button>
    <div style="margin-top:10px;font-size:24px">🚀</div>
  `, width, height, 'rgba(0, 40, 80, 0.9)');
  frontFace.position.z = depth / 2 + 0.1;
  htmlCube.add(frontFace);

  // Arka yüz (back) - Mor tema
  const backFace = createHTMLFace(`
    <h2>🌌 Arka Yüz</h2>
    <p>Burası arka yüz!</p>
    <img src="https://placehold.co/100/ff6b6b/ffffff?text=IMG" style="width:100px;height:100px;border-radius:10px;">
    <div style="margin-top:10px;font-size:24px">🌠</div>
  `, width, height, 'rgba(80, 0, 80, 0.9)');
  backFace.position.z = -depth / 2 - 0.1;
  backFace.rotation.y = Math.PI;
  htmlCube.add(backFace);

  // Sol yüz (left) - Yeşil tema
  const leftFace = createHTMLFace(`
    <h2>🌿 Sol Yüz</h2>
    <ul style="text-align:left">
      <li>Liste elemanı 1</li>
      <li>Liste elemanı 2</li>
      <li>Liste elemanı 3</li>
    </ul>
    <div style="margin-top:10px;font-size:24px">🍃</div>
  `, depth, height, 'rgba(0, 80, 40, 0.9)');
  leftFace.position.x = -width / 2 - 0.1;
  leftFace.rotation.y = -Math.PI / 2;
  htmlCube.add(leftFace);

  // Sağ yüz (right) - Turuncu tema
  const rightFace = createHTMLFace(`
    <h2>🍊 Sağ Yüz</h2>
    <form onsubmit="event.preventDefault(); alert('Form gönderildi!')">
      <input type="text" placeholder="Adınız" style="width:100%;margin-bottom:10px;"><br>
      <input type="email" placeholder="Email" style="width:100%;margin-bottom:10px;"><br>
      <input type="submit" value="Gönder" style="width:100%;">
    </form>
  `, depth, height, 'rgba(80, 40, 0, 0.9)');
  rightFace.position.x = width / 2 + 0.1;
  rightFace.rotation.y = Math.PI / 2;
  htmlCube.add(rightFace);

  // Üst yüz (top) - Sarı tema
  const topFace = createHTMLFace(`
    <h2>⚡ Üst Yüz</h2>
    <div style="font-size:48px;margin:20px 0;">⚡🌟🔥</div>
    <p>Küpün üst yüzü</p>
  `, width, depth, 'rgba(80, 80, 0, 0.9)');
  topFace.position.y = height / 2 + 0.1;
  topFace.rotation.x = -Math.PI / 2;
  htmlCube.add(topFace);

  // Alt yüz (bottom) - Kırmızı tema
  const bottomFace = createHTMLFace(`
    <h2>❤️ Alt Yüz</h2>
    <div style="font-size:48px;margin:20px 0;">❤️💜💙</div>
    <p>Küpün alt yüzü</p>
  `, width, depth, 'rgba(80, 0, 0, 0.9)');
  bottomFace.position.y = -height / 2 - 0.1;
  bottomFace.rotation.x = Math.PI / 2;
  htmlCube.add(bottomFace);

  scene.add(htmlCube);
}

function updateCubes() {
  // Mevcut küpleri temizle
  if (htmlCube) {
    while(htmlCube.children.length > 0) { 
      htmlCube.remove(htmlCube.children[0]); 
    }
    scene.remove(htmlCube);
  }
  
  if (metalCube) {
    scene.remove(metalCube);
  }
  
  // Yeni küpleri oluştur
  createMetalCube();
  createHTMLCube();
}

function createCubes() {
  // Metalik küp oluştur
  createMetalCube();
  
  // HTML içerikli küp oluştur
  createHTMLCube();
}

function updateContentStyles() {
  if (htmlCube) {
    htmlCube.children.forEach(face => {
      if (face.element) {
        face.element.style.border = `${contentBorder}px solid rgba(255, 255, 255, 0.5)`;
      }
    });
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  cssRenderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  
  // Küpleri döndür
  if (isRotating) {
    const rotationAmount = 0.005 * rotationSpeed;
    if (htmlCube) {
      htmlCube.rotation.x += rotationAmount;
      htmlCube.rotation.y += rotationAmount;
    }
    if (metalCube) {
      metalCube.rotation.x += rotationAmount;
      metalCube.rotation.y += rotationAmount;
    }
  }
  
  controls.update();
  
  // Render both renderers
  renderer.render(scene, camera);
  cssRenderer.render(scene, camera);
}
