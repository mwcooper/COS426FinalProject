/**
 * app.js
 *
 * This is the first file loaded. It sets up the Renderer,
 * Scene and Camera. It also starts the render loop and
 * handles window resizes.
 *
 */
import { WebGLRenderer, PerspectiveCamera, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SeedScene } from 'scenes';

// Initialize core ThreeJS components
const camera = new PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    1,
    2000
);
const scene = new SeedScene(camera);
const renderer = new WebGLRenderer({ antialias: true });

// Set up camera
camera.position.set(0, 0, 80);
camera.lookAt(1000, 0, 1000);
camera.lookAt(75, 0, 75);
camera.rotateZ(1.5 * Math.PI);

// Set up renderer, canvas, and minor CSS adjustments
renderer.setPixelRatio(window.devicePixelRatio);
const canvas = renderer.domElement;
canvas.style.display = 'block'; // Removes padding below canvas
document.body.style.margin = 0; // Removes margin around page
document.body.style.overflow = 'hidden'; // Fix scrolling
document.body.appendChild(canvas);

// Set up controls
// const controls = new OrbitControls(camera, canvas);
// controls.enableDamping = true;
// controls.enablePan = false;
// controls.minDistance = 4;
// controls.maxDistance = 16;
// controls.update();

document.onkeydown = function (e) {
    switch (e.key) {
        case 'ArrowRight':
            if (camera.position.y > -75) {
                camera.translateX(0.6);
            }
            break;
        case 'ArrowLeft':
            if (camera.position.y < 75) {
                camera.translateX(-0.6);
            }
            break;
    }
};

// Render loop
const onAnimationFrameHandler = (timeStamp) => {
    //controls.update();
    // Recenter the camera
    if (!(-10.4 < camera.position.y && camera.position.y < 10.4)) {
        if (camera.position.y > -0.1) {
            camera.translateX(0.3);
        }
        if (camera.position.y < 0.1) {
            camera.translateX(-0.3);
        }
    }
    renderer.render(scene, camera);
    scene.update && scene.update(timeStamp);
    window.requestAnimationFrame(onAnimationFrameHandler);
};
window.requestAnimationFrame(onAnimationFrameHandler);

// Resize Handler
const windowResizeHandler = () => {
    const { innerHeight, innerWidth } = window;
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
};
windowResizeHandler();
window.addEventListener('resize', windowResizeHandler, false);
