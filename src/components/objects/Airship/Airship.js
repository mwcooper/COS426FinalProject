import { Group } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min.js';
import MODEL from './airship.gltf';
import { Vector3 } from 'three';

class Airship extends Group {
    constructor(parent) {
        // Call parent Group() constructor
        super();

        // Init state
        this.state = {
        };

        // Load object
        const loader = new GLTFLoader();

        this.name = 'airship';
        loader.load(MODEL, (gltf) => {
            this.add(gltf.scene);
        });

        this.rotateOnAxis(new Vector3(1, 0, 0), Math.PI/2)
        this.rotateOnAxis(new Vector3(0, 1, 0), Math.PI*.62)
        this.scale.multiplyScalar(1.5)
        

        // Add self to parent's update list
        // parent.addToUpdateList(this);
    }


    update(timeStamp) {

    }
}

export default Airship;
