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
    Object3D,
    VectorKeyframeTrack,
    TangentSpaceNormalMap,
} from 'three';
import { Tree } from '../Tree';
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

        this.parent = parent;
        // Add self to parent's update list
        parent.addToUpdateList(this);

        this.heightMap = [];
        this.faceColors = [];
        this.treeLocations = [];
        this.trees = [];
        this.terrainMesh = this.generateTerrain();
        this.colorTerrain();
    }

    generateTerrain() {
        const width = this.state.width;
        const height = this.state.height;
        const radius = this.state.ringRadius;

        // Customizable
        const resolution = this.state.resolution;
        const scale = this.state.noiseScale;

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
            this.heightMap.push(noise);

            // raise sides, lower middle
            let alpha = map(Math.abs(vertex.y), 0, height / 2, 0.8, 1.2);
            this.heightMap[i] *= alpha;

            // Modifications
            if (this.heightMap[i] <= 0.25) {
                // set water level to same height
                this.heightMap[i] = 0.25;
            } else if (this.heightMap[i] < 0.5) {
                const treeFreq = 0.01
                if (Math.random() < treeFreq) {
                    this.treeLocations.push(i)
                }
            }
            else if (this.heightMap[i] > 0.7) {
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
            
            let c = (width/2)/radius
            let b = (radius-this.heightMap[i])*c
            vertex.x = map(vertex.x, -width/2, width/2, -b, b)
            
        }

        function lerpColors(c1, c2, alpha) {
            const rC1 = (c1 >> 16) & 0xff;
            const gC1 = (c1 >> 8) & 0xff;
            const bC1 = c1 & 0xff;
            const rC2 = (c2 >> 16) & 0xff;
            const gC2 = (c2 >> 8) & 0xff;
            const bC2 = c2 & 0xff;
            const lerp =
                (((rC2 - rC1) * alpha + rC1) << 16) |
                (((gC2 - gC1) * alpha + gC1) << 8) |
                ((bC2 - bC1) * alpha + bC1);
            return lerp
        }

        // set faceColors with end colors
        geo.faces.forEach((f) => {
            //get three z values for the face
            const a = this.heightMap[f.a];
            const b = this.heightMap[f.b];
            const c = this.heightMap[f.c];

            //if average is below water, set to 0
            //alt: color transparent to show the underwater landscape

            // assign colors based on the highest point of the face
            let color = 0x000000;
            let max = Math.max(a, b, c);
            if (max <= 0.25) {
                // blue (water) 0x44ccff
                color = 0x44ccff;
            } else if (max < 0.28) {
                // brown (beach) 0x483C32
                color = 0x483c32;
            } else  if (max <= 0.45) {
                // green (grass) 0x356520
                color = 0x356520;
            } else if (max <= 0.55) {
                // green --> grey (lerp)
                const grass = 0x356520;
                const cliff = 0x335577;

                const alpha = map(max, 0.45, 0.55, 0, 1)
                color = lerpColors(grass, cliff, alpha)
            } else if (max <= 0.7) {
                // grey (cliff) 0x335577
                color = 0x335577;
            } else if (max <= 0.9) {
                // green --> grey (lerp)
                const cliff = 0x335577;
                const snow = 0xcccccc;

                const alpha = map(max, 0.7, 0.9, 0, 1)
                color = lerpColors(cliff, snow, alpha)
            } else {
                // white (snow) 0xcccccc
                color = 0xcccccc;
            }

            // color each chunk differently for debugging:
            // color = 0x333333 * this.heightMap[100];

            this.faceColors.push(color);
        });

        geo.verticesNeedUpdate = true;
        // geo.colorsNeedUpdate = true;

        geo.computeFlatVertexNormals();
        const mesh = new Mesh(geo, this.state.meshMaterial);

        const thetaOffset = this.state.thetaOffset;
        mesh.position.x = radius * Math.sin(thetaOffset);
        mesh.position.z = radius - radius * Math.cos(thetaOffset);
        mesh.lookAt(0, 0, this.state.ringRadius);

        mesh.receiveShadow = true;
        mesh.castShadow = true;

        return mesh;
    }

    moveOnRing(speed) {
        // Calculate the z position of the mesh based on its theta position in the ring
        this.state.thetaOffset -= 0.001 * speed * 2 * Math.PI;
        const thetaOffset = this.state.thetaOffset;
        const mesh = this.terrainMesh;
        const radius = this.state.ringRadius;
        let chordThetaOff = 0;
        
        
            let alpha = (mesh.position.x)/(39*this.state.width)
            chordThetaOff = 15* alpha * (2 * Math.PI) / 1000;
        
        mesh.position.x = radius * Math.sin(thetaOffset-chordThetaOff);
        mesh.position.z = radius - radius * Math.cos(thetaOffset-chordThetaOff);
        mesh.lookAt(0, 0, this.state.ringRadius);
    }

    colorTerrain() {
        let geo = this.terrainMesh.geometry;
        const noiseStrength = this.state.noiseStrength;

        function lerpColors(c1, c2, alpha) {
            const rC1 = (c1 >> 16) & 0xff;
            const gC1 = (c1 >> 8) & 0xff;
            const bC1 = c1 & 0xff;
            const rC2 = (c2 >> 16) & 0xff;
            const gC2 = (c2 >> 8) & 0xff;
            const bC2 = c2 & 0xff;
            const lerp =
                (((rC2 - rC1) * alpha + rC1) << 16) |
                (((gC2 - gC1) * alpha + gC1) << 8) |
                ((bC2 - bC1) * alpha + bC1);
            return lerp
        }

        // if ()

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

            return f.color.setHex(lerpColors(flat, color, alpha));
            // return f.color.setHex(color);
        });

        // geo.verticesNeedUpdate = true;
        geo.computeFlatVertexNormals();
        geo.colorsNeedUpdate = true;
    }

    // loop thru each vertex and lerp its new .z based on the vertex's .x between gcl[0] and gcl[1]
    growTerrain(noiseStrength, breathingTerrain, timeStamp) {
        if( this.terrainMesh.position.x-this.state.width/2 > this.state.growthBoundaries[0])
            return;
        const geo = this.terrainMesh.geometry;
        for (let i = 0; i < geo.vertices.length; i++) {
            const vertex = geo.vertices[i];
            const xPos = this.terrainMesh.position.x + vertex.x;
            const yPos = this.terrainMesh.position.y + vertex.y + 30 * Math.sin(xPos/45);
            const near = this.state.growthBoundaries[1];
            const far = this.state.growthBoundaries[0];
            const EPS = 2;

            const time = timeStamp / (10 * 60) * breathingTerrain;
            const breath = 1.0 - Math.sin(time) * Math.sin((xPos+time)/63) * Math.sin((xPos)/29) * Math.sin((yPos+time)/45)* Math.sin(yPos/75);

            // Close full heights, in between interpolate, far flat
            if (xPos < near) {
                // Full height
                vertex.z = this.heightMap[i] * noiseStrength * breath;
            } else if (near < xPos && xPos - EPS < far) {
                // Interpolate
                const alpha = (xPos - far) / (near - far);
                vertex.z = this.heightMap[i] * alpha * noiseStrength * breath;
            } else {
                // Flat
                vertex.z = 0;
            }
        }

        geo.verticesNeedUpdate = true;
    }

    addFlora(noiseStrength) {
        if (this.terrainMesh.position.x-this.state.width/2 > this.state.growthBoundaries[4])
            return;

        const near = this.state.growthBoundaries[5];
        const far = this.state.growthBoundaries[4];
        const geo = this.terrainMesh.geometry;
        if (this.trees.length <= 0)
            this.treeLocations.forEach((t) => {
                const vertex = geo.vertices[t];
                const tree = new Tree(this);
                tree.rotateOnAxis(new Vector3(1, 0, 0), Math.PI/2)
                tree.rotateOnAxis(new Vector3(0, 1, 0), Math.random()*2*Math.PI)
                tree.position.x = vertex.x + this.terrainMesh.position.x
                tree.position.y = vertex.y + this.terrainMesh.position.y
                tree.position.z = vertex.z + this.terrainMesh.position.z
                this.parent.add(tree)
                this.trees.push(tree)
                tree.castShadow = true;
                tree.recieveShadow = true;
            });
        else {
            let i = 0;
            this.treeLocations.forEach((t) => {
                const vertex = geo.vertices[t];
                const tree = this.trees[i];
                
                tree.position.x = vertex.x + this.terrainMesh.position.x
                tree.position.y = vertex.y + this.terrainMesh.position.y
                tree.position.z = vertex.z + this.terrainMesh.position.z - 2.5
                
                // LERP to "grow"
                const alpha = (tree.position.x - far) / (near - far);
                const maxSize = new Vector3(1.5, 1.5, 1.75).multiplyScalar(
                    noiseStrength / 60
                );
                tree.scale.lerpVectors(new Vector3(0, 0, 0), maxSize, alpha);

                i++
            });
        }
        
    }

    removeFlora() {
        this.trees.forEach((tree) => {
            this.parent.remove(tree)
        });
    }

    addToUpdateList(object) {
        this.state.updateList.push(object);
    }

    update(timeStamp, speed, noiseStrength, breathingTerrain) {
        const { updateList } = this.state;

        // Translate the chunk (move it closer and update the curve)
        this.moveOnRing(speed);

        // Increase the height of the terrain as a function of this.terrainMesh.x
        this.growTerrain(noiseStrength, breathingTerrain, timeStamp);

        // Add color as a function of this.terrainMesh.x
        this.colorTerrain();

        // Add plants, as a function of this.terrainMesh.x
        this.addFlora(noiseStrength);

        // Call update for each object in the updateList
        for (const obj of updateList) {
            obj.update(timeStamp);
        }
    }
}

export default Chunk;
