import * as Dat from 'dat.gui';
import { Scene, Color, EquirectangularReflectionMapping } from 'three';
import { Flower, Land, Chunk} from 'objects';
import { BasicLights } from 'lights';

class SeedScene extends Scene {
    constructor(camera) {
        // Call parent Scene() constructor
        super();

        // Init state
        this.state = {
            gui: new Dat.GUI(), // Create GUI for scene
            rotationSpeed: 1,
            updateList: [],
        };

        // Set background to a nice color
        // MWC TODO - Equirectangular background of stars
        this.background = new Color(0x050018);

        // Add meshes to scene
        const lights = new BasicLights();
        const chunk = new Chunk(this);
        const land = new Land();
        this.add(lights, chunk, land);

        // Populate GUI
        this.state.gui.add(this.state, 'rotationSpeed', -5, 5);
    }

    addToUpdateList(object) {
        this.state.updateList.push(object);
    }

    update(timeStamp) {
        const { rotationSpeed, updateList } = this.state;
        this.rotation.y = (rotationSpeed * timeStamp) / 10000;

        // Call update for each object in the updateList
        for (const obj of updateList) {
            obj.update(timeStamp);
        }
    }
}

export default SeedScene;
