import { Group, PlaneGeometry, Mesh, MeshLambertMaterial, VertexColors, Data3DTexture } from 'three';
import  SimplexNoise  from 'simplex-noise';


class Chunk extends Group {
    constructor(parent, nx, ny) {
        // Call parent Group() constructor
        super();

        this.name = 'Chunk';

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

        this.terrainMesh = this.generateTerrain(nx, ny);

    }


    generateTerrain(nx, ny) {

        // Create Height Field using Simplex noise (https://blog.mozvr.com/low-poly-style-terrain-generation/)
        let simplex = new SimplexNoise(5);
        function map(val, smin, smax, emin, emax) {
            const t =  (val-smin)/(smax-smin)
            return (emax-emin)*t + emin
        }
        // TODO: (2) rework this noise handling so that the chunks will match up
        function noise(nx, ny) {
            // Re-map from -1.0:+1.0 to 0.0:1.0
            return map(simplex.noise2D(nx,ny),-1,1,0,1)
        }
        //stack some noisefields together, commented out bc we don't need atm
        function octave(nx,ny,octaves) {
            let val = 0;
            let freq = 1;
            let max = 0;
            let amp = 1;
            for(let i=0; i<octaves; i++) {
                val += noise(nx*freq,ny*freq)*amp;
                max += amp;
                amp /= 2;
                freq  *= 2;
            }
            return val/max;
        }

        //generate grayscale image of noise
        function generateTexture() {
            const canvas = document.createElement('canvas')
            const c = canvas.getContext('2d')
            c.fillStyle = 'black'
            c.fillRect(0,0,canvas.width, canvas.height)
            // console.log(canvas.width, canvas.height) 
            // output: 300 by 150

            for(let i=0; i<canvas.width; i++) {
                for(let j=0; j<canvas.height; j++) {
                    let v =  octave(i/canvas.width,j/canvas.height,16)
                    const per = (100*v).toFixed(2)+'%'
                    c.fillStyle = `rgb(${per},${per},${per})`
                    c.fillRect(i,j,1,1)
                }
            }
            return c.getImageData(0,0,canvas.width,canvas.height)
        }

        let data = generateTexture();

        // turn into mesh
        const geo = new PlaneGeometry(data.width,data.height,
            data.width,data.height/2)
        //assign vert data from the canvas
        for(let j=0; j<data.height; j++) {
            for (let i = 0; i < data.width; i++) {
                const n =  (j*(data.height)  +i)
                const nn = (j*(data.height+1)+i)
                const col = data.data[n*4] // the red channel
                const v1 = geo.vertices[nn]
                v1.z = map(col,0,255,-10,40) //map from 0:255 to -10:10
                if(v1.z > 2.5) v1.z *= 1.3 //exaggerate the peaks
                // v1.x += map(Math.random(),0,1,-0.5,0.5) //jitter x
                // v1.y += map(Math.random(),0,1,-0.5,0.5) //jitter y
            }
        }
        
        // Set colors:
        //for every face
        geo.faces.forEach(f=>{
            //get three verts for the face
            const a = geo.vertices[f.a]
            const b = geo.vertices[f.b]
            const c = geo.vertices[f.c]

            //if average is below water, set to 0
            //alt: color transparent to show the underwater landscape
            const avgz = (a.z+b.z+c.z)/3
            if(avgz < 0) {
                a.z = 0
                b.z = 0
                c.z = 0
            }

            //assign colors based on the highest point of the face
            const max = Math.max(a.z,Math.max(b.z,c.z))
            if(max <=0)   return f.color.set(0x44ccff)
            if(max <=10) return f.color.set(0x228800)
            if(max <=20)   return f.color.set(0xeecc44)
            if(max <=30)   return f.color.set(0xcccccc)

            //otherwise, return white
            f.color.set('white')
        })

        geo.colorsNeedUpdate = true
        geo.verticesNeedUpdate = true

        //required for flat shading
        geo.computeFlatVertexNormals()
        const mesh = new Mesh(geo, new MeshLambertMaterial({
            //wireframe:true,
            vertexColors: VertexColors,
            //required for flat shading
            flatShading:true,
        }))
        mesh.position.y = 0
        mesh.position.z = -20

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
        this.terrainMesh.translateX(x)
    }
    

}

export default Chunk;
