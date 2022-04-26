import {
    Group,
    PlaneGeometry,
    Mesh,
    MeshLambertMaterial,
    VertexColors,
    Data3DTexture,
} from 'three';
import SimplexNoise from 'simplex-noise';

class Chunk extends Group {
    constructor(parent, width, height, xOffset) {
        // Call parent Group() constructor
        super();

        this.name = 'Chunk';

        this.width = width;
        this.height = height;
        this.xOffset = xOffset;

        // Init state
        // this.state = {
        //     gui: parent.state.gui,
        //     chunks: [],
        // };

        // // Load object
        // const loader = new GLTFLoader();

        // this.name = 'flower';
        // loader.load(MODEL, (gltf) => {
        //     this.add(gltf.scene);
        // });

        // Add self to parent's update list
        //parent.addToUpdateList(this);

        // // Populate GUI
        // this.state.gui.add(this.state, 'new seed');

        this.terrainMesh = this.generateTerrain();
    }

    generateTerrain() {
        // Create Height Field using Simplex noise (https://blog.mozvr.com/low-poly-style-terrain-generation/)
        let simplex = new SimplexNoise(5);

        function map(val, smin, smax, emin, emax) {
            const t = (val - smin) / (smax - smin);
            return (emax - emin) * t + emin;
        }
        // TODO: (2) rework this noise handling so that the chunks will match up
        function noise(nx, ny) {
            // Re-map from -1.0:+1.0 to 0.0:1.0
            return map(simplex.noise2D(nx, ny), -1, 1, 0, 1);
        }

        // stack some noisefields together
        function fbm(x, y) {
            const octaves = 4;
            const lacunarity = 2.0; // How quickly width shrinks
            const gain = 0.5; // How slowly height shrinks

            let freq = 1;
            let amp = 1;
            let z = 0;
            let max = 0;
            for (let i = 0; i < octaves; i++) {
                z += amp * noise(x * freq, y * freq);
                max += amp;
                freq *= lacunarity;
                amp *= gain;
            }
            return z / max;
        }

        const width = this.width;
        const height = this.height;

        // TODO add GUI elements to make these customizable
        const resolution = 1;
        const scale = 50; // 20-100 for range?
        const noiseStrength = 40;

        // Create mesh
        const geo = new PlaneGeometry(
            width,
            height,
            width * resolution,
            height * resolution
        );

        // Create noisy terrain
        // Adapted from https://codepen.io/DonKarlssonSan/pen/deVYoZ?editors=0010
        for (let i = 0; i < geo.vertices.length; i++) {
            const vertex = geo.vertices[i];
            vertex.x += this.xOffset;
            const x = vertex.x / scale;
            const y = vertex.y / scale;
            const noise = fbm(x, y);
            vertex.z = noise * noiseStrength;

            // Modifications
            if (vertex.z > 0.95 * noiseStrength) vertex.z *= 1.3; //exaggerate the peaks
            // BUG jitter causes a break in stitching
            vertex.x += map(Math.random(), 0, 1, -0.5, 0.5); //jitter x
            vertex.y += map(Math.random(), 0, 1, -0.5, 0.5); //jitter y
        }

        // Set colors:
        //for every face
        geo.faces.forEach((f) => {
            //get three verts for the face
            const a = geo.vertices[f.a];
            const b = geo.vertices[f.b];
            const c = geo.vertices[f.c];

            //if average is below water, set to 0
            //alt: color transparent to show the underwater landscape
            const avgz = (a.z + b.z + c.z) / 3;
            if (avgz < 0) {
                a.z = 0;
                b.z = 0;
                c.z = 0;
            }

            //assign colors based on the highest point of the face
            const max = Math.max(a.z, Math.max(b.z, c.z));
            if (max <= 0.25 * noiseStrength) return f.color.set(0x44ccff);
            if (max <= 0.5 * noiseStrength) return f.color.set(0x228811);
            if (max <= 0.7 * noiseStrength) return f.color.set(0x335577);
            if (max <= 0.9 * noiseStrength) return f.color.set(0xcccccc);

            //otherwise, return white
            f.color.set('white');
        });

        geo.colorsNeedUpdate = true;
        geo.verticesNeedUpdate = true;

        //required for flat shading
        geo.computeFlatVertexNormals();
        const mesh = new Mesh(
            geo,
            new MeshLambertMaterial({
                //wireframe:true,
                vertexColors: VertexColors,
                //required for flat shading
                flatShading: true,
            })
        );
        mesh.position.y = 0;
        mesh.position.z = -20;

        return mesh;
    }

    /* sets chunk position.x to x and position.y to y,
     * calculates and angles along
     */
    setChunkPosition(x, y, rads) {
        this.position.x = x;
        this.position.y = y;
    }

    // moves a chunk in the x direction
    moveChunk(x) {
        this.terrainMesh.translateX(x);
    }
}

export default Chunk;
