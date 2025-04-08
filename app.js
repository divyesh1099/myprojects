import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';

// Scene setup
const scene = new THREE.Scene();

// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 5);

// Renderer setup
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('scene'), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;

// Controls setup
const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Loaders
const loader = new GLTFLoader();
const fontLoader = new FontLoader();

// Drone variables
let drone;
const moveSpeed = 0.05;
const rotateSpeed = 0.03;
const keysPressed = {};
let userRotated = false;

// Project details mapped to planets
const planetProjects = {
  "mercury_2": { title: "Mercury Project", description: "Description of Mercury project." },
  "venus_5": { title: "Venus Project", description: "Description of Venus project." },
  "erath_8": { title: "Earth Project", description: "Description of Earth project." },
  "mars_12": { title: "Mars Project", description: "Description of Mars project." },
  "jupiter_15": { title: "Jupiter Project", description: "Description of Jupiter project." },
  "saturn_19": { title: "Saturn Project", description: "Description of Saturn project." },
  "uranus_22": { title: "Uranus Project", description: "Description of Uranus project." },
  "neptune_25": { title: "Neptune Project", description: "Description of Neptune project." },
  "pluto_28": { title: "Pluto Project", description: "Description of Pluto project." },
  "sun_53": { title: "❤️Moti", description: "Special dedication." }
};

// Load Drone Model
loader.load('/assets/drone/buster_drone.glb', (gltf) => {
    drone = gltf.scene;
    drone.scale.set(0.5, 0.5, 0.5);
    drone.position.set(0, 1, 0);
    scene.add(drone);
});

// Load Planets Model
let planets;
loader.load('/assets/planets/solar_system_animation.glb', (gltf) => {
    planets = gltf.scene;
    planets.position.set(-5, 0, -10);
    planets.traverse((child) => console.log(child.name));
    scene.add(planets);
});

// Skybox setup
const cubeTextureLoader = new THREE.CubeTextureLoader();
scene.background = cubeTextureLoader.load([
    '/assets/skybox/skybox/right.png',
    '/assets/skybox/skybox/left.png',
    '/assets/skybox/skybox/top.png',
    '/assets/skybox/skybox/bottom.png',
    '/assets/skybox/skybox/front.png',
    '/assets/skybox/skybox/back.png'
]);

// Lighting
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// Event listeners
window.addEventListener('keydown', (e) => keysPressed[e.key.toLowerCase()] = true);
window.addEventListener('keyup', (e) => keysPressed[e.key.toLowerCase()] = false);
controls.addEventListener('start', () => { userRotated = true; });
controls.addEventListener('end', () => { userRotated = false; });

// Helper functions
function addGlowEffect(object) {
    const glowMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.5 });
    const glowGeometry = new THREE.SphereGeometry(1.2, 32, 32);
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    glowMesh.name = "glowMesh";
    object.add(glowMesh);
}

function addProjectScreen(object, title) {
    const geometry = new THREE.PlaneGeometry(2, 1);
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title, canvas.width / 2, canvas.height / 2);
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    const screen = new THREE.Mesh(geometry, material);
    screen.name = "infoText";
    screen.position.set(0, 1.5, 1.2);
    screen.lookAt(camera.position);
    object.add(screen);
}

function addMotiText(object) {
    fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
        const textGeometry = new TextGeometry('❤️ Moti', {
            font: font,
            size: 0.5,
            height: 0.05
        });
        const material = new THREE.MeshBasicMaterial({ color: 0xff66cc });
        const mesh = new THREE.Mesh(textGeometry, material);
        mesh.position.set(-1.5, 1.5, 0);
        mesh.name = "motiText";
        object.add(mesh);
    });
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    if (drone) {
        if (keysPressed['w']) drone.translateZ(-moveSpeed);
        if (keysPressed['s']) drone.translateZ(moveSpeed);
        if (keysPressed['a']) drone.translateX(-moveSpeed);
        if (keysPressed['d']) drone.translateX(moveSpeed);
        if (keysPressed['q']) drone.rotation.y += rotateSpeed;
        if (keysPressed['e']) drone.rotation.y -= rotateSpeed;

        drone.traverse(child => {
            if (["drone_turb_blade_l", "drone_turb_blade_r"].includes(child.name.toLowerCase()))
                child.rotation.y += 0.5;
        });

        if (!userRotated) {
            const offset = new THREE.Vector3(0, 2, 5).applyAxisAngle(new THREE.Vector3(0, 1, 0), drone.rotation.y);
            const idealPosition = drone.position.clone().add(offset);
            camera.position.lerp(idealPosition, 0.05);
            controls.target.copy(drone.position);
        }

        if (planets) {
            planets.traverse(object => {
                if (planetProjects[object.name]) {
                    const distance = drone.position.distanceTo(object.getWorldPosition(new THREE.Vector3()));
                    if (distance < 2) {
                        if (!object.getObjectByName("glowMesh")) addGlowEffect(object);
                        if (!object.getObjectByName("infoText")) addProjectScreen(object, planetProjects[object.name].title);
                        if (object.name === "sun_53" && !object.getObjectByName("motiText")) {
                            addMotiText(object);
                        }
                    } else {
                        const glow = object.getObjectByName("glowMesh");
                        const text = object.getObjectByName("infoText");
                        if (glow) object.remove(glow);
                        if (text) object.remove(text);
                    }
                }
            });
        }
    }

    controls.update();
    renderer.render(scene, camera);
}
animate();
