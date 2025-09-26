const roadmapData = [
  {
    "başlık": "1. Websitesi açılışı",
    "açıklama": "Rezervasyon, Yorum ve yıldızlama özellikleri, akıllı arama özelliği",
    "tarih": "11/2025",
    "durum": "Yapım Aşamasında"
  },
  {
    "başlık": "2. Yorum analizleri",
    "açıklama": "İşletmelerin güçlü yanlarını açığa çıkarıp tanıtacak olan özellik!",
    "tarih": "01/2026",
    "durum": "Planlandı"
  },
  {
    "başlık": "3. Mobil Uygulama",
    "açıklama": "ProjectYB Android ve IOS uygulamaları",
    "tarih": "03/2026",
    "durum": "Planlanıyor"
  },
  {
    "başlık": "4. Akıllı Asistan",
    "açıklama": "Hem işletmelere hem kullanıcılara yönelik akıllı asistan! (Harika özellikler eklenecek, ProjectYB V2.0)",
    "tarih": "06/2026",
    "durum": "Planlanıyor"
  }
];

let scene, camera, renderer, controls;
let spheres = [];
let lines = [];
let raycaster, mouse;
let tooltip = document.getElementById('tooltip');

init();
animate();

function init() {
  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a1a);

  // Camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 20;

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.getElementById('canvas-container').appendChild(renderer.domElement);

  // OrbitControls
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);

  const pointLight = new THREE.PointLight(0xffffff, 1, 100);
  pointLight.position.set(10, 10, 10);
  scene.add(pointLight);

  // Raycaster
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // Create spheres
  createSpheres();

  // Create connections
  createConnections();

  // Events
  window.addEventListener('resize', onWindowResize);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('click', onClick);
}

function createSpheres() {
  const radius = 8;
  const sphereRadius = 2.5;

  roadmapData.forEach((item, i) => {
    const angle = (i / roadmapData.length) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const z = Math.sin(angle * 2) * 2;

    // Liquid glass material
    const material = new THREE.MeshPhysicalMaterial({
      color: item.durum.includes('Yapım') || item.durum.includes('Tamamlandı') 
        ? new THREE.Color(0xff6b00) 
        : new THREE.Color(0x8b5cf6),
      metalness: 0.2,
      roughness: 0.1,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      transmission: 0.9,
      transparent: true,
      opacity: 0.9,
      reflectivity: 0.8,
      side: THREE.DoubleSide
    });

    const geometry = new THREE.SphereGeometry(sphereRadius, 64, 64);
    const sphere = new THREE.Mesh(geometry, material);
    
    sphere.position.set(x, y, z);
    sphere.userData = item;
    sphere.name = `sphere-${i}`;
    
    scene.add(sphere);
    spheres.push(sphere);

    // 3D Text Creation
    create3DText(item, sphere, sphereRadius);
  });
}

function create3DText(item, parentSphere, sphereRadius) {
  // Başlık için text
  const titleText = createTextSprite(item.başlık, {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white'
  });
  titleText.position.y = sphereRadius + 0.8;
  parentSphere.add(titleText);

  // Tarih ve durum için text
  const infoText = createTextSprite(`${item.tarih} - ${item.durum}`, {
    fontSize: 16,
    fontWeight: 'normal',
    color: item.durum.includes('Yapım') || item.durum.includes('Tamamlandı') 
      ? '#ffcc00' 
      : '#d8b4fe'
  });
  infoText.position.y = sphereRadius + 0.3;
  parentSphere.add(infoText);
}

function createTextSprite(text, style) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  // Canvas boyutunu ayarla
  context.font = `${style.fontWeight} ${style.fontSize}px Arial`;
  const textWidth = context.measureText(text).width;
  canvas.width = textWidth * 2;
  canvas.height = style.fontSize * 2;
  
  // Arka planı temizle
  context.clearRect(0, 0, canvas.width, canvas.height);
  
  // Text stilini ayarla
  context.font = `${style.fontWeight} ${style.fontSize}px Arial`;
  context.fillStyle = style.color;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, canvas.width / 2, canvas.height / 2);
  
  // Texture oluştur
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ 
    map: texture,
    transparent: true,
    opacity: 0.9
  });
  
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(canvas.width / 100, canvas.height / 100, 1);
  
  return sprite;
}

function createConnections() {
  const material = new THREE.LineBasicMaterial({ 
    color: 0xffffff, 
    transparent: true, 
    opacity: 0.3 
  });

  for (let i = 0; i < spheres.length - 1; i++) {
    const points = [];
    points.push(spheres[i].position);
    points.push(spheres[i + 1].position);

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, material);
    
    scene.add(line);
    lines.push(line);
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(spheres);

  if (intersects.length > 0) {
    const object = intersects[0].object;
    showTooltip(object, event);
  } else {
    tooltip.style.display = 'none';
  }
}

function onClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(spheres);

  if (intersects.length > 0) {
    const object = intersects[0].object;
    //alert(`Seçilen: ${object.userData.başlık}`);
  }
}

function showTooltip(object, event) {
  const data = object.userData;
  tooltip.querySelector('h3').textContent = data.başlık;
  tooltip.querySelector('p').textContent = data.açıklama;
  tooltip.querySelector('div').textContent = `${data.tarih} - ${data.durum}`;
  
  tooltip.style.display = 'block';
  tooltip.style.left = event.clientX + 'px';
  tooltip.style.top = event.clientY + 'px';
}

function animate() {
  requestAnimationFrame(animate);
  
  // Kürelerde hafif dönüş animasyonu
  spheres.forEach(sphere => {
    sphere.rotation.x += 0.005;
    sphere.rotation.y += 0.005;
    
    // Text'leri de döndür ki her zaman kameraya baksın
    sphere.children.forEach(child => {
      if (child instanceof THREE.Sprite) {
        child.quaternion.copy(camera.quaternion);
      }
    });
  });

  controls.update();
  renderer.render(scene, camera);
}
