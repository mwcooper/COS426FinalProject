import { Group } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min.js';
import MODEL from './tree.gltf';

class Tree extends Group {
    constructor(parent) {
        // Call parent Group() constructor
        super();

        // Init state
        this.state = {
        };

        // Load object
        const loader = new GLTFLoader();

        // 'Low Poly Tree' mesh from:
        // https://sketchfab.com/3d-models/low-poly-tree-6d986e0b24b54d85a5354e5cac6207a1
        // from user Kotzuo
        this.name = 'tree';
        loader.load(MODEL, (gltf) => {
            this.add(gltf.scene);
        });
        

        // Add self to parent's update list
        // parent.addToUpdateList(this);
    }


    update(timeStamp) {

    }
}

export default Tree;
