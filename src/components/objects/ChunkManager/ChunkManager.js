import { Group, PlaneGeometry, Mesh, MeshLambertMaterial, VertexColors, Data3DTexture } from 'three';
import { Chunk} from 'objects';

class ChunkManager extends Group {
    constructor(parent, camera) {
        // Call parent Group() constructor
        super();

        this.name = 'ChunkManager';
        this.list = [];
        this.camera = camera;


        // Add self to parent's update list
        parent.addToUpdateList(this);

        let initChunk = new Chunk(this, 0, 0);
        let chunkTerrain = initChunk.terrainMesh;
        this.add(chunkTerrain);
        console.log("added")
        this.list.push(initChunk);


        let secondChunk = new Chunk(this, 0.2, 0.3)
        secondChunk.moveChunk(300); // TODO: this 300 is from canvas property in Chunk
        this.add(secondChunk.terrainMesh)
        console.log("added 2")
        this.list.push(secondChunk);

        let third = new Chunk(this, 0.2, 0.3)
        third.moveChunk(600); // TODO: this 300 is from canvas property in Chunk
        this.add(third.terrainMesh)
        console.log("added 3")
        this.list.push(third);
        
    }

    update(timeStamp) {
        const speed = -0.1;

        for (var i = 0; i < this.list.length; i++) {
            // move terrain
            this.list[i].moveChunk(speed);

            // replace chunks behind camera
            if (this.list[i].terrainMesh.position.x < this.camera.position.x - 150) {
                this.remove(this.list.shift());

                // add new chunk in back
                let newChunk = new Chunk(this, 0.2, 0.3)
                newChunk.moveChunk(this.list[this.list.length-1].terrainMesh.position.x + 300)
                console.log(this.list.length)
                // console.log(this.list[this.list.length-1].terrainMesh);
                this.add(newChunk.terrainMesh)
                this.list.push(newChunk)
            }
        }

        

    }
}

export default ChunkManager;