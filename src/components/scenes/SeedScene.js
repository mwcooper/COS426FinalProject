import * as Dat from 'dat.gui';
import { Scene, Color, AxesHelper, Vector3 } from 'three';
import { Flower, Land, Chunk, ChunkManager, TerrainGenerator } from 'objects';
import { BasicLights } from 'lights';
import { Tree } from '../objects/Tree';

class SeedScene extends Scene {
    constructor(camera) {
        // Call parent Scene() constructor
        super();

        // Init state
        this.state = {
            gui: new Dat.GUI(), // Create GUI for scene
            updateList: [],
            camera: camera
        };

        // Set background to a nice color
        // MWC TODO - Equirectangular background of stars
        this.background = new Color(0x050018);

        // Add meshes to scene
        const lights = new BasicLights();
        const chunkManager = new ChunkManager(this);
        this.add(lights, chunkManager);

        const tree = new Tree(this);
        tree.position.x = 100
        tree.position.z = 100
        tree.rotateOnAxis(new Vector3(1, 0, 0), Math.PI/2)
        this.add(tree)
        

        // Debugging X axis is red. The Y axis is green. The Z axis is blue.
        //const axesHelper = new AxesHelper(5);
        //this.add(axesHelper);
    }

    addToUpdateList(object) {
        this.state.updateList.push(object);
    }

    update(timeStamp) {
        const { updateList } = this.state;

        // Call update for each object in the updateList
        for (const obj of updateList) {
            obj.update(timeStamp);
        }
    }
}

export default SeedScene;
