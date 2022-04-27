import {
    Group,
    PlaneGeometry,
    Mesh,
    MeshLambertMaterial,
    VertexColors,
    Data3DTexture,
} from 'three';
import { Chunk } from 'objects';

class ChunkManager extends Group {
    constructor(parent) {
        // Call parent Group() constructor
        super();

        // Init state
        this.state = {
            gui: parent.state.gui,
            camera: parent.camera,
            speed: 0.2,

            updateList: [],
            chunks: [],

            numChunks: 20,
            width: 30,
            height: 150,
            xOffset: 0,
            seed: 3,
            resolution: 1,
            noiseScale: 50,
            noiseStrength: 40,
        };

        // Add self to parent's update list
        parent.addToUpdateList(this);

        // Populate GUI
        // BUG sliders dont actually do anything bc doesnt affect chunks already created
        this.state.gui.add(this.state, 'speed', 0.01, 3.0).step(0.1);
        this.state.gui.add(this.state, 'seed', 0, 10).step(1);
        this.state.gui.add(this.state, 'resolution', 1, 4).step(1); // Dont make this too big (crashes due to too much memory overflow)
        this.state.gui.add(this.state, 'noiseScale', 20, 100).step(1);
        this.state.gui.add(this.state, 'noiseStrength', 20, 100).step(1);

        // Create initial chunks
        this.createInitialChunks();
    }

    createInitialChunks() {
        for (let i = 0; i < this.state.numChunks; i++) {
            const chunk = new Chunk(this);
            this.add(chunk.terrainMesh);
            this.state.chunks.push(chunk);
            this.state.xOffset += this.state.width;
        }
    }

    addToUpdateList(object) {
        this.state.updateList.push(object);
    }

    update(timeStamp) {
        const { updateList } = this.state;

        // TODO create and destroy chunks as we move


        // Call update for each object in the updateList
        for (const obj of updateList) {
            obj.update(timeStamp);
        }
    }
}

export default ChunkManager;
