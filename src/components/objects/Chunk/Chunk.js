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
    Color,
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
            thetaOffset: parent.state.thetaOffset,
            noiseOffset: parent.state.noiseOffset,
            speed: parent.state.speed,
            seed: parent.state.seed,
            resolution: parent.state.resolution,
            noiseScale: parent.state.noiseScale,
            noiseStrength: parent.state.noiseStrength,
            growthBoundaries: parent.state.growthBoundaries,
            ringRadius: parent.state.ringRadius,
            meshMaterial: parent.state.meshMaterial,
            updateList: [],
        };

        // Add self to parent's update list
        parent.addToUpdateList(this);

        this.heightMap = [];
        this.faceColors = [];
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

            // raise sides, lower middle
            let alpha = map(Math.abs(vertex.y), 0, height / 2, 0.8, 1.2);
            this.heightMap[i] *= alpha;

            // Modifications
            if (this.heightMap[i] > 0.7 * noiseStrength) {
                this.heightMap[i] **= 1.012; //exaggerate the peaks
            }

            // make the left and right edges at 0
            if ((vertex.y + height / 2) % height == 0) {
                vertex.z = 0;
                this.heightMap[i] = 0;
            }

            // dont jitter edges of the mesh
            if (
                (vertex.x + width / 2) % width != 0 &&
                (vertex.y + height / 2) % height != 0
            ) {
                vertex.x += map(Math.random(), 0, 1, -0.5, 0.5); //jitter x
                vertex.y += map(Math.random(), 0, 1, -0.5, 0.5); //jitter y
            }

            // squish mesh in proportion to angle of rotation
        }

        // set faceColors with end colors
        geo.faces.forEach((f) => {
            //get three z values for the face
            const a = this.heightMap[f.a];
            const b = this.heightMap[f.b];
            const c = this.heightMap[f.c];

            //if average is below water, set to 0
            //alt: color transparent to show the underwater landscape
            const avgz = (a + b + c) / 3;
            if (avgz < 0) {
                this.heightMap[f.a] = 0;
                this.heightMap[f.b] = 0;
                this.heightMap[f.c] = 0;
            }

            // assign colors based on the highest point of the face
            let color = 0x000000;
            let max = Math.max(a, b, c);
            // console.log(max, 0.25 * noiseStrength)
            if (max <= 0.25 * noiseStrength) {
                // blue (water) 0x44ccff
                color = 0x44ccff;
            } else if (max <= 0.28 * noiseStrength) {
                // brown (beach) 0x483C32
                color = 0x483c32;
            } else if (max <= 0.5 * noiseStrength) {
                // green (grass) 0x356520
                color = 0x356520;
            } else if (max <= 0.7 * noiseStrength) {
                // grey (cliff) 0x335577
                color = 0x335577;
            } else {
                // white (snow) 0xcccccc
                color = 0xcccccc;
            }

            // color each chunk differently for debugging:
            //color = 0x333333 * this.heightMap[100];

            this.faceColors.push(color);
        });

        geo.verticesNeedUpdate = true;
        // geo.colorsNeedUpdate = true;

        geo.computeFlatVertexNormals();
        const mesh = new Mesh(geo, this.state.meshMaterial);
        const radius = this.state.ringRadius;

        const thetaOffset = this.state.thetaOffset;
        mesh.position.x = radius * Math.sin(thetaOffset);
        mesh.position.z = radius - radius * Math.cos(thetaOffset);
        mesh.lookAt(0, 0, this.state.ringRadius);

        return mesh;
    }

    moveOnRing() {
        // Calculate the z position of the mesh based on its theta position in the ring
        this.state.thetaOffset -= 0.001 * this.state.speed * 2 * Math.PI;
        const thetaOffset = this.state.thetaOffset;
        const mesh = this.terrainMesh;
        const radius = this.state.ringRadius;
        mesh.position.x = radius * Math.sin(thetaOffset);
        mesh.position.z = radius - radius * Math.cos(thetaOffset);
        mesh.lookAt(0, 0, this.state.ringRadius);
    }

    colorTerrain() {
        let geo = this.terrainMesh.geometry;
        const noiseStrength = this.state.noiseStrength;

        // Set colors:
        // for every face
        let counter = 0;
        geo.faces.forEach((f) => {
            //get three verts for the face
            const a = geo.vertices[f.a];
            const b = geo.vertices[f.b];
            const c = geo.vertices[f.c];

            const flat = 0x777777;
            let color = this.faceColors[counter++];

            // Add color as we get closer
            let alpha = 0;
            const xPos = (a.x + b.x + c.x) / 3 + this.terrainMesh.position.x;
            const near = this.state.growthBoundaries[3];
            const far = this.state.growthBoundaries[2];
            if (xPos >= far) {
                return f.color.setHex(flat);
            } else if (xPos < near) {
                // Full color
                alpha = 1.0;
            } else {
                // Interpolate
                alpha = 1.0 - (xPos - near) / (far - near);
            }

            // const flat = 0x777777;
            const rFlat = (flat >> 16) & 0xff;
            const gFlat = (flat >> 8) & 0xff;
            const bFlat = flat & 0xff;
            const rColor = (color >> 16) & 0xff;
            const gColor = (color >> 8) & 0xff;
            const bColor = color & 0xff;
            const lerp =
                (((rColor - rFlat) * alpha + rFlat) << 16) |
                (((gColor - gFlat) * alpha + gFlat) << 8) |
                ((bColor - bFlat) * alpha + bFlat);

            return f.color.setHex(lerp);
            // return f.color.setHex(color);
        });

        // geo.verticesNeedUpdate = true;
        geo.computeFlatVertexNormals();
        geo.colorsNeedUpdate = true;
    }

    // loop thru each vertex and lerp its new .z based on the vertex's .x between gcl[0] and gcl[1]
    growTerrain() {
        const geo = this.terrainMesh.geometry;
        for (let i = 0; i < geo.vertices.length; i++) {
            const vertex = geo.vertices[i];
            const xPos = this.terrainMesh.position.x + vertex.x;
            const near = this.state.growthBoundaries[1];
            const far = this.state.growthBoundaries[0];
            const EPS = 2;
            // Close full heights, in between interpolate, far flat
            if (xPos < near) {
                // Full height
                vertex.z = this.heightMap[i];
            } else if (near < xPos && xPos - EPS < far) {
                // Interpolate
                const alpha = (xPos - far) / (near - far);
                vertex.z = this.heightMap[i] * alpha;
            } else {
                // Flat
                vertex.z = 0;
            }
        }

        geo.verticesNeedUpdate = true;
    }

    addToUpdateList(object) {
        this.state.updateList.push(object);
    }

    update(timeStamp) {
        const { speed, updateList } = this.state;

        // Translate the chunk (move it closer and update the curve)
        this.moveOnRing();

        // Update terrain based on slider parameters (this seems difficult. Dreamworld used presets. Im guessing it was because it was too hard to livetime update)

        // Increase the height of the terrain as a function of this.terrainMesh.x
        this.growTerrain();

        // Add color as a function of this.terrainMesh.x
        this.colorTerrain();

        // Add plants, clouds as a function of this.terrainMesh.x

        // Add moving life as a function of this.terrainMesh.x

        // Call update for each object in the updateList
        for (const obj of updateList) {
            obj.update(timeStamp);
        }
    }
}

export default Chunk;
