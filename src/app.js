/**
 * app.js
 *
 * This is the first file loaded. It sets up the Renderer,
 * Scene and Camera. It also starts the render loop and
 * handles window resizes.
 *
 */
import { WebGLRenderer, PerspectiveCamera, Vector3, MathUtils } from 'three';
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
// camera.lookAt(1000, 0, 1000);
camera.lookAt(75, 0, 65);
camera.rotateZ(1.5 * Math.PI);

// Set up renderer, canvas, and minor CSS adjustments
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
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

const chunkManager = scene.state.updateList[0]

let yAcc = 0;
let aRate = 0.06;
let yVelocity = 0;
document.onkeydown = function (e) {
    switch (e.key) {
        case 'ArrowRight':
            if (yVelocity > -0.6)
                yAcc = -aRate;
            break;
        case 'ArrowLeft':
            if (yVelocity < 0.6)    
                yAcc = aRate;
            break;
        // case 'ArrowUp':
        //     if (chunkManager.state.speed < 3)
        //         chunkManager.state.speed += 0.05
        //     break;
        // case 'ArrowDown':
        //     if (chunkManager.state.speed > 0)
        //         chunkManager.state.speed -= 0.05
        //     break;
    }
};

document.onkeyup = function (e) {
    switch (e.key) {
        case 'ArrowRight':
            yAcc = 0;
            break;
        case 'ArrowLeft':
            yAcc = 0;
            break;
    }
};

// Render loop
const onAnimationFrameHandler = (timeStamp) => {
    //controls.update();
    // Recenter the camera
    // if (!(-10.4 < camera.position.y && camera.position.y < 10.4)) {
    //     if (camera.position.y > -0.1) {
    //         camera.translateX(0.3);
    //     }
    //     if (camera.position.y < 0.1) {
    //         camera.translateX(-0.3);
    //     }
    // }

    
    if (camera.position.y > 70) {
        camera.position.y = 70
        yVelocity = 0
    } else if (camera.position.y < -70) {
        camera.position.y = -70
        yVelocity = 0
    }
    if (yVelocity > 0.6) yVelocity = 0.6; if (yVelocity < -0.6) yVelocity = -0.6;
    
    if (Math.abs(yAcc) < aRate/1.9) {
        
        if (Math.abs(yVelocity) >= aRate*2)
            yAcc = -1*Math.sign(yVelocity)*aRate/2
        else {
            yVelocity = 0; 
            yAcc = 0
        }
    }

    camera.position.y += yVelocity
    yVelocity += yAcc

    scene.airship.rotation.x = -Math.PI/2 - yVelocity
    scene.airship.position.y = camera.position.y

    camera.position.x = -chunkManager.state.speed*5


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
