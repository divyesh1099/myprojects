import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

// ----------------------------------------------------
//  SCENE, CAMERA, RENDERER
// ----------------------------------------------------
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 2, 5);

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("scene"),
  antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;

// OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.enableDamping = true;
controls.dampingFactor = 0.05;
let userRotated = false;
controls.addEventListener("start", () => (userRotated = true));
controls.addEventListener("end", () => (userRotated = false));

// ----------------------------------------------------
//  HDR BACKGROUND (optional)
// ----------------------------------------------------
const rgbeLoader = new RGBELoader();
rgbeLoader.setDataType(THREE.UnsignedByteType);
rgbeLoader.load(
  '/assets/space.hdr',
  (texture) => {
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    scene.environment = envMap;
    scene.background = envMap;
    texture.dispose();
    pmremGenerator.dispose();
  },
  undefined,
  (error) => {
    console.error("HDR file load error:", error);
    // fallback: black background
    scene.background = new THREE.Color(0x000000);
    scene.environment = null;
  }
);

// ----------------------------------------------------
//  STARFIELD
// ----------------------------------------------------
const starGeometry = new THREE.BufferGeometry();
const starCount = 1000;
const starPositions = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
  starPositions[i * 3] = THREE.MathUtils.randFloatSpread(200);
  starPositions[i * 3 + 1] = THREE.MathUtils.randFloatSpread(200);
  starPositions[i * 3 + 2] = THREE.MathUtils.randFloatSpread(200);
}
starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 });
const starField = new THREE.Points(starGeometry, starMaterial);
scene.add(starField);

// ----------------------------------------------------
//  POST-PROCESSING (Bloom)
// ----------------------------------------------------
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.5,  // strength
  0.4,  // radius
  0.85  // threshold
);
composer.addPass(bloomPass);

// ----------------------------------------------------
//  LOADERS
// ----------------------------------------------------
const loader = new GLTFLoader();
const fontLoader = new FontLoader();

// Drone & Planets
let drone;
let planets;
const moveSpeed = 0.05;
const rotateSpeed = 0.02; // Slightly slower rotation
const keysPressed = {};

// ----------------------------------------------------
//  PLANET PROJECT DATA
// ----------------------------------------------------
const planetProjects = {
  mercury_2: { title: "Mercury Project", description: "Research on Mercury." },
  venus_5:   { title: "Venus Project",   description: "Exploring Venusian mysteries." },
  erath_8:   { title: "Earth Project",   description: "Terrestrial beauty meets tech." },
  mars_12:   { title: "Mars Project",    description: "Alien colonization on Mars." },
  jupiter_15:{ title: "Jupiter Project", description: "Swirling alien atmospheres." },
  saturn_19: { title: "Saturn Project",  description: "Rings of innovation." },
  uranus_22: { title: "Uranus Project",  description: "Beyond earthly norms." },
  neptune_25:{ title: "Neptune Project", description: "Deep blue extraterrestrial secrets." },
  pluto_28:  { title: "Pluto Project",   description: "Small but huge discoveries." },
  sun_53:    { title: "❤️ Moti",        description: "Special dedication." }
};

// ----------------------------------------------------
//  LOAD DRONE GLTF (removing ground, if any)
// ----------------------------------------------------
loader.load("/assets/drone/buster_drone.glb", (gltf) => {
  drone = gltf.scene;
  drone.scale.set(0.5, 0.5, 0.5);
  drone.position.set(0, 1, 0);

  drone.traverse((child) => {
    const lower = child.name.toLowerCase();
    // remove ground mesh
    if (lower.includes("ground") || lower.includes("floor")) {
      child.parent.remove(child);
    }
    // cast shadows
    if (child.isMesh) {
      child.castShadow = true;
    }
  });

  scene.add(drone);
});

