gsap.registerPlugin(ScrollTrigger);

// 1. Scene, Camera, Renderer Setup
const canvas = document.querySelector('#webgl');
const scene = new THREE.Scene();

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
};

const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100);
camera.position.set(0, 0, 7.0); // Slightly pulled back to comfortably frame the 1.4x larger jar
scene.add(camera);

const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// 2. Studio Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
keyLight.position.set(4, 5, 5);
scene.add(keyLight);

// Lychee Pink Rim Light from behind
const pinkRimLight = new THREE.DirectionalLight(0xf99ab7, 3.8);
pinkRimLight.position.set(3, 2, -2.5);
scene.add(pinkRimLight);

// 3. Model Containers
const jarGroup = new THREE.Group();
const barsGroup = new THREE.Group();
scene.add(barsGroup);
scene.add(jarGroup); // Jar added after bars so it renders cleanly in front

let jarBaseScale = 1;
let barBaseScale = 1;
let bar1 = null;
let bar2 = null;

const loader = new THREE.GLTFLoader();

// Helper to load models as Promises
function loadGLTF(path) {
    return new Promise((resolve, reject) => {
        loader.load(path, resolve, undefined, reject);
    });
}

// 4. Load Both 3D Assets (Jar + Protein Bar)
Promise.all([
    loadGLTF('assets/esn_jar.glb'),
    loadGLTF('assets/ESN_bar.glb')
]).then(([jarGltf, barGltf]) => {

    // --- SETUP JAR ---
    const jarModel = jarGltf.scene;
    const jarBox = new THREE.Box3().setFromObject(jarModel);
    const jarCenter = jarBox.getCenter(new THREE.Vector3());
    const jarSize = jarBox.getSize(new THREE.Vector3());

    jarModel.position.x -= jarCenter.x;
    jarModel.position.y -= jarCenter.y;
    jarModel.position.z -= jarCenter.z;
    jarGroup.add(jarModel);

    const jarMaxDim = Math.max(jarSize.x, jarSize.y, jarSize.z);
    jarBaseScale = 2.4 / jarMaxDim;

    // Start centered and compact
    jarGroup.scale.set(jarBaseScale * 0.55, jarBaseScale * 0.55, jarBaseScale * 0.55);
    jarGroup.position.set(0, 0, 0);


    // --- SETUP PROTEIN BARS ---
    const barModel = barGltf.scene;
    const barBox = new THREE.Box3().setFromObject(barModel);
    const barCenter = barBox.getCenter(new THREE.Vector3());
    const barSize = barBox.getSize(new THREE.Vector3());

    barModel.position.x -= barCenter.x;
    barModel.position.y -= barCenter.y;
    barModel.position.z -= barCenter.z;

    const barMaxDim = Math.max(barSize.x, barSize.y, barSize.z);
    barBaseScale = 1.9 / barMaxDim; // Proportioned relative to the jar

    // Clone two bars (Top Bar and Bottom Bar)
    bar1 = barModel.clone();
    bar2 = barModel.clone();

    // Initial position: hidden directly behind the jar (scale 0)
    bar1.scale.set(0.001, 0.001, 0.001);
    bar2.scale.set(0.001, 0.001, 0.001);

    // Diagonal tilt matching Screenshot 2 (~32 degrees up-right)
    bar1.rotation.set(0.15, -0.35, 0.55);
    bar2.rotation.set(0.15, -0.55, 0.20);

    barsGroup.add(bar1);
    barsGroup.add(bar2);

    initScrollTimeline();

}).catch((err) => {
    console.error('Error loading 3D assets:', err);
});


