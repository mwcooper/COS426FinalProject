import {
    Group,
    PlaneGeometry,
    Mesh,
    MeshLambertMaterial,
    VertexColors,
    Data3DTexture,
    Plane,
    DstAlphaFactor,
    LoopRepeat,
    ClampToEdgeWrapping,
    Vector3,
} from 'three';
import SimplexNoise from 'simplex-noise';

class Chunk extends Group {
    constructor(parent) {
        // Call parent Group() constructor
        super();

        // Init state
        this.state = {
            gui: parent.state.gui,
            width: parent.state.width,
            height: parent.state.height,
            xOffset: parent.state.xOffset,
            noiseOffset: parent.state.noiseOffset,
            speed: parent.state.speed,
            seed: parent.state.seed,
            resolution: parent.state.resolution,
            noiseScale: parent.state.noiseScale,
            noiseStrength: parent.state.noiseStrength,
            growthBoundaries: parent.state.growthBoundaries,
            ringRadius: parent.state.ringRadius,

            updateList: [],
        };

        // Add self to parent's update list
        parent.addToUpdateList(this);

        this.heightMap = [];
        this.terrainMesh = this.generateTerrain();
        this.colorTerrain();
    }

    generateTerrain() {
        const width = this.state.width;
        const height = this.state.height;

        // Customizable
        const resolution = this.state.resolution;
        const scale = this.state.noiseScale;
        const noiseStrength = this.state.noiseStrength;

        let simplex = new SimplexNoise(this.state.seed);

        function map(val, smin, smax, emin, emax) {
            const t = (val - smin) / (smax - smin);
            return (emax - emin) * t + emin;
        }

        function noise(nx, ny) {
            // Re-map from -1.0:+1.0 to 0.0:1.0
            return map(simplex.noise2D(nx, ny), -1, 1, 0, 1);
        }

        // Fractal Brownian Motion
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
            const x = (vertex.x + this.state.noiseOffset) / scale;
            const y = vertex.y / scale;
            const noise = fbm(x, y);
            // vertex.z = noise * noiseStrength;
            this.heightMap.push(noise * noiseStrength);

            // Modifications
            // if (vertex.z > 0.95 * noiseStrength) vertex.z *= 1.3; //exaggerate the peaks
            if (this.heightMap[i] > 0.95 * noiseStrength)
                this.heightMap[i] *= 1.3; //exaggerate the peaks

            if ((vertex.x + width / 2) % width != 0) {
                vertex.x += map(Math.random(), 0, 1, -0.5, 0.5); //jitter x
                vertex.y += map(Math.random(), 0, 1, -0.5, 0.5); //jitter y
            }
        }

        geo.verticesNeedUpdate = true;
        geo.colorsNeedUpdate = true;

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

        mesh.position.x = this.state.xOffset;
        mesh.lookAt(0,0,this.state.ringRadius);

        return mesh;
    }

    translate(speed) {
        // Calculate the z position of the mesh based on how far it is from the camera
        const currX = this.terrainMesh.position.x;
        const currZ = this.terrainMesh.position.z;
        const radius = this.state.ringRadius;
        let z = 0
        if (currX < radius) {
            z = -Math.sqrt(-(currX ** 2) + radius**2) + radius - currZ;
            this.terrainMesh.translateZ(z);
        }
        // Move the mesh closer to the camera
        this.terrainMesh.translateX(-speed);
        // Rotate the mesh so it looks like it is a smooth ring
        this.terrainMesh.lookAt(0,0,radius);
    }

    colorTerrain() {
        let geo = this.terrainMesh.geometry;
        const noiseStrength = this.state.noiseStrength;

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
            const max = Math.max(a.z, b.z, c.z);
            if (max <= 0.25 * noiseStrength) {
                // // make water flat
                return f.color.set(0x44ccff);
            }
            if (max <= 0.3 * noiseStrength) {
                // brown (beach) color
                return f.color.set(0x5c4033);
            }
            if (max <= 0.5 * noiseStrength) {
                // green (grass)
                return f.color.set(0x008000);
            }
            if (max <= 0.7 * noiseStrength) {
                // cliff grey
                return f.color.set(0x335577);
            }
            if (max <= 0.9 * noiseStrength) {
                // snow white
                return f.color.set(0xcccccc);
            }

            //otherwise, return white
            f.color.set('white');
        });

        geo.verticesNeedUpdate = true;
        geo.computeFlatVertexNormals();
        geo.colorsNeedUpdate = true;
    }

    // loop thru each vertex and lerp its new .z based on the vertex's .x between gcl[0] and gcl[1]
    growTerrain() {
        const geo = this.terrainMesh.geometry;

        // returns alpha value from 0 to 1
        // these two functions from https://codepen.io/trys/pen/XWrNRze:
        const clamp = (a, min = 0, max = 1) => Math.min(max, Math.max(min, a));
        const invlerp = (x, y, a) => clamp((a - x) / (y - x));

        for (let i = 0; i < geo.vertices.length; i++) {
            const vertex = geo.vertices[i];
            let alpha = invlerp(
                this.state.growthBoundaries[0],
                this.state.growthBoundaries[1],
                vertex.x + this.terrainMesh.position.x
            );
            vertex.z = this.heightMap[i] * alpha;
        }

        geo.verticesNeedUpdate = true;
    }

    addToUpdateList(object) {
        this.state.updateList.push(object);
    }

    update(timeStamp) {
        const { speed, updateList } = this.state;

        // Translate the chunk (move it closer and update the curve)
        this.translate(speed);

        // Update terrain based on slider parameters (this seems difficult. Dreamworld used presets. Im guessing it was because it was too hard to livetime update)

        // Increase the height of the terrain as a function of this.terrainMesh.x
        if (
            this.terrainMesh.position.x < this.state.growthBoundaries[0] &&
            this.terrainMesh.position.x + this.state.width / 2 >
                this.state.growthBoundaries[1]
        ) {
            this.growTerrain();
            this.colorTerrain();
        }

        // Add color as a function of this.terrainMesh.x

        // Add plants, clouds as a function of this.terrainMesh.x

        // Add moving life as a function of this.terrainMesh.x

        // Call update for each object in the updateList
        // also translate each object in updatelist
        for (const obj of updateList) {
            obj.translateX(-speed);
            obj.update(timeStamp);
        }
    }
}

export default Chunk;