// ----------------------------------------------------
//  ALIEN SHADER (for Planets)
// ----------------------------------------------------
const alienShaderMaterial = new THREE.ShaderMaterial({
  uniforms: { time: { value: 1.0 } },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float time;
    varying vec2 vUv;
    float random(in vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }
    void main() {
      float n = random(vUv * time * 3.0);
      // Alien color combo
      gl_FragColor = vec4(n, 0.3 + 0.7*n, 1.0 - n, 1.0);
    }
  `
});

// ----------------------------------------------------
//  LOAD PLANETS GLTF, reduce glow from any "BezierCircle"
// ----------------------------------------------------
loader.load("/assets/planets/solar_system_animation.glb", (gltf) => {
  planets = gltf.scene;
  planets.position.set(0, 0, -3); // Bring them closer

  // We can also attempt to find "BezierCircle" objects & reduce glow
  gltf.scene.traverse((child) => {
    if (child.name.toLowerCase().includes("beziercircle")) {
      if (child.material && child.material.emissive) {
        child.material.emissiveIntensity = 0.1; // reduce glow
      }
    }
    // Apply alien shader to recognized planet meshes
    if (planetProjects[child.name] && child.isMesh) {
      child.material = alienShaderMaterial.clone();
      child.material.needsUpdate = true;
    }
  });

  scene.add(planets);
});

// ----------------------------------------------------
//  LIGHTING
// ----------------------------------------------------
scene.add(new THREE.AmbientLight(0xffffff, 0.4));
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7.5);
directionalLight.castShadow = true;
scene.add(directionalLight);

// ----------------------------------------------------
//  BLACK HOLE (DUST BIN)
// ----------------------------------------------------
const blackHoleRadius = 1.5;
let blackHole;
{
  // Custom swirl shader for black hole
  const blackHoleUniforms = {
    iTime: { value: 0 },
    iResolution: { value: new THREE.Vector2(512, 512) },
  };

  const blackHoleMat = new THREE.ShaderMaterial({
    uniforms: blackHoleUniforms,
    vertexShader: `
      varying vec2 vUv;
      void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform float iTime;
      void main() {
        // A swirling black hole effect
        vec2 uv = vUv - 0.5;
        float r = length(uv);
        float angle = atan(uv.y, uv.x);
        angle += r * 10.0 - iTime * 2.0;
        float swirl = cos(angle)*0.5 + 0.5;
        // fade out near center
        float fade = smoothstep(0.0, 0.5, r);
        vec3 col = mix(vec3(0.0), vec3(swirl, 0.0, swirl), fade);
        gl_FragColor = vec4(col,1.0);
      }
    `,
    side: THREE.DoubleSide
  });

  // Sphere geometry
  const blackHoleGeo = new THREE.SphereGeometry(blackHoleRadius, 32, 32);
  blackHole = new THREE.Mesh(blackHoleGeo, blackHoleMat);
  blackHole.position.set(-5, 1, 0); // Place it somewhere interesting
  blackHole.name = "BlackHole";
  blackHole.receiveShadow = true;
  scene.add(blackHole);
}

// ----------------------------------------------------
//  VALUABLE COLLECTIBLES (Crystals)
// ----------------------------------------------------
const valuables = [];
let score = 0; // track collected items

function createValuable(position) {
  // Simple gem shape: an Octahedron
  const geometry = new THREE.OctahedronGeometry(0.3);
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(`hsl(${Math.random()*360}, 80%, 50%)`),
    roughness: 0.2,
    metalness: 0.7
  });

  const valuable = new THREE.Mesh(geometry, material);
  valuable.position.copy(position);
  valuable.castShadow = true;
  scene.add(valuable);
  valuables.push(valuable);
}

// Create a few valuables scattered around
for (let i = 0; i < 8; i++) {
  const pos = new THREE.Vector3(
    (Math.random() - 0.5) * 15,
    1,
    (Math.random() - 0.5) * 15
  );
  createValuable(pos);
}

// ----------------------------------------------------
//  HUD / SCORE DISPLAY
// ----------------------------------------------------
const scoreboardEl = document.createElement("div");
scoreboardEl.id = "scoreboard";
scoreboardEl.style.position = "fixed";
scoreboardEl.style.top = "10px";
scoreboardEl.style.right = "10px";
scoreboardEl.style.color = "#fff";
scoreboardEl.style.fontFamily = "Arial, sans-serif";
scoreboardEl.style.fontSize = "20px";
scoreboardEl.innerText = "Score: 0";
document.body.appendChild(scoreboardEl);

function updateScoreDisplay() {
  scoreboardEl.innerText = `Score: ${score}`;
}

// ----------------------------------------------------
//  EVENT LISTENERS
// ----------------------------------------------------
window.addEventListener("keydown", e => { keysPressed[e.key.toLowerCase()] = true; });
window.addEventListener("keyup", e => { keysPressed[e.key.toLowerCase()] = false; });

// Raycaster (for clicking planets)
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
window.addEventListener("click", onMouseClick, false);

function onMouseClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  if (planets) {
    const intersects = raycaster.intersectObjects(planets.children, true);
    if (intersects.length > 0) {
      const selected = intersects[0].object;
      if (planetProjects[selected.name]) {
        const { title, description } = planetProjects[selected.name];
        showProjectModal(title, description);
      }
    }
  }
}

// ----------------------------------------------------
//  MODAL FOR PROJECT INFO
// ----------------------------------------------------
function showProjectModal(title, description, link) {
  const modal = document.getElementById("projectModal");
  if (!modal) return;

  document.getElementById("projectTitle").textContent = title;
  document.getElementById("projectDesc").textContent = description;
  const linkEl = document.getElementById("projectLink");
  if (linkEl) linkEl.href = link || "#";

  modal.style.display = "block";
  modal.style.opacity = 1;
  setTimeout(() => {
    modal.style.opacity = 0;
    setTimeout(() => (modal.style.display = "none"), 500);
  }, 4000);
}

// ----------------------------------------------------
//  GLOW / MOTI SPRITE
// ----------------------------------------------------
function addGlowEffect(object) {
  // reduced glow
  if (!object.getObjectByName("glowMesh")) {
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.3 // made less intense
    });
    const glowGeometry = new THREE.SphereGeometry(1.2, 32, 32);
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    glowMesh.name = "glowMesh";
    object.add(glowMesh);
  }
}

function addMotiSprite(sun) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "rgba(0,0,0,0)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = "bold 48px Arial";
  ctx.fillStyle = "#ffee00";
  ctx.textAlign = "center";
  ctx.fillText("Moti❤️", canvas.width / 2, canvas.height / 2 + 16);

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true
  });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(0.8, 0.4, 1);
  sprite.position.set(0, 0, 0);
  sprite.name = "motiSprite";
  sun.add(sprite);
}

// ----------------------------------------------------
//  PLANET ORBITS
// ----------------------------------------------------
const planetOrbitData = {}; // { planetName: { orbitRadius, angle, speed } }

function setupPlanetOrbits() {
  if (!planets) return;

  // find the sun
  let sun = planets.getObjectByName("sun_53");
  if (!sun) return;

  // For each planet
  planets.traverse((obj) => {
    if (planetProjects[obj.name] && obj.name !== "sun_53") {
      // Slower speeds, smaller orbits
      planetOrbitData[obj.name] = {
        orbitRadius: THREE.MathUtils.randFloat(2.0, 4.0),
        angle: Math.random() * Math.PI * 2,
        speed: THREE.MathUtils.randFloat(0.0002, 0.0007)  // slower
      };
      // Move them to initial position
      updatePlanetOrbit(obj);
    }
  });
}

function updatePlanetOrbit(planet) {
  const data = planetOrbitData[planet.name];
  if (!data) return;
  data.angle += data.speed;

  // revolve in XZ-plane around local 0,0
  let x = data.orbitRadius * Math.cos(data.angle);
  let z = data.orbitRadius * Math.sin(data.angle);
  let y = planet.position.y; // keep same height
  planet.position.set(x, y, z);
}

// ----------------------------------------------------
//  COLLISIONS
// ----------------------------------------------------
// 1) Drone with Planets (shows modal).
// 2) Drone with Collectibles (increase score).
// 3) Valuables with Black Hole (they get removed).
function checkCollisions() {
  if (!drone) return;

  // Drone bounding sphere
  const droneBox = new THREE.Box3().setFromObject(drone);
  const droneSphere = new THREE.Sphere();
  droneBox.getBoundingSphere(droneSphere);

  // A) Drone <-> Planets
  if (planets) {
    planets.traverse((obj) => {
      if (planetProjects[obj.name]) {
        const planetBox = new THREE.Box3().setFromObject(obj);
        const planetSphere = new THREE.Sphere();
        planetBox.getBoundingSphere(planetSphere);

        if (droneSphere.intersectsSphere(planetSphere)) {
          // collision -> show modal
          const { title, description } = planetProjects[obj.name];
          showProjectModal(title, description);
        }
      }
    });
  }

  // B) Drone <-> Valuables
  valuables.forEach((val, idx) => {
    if (!val) return;
    const valBox = new THREE.Box3().setFromObject(val);
    const valSphere = new THREE.Sphere();
    valBox.getBoundingSphere(valSphere);

    if (droneSphere.intersectsSphere(valSphere)) {
      // collected
      score += 1;
      updateScoreDisplay();

      // remove from scene & array
      scene.remove(val);
      valuables[idx] = null;
    }
  });

  // C) Valuables <-> Black Hole
  // If they get near black hole, we remove them (like a dust bin)
  if (blackHole) {
    const holeBox = new THREE.Box3().setFromObject(blackHole);
    const holeSphere = new THREE.Sphere();
    holeBox.getBoundingSphere(holeSphere);

    valuables.forEach((val, idx) => {
      if (!val) return;
      // bounding sphere for the valuable
      const vb = new THREE.Box3().setFromObject(val);
      const vsphere = new THREE.Sphere();
      vb.getBoundingSphere(vsphere);

      // If within blackHoleRadius *some factor*, remove
      if (holeSphere.intersectsSphere(vsphere)) {
        scene.remove(val);
        valuables[idx] = null;
      }
    });
  }
}

// ----------------------------------------------------
//  SEARCH
// ----------------------------------------------------
document.getElementById("searchBtn")?.addEventListener("click", () => {
  const input = document.getElementById("planetSearch");
  if (!input) return;
  const query = input.value.toLowerCase();

  if (planets) {
    planets.traverse((object) => {
      if (object.name && object.name.toLowerCase().includes(query)) {
        const targetPosition = new THREE.Vector3();
        object.getWorldPosition(targetPosition);
        // move camera near planet
        camera.position.lerp(
          targetPosition.clone().add(new THREE.Vector3(0, 2, 5)),
          0.1
        );
        controls.target.copy(targetPosition);

        addGlowEffect(object);
        if (planetProjects[object.name]) {
          const { title, description } = planetProjects[object.name];
          showProjectModal(title, description);
        }
      }
    });
  }
});

// ----------------------------------------------------
//  ANIMATION LOOP
// ----------------------------------------------------
function animate() {
  requestAnimationFrame(animate);

  // Drone movement
  if (drone) {
    if (keysPressed["w"]) drone.translateZ(-moveSpeed);
    if (keysPressed["s"]) drone.translateZ(moveSpeed);
    if (keysPressed["a"]) drone.translateX(-moveSpeed);
    if (keysPressed["d"]) drone.translateX(moveSpeed);
    if (keysPressed["q"]) drone.rotation.y += rotateSpeed;
    if (keysPressed["e"]) drone.rotation.y -= rotateSpeed;

    // Spin the rotor blades
    drone.traverse(child => {
      let n = child.name.toLowerCase();
      if (n.includes("blade")) {
        child.rotation.y += 0.5;
      }
    });

    // Smooth camera behind drone if user isn’t orbiting
    if (!userRotated) {
      const offset = new THREE.Vector3(0, 2, 5)
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), drone.rotation.y);
      const idealPosition = drone.position.clone().add(offset);
      camera.position.lerp(idealPosition, 0.05);
      controls.target.copy(drone.position);
    }
  }

  // Starfield subtle motion
  const arr = starField.geometry.attributes.position.array;
  for (let i = 0; i < arr.length; i++) {
    arr[i] += (Math.random() - 0.5) * 0.0003;
  }
  starField.geometry.attributes.position.needsUpdate = true;

  // Animate black hole swirl
  if (blackHole && blackHole.material && blackHole.material.uniforms) {
    blackHole.material.uniforms.iTime.value += 0.01;
  }

  // Animate Planets
  if (planets) {
    const sun = planets.getObjectByName("sun_53");
    if (sun && !sun.getObjectByName("motiSprite")) {
      addMotiSprite(sun);
    }
    planets.traverse(obj => {
      if (planetOrbitData[obj.name]) {
        updatePlanetOrbit(obj);
      }
    });
  }

  // Check collisions
  checkCollisions();

  // Update alien shader time
  alienShaderMaterial.uniforms.time.value += 0.01;

  controls.update();
  composer.render();
}
animate();

// ----------------------------------------------------
//  INITIAL SETUP
// ----------------------------------------------------
setTimeout(() => {
  setupPlanetOrbits();
}, 2000); // wait for glTF to load

// Resize handling
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});
