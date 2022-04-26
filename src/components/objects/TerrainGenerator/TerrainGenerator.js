import { Group, PlaneGeometry, Mesh, MeshLambertMaterial, VertexColors, Data3DTexture } from 'three';
import  SimplexNoise  from 'simplex-noise';


class TerrainGenerator extends Group {
    constructor(parent) {
        // Call parent Group() constructor
        super();

        this.name = 'TerrainGenerator';
        this.list = [];


        // Add self to parent's update list
        parent.addToUpdateList(this);

        // Adapted from https://codepen.io/DonKarlssonSan/pen/deVYoZ?editors=0010
        // Parameters TODO: make these adjustable in the GUI
        const xScale = 20;
        const yScale = 20;
        const noiseStrength = 2;
        const seed = 5;

        const simplex = new SimplexNoise(seed);
        
        // Setup the plane. Can adjust side parameter to make high res or low poly
        const side = 120;
        geometry = new PlaneGeometry(40,40,side,side);
        let material = new MeshLambertMaterial({
            //wireframe:true,
            //vertexColors: VertexColors,
            //required for flat shading
            flatShading:true,
            color:0x049ef4,
        })
    }

    update(timeStamp) {
        
    }
}

export default TerrainGenerator;