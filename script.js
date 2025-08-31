// Remove loading screen when page is loaded
window.addEventListener('load', () => {
    setTimeout(() => {
        document.getElementById('loading').style.display = 'none';
        init();
    }, 1500);
});

let scene, camera, renderer, controls;
let planets = [];
let animationSpeed = 1;
let selectedPlanet = null;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();

function init() {
    // Create scene
    scene = new THREE.Scene();

    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 50, 100);

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    document.getElementById('container').appendChild(renderer.domElement);

    // Add orbit controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 20;
    controls.maxDistance = 500;

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);

    // Add directional light (sun light)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 0, 0);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Add stars background
    addStars();

    // Create sun and planets
    createSun();
    createPlanets();

    // Add event listeners
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('click', onDocumentClick, false);

    // Start animation
    animate();
}

function addStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.1,
        transparent: true
    });

    const starsVertices = [];
    for (let i = 0; i < 5000; i++) {
        const x = (Math.random() - 0.5) * 2000;
        const y = (Math.random() - 0.5) * 2000;
        const z = (Math.random() - 0.5) * 2000;
        starsVertices.push(x, y, z);
    }

    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
}

function createSun() {
    const sunGeometry = new THREE.SphereGeometry(10, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        emissive: 0xffff00,
        emissiveIntensity: 1
    });

    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.name = "Sun";
    scene.add(sun);

    // Add sun glow
    const sunGlowGeometry = new THREE.SphereGeometry(12, 32, 32);
    const sunGlowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        transparent: true,
        opacity: 0.5
    });

    const sunGlow = new THREE.Mesh(sunGlowGeometry, sunGlowMaterial);
    sun.add(sunGlow);
}

function createPlanets() {
    const planetData = [
        { name: "Mercury", color: 0x8c8c8c, size: 0.8, distance: 28, speed: 0.04, info: "Closest to the Sun, Mercury is only slightly larger than Earth's Moon." },
        { name: "Venus", color: 0xe6c229, size: 1.5, distance: 44, speed: 0.015, info: "Similar in size to Earth, Venus is the hottest planet with a toxic atmosphere." },
        { name: "Earth", color: 0x3498db, size: 1.6, distance: 62, speed: 0.01, info: "Our home planet is the only known place in the universe confirmed to host life." },
        { name: "Mars", color: 0xc1440e, size: 1.2, distance: 78, speed: 0.008, info: "The Red Planet is home to the tallest mountain in the solar system." },
        { name: "Jupiter", color: 0xd8b08c, size: 3.5, distance: 100, speed: 0.002, info: "The largest planet in our solar system, a gas giant with a Great Red Spot." },
        { name: "Saturn", color: 0xf5e7b2, size: 3, distance: 130, speed: 0.0009, info: "Famous for its beautiful rings made of ice and rock particles." },
        { name: "Uranus", color: 0x7bcff1, size: 2.5, distance: 160, speed: 0.0004, info: "An ice giant that rotates on its side with a unique blue-green color." },
        { name: "Neptune", color: 0x5b5bff, size: 2.4, distance: 180, speed: 0.0001, info: "The windiest planet with the strongest winds in the solar system." }
    ];

    planetData.forEach((data, index) => {
        const planetGeometry = new THREE.SphereGeometry(data.size, 32, 32);
        const planetMaterial = new THREE.MeshStandardMaterial({
            color: data.color,
            roughness: 0.8,
            metalness: 0.2
        });

        const planet = new THREE.Mesh(planetGeometry, planetMaterial);
        planet.name = data.name;
        planet.position.x = data.distance;
        planet.castShadow = true;
        planet.receiveShadow = true;

        // Add orbit path
        const orbitGeometry = new THREE.RingGeometry(data.distance - 0.3, data.distance + 0.3, 64);
        const orbitMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.2
        });
        const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
        orbit.rotation.x = Math.PI / 2;
        scene.add(orbit);

        // Special case for Saturn's rings
        if (data.name === "Saturn") {
            const ringGeometry = new THREE.RingGeometry(4, 6, 32);
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: 0xe5e5e5,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.8
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.rotation.x = Math.PI / 2;
            planet.add(ring);
        }

        scene.add(planet);
        planets.push({
            mesh: planet,
            angle: Math.random() * Math.PI * 2,
            speed: data.speed,
            distance: data.distance,
            info: data.info
        });
    });
}

function animate() {
    requestAnimationFrame(animate);

    // Rotate planets around the sun
    planets.forEach(planet => {
        planet.angle += planet.speed * animationSpeed;
        planet.mesh.position.x = Math.cos(planet.angle) * planet.distance;
        planet.mesh.position.z = Math.sin(planet.angle) * planet.distance;

        // Rotate planet on its axis
        planet.mesh.rotation.y += 0.01;
    });

    controls.update();
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onDocumentClick(event) {
    // Calculate mouse position in normalized device coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the raycaster
    raycaster.setFromCamera(mouse, camera);

    // Calculate objects intersecting the ray
    const intersects = raycaster.intersectObjects(scene.children);

    if (intersects.length > 0) {
        const object = intersects[0].object;

        // Check if we clicked on a planet
        const planetInfo = planets.find(p => p.mesh === object || p.mesh.children.includes(object));

        if (planetInfo) {
            showPlanetInfo(planetInfo);
        }
    }
}

function showPlanetInfo(planet) {
    const infoPanel = document.getElementById('planet-info');
    infoPanel.innerHTML = `
                <h2 class="text-xl font-bold mb-2" style="color: ${planet.mesh.material.color.getHexString() ? '#' + planet.mesh.material.color.getHexString() : '#fff'}">${planet.mesh.name}</h2>
                <p class="text-sm mb-2">Distance from Sun: ${planet.distance} million km</p>
                <p class="text-sm mb-2">Orbital Speed: ${(planet.speed * 100).toFixed(2)} (relative)</p>
                <p class="text-sm">${planet.info}</p>
            `;

    // Fly to planet
    selectedPlanet = planet;
    const targetPosition = new THREE.Vector3();
    targetPosition.copy(planet.mesh.position);
    targetPosition.multiplyScalar(1.5);

    gsap.to(camera.position, {
        x: targetPosition.x,
        y: targetPosition.y + 5,
        z: targetPosition.z,
        duration: 1,
        ease: "power2.inOut"
    });

    gsap.to(controls.target, {
        x: planet.mesh.position.x,
        y: planet.mesh.position.y,
        z: planet.mesh.position.z,
        duration: 1,
        ease: "power2.inOut"
    });
}

// Button controls
document.getElementById('speed-up').addEventListener('click', () => {
    animationSpeed *= 1.5;
});

document.getElementById('slow-down').addEventListener('click', () => {
    animationSpeed /= 1.5;
});

document.getElementById('reset-view').addEventListener('click', () => {
    animationSpeed = 1;
    camera.position.set(0, 50, 100);
    controls.target.set(0, 0, 0);
    document.getElementById('planet-info').innerHTML = '<p class="text-sm">Hover over or click on a planet to see information.</p>';
});

// GSAP for smooth animations (included at runtime)
const gsapScript = document.createElement('script');
gsapScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.9.1/gsap.min.js';
document.head.appendChild(gsapScript);