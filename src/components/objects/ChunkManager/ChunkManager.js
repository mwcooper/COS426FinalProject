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
            speed: 0.1,

            updateList: [],
            chunks: [],

            numChunks: 1,
            width: 30,
            height: 150,
            thetaOffset: 0,
            noiseOffset: 0,
            seed: 3,
            resolution: 1,
            noiseScale: 60,
            noiseStrength: 50,
            growthBoundaries: [],
            ringRadius: 1100,
            chordTheta: 0,
            meshMaterial: undefined,
            breathRate: 0,
            breathLow: 0,
            breathHigh: 0,
        };

        this.state.growthBoundaries = [
            22 * this.state.width,
            10 * this.state.width,
            14 * this.state.width,
            7 * this.state.width,
            10 * this.state.width,
            4 * this.state.width,
        ];

        // To save memory
        this.state.meshMaterial = new MeshLambertMaterial({
            //wireframe:true,
            vertexColors: VertexColors,
            //required for flat shading
            //flatShading: true,
        });

        // 0 is here, so no EPS at the moment
        const EPS = 0*(2 * Math.PI) / 1000;
        this.state.chordTheta =
            2 * Math.asin(this.state.width / 2 / this.state.ringRadius) - EPS;
        //this.state.numChunks = Math.floor(0.5 * Math.PI / this.state.chordTheta);
        this.state.numChunks = 39;

        // Add self to parent's update list
        parent.addToUpdateList(this);

        // Populate GUI
        // BUG sliders dont actually do anything bc doesnt affect chunks already created
        // TODO make sliders work in realtime. Solution: use chunk update function?
        this.state.gui.add(this.state, 'speed', 0.01, 3.0).name("Speed").step(0.1);
        this.state.gui.add(this.state, 'noiseStrength', 0, 100).name("Height Scale").step(1);
        this.state.gui.add(this.state, 'breathRate',0, 5).name("Breath Rate").step(0.1);
        // this.state.gui.add(this.state, 'breathLow',0, 100).name("Breath Low").step(1);
        // this.state.gui.add(this.state, 'breathHigh',0, 100).name("Breath High").step(1);
    }

    addChunk() {
        const chunk = new Chunk(this);
        this.add(chunk.terrainMesh);
        this.state.chunks.push(chunk);
        this.state.noiseOffset += this.state.width;
        this.state.thetaOffset += this.state.chordTheta;
    }

    removeChunk(chunk) {
        // There are some better ways to remove stuff that are more memory efficient but we will stick with this until it is an issue
        this.remove(chunk.terrainMesh);
        chunk.terrainMesh.geometry.dispose();
        //chunk.terrainMesh.material.dispose()
        chunk.terrainMesh = undefined;
        chunk.removeFlora();
        this.remove(chunk);
    }

    addToUpdateList(object) {
        this.state.updateList.push(object);
    }

    update(timeStamp) {
        this.state.thetaOffset -= 0.001 * this.state.speed * 2 * Math.PI;

        // Add new chunk if necessary
        if (this.state.chunks.length < this.state.numChunks) {
            this.addChunk();
        }

        // Remove chunk if behind camera,
        if (this.state.chunks[0].terrainMesh.position.x < 0) {
            const chunk = this.state.chunks.shift();
            this.removeChunk(chunk);
        }

        // Call update for each chunk in the chunks list
        for (const chunk of this.state.chunks) {
            chunk.update(timeStamp, this.state.speed, this.state.noiseStrength, this.state.breathRate);
        }
       
    }
}

export default ChunkManager;
