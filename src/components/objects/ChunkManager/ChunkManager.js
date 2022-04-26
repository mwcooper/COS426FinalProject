import { Group, PlaneGeometry, Mesh, MeshLambertMaterial, VertexColors, Data3DTexture } from 'three';

class ChunkManager extends Group {
    constructor() {
        // Call parent Group() constructor
        super();

        this.name = 'ChunkManager';


        // Add self to parent's update list
        parent.addToUpdateList(this);
    }

    update(timeStamp) {
        const speed = 1.0;

        for (var i = 0; i < this.list.length; i++) {
            this.list[i].moveChunk(speed);
        }
    }
}

export default ChunkManager;