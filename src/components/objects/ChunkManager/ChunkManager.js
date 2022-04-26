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
    constructor(parent, camera) {
        // Call parent Group() constructor
        super();

        this.name = 'ChunkManager';
        this.list = [];
        this.camera = camera;

        // Add self to parent's update list
        parent.addToUpdateList(this);

        // Create initial chunks
        const numChunks = 10;
        this.width = 30;
        this.height = 150;
        this.xOffset = this.width;
        for (let i = 0; i < numChunks; i++) {
            const chunk = new Chunk(this, this.width, this.height, i * this.xOffset);
            let chunkTerrain = chunk.terrainMesh;
            this.add(chunkTerrain);
            this.list.push(chunk);
        }
    }

    update(timeStamp) {
        const speed = -0.1;

        for (var i = 0; i < this.list.length; i++) {
            // move terrain
            this.list[i].moveChunk(speed);

            // replace chunks behind camera
            if (
                this.list[i].terrainMesh.position.x <
                this.camera.position.x - 150
            ) {
                this.remove(this.list.shift());

                // add new chunk in back
                let newChunk = new Chunk(this, this.width, this.height, 0);
                newChunk.moveChunk(
                    this.list[this.list.length - 1].terrainMesh.position.x + this.xOffset
                );

                this.add(newChunk.terrainMesh);
                this.list.push(newChunk);
            }
        }
    }
}

export default ChunkManager;
