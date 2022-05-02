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
            ringRadius: 1000,
            chordTheta: 0,
            meshMaterial: undefined,
        };

        this.state.growthBoundaries = [
            25 * this.state.width,
            10 * this.state.width,
            14 * this.state.width,
            6 * this.state.width,
            2 * this.state.width,
            1 * this.state.width,
        ];

        // To save memory
        this.state.meshMaterial = new MeshLambertMaterial({
            //wireframe:true,
            vertexColors: VertexColors,
            //required for flat shading
            flatShading: true,
        });

        const EPS = 2*Math.PI/2000
        this.state.chordTheta = 2*Math.asin(this.state.width/2/this.state.ringRadius)-EPS;
        //this.state.numChunks = Math.floor(0.5 * Math.PI / this.state.chordTheta);
        this.state.numChunks = 39;

        // Add self to parent's update list
        parent.addToUpdateList(this);

        // Populate GUI
        // BUG sliders dont actually do anything bc doesnt affect chunks already created
        // TODO make sliders work in realtime. Solution: use chunk update function?
        this.state.gui.add(this.state, 'speed', 0.01, 3.0).step(0.1);
        this.state.gui.add(this.state, 'seed', 0, 10).step(1);
        //this.state.gui.add(this.state, 'resolution', 1, 4).step(1); // Dont make this too big (crashes due to too much memory overflow)
        this.state.gui.add(this.state, 'noiseScale', 20, 100).step(1);
        this.state.gui.add(this.state, 'noiseStrength', 20, 100).step(1);


    }

    addChunk() {
        const chunk = new Chunk(this);
        this.add(chunk.terrainMesh);
        this.state.chunks.push(chunk);
        this.state.noiseOffset += this.state.width;
        this.state.thetaOffset += this.state.chordTheta;
    }

    addToUpdateList(object) {
        this.state.updateList.push(object);
    }

    // moveChunksY(amt) {
    //     this.state.chunks.forEach(chunk => {
    //         chunk.terrainMesh.position.y += amt;
    //         this.state.yPosition += amt;
    //     });
    // }

    update(timeStamp) {
        this.state.thetaOffset -= 0.001 * this.state.speed*2*Math.PI;

        // Add new chunk if necessary
        if (this.state.chunks.length < this.state.numChunks) {
            this.addChunk();
        }

        // Remove chunk if behind camera, 
        if (this.state.chunks[0].terrainMesh.position.x < 0) {
            const chunk = this.state.chunks.shift();
            // There are some better ways to remove stuff that are more memory efficient but we will stick with this until it is an issue
            this.remove(chunk.terrainMesh)
            chunk.terrainMesh.geometry.dispose()
            //chunk.terrainMesh.material.dispose()
            chunk.terrainMesh = undefined
            this.remove(chunk);
        } 

        // Call update for each chunk in the chunks list
        for (const chunk of this.state.chunks) {
            chunk.update(timeStamp);
        }

        // this.moveChunksY(this.state.yVelocity)
       
    }
}

export default ChunkManager;
