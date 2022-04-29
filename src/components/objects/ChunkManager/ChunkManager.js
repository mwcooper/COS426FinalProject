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

            numChunks: 25,
            width: 30,
            height: 150,
            xOffset: 0,
            noiseOffset: 0,
            seed: 3,
            resolution: 1,
            noiseScale: 50,
            noiseStrength: 40,
            growthBoundaries: [],
            ringRadius: 1000,
        };

        this.state.growthBoundaries = [
            15 * this.state.width,
            5 * this.state.width,
            4 * this.state.width,
            3 * this.state.width,
            2 * this.state.width,
            1 * this.state.width,
        ];

        // Add self to parent's update list
        parent.addToUpdateList(this);

        // Populate GUI
        // BUG sliders dont actually do anything bc doesnt affect chunks already created
        // TODO make sliders work in realtime. Solution: use chunk update function?
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
            this.addChunk();
        }
    }

    addChunk() {
        const chunk = new Chunk(this);
        this.add(chunk.terrainMesh);
        this.state.chunks.push(chunk);
        this.state.xOffset += this.state.width;
        this.state.noiseOffset += this.state.width;
    }

    addToUpdateList(object) {
        this.state.updateList.push(object);
    }

    update(timeStamp) {
        this.state.xOffset -= this.state.speed;

        // Remove chunk if behind camera
        if (this.state.chunks[0].terrainMesh.position.x < 0) {
            const chunk = this.state.chunks.shift();
            // There are some better ways to remove stuff that are more memory efficient but we will stick with this until it is an issue
            this.remove(chunk);
        }

        // Add chunk
        if (this.state.chunks.length < this.state.numChunks) {
            this.addChunk();
        }

        const { updateList } = this.state;

        // Call update for each object in the updateList
        for (const obj of updateList) {
            obj.update(timeStamp);
        }
    }
}

export default ChunkManager;
