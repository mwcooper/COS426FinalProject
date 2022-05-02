import { Group } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min.js';
import MODEL from './airship.gltf';

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
        

        // Add self to parent's update list
        // parent.addToUpdateList(this);
    }


    update(timeStamp) {

    }
}

export default Airship;