// 5. GSAP ScrollTrigger Master Timeline
function initScrollTimeline() {
    if (!jarGroup || !bar1 || !bar2) return;

    const isDesktop = window.innerWidth > 1024;
    // Pushed further right to accommodate the 1.4x larger size
    const targetJarX = isDesktop ? 1.25 : 0;
    const targetJarY = isDesktop ? -0.1 : 0.6;

    // Final positions for the bars peeking out behind the jar
    const bar1FinalX = targetJarX + 2.1;
    const bar1FinalY = targetJarY + 0.45;
    const bar1FinalZ = -0.45; // Behind the jar

    const bar2FinalX = targetJarX + 2.35;
    const bar2FinalY = targetJarY - 0.35;
    const bar2FinalZ = -0.75; // Behind bar 1

    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: '.scroll-container',
            start: 'top top',
            end: 'bottom bottom',
            scrub: 1.2
        }
    });

    // 1. Hide the "Scroll down" prompt immediately
    tl.to('.scroll-indicator', {
        opacity: 0,
        y: -20,
        duration: 0.25,
        ease: 'power2.out'
    }, 0);

    // 2. Light up Pink Diagonal Split Background
    tl.to('.pink-diagonal', {
        opacity: 1,
        duration: 1,
        ease: 'power1.inOut'
    }, 0);

    // 3. Jar 360° Spin + 1.4x Growth + Shift to the Right
    tl.to(jarGroup.rotation, {
        y: Math.PI * 1.97, // 360 degree spin
        x: 0.06,
        duration: 1,
        ease: 'none'
    }, 0);

    tl.to(jarGroup.position, {
        x: targetJarX,
        y: targetJarY,
        duration: 1,
        ease: 'power1.inOut'
    }, 0);

    // Fade in lychees near the end of the scroll
    tl.to('.lychee-decor', {
        opacity: 1,
        y: 0,
        duration: 0.45,
        ease: 'power2.out'
    }, 0.65);

    tl.to(jarGroup.scale, {
        // 1.4x bigger than the previous size (1.18 * 1.4 ≈ 1.65)
        x: jarBaseScale * 1.65,
        y: jarBaseScale * 1.65,
        z: jarBaseScale * 1.65,
        duration: 1,
        ease: 'power1.inOut'
    }, 0);

    // 4. Reveal the Left Typography
    tl.to('.hero-left', {
        opacity: 1,
        x: 0,
        duration: 0.8,
        ease: 'power2.out'
    }, 0.2);

    // 5. Protein Bars Fan Outwards from behind the jar
    // They start emerging around 45% into the scroll
    tl.fromTo(bar1.position, 
        { x: targetJarX, y: targetJarY, z: -0.5 },
        { x: bar1FinalX, y: bar1FinalY, z: bar1FinalZ, duration: 0.55, ease: 'back.out(1.2)' },
        0.45
    );
    tl.to(bar1.scale, {
        x: barBaseScale * 1.6,
        y: barBaseScale * 1.6,
        z: barBaseScale * 1.6,
        duration: 0.55,
        ease: 'back.out(1.2)'
    }, 0.45);

    tl.fromTo(bar2.position, 
        { x: targetJarX, y: targetJarY, z: -0.8 },
        { x: bar2FinalX, y: bar2FinalY, z: bar2FinalZ, duration: 0.55, ease: 'back.out(1.2)' },
        0.55
    );
    tl.to(bar2.scale, {
        x: barBaseScale * 1.6,
        y: barBaseScale * 1.6,
        z: barBaseScale * 1.6,
        duration: 0.55,
        ease: 'back.out(1.2)'
    }, 0.55);
}

// 6. Subtle Idle Floating Loop
const clock = new THREE.Clock();

function tick() {
    const elapsedTime = clock.getElapsedTime();

    if (jarGroup) {
        jarGroup.position.y += Math.sin(elapsedTime * 2) * 0.0006;
    }
    if (bar1 && bar2) {
        bar1.position.y += Math.sin(elapsedTime * 2 + 0.5) * 0.0005;
        bar2.position.y += Math.sin(elapsedTime * 2 + 1.0) * 0.0005;
    }

    renderer.render(scene, camera);
    window.requestAnimationFrame(tick);
}
tick();

// 7. Responsive Resizing
window.addEventListener('resize', () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    ScrollTrigger.refresh();
});