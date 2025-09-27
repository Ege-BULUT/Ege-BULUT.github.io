// <script src="https://cdn.jsdelivr.net/npm/three@0.134.0/examples/js/postprocessing/EffectComposer.js"></script>
// <script src="https://cdn.jsdelivr.net/npm/three@0.134.0/examples/js/postprocessing/RenderPass.js"></script>
// <script src="https://cdn.jsdelivr.net/npm/three@0.134.0/examples/js/postprocessing/UnrealBloomPass.js"></script>


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
  },
  {
    "başlık": "5. Versiyon 2.0",
    "açıklama": "Harika özellikler eklenecek, ProjectYB V2.0",
    "tarih": "01/2027",
    "durum": "Planlanıyor"
  }
];

let scene, camera, renderer, controls;
let spheres = [];
let lines = [];
let raycaster, mouse, lastHovered;
let mouseLight;
let mouseGlowSphere;
let mouseWorldPosition = new THREE.Vector3();
let lastMouseMoveTime = 0;
let tooltip = document.getElementById('tooltip');
let composer;

init();
animate();

async function init() {
  // Scene
  scene = new THREE.Scene();
  // scene.background = new THREE.Color(0x0a0a1a);
  //scene.background = new THREE.Color(0x000000);
  const textureLoader = new THREE.TextureLoader();
  const backgroundTexture = await textureLoader.loadAsync('stars.jpg');
  
  scene.background = backgroundTexture;
  const targetAspect = window.innerWidth / window.innerHeight;
  const imageAspect = backgroundTexture.image.width / backgroundTexture.image.height ;
  const factor = imageAspect / targetAspect;
  // When factor larger than 1, that means texture 'wilder' than target。 
  // we should scale texture height to target height and then 'map' the center  of texture to target， and vice versa.
  scene.background.offset.x = factor > 1 ? (1 - 1 / factor) / 2 : 0;
  scene.background.repeat.x = factor > 1 ? 1 / factor : 1;
  scene.background.offset.y = factor > 1 ? 0 : (1 - factor) / 2;
  scene.background.repeat.y = factor > 1 ? 1 : factor;

  
  
  // Camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 20;

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.toneMapping = THREE.ReinhardToneMapping;
  renderer.toneMappingExposure = Math.pow(1.5, 4.0);
  document.getElementById('canvas-container').appendChild(renderer.domElement);

  renderer.domElement.addEventListener('mousemove', onHover);
  // touch support:
  renderer.domElement.addEventListener('touchmove', (e)=> onHover(e.touches[0]));


  // Effect Composer for Bloom
  composer = new THREE.EffectComposer(renderer);
  const renderPass = new THREE.RenderPass(scene, camera);
  composer.addPass(renderPass);

  const bloomPass = new THREE.UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.0,    // strength
    0.1,    // radius
    1.0    // threshold
  );
  composer.addPass(bloomPass);

  // OrbitControls
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  //Lighting (emissive objeler için aydınlatma azaltılabilir)
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.005);
  scene.add(ambientLight);

  //const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  //directionalLight.position.set(10, 5, 5);
  //scene.add(directionalLight);

  const pointLight = new THREE.PointLight(0xffffff, 1, 100);
  //pointLight.position.set(10, 10, 10);
  pointLight.position.set(0, 0, 0);
  scene.add(pointLight);

  mouseLight = new THREE.PointLight(0xc941eb, 1, 50);
  mouseLight.position.set(0, 0, 0);
  scene.add(mouseLight);
  // Mouse'da görünen glowing küre
  const glowGeometry = new THREE.SphereGeometry(0.1, 8, 8);
  const glowMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xc941eb,
    emissive: 0xc941eb,
    emissiveIntensity: 2,
    transparent: true,
    opacity: 0.6,
    metalness: 0,
    roughness: 0,
    clearcoat: 1
  });

  mouseGlowSphere = new THREE.Mesh(glowGeometry, glowMaterial);
  scene.add(mouseGlowSphere);

  // Partikülleri oluştur ve ekle
  const particles = createMouseParticles();
  mouseGlowSphere.add(particles);
  mouseGlowSphere.particles = particles; // Referansı sakla

  // Raycaster
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  lastHovered = null;


  // Create spheres
  createSpheres();

  // Create connections
  createConnections();

  // Create Title
  createGlowingTitle();

  // Events
  window.addEventListener('resize', onWindowResize);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('click', onClick);
}

function createGlowingTitle() {
  // Fiziksel küre oluştur
  const titleGeometry = new THREE.TorusKnotGeometry( 1, 0.21, 64, 12 ); 

  const titleMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0x00ffff),
    emissive: new THREE.Color(0x00ffff),
    emissiveIntensity: 0.025,
    metalness: 0.5,
    roughness: 0.4,
    transparent: true,
    opacity: 0.75,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    transmission: 0.6
  });
  
  const titleSphere = new THREE.Mesh(titleGeometry, titleMaterial);
  titleSphere.position.set(0, 0, 0); // Sayfanın tepesine yerleştir
  titleSphere.userData = { başlık: "ProjectYB RoadMap", açıklama: "Ana başlık", tarih: "", durum: "Aktif" };
  titleSphere.isRoadmapSphere = true;
  scene.add(titleSphere);
  spheres.push(titleSphere); // Fizik etkileşimi için listeye ekle

  // 3D Text for title
  const titleText = createTextSprite("ProjectYB RoadMap", {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white'
  });
  titleText.position.y = 2.5;
  titleText.scale.multiplyScalar(1.5);
  titleSphere.add(titleText);
}

function createSpheres() {
  const radius = 8;
  // const sphereRadius = 2.5;
  var sphereRadius = 2.5;

  roadmapData.forEach((item, i) => {
    sphereRadius = sphereRadius * 0.90
    const angle = ((i / roadmapData.length) * Math.PI * 2) - 30; // Başlangıç açısını yukarı kaydır);
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const z = Math.sin(angle * 2) * 2;

    // Liquid glass material
    const material = new THREE.MeshPhysicalMaterial({
      color: item.durum.includes('Yapım') || item.durum.includes('Tamamlandı') 
        ? new THREE.Color(0x6fbd66) 
        : new THREE.Color(0xff6b00),
        // : new THREE.Color(0x8b5cf6), // mor
      
      transmission: item.durum.includes('Yapım') || item.durum.includes('Tamamlandı') 
        ? 0.9
        : 0.9,
      emissive: item.durum.includes('Yapım') || item.durum.includes('Tamamlandı') 
        ? new THREE.Color(0x6fbd66) 
        : new THREE.Color(0xff6b00),
      emissiveIntensity: item.durum.includes('Yapım') || item.durum.includes('Tamamlandı') 
        ? 0.015 
        : 0,
        
      metalness: 0.01,
      roughness: 0.3,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      transparent: true,
      opacity: 0.6,
      reflectivity: 0.8,
      //side: THREE.DoubleSide
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
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white'
  });
  titleText.position.y = sphereRadius + 0.8;
  parentSphere.add(titleText);

  // Tarih ve durum için text
  const infoText = createTextSprite(`${item.tarih} - ${item.durum}`, {
    fontSize: 32,
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
  sprite.isTextSprite = true;
  
  return sprite;
}

function createConnections2() {
  const material = new THREE.LineBasicMaterial({ 
    color: 0xffffff, 
    transparent: true, 
    opacity: 0.8 
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

function createConnections() { //star
  const material = new THREE.LineBasicMaterial({ 
    color: 0xffffff, 
    transparent: true, 
    opacity: 0.6 
  });
  
  const material2 = new THREE.LineBasicMaterial({ 
    color: 0x222222, 
    transparent: true, 
    opacity: 0.1 
  });

  const a = spheres[0].position.clone();
  const b = spheres[spheres.length - 1].position.clone();

  const mid = a.clone().add(b).multiplyScalar(0.5);  // (A+B)/2
  const control = mid.clone().multiplyScalar(0.5);   // ((A+B)/2)/2

  const points = [a, control, b];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const line = new THREE.Line(geometry, material2);
  scene.add(line);
  lines.push(line);

  for (let i = 0; i < spheres.length - 1; i++) {
    const a = spheres[i].position.clone();
    const b = spheres[i + 1].position.clone();

    const mid = a.clone().add(b).multiplyScalar(0.5);  // (A+B)/2
    const control = mid.clone().multiplyScalar(0.5);   // ((A+B)/2)/2

    const points = [a, control, b];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, material);
    scene.add(line);
    lines.push(line);
  }
}

function createConnections3() { // bezier curve 
  const material = new THREE.LineBasicMaterial({ 
    color: 0xffffff, 
    transparent: true, 
    opacity: 0.8 
  });

    
  const material2 = new THREE.LineBasicMaterial({ 
    color: 0x222222, 
    transparent: true, 
    opacity: 0.1 
  });
  
  const ORIGIN = new THREE.Vector3(); // (0,0,0)
  const SEGMENTS = 32;                // eğri örnek sayısı
  const bend = 0.5;                   // 0=hiç içeri çekme, 1=merkeze kadar

  const a = spheres[0].position.clone();
  const b = spheres[spheres.length - 1].position.clone();

  // Orta nokta ve içeri çekilmiş kontrol noktası:
  const mid = a.clone().add(b).multiplyScalar(0.5);
  const control = mid.clone().lerp(ORIGIN, bend); // mid * (1 - bend) çünkü origin 0

  const curve = new THREE.QuadraticBezierCurve3(a, control, b);
  const pts = curve.getPoints(SEGMENTS);

  const geometry = new THREE.BufferGeometry().setFromPoints(pts);
  const line = new THREE.Line(geometry, material);
  scene.add(line);
  lines.push(line);

  for (let i = 0; i < spheres.length - 1; i++) {
    const a = spheres[i].position.clone();
    const b = spheres[i + 1].position.clone();

    // Orta nokta ve içeri çekilmiş kontrol noktası:
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const control = mid.clone().lerp(ORIGIN, bend); // mid * (1 - bend) çünkü origin 0

    const curve = new THREE.QuadraticBezierCurve3(a, control, b);
    const pts = curve.getPoints(SEGMENTS);

    const geometry = new THREE.BufferGeometry().setFromPoints(pts);
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

  // Mouse konumunu 3D dünyaya çevir
  const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
  vector.unproject(camera);
  const dir = vector.sub(camera.position).normalize();
  const distance = -camera.position.z / dir.z;
  const pos = camera.position.clone().add(dir.multiplyScalar(distance));
  
  // Global pozisyonu güncelle
  mouseWorldPosition.copy(pos);
  lastMouseMoveTime = Date.now();

  // Mouse light'ı mouse pozisyonuna yerleştir
  if (mouseLight) {
    mouseLight.position.copy(pos);
  }
  
  // Mouse glowing küresini mouse pozisyonuna yerleştir
  if (mouseGlowSphere) {
    mouseGlowSphere.position.copy(pos);
  }
}


function onClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(spheres);

  if (intersects[0].object.userData.başlık) {
    const object = intersects[0].object;
    //alert(`${object.userData.başlık}: \n ${object.userData.açıklama} \n\n Tahmini Tarih: ${object.userData.tarih} | Durum: ${object.userData.durum}`);
  }
}

function onHover(event) {
  // 1) Mouse'u canvas'a göre normalize et
  const rect = renderer.domElement.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width;
  const y = (event.clientY - rect.top) / rect.height;
  mouse.x =  x * 2 - 1;
  mouse.y = -y * 2 + 1;

  // 2) Raycast
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(spheres, true); // çocukları da tara

  if (intersects.length > 0) {
    const hit = intersects[0].object;

    // 3) userData kontrolü
    if (hit.userData && hit.userData.başlık) {
      // her harekette renk değiştirmek istemiyorsan bu satırı koşullu yap
      if (lastHovered !== hit) {
        hit.scale.set(0.9 + Math.random()/4, 0.9 + Math.random()/4, 0.9 + Math.random()/4);
      }
      showTooltip(hit, event);
      lastHovered = hit;
    } else {
      hideTooltip();
      lastHovered = null;
    }
  } else {
    hideTooltip();
    lastHovered = null;
  }

  // 4) Render
  renderer.render(scene, camera);
}

function showTooltip(object, event) {
  const data = object.userData;

  tooltip.querySelector('h3').textContent = data.başlık || '';
  tooltip.querySelector('p').textContent = data.açıklama || '';
  tooltip.querySelector('div').textContent = `${data.tarih || ''} - ${data.durum || ''}`;

  // Tooltip konumlandırma (scroll'u hesaba kat)
  const offset = 12;
  const left = event.clientX + window.scrollX + offset;
  const top  = event.clientY + window.scrollY + offset;

  tooltip.style.display = 'block';
  tooltip.style.position = 'absolute'; // ya da 'fixed' istiyorsan scrollX/Y ekleme
  tooltip.style.left = left + 'px';
  tooltip.style.top = top + 'px';
}

function hideTooltip() {
  tooltip.style.display = 'none';
}

function createMouseParticles() {
  const particleCount = 3;
  const particles = new THREE.Group();
  
  for (let i = 0; i < particleCount; i++) {
    const geometry = new THREE.SphereGeometry(0.08, 6, 6);
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xc941eb,
      emissive: 0xc941eb,
      emissiveIntensity: 1,
      transparent: true,
      opacity: 0.7,
      metalness: 0,
      roughness: 0
    });
    const particle = new THREE.Mesh(geometry, material);
    
    // Dairesel düzen
    const angle = (i / particleCount) * Math.PI * 2;
    const distance = 0.5;
    particle.position.set(
      Math.cos(angle) * distance,
      Math.sin(angle) * distance,
      0
    );
    
    particle.userData = { angle: angle, originalDistance: distance };
    particles.add(particle);
  }
  
  return particles;
}

function animate() {
  requestAnimationFrame(animate);
  
  const time = Date.now() * 0.005;
  const currentTime = Date.now();
  
  // Başlık animasyonu
  const titleSphere = spheres[spheres.length - 1];
  if (titleSphere && titleSphere.material) {
    const hue = (time * 0.01) % 1;
    const color = new THREE.Color().setHSL(hue, 0.5, 0.5);
    titleSphere.material.emissive = color;
    titleSphere.material.color = color;
  }

  // Kürelerde hafif dönüş animasyonu
  spheres.forEach(sphere => {
    sphere.rotation.x += 0.005;
    sphere.rotation.y += 0.005;
    
    sphere.children.forEach(child => {
      if (child instanceof THREE.Sprite) {
        child.quaternion.copy(camera.quaternion);
      }
    });
  });

  // Mouse glowing küresi ve partiküller (HER ZAMAN)
  if (mouseGlowSphere) {
    // Mouse pozisyonunu sürekli güncelle
    mouseGlowSphere.position.copy(mouseWorldPosition);
    
    // Zaman bazlı animasyon
    const time = Date.now() * 0.005;
    const currentTime = Date.now();
    
    // Küreye rainbow renk
    const hue = (time * 0.1) % 1;
    const color = new THREE.Color().setHSL(hue, 1, 0.7);
    mouseGlowSphere.material.emissive = color;
    mouseGlowSphere.material.color = color;
    
    // Küçük pulsing efekti
    const scale = 0.6 + Math.sin(time * 5) * 0.15;
    mouseGlowSphere.scale.set(scale, scale, scale);
    
    // MOUSE IŞIĞI RADIUS VE FADE KONTROLÜ
    const timeSinceMove = currentTime - lastMouseMoveTime;
    const maxRadius = 10; // Maksimum etki alanı
    const minRadius = 2;  // Minimum etki alanı
        
    const fadeFactor = Math.exp(-timeSinceMove / 2000); // 2 saniyelik half-life
    let currentRadius = minRadius + (maxRadius - minRadius) * fadeFactor;
    let lightIntensity = 0.5 + (1.0 * fadeFactor);

    if (timeSinceMove > 1000) {
      // 1 saniyeden sonra lineer azalma
      const fadeProgress = Math.min(1, (timeSinceMove - 1000) / 3000); // 3 saniyede tamamen kaybol
      currentRadius = Math.max(minRadius, currentRadius);
      lightIntensity = Math.max(0, lightIntensity);
      
      // Tamamen kaybolma
      if (fadeProgress >= 1.5) {
        currentRadius = minRadius;
        lightIntensity = 0;
      }
    }
    
    // Mouse light radius ve intensity güncelle
    if (mouseLight) {
      mouseLight.distance = currentRadius;
      mouseLight.intensity = lightIntensity;
    }
    
    // Partikül animasyonu
    if (mouseGlowSphere.particles) {
      mouseGlowSphere.particles.rotation.z = time * 0.25;
      
      mouseGlowSphere.particles.children.forEach((particle, i) => {
        // Partiküllerin dairesel hareketi
        const userData = particle.userData;
        const newAngle = userData.angle + time * 0.15;
        const distance = userData.originalDistance + Math.sin(time * 2.0 + i) * 2.0;
        
        particle.position.x = Math.cos(newAngle) * distance;
        particle.position.y = Math.sin(newAngle) * distance;
        
        // Partikül renk değişimi
        const particleHue = (hue + i * 0.8) % 1;
        const particleColor = new THREE.Color().setHSL(particleHue, 1, 0.7);
        particle.material.emissive = particleColor;
        particle.material.color = particleColor;
        
        // Partikül pulsing ve fade
        const particleScale = 0.6 + Math.sin(time * 4 + i) * 0.5;
        particle.scale.set(particleScale, particleScale, particleScale);
        
        // Partikül opacity fade
        const particleOpacity = Math.max(0.1, mouseGlowSphere.material.opacity * 0.7);
        particle.material.opacity = particleOpacity;
      });
    }
    
    // Ana küre opacity fade
    const fadeProgress = Math.min(1, timeSinceMove / 4000); // 4 saniyede fade
    const finalOpacity = Math.max(0.1, 0.9 - (0.8 * fadeProgress));
    mouseGlowSphere.material.opacity = finalOpacity;
  }
  controls.update();
  
  // Bloom efektli render
  if (composer && typeof composer.render === 'function') {
    composer.render();
  } else {
    renderer.render(scene, camera);
  }
}
