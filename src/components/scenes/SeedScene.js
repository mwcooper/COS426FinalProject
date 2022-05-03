import * as Dat from 'dat.gui';
import { Scene, Color, AxesHelper, Vector3, PointLight } from 'three';
import { Flower, Land, Chunk, ChunkManager, TerrainGenerator } from 'objects';
import { BasicLights } from 'lights';
import { Tree } from '../objects/Tree';
import { Airship } from '../objects/Airship';

class SeedScene extends Scene {
    constructor(camera) {
        // Call parent Scene() constructor
        super();

        // Init state
        this.state = {
            gui: new Dat.GUI(), // Create GUI for scene
            updateList: [],
            camera: camera,
            shadows: false,
            light: new BasicLights(),
        };

        // Set background to a nice color
        // MWC TODO - Equirectangular background of stars
        this.background = new Color(0x050018);

        // Add to scene
        this.add(this.state.light)

        const chunkManager = new ChunkManager(this);
        this.add(chunkManager);

        // Debugging X axis is red. The Y axis is green. The Z axis is blue.
        //const axesHelper = new AxesHelper(5);
        //this.add(axesHelper);

        this.state.gui.add(this.state, 'shadows').onChange(()=> this.toggleShadows());

        this.airship = new Airship();
        this.airship.position.x = 50
        this.airship.position.z = 50
        this.add(this.airship)
    }

    toggleShadows(){
        if (this.state.shadows) {
            this.remove(this.state.light);
            //Create a PointLight and turn on shadows for the light
            const light = new PointLight(0xffffef, 2.1, 0, 2);
            light.position.set(90, 75, 70);
            light.castShadow = true; // default false
            this.add(light);
            this.state.light = light;
        }
        else {
            this.remove(this.state.light);
            const light = new BasicLights();
            this.add(light);
            this.state.light = light;
        }
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
