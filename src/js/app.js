/**
 * Created by jla on 15/08/2017.
 */


var jla = jla || {};
jla.app = jla.app || {};
jla.ui = jla.ui || {};

jla.app = (function () {
    var module = {};
    var gcanvas = null;
    var bjscanvas = null;
    var graph = null;
    var graph_gl = null;
    var main_node = null;//new EZ.EMesh();
    //module.main_node = main_node;
    var live_update = true;
    var textures = {};
    //-----------BABYLONJS
    var engine = null;//BJS
    var bmain_node = null;
    var blight = null; //light 
    var scene = null;
    var gCubemap = true;
    var gHdrTextures = [];
    var gHdrTexture = 0;
    var gMetallicModel = false;
    var gHdrIndex = 0; //
    var assetsManager3 = null; //used for loading graphs button
    var imageCache = new Map();



    var scene_default_properties = {
        // lighting options
        diffuse_color: "#ffffff",
        specular_color: "#ffffff",
        ground_color: "#222222",
        light_intensity: 1,
        light_dir_x: 1.0,
        light_dir_y: 1.0,
        light_dir_z: 1.0,
        alpha_threshold: 0.5,
        environment_name: "default",
        environment_blur: .2,
        mesh_name: "sphere",
        background: true,
        autorotate: true,
        version: {major:"1",minor:"01",desc:"beta"},
        version_loaded: {major:"",minor:"",desc:""}
};

    module.scene_properties = scene_default_properties;

    getVersionString = function (version) {
        return "V " + version.major + "." + version.minor + " " + version.desc;
    }

    getVersionNumber = function (version) {
        return version.major * 100 + version.minor;
    }

    module.CUBEMAPS_PATH = "assets/textures/cubemap/";
    module.TEXTURES_PATH = "assets/textures/texture/";
    module.MESHES_PATH = "assets/meshes/";
    module.GRAPHS_PATH = "graphs/";
    module.meshNames = ['sphere', 'ico', 'box', 'knot', 'torus', 'poly1', 'poly2', 'poly3','usermesh'];
    module.meshIcons = ['fa fa-globe', 'fa fa-globe', 'fa fa-cube', 'fa fa-circle-o', 'fa fa-circle-o', 'fa fa-user', 'fa fa-user', 'fa fa-user', 'fa fa-user-plus'];
    module.envNames = []; //will be filled on init()
    module.graphNames = [];


    localVars = {};
    images = {};
    material = null;

    LiteGraph.current_ctx = LiteGraph.CANVAS_2D;


    module.onLightChange = function (what, value) {
        //console.log("light change..."+value)
        if ("light_dir_x" == what) blight.direction.x = value;
        else if ("light_dir_y" == what) blight.direction.y = value;
        else if ("light_dir_z" == what) blight.direction.z = value;
        else if ("diffuse_color" == what) blight.diffuse = BABYLON.Color3.FromHexString(value);
            //else if ("specular_color" == what) {blight.specular = BABYLON.Color3.FromHexString(value);}
        else if ("ground_color" == what) blight.groundColor = BABYLON.Color3.FromHexString(value);
        else if ("light_intensity" == what) blight.intensity = (value);
    }
    /*
    module.onUserMeshChange = function (props) {
        //console.log("onUserMeshChange..." + what + ":" + value)
         createMesh("usermesh", { metallic: isMetallicModel(), usermesh_path: props.usermesh_path, usermesh_createRoot: props.usermesh_createRoot, usermesh_scale: props.usermesh_scale })
        module.scene_properties.mesh_name = "usermesh";
        jla.ui.updatePropertiesGUI();
    }
    */

    module.onEnvChange = function (what, value) {
        console.log("env change..." + what + ":" + value)
        if ('mesh_name' == what) {
            createMesh(value, { metallic: isMetallicModel() })
            
            module.compile(false, true);
        }
        else if ('environment_name' == what) {
            var ix = module.envNames.indexOf(value);
            if (ix >= 0) {
                gHdrIndex = ix;
                createSkybox();
                material.reflectionTexture = gHdrCurrent;
                module.compile(false, true);
            }
        }
        else if ('environment_blur' == what) {
            var bg = scene.getMeshByName("hdrSkyBox");
            if (bg) {
                bg.material.microSurface = 1.0 - value;
            }
            material.microSurface = 1.0 - value;
        }
        else if ('background' == what) {
            var bg = scene.getMeshByName("hdrSkyBox");
            if (bg) {
                bg.isVisible = value;
            }
        }
    }
    //    <a href="https://github.com/androdlang/PBRComposer"><img style="z-index:2;position: absolute; top: -10; right: -10; border: 0; " src="https://camo.githubusercontent.com/e7bbb0521b397edbd5fe43e7f760759336b5e05f/68747470733a2f2f73332e616d617a6f6e6177732e636f6d2f6769746875622f726962626f6e732f666f726b6d655f72696768745f677265656e5f3030373230302e706e67" alt="Fork me on GitHub" data-canonical-src="https://s3.amazonaws.com/github/ribbons/forkme_right_green_007200.png"></a>

    function createScene() {
        var canvas = document.getElementById("bjsCanvas");
        canvas.style.top = "52px";
        engine = new BABYLON.Engine(canvas, true, { stencil: true });
        scene = new BABYLON.Scene(engine);
        var bcamera = new BABYLON.ArcRotateCamera("Camera", -6 * Math.PI / 4, 2 * Math.PI / 4, 8, new BABYLON.Vector3(0, -.35, 0), scene);
        bcamera.attachControl(canvas, true);
        bcamera.wheelPrecision = 20;
        bcamera.radius = 6.8;
        blight = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0, 1, 0), scene);
        blight.intensity = scene_default_properties.light_intensity;
        blight.groundColor = BABYLON.Color3.FromHexString(scene_default_properties.ground_color);
        blight.diffuse = BABYLON.Color3.FromHexString(scene_default_properties.diffuse_color);
        blight.direction.x = scene_default_properties.light_dir_x;
        blight.direction.y = scene_default_properties.light_dir_y;
        blight.direction.z = scene_default_properties.light_dir_z;
        assetsManager3 = new BABYLON.AssetsManager(scene);
    }

    module.init = function () {
        window.addEventListener("load", jla.ui.init());
        createScene();
        var assetsManager = new BABYLON.AssetsManager(scene);
        var assetsManager2 = new BABYLON.AssetsManager(scene);

        var cubemaplistTask = assetsManager.addTextFileTask("cubemaplist", module.CUBEMAPS_PATH + "list.txt");
        cubemaplistTask.onSuccess = function (task) {
            //console.log("loaded:" + task.name);
            module.envNames = task.text.split(/\r?\n/);
        }
        var graphlistTask = assetsManager.addTextFileTask("graphlist", module.GRAPHS_PATH + "list.txt");
        graphlistTask.onSuccess = function (task) {
            //console.log("loaded:" + task.name);
            module.graphNames = task.text.split(/\r?\n/);
        }
        var texlistTask = assetsManager.addTextFileTask("texlist", module.TEXTURES_PATH + "list.txt");
        texlistTask.onSuccess = function (task) {
            //console.log("loaded:" + task.name);
            var list = task.text.split(/\r?\n/);
            list.forEach((txt) => {
                var filename = LiteGraph.removeExtension(txt);
                textures[filename] = module.TEXTURES_PATH + txt;

            })

        }
        assetsManager.load();

        assetsManager.onFinish = function (tasks) {
            var graphTask = assetsManager2.addTextFileTask("graphTask", module.GRAPHS_PATH + module.graphNames[0] + '.json');
            assetsManager2.load();
        }

        assetsManager2.onFinish = function (tasks) {
            graph = new LGraph();
            graph.scene_properties = scene_default_properties;
            module.scene_properties = graph.scene_properties;
            tasks.forEach((t) => {
                if (t.name == "graphTask") {
                    module.changeGraphData(t.text);
                    //console.log("wanted scene_environment:" + graph.scene_properties.environment_name)
                    //console.log("wanted mesh:" + graph.scene_properties.mesh_name)
                    //console.log("graph.scene_properties.version"+graph.scene_properties.version)
                }
            })
            meshAndEnvFromGraph();
            createSkybox();
            createMesh(module.scene_properties.mesh_name, { metallic: isMetallicModel() });
            loadListeners();
            module.changeCanvas();
            var crot = 0;
            scene.registerBeforeRender(function () {
                if (module.scene_properties.autorotate) {
                    crot += .005;
                    scene.activeCamera.alpha = crot;
                }
            });
            engine.runRenderLoop(function () {
                scene.render();
            });
        };



    }

    module.loadTextures = function (name, url) {

        // we read the list of assets and store the filename and its paths into a map
        var request = new XMLHttpRequest();
        request.open('GET', module.TEXTURES_PATH + "list.txt");
        request.onreadystatechange = function () {
            if (request.readyState == 4 && request.status == 200) {
                var txt = request.responseText.split(/\r?\n/);
                for (var i in txt) {
                    var filename = LiteGraph.removeExtension(txt[i]);
                    textures[filename] = module.TEXTURES_PATH + txt[i];
                }
            }
        }
        request.send();
    }

    createSkybox = function () {
        if (scene.getMeshByName("hdrSkyBox"))
            scene.getMeshByName("hdrSkyBox").dispose();

        gHdrCurrent = new BABYLON.HDRCubeTexture(module.CUBEMAPS_PATH + module.envNames[gHdrIndex], scene, 512);
        var box = scene.createDefaultSkybox(gHdrCurrent, true, 100,module.scene_properties.environment_blur);//  0.9515);
        //var tt=$('#layout_main_layout_panel_left #BJS');
        var title = document.getElementById("tabs_layout2_main_tabs_tab_BJS");
        title.children[0].textContent = "BabylonJS (" + module.envNames[gHdrIndex] + ')';
        box.isVisible = module.scene_properties.background;


    }

    module.resetPBR = function () {
        material = new BABYLON.PBRMaterial("pbr", scene);
        applyPbr(isMetallicModel());
    }

    function applyPbr(isMetallic) {
        if (bmain_node == null) return;
        //Glossiness mode
        material.albedoColor = BABYLON.Color3.FromHexString("#FFFFFF");// BABYLON.Color3.FromHexString("#FFC356");
        material.reflectivityColor = BABYLON.Color3.FromHexString("#FFFFFF");  //BABYLON.Color3.FromHexString("#FFC356");
        material.microSurface = .7;

        //  material.reflectionTexture = BABYLON.CubeTexture.CreateFromPrefilteredData(module.CUBEMAPS_PATH+module.envs[gHdrTexture], scene);// "assets/textures/cubemap/environment.dds", scene);
        material.reflectionTexture = gHdrCurrent;//BABYLON.CubeTexture.CreateFromPrefilteredData(gHdrCurrent, scene);// "assets/textures/cubemap/environment.dds", scene);
        //material.albedoTexture = new BABYLON.Texture("assets/textures/texture/albedo.png", scene);
        //material.albedoTexture.hasAlpha = true;
        //material.reflectivityTexture = new BABYLON.Texture("assets/textures/texture/sg.png", scene);
        //material.reflectivityTexture.hasAlpha = true;
        material.microSurfaceTexture = new BABYLON.Texture("assets/textures/texture/micro.jpg", scene);
        material.emissiveColor = BABYLON.Color3.FromHexString("#000000");
        //material.metallicFactor = .1;
        //material.roughnessFactor = .2;
        //material.ambientTexture = new BABYLON.Texture("assets/textures/texture/ambient.png", scene);
        material.ambientTextureStrength = 1;
        //material.albedoTexture = new BABYLON.Texture("assets/textures/texture/lee.jpg", scene);
        //material.ambientColor = new BABYLON.Color3(0, 0, 0);

        bmain_node.material = material;
    }

    function createMesh(id, props) {
        //console.log("CHANGED:" + id+" metallic:"+isMetallic);

        if (bmain_node)
            bmain_node.dispose();

        module.scene_properties.mesh_name = id;
        material = new BABYLON.PBRMaterial("pbr", scene);

        if (id == "drop_mesh") {
            BABYLON.SceneLoader.ImportMesh("", "", "data:" + props.droppath, scene, function (meshes) {
                //var mat = new BABYLON.StandardMaterial("std", scene);
                //meshes[0].material = mat;

                if (meshes.length > 1) {
                    var m = new BABYLON.Mesh("m", scene);
                    meshes.forEach((me) => {
                        me.parent = m;
                    });
                    bmain_node = m;
                } else {
                    bmain_node = meshes[0];
                }

                //meshes[0].material = bmaterial;
                bmain_node.scaling = new BABYLON.Vector3(1, 1, 1);
                //bmain_node.material = material;
                applyPbr(props.metallic);
                module.compile(false, true);

            });
            return;

        }
        else if (id == "usermesh") {
            BABYLON.SceneLoader.ImportMesh("", props.usermesh_path, props.usermesh_file,scene, function (meshes) {
                
                if (props.usermesh_createRoot && meshes.length > 1) {
                    if (meshes.length > 1) {
                        var m = new BABYLON.Mesh("m", scene);
                        meshes.forEach((me) => {
                            me.parent = m;
                        });
                        bmain_node = m;
                    } 
                } else {
                    bmain_node = meshes[0];
                }
                

                // bmain_node = meshes[0];//.clone("mymesh")
                bmain_node.scaling = new BABYLON.Vector3(props.usermesh_scale, props.usermesh_scale, props.usermesh_scale);
                 applyPbr(props.metallic);
                module.compile(false, true);
            });
            return;
        }
        else if (id == "poly3") {
            // BABYLON.SceneLoader.ImportMesh("", "assets/meshes/anvil/", "amboss1.gltf", scene, function (meshes) {
            //BABYLON.SceneLoader.ImportMesh("", "assets/meshes/", "nutAndBolt.gltf", scene, function (meshes) {
            BABYLON.SceneLoader.ImportMesh("", "assets/meshes/", "bolt2a.gltf", scene, function (meshes) {

                //BABYLON.SceneLoader.ImportMesh("", "assets/meshes/", "mylogo.babylon", scene, function (meshes) {
                //bmain_node = BABYLON.MeshBuilder.CreateTorusKnot("tk", { radius: 1, tube: .25, radialSegments: 128, tubularSegments: 64 }, scene);

                //bmain_node.onMaterialChangedObservable.add(function () {
                //    console.log("Material loaded");
                //});
                bmain_node = meshes[0];//.clone("mymesh")
                /*;
                var sh = BABYLON.Mesh.CreateSphere("sph", 32, 4, scene);
                sh.material = new BABYLON.StandardMaterial("std", scene);
                sh.material.ambientColor = BABYLON.Color3.Green();
                sh.material.emissiveColor = BABYLON.Color3.Green();
                sh.position.x = 3;
                sh.scaling.x = sh.scaling.y = sh.scaling.z = .5
                sh.parent = bmain_node;
                */

                //bmain_node.scaleInPlace(2);// = new BABYLON.Vector3(4, 4, 4);
                //meshes[0].material = bmaterial;
                bmain_node.scaling = new BABYLON.Vector3(1.3, 1.3, 1.3);
                //bmain_node.material = material;
                applyPbr(props.metallic);
                module.compile(false, true);



            });
            return;
        } else if (id == "poly2") {
            // BABYLON.SceneLoader.ImportMesh("", "assets/meshes/anvil/", "amboss1.gltf", scene, function (meshes) {
            //BABYLON.SceneLoader.ImportMesh("", "assets/meshes/", "nutAndBolt.gltf", scene, function (meshes) {
            //BABYLON.SceneLoader.ImportMesh("", "assets/meshes/", "bolt2a.gltf", scene, function (meshes) {

            BABYLON.SceneLoader.ImportMesh("", "assets/meshes/", "mylogo.babylon", scene, function (meshes) {
                //bmain_node = BABYLON.MeshBuilder.CreateTorusKnot("tk", { radius: 1, tube: .25, radialSegments: 128, tubularSegments: 64 }, scene);

                //bmain_node.onMaterialChangedObservable.add(function () {
                //    console.log("Material loaded");
                //});
                bmain_node = meshes[0];//.clone("mymesh")
                /*;
                var sh = BABYLON.Mesh.CreateSphere("sph", 32, 4, scene);
                sh.material = new BABYLON.StandardMaterial("std", scene);
                sh.material.ambientColor = BABYLON.Color3.Green();
                sh.material.emissiveColor = BABYLON.Color3.Green();
                sh.position.x = 3;
                sh.scaling.x = sh.scaling.y = sh.scaling.z = .5
                sh.parent = bmain_node;
                */

                //bmain_node.scaleInPlace(2);// = new BABYLON.Vector3(4, 4, 4);
                //meshes[0].material = bmaterial;
                bmain_node.scaling = new BABYLON.Vector3(1.3, 1.3, 1.3);
                //bmain_node.material = material;
                applyPbr(props.metallic);
                module.compile(false, true);



            });
            return;
        }
        if (id == "poly1") {
            BABYLON.SceneLoader.ImportMesh("", "assets/meshes/", "lee.obj", scene, function (meshes) {
                //bmain_node = BABYLON.MeshBuilder.CreateTorusKnot("tk", { radius: 1, tube: .25, radialSegments: 128, tubularSegments: 64 }, scene);

                //bmain_node.onMaterialChangedObservable.add(function () {
                //    console.log("Material loaded");
                //});
                bmain_node = meshes[0];//.clone("mymesh");
                //bmain_node.scaleInPlace(2);// = new BABYLON.Vector3(4, 4, 4);
                //meshes[0].material = bmaterial;
                bmain_node.scaling = new BABYLON.Vector3(4, 4, 4);
                //bmain_node.material = material;
                applyPbr(props.metallic);
                module.compile(false, true);



            });
            return;
        }
        if (id == "box") {

            bmain_node = BABYLON.Mesh.CreateBox(id, 3, scene);
        }
        else if (id == "ico") {
            //bmain_node = BABYLON.MeshBuilder.CreatePolyhedron("oct", { type: 2, size: 2 }, scene);
            bmain_node = BABYLON.MeshBuilder.CreateIcoSphere(id, { radius: 2, radiusY: 2, subdivisions: 3 }, scene);
        }
        else if (id == "sphere") {
            bmain_node = BABYLON.Mesh.CreateSphere(id, 32, 4, scene);
        }
        else if (id == "knot") {
            //bmain_node = BABYLON.Mesh.CreatePlane("plane", 4.0, scene, false, BABYLON.Mesh.DOUBLESIDE);
            bmain_node = BABYLON.MeshBuilder.CreateTorusKnot(id, { radius: 1.2, tube: .4, radialSegments: 128, tubularSegments: 32 }, scene);

        }
        else if (id == "torus") {
            bmain_node = BABYLON.MeshBuilder.CreateTorus(id, { diameter: 4, thickness: 1, tessellation: 32 }, scene);
        }

        applyPbr(props.metallic);
    }

    function isMetallicModel() {
        if (graph) {
            var n = graph.findNodesByTitle("Output");
            if (n && n.length > 0) {
                return n[0].properties.MetallicModel
            }
        }
        return false;
    }


    module.writeImageCache = function () {
        var root = graph.findNodesByTitle("Output");
        if (root.length > 0) {
            console.log("writeImageCache");
            var nOut = root[0];
            var buf = [];
            buf.push("var " + nOut.properties.global_name + "_images=function(){");
            buf.push("  var images = {};");
            buf.push("  images.environment = '" + module.CUBEMAPS_PATH + gHdrTextures[gHdrTexture] + "';");
            imageCache.forEach((e, ix) => { buf.push('  ' + e); })
            buf.push("  return images;\n}\n")
            module.createImageCode(buf.join("\n"))
        } else {
            console.log("writeImageCacheFailed");
        }
    }

    var outBuf = { body: [], uv: [], texture: [], color: [] };

    function clearOutBuf() {
        outBuf = { body: [], uv: [], texture: [], color: [], image: [], material: [] };
    }

    function myeeval(section, e) {
        //console.log(section + "/" + e);
        //evalBuf.push(e);
        outBuf[section].push('  ' + e);
        //eval(e);

    }

    function eeval(e) {
        evalBuf.push(e);
        eval(e);
    }

    function eevalNoPush(section, e) {
        console.log(section + "/...");
        eval(e);
    }

    function evalImagePath(id, texture_url, pushOnly, isDataurl) {
        if (!isDataurl) {
            var e = "images.image_" + id + "= '" + texture_url + "';";
            myeeval("image", e);
            return;
        }
        var e = "images.image_" + id + "= '" + texture_url + "';";
        var sliced = "// @see tab Images: " + e.slice(0, e.indexOf("data:")) + "data:...');";
        //console.log(sliced);
        //myeeval("image",sliced);
        if (!pushOnly)
            eevalNoPush("image", e);
    }

    function evalTexturePath(id, texture_name, level, has_alpha, isDataurl) {
        if (!isDataurl) {
            var e = "localVars.texture_" + id + "= new BABYLON.Texture(images.image_" + id + ",scene);";
            myeeval("texture", e);
            e = "localVars.texture_" + id + ".level = " + level + ";";
            myeeval("texture", e);
            e = "localVars.texture_" + id + ".hasAlpha = " + has_alpha + ";";
            myeeval("texture", e);
        } else {
            var e = "localVars.texture_" + id + "= new BABYLON.Texture('data:" + texture_name + "',scene,true,true,BABYLON.Texture.BILINEAR_SAMPLINGMODE,null, null, images.image_" + id + ", true);";
            //eeval(e);
            myeeval("texture", e);
            e = "localVars.texture_" + id + ".level = " + level + ";";
            myeeval("texture", e);
            e = "localVars.texture_" + id + ".hasAlpha = " + has_alpha + ";";
            myeeval("texture", e);
        }
    }

    function evalTexture(pinname, id) {
        var e = "material." + pinname + " = localVars.texture_" + id + ";";
        //console.log(e);
        //eeval(e);
        myeeval("body", e);
    }

    function evalTextureNone(pinname) {
        var e = "material." + pinname + " = null;";
        //console.log(e);
        //eeval(e);
        myeeval("body", e);
    }

    function evalColorVar(hex, id) {
        var e = "localVars.color_" + id + "= BABYLON.Color3.FromHexString('" + hex + "');";
        //console.log(e);
        //eeval(e);
        myeeval("color", e);
    }

    function evalColor(pinname, id) {
        var e = "material." + pinname + " = localVars.color_" + id + ";";
        //console.log(e);
        //eeval(e);
        myeeval("body", e);
    }

    function evalColorDefault(pinname, color) {
        var e = "material." + pinname + " = " + color + ";";
        //console.log(e);
        //eeval(e);
        myeeval("body", e);
    }

    function evalUVVar(props, id) {
        var e = "localVars.uv_" + id + "= { uOffset:" + props.UOffset + ",vOffset:" + props.VOffset + " ,uScale:" + props.UScale + " ,vScale:" + props.VScale + " ,uAng:" + props.UAng + " ,vAng:" + props.VAng + " ,wAng:" + props.WAng + " ,wrapU:" + props.wrapU + " ,wrapV:" + props.wrapV + "  };";
        //console.log(e);
        //eeval(e);
        myeeval("uv", e);
    }

    function evalUVs(pinname, id,uvprops) {

        ['uOffset', 'vOffset', 'uScale', 'vScale', 'uAng', 'vAng', 'wAng', 'wrapU', 'wrapV'].forEach((a) => {
            var a1 = a;
            if (a == 'uScale') {
                a1 = a + (uvprops.u ? " *-1" : "");
            } else if (a == 'vScale') {
                a1 = a + (uvprops.v ? " *-1" : "");
            }
            var e = "material." + pinname + "." + a + " = localVars.uv_" + id + "." + a1 + ";";
            //console.log(e);
            //eeval(e);
            myeeval("body", e);
        })

    }
    function evalUVInvert(pinname, uvprop) {
        var e = "material." + pinname + ".uScale *= " + (uvprop.u ? '-1' : '1') + ";";
        myeeval("body", e);
        e = "material." + pinname + ".vScale *= " + (uvprop.v ? '-1' : '1') + ";";
        myeeval("body", e);
    }


    var evalPin2 = function (objAsString, node, pin) {
        var connectedNode = node.getInputNode(pin);
        var pinname = node.inputs[pin].name;
        var isTexture = pinname.endsWith("Texture");
        if (connectedNode) {
            if (isTexture) {

                var pushonly = true;
                var isDataUrl = connectedNode.properties.texture_url.startsWith('data:');
                if (!imageCache.has(connectedNode.properties.name)) {
                    //imageCache.set(connectedNode.properties.name, { id: connectedNode.id, texture_url: connectedNode.properties.texture_url });
                    pushonly = false;
                    var e = "images.image_" + connectedNode.id + " = '" + connectedNode.properties.texture_url + "';";
                    imageCache.set(connectedNode.id, e);
                    //module.writeImageCache();



                }
                evalImagePath(connectedNode.id, connectedNode.properties.texture_url, pushonly, isDataUrl);

                //localVars.texture_6= new BABYLON.Texture('data:hugo',scene,true,true,BABYLON.Texture.BILINEAR_SAMPLINGMODE,null, null, image_6, true);
                if (isDataUrl) {
                    evalTexturePath(connectedNode.id, connectedNode.properties.name, connectedNode.properties.level, connectedNode.properties.hasAlpha, true);
                } else {
                    evalTexturePath(connectedNode.id, connectedNode.properties.texture_url, connectedNode.properties.level, connectedNode.properties.hasAlpha, false);

                }
                if (connectedNode.properties.invertU==null) {
                    connectedNode.properties.invertU=false;
                }
                if (connectedNode.properties.invertV == null) {
                    connectedNode.properties.invertV = false;
                }
                evalTexture(pinname, connectedNode.id);
                var uvNode = connectedNode.getInputNode(0);
                if (connectedNode.inputs) { //cubeTexture doesn't have inputs
                    if (uvNode) {

                        evalUVVar(uvNode.properties, uvNode.id);
                        evalUVs(pinname, uvNode.id, { u: connectedNode.properties.invertU, v: connectedNode.properties.invertV });

                    }
                    else { //no node, make it direct
                        evalUVInvert(pinname, { u: connectedNode.properties.invertU, v: connectedNode.properties.invertV });
                    }
                }

            } else {

                //console.log("color");
                evalColorVar(connectedNode.properties.color, connectedNode.id);
                evalColor(pinname, connectedNode.id);

            }
        } else {
            if (isTexture) {
                evalTextureNone(pinname);
            } else {

                evalColorDefault(pinname, pin == 2 ? "BABYLON.Color3.Black()" : "BABYLON.Color3.White()");
            }
        }
    }

    function manageModelProperties(metallic, n) {
        //if (metallic) {
        //n.options.metallic.hidden = metallic ? 0 : 1;
        //console.log("n.options.metallic.hidden:" + n.options.metallic.hidden)
        jla.ui.updateDetailDisplay(metallic);

    }

    module.compile = function (force_compile, draw) {
        if (live_update || force_compile) {

            var isMetallic = isMetallicModel();

            if (gMetallicModel != isMetallic) {
                gMetallicModel = isMetallic;
                module.resetPBR();
            }


            if (!isMetallicModel()) {
                //console.log("compile:Glossy")
                material.metallic = null;
                material.roughness = null;
                material.metallicTexture = null;
            } else {
                //console.log("compile:Metallic")
                material.metallic = 1;

            }

            var root = graph.findNodesByTitle("Output");
            if (root.length > 0) {
                var nOut = root[0];
                nOut.inputs[10].type = isMetallic ? "BABYLON.Texture" : "NONO"; ////metallicTexture
                nOut.inputs[9].type = isMetallic ? "NONO" : "BABYLON.Texture"; ////reflectiveityTexture
                nOut.inputs[10].types = isMetallic ? { bjstexture: 1 } : { nono: 1 };
                nOut.inputs[9].types = isMetallic == false ? { bjstexture: 1 } : { nono: 1 };
            }

            graph.runStep(1);

            var root = graph.findNodesByTitle("Output");
            if (root.length > 0) {
                clearOutBuf();
                var nOut = root[0];

                manageModelProperties(isMetallic, nOut);


                //if (mmodel) {
                //    nOut.inputs[0].type = "HUGO";
                //    nOut.inputs[0].types = { hugo3: 1 };
                // }
                var evalBuf = [];
                evalBuf.push('// PBR-Composer ' + getVersionString(scene_default_properties.version) + ' (johann@langhofer.net)');
                evalBuf.push('// https://github.com/androdlang/PBRComposer');
                evalBuf.push('var ' + nOut.properties.global_name + '=function(scene,images) {');
                //evalBuf.push('var scene = scene');
                evalBuf.push('  var material = new BABYLON.PBRMaterial("pbr", scene);');
                //evalBuf.push('  var module = {}');
                //evalBuf.push('  var images = {}');
                evalBuf.push('  var localVars = {}');
                evalBuf.push('  images = images||{}\n');

                var connectedNode = nOut.getInputNode(10); //metallicTexture
                if (!isMetallic && connectedNode) {
                    nOut.disconnectInput(10);
                    // nOut.inputs[10].type = "NONO";
                }
                connectedNode = nOut.getInputNode(9); //reflectivityTexture
                if (isMetallic && connectedNode) {
                    nOut.disconnectInput(9);
                    // nOut.inputs[10].type = "NONO";
                }

                nOut.inputs.forEach((a, ix) => { evalPin2("material", nOut, ix) })

                myeeval('body', "material.microSurface = " + nOut.properties.MicroSurface.toFixed(3) + ";")
                myeeval('body', "material.ambientTextureStrength = " + nOut.properties.AmbientTextureStrength.toFixed(3) + ";")
                myeeval('body', "material.useAlphaFromAlbedoTexture = " + nOut.properties.useAlphaFromAlbedoTexture + ";")

                if (nOut.properties.useRefraction) {
                    myeeval('body', "material.alpha = " + nOut.properties.alpha + ";")
                    myeeval('body', "material.refractionTexture = material.reflectionTexture;");
                    //myeeval('body', "material.linkRefractionWithTransparency = true;");
                    myeeval('body', "material.indexOfRefraction = " + nOut.properties.indexOfRefraction + ";")
                } else {
                    myeeval('body', "material.refractionTexture = null;");
                }

                myeeval('body', "material.directIntensity = " + nOut.properties.directIntensity + ";")
                myeeval('body', "material.environmentIntensity = " + nOut.properties.environmentIntensity + ";")
                myeeval('body', "material.cameraExposure = " + nOut.properties.cameraExposure + ";")
                myeeval('body', "material.cameraContrast = " + nOut.properties.cameraContrast + ";")

                myeeval('body', "material.specularIntensity = " + nOut.properties.specularIntensity.toFixed(3) + ";")
                myeeval('body', "material.emissiveIntensity = " + nOut.properties.emissiveIntensity.toFixed(3) + ";")
                myeeval('body', "material.useMicroSurfaceFromReflectivityMapAlpha =" + nOut.properties.useMicroSurfaceFromReflectivityMapAlpha + ";")

                if (isMetallic) {
                    myeeval('body', "material.metallic = " + nOut.properties.metallic.toFixed(3) + ";")
                    myeeval('body', "material.roughness = " + nOut.properties.roughness.toFixed(3) + ";")
                    myeeval('body', "material.useRoughnessFromMetallicTextureGreen = true" + ";")
                    myeeval('body', "material.useMetallnessFromMetallicTextureBlue = true" + ";")
                    myeeval('body', "material.useRoughnessFromMetallicTextureAlpha = false" + ";")
                    myeeval('body', "material.useMicroSurfaceFromReflectivityMapAlpha = false" + ";")
                    myeeval('body', "material.useAutoMicroSurfaceFromReflectivityMap = false" + ";")
                    myeeval('body', "material.useLightmapAsShadowmap = false" + ";")
                    // myeeval('body', "material.specularIntensity = 1" + ";")
                    //myeeval('body', "material.specularIntensity = " + nOut.properties.specularIntensity.toFixed(3) + ";")
                    //myeeval('body', "material.emissiveIntensity = 1" + ";")
                    myeeval('body', "material.useAlphaFromAlbedoTexture = false" + ";")
                } else {
                    myeeval('body', "material.useSpecularOverAlpha = false" + ";")
                    
                }

                //evalBuf.push('  material.reflectionTexture = BABYLON.CubeTexture.CreateFromPrefilteredData(images.environment,scene);');
                evalBuf.push('  material.reflectionTexture = new BABYLON.HDRCubeTexture(images.environment,scene,512);');
                //gHdrTextures.push(new BABYLON.HDRCubeTexture(module.CUBEMAPS_PATH + e, scene, 512));

                //evalBuf.push("material.alpha = " + nOut.properties.alpha + ";");

                //evalBuf.push('  material.refractionTexture = material.reflectionTexture;');
                //evalBuf.push('  material.linkRefractionWithTransparency = true;');
                //evalBuf.push('  material.indexOfRefraction = true;');
                //myeeval('body', "material.indexOfRefraction = " + nOut.properties.indexOfRefraction + ";")

                // if (material.bumpTexture) {
                //    myeeval('body', 'material.bumpTexture.level =' + nOut.properties.BumpLevel.toFixed(3));
                // }
                // var uniqueTexureArray = outBuf.texture.filter(function (item, pos, self) {
                //     return self.indexOf(item) == pos;
                // })
                outBuf.image.filter(function (item, pos, self) { return self.indexOf(item) == pos; }).forEach((e) => { eval(e); evalBuf.push(e) })
                outBuf.material.filter(function (item, pos, self) { return self.indexOf(item) == pos; }).forEach((e) => { eval(e); evalBuf.push(e) })
                outBuf.texture.filter(function (item, pos, self) { return self.indexOf(item) == pos; }).forEach((e) => { eval(e); evalBuf.push(e) })
                outBuf.color.filter(function (item, pos, self) { return self.indexOf(item) == pos; }).forEach((e) => { eval(e); evalBuf.push(e) })
                outBuf.uv.filter(function (item, pos, self) { return self.indexOf(item) == pos; }).forEach((e) => { eval(e); evalBuf.push(e) })
                outBuf.body.filter(function (item, pos, self) { return self.indexOf(item) == pos; }).forEach((e) => { eval(e); evalBuf.push(e) })
                evalBuf.push('  return material;\n}\n');
                module.createCodeHighlighted2(evalBuf.join("\n"));

            }


            if (draw)
                gcanvas.draw(true, true);
        }
    }

    module.draw = function () {
        gcanvas.draw(true, true);
    }

    module.createImageCode = function (bjscode) {
        // code creation
        var code_div = $("#images");//document.getElementById("code");
        code_div.height(code_div.parent().parent().height() - 30);
        code_div[0].innerHTML = '<div class="dg"><ul>' +
            '<li class="code-title">Javascript Code</li>' +
            '<pre><code class="js" id="image_code">' + bjscode + ' </pre></code>' +
            '</ul></div>';
        //hljs.highlightBlock(document.getElementById("image_code"));
    }

    module.createCodeHighlighted2 = function (bjscode) {
        // code creation
        var code_div = $("#code");//document.getElementById("code");
        code_div.height(code_div.parent().parent().height() - 30);
        code_div[0].innerHTML = '<div class="dg"><ul>' +
            '<li class="code-title">Javascript Code</li>' +
            '<pre><code class="js" id="vertex_code">' + bjscode + ' </pre></code>' +
            '</ul></div>';
        hljs.highlightBlock(document.getElementById("vertex_code"));
    }

    module.resize = function () {
        var parent = $("#layout_main_layout_panel_main div.w2ui-panel-content");
        var w = parent.width();
        var h = parent.height();
        gcanvas.resize(w, h);
        jla.ui.onResize();

        if (engine != null)
            engine.resize()
    }

    module.setLiveUpdate = function (value) {
        live_update = value;
        if (live_update) module.compile();
    }

    onGraphChange = function () {
        //module.scene_properties = graph.scene_properties;
        meshAndEnvFromGraph();
        createSkybox();
        createMesh(module.scene_properties.mesh_name, { metallic: isMetallicModel() });
        jla.ui.updatePropertiesGUI();
        module.compile(true);
    }

    meshAndEnvFromGraph = function () {
        //stores gHdrIndex, module.scene_properties.environment_name and module.scene_properties.mesh_name
        gHdrIndex = module.envNames.indexOf(graph.scene_properties.environment_name);
        if (gHdrIndex < 0) gHdrIndex = 0; //skybox will load this
        module.scene_properties.environment_name = module.envNames[gHdrIndex]
        var meshindex = module.meshNames.indexOf(graph.scene_properties.mesh_name);
        var meshname = meshindex < 0 ? 'box' : module.meshNames[meshindex];
        module.scene_properties.mesh_name = meshname;
        module.scene_properties.background = graph.scene_properties.background;
        module.scene_properties.autorotate = graph.scene_properties.autorotate;
        module.scene_properties.environment_blur = graph.scene_properties.environment_blur;
        module.scene_properties.diffuse_color = graph.scene_properties.diffuse_color;
        blight.diffuse = BABYLON.Color3.FromHexString(module.scene_properties.diffuse_color);
        module.scene_properties.ground_color = graph.scene_properties.ground_color;
        blight.groundColor = BABYLON.Color3.FromHexString(module.scene_properties.ground_color);
            
        blight.intensity = module.scene_properties.light_intensity = graph.scene_properties.light_intensity;
        blight.direction.x =  module.scene_properties.light_dir_x = graph.scene_properties.light_dir_x;
        blight.direction.y =  module.scene_properties.light_dir_y = graph.scene_properties.light_dir_y;
        blight.direction.z =  module.scene_properties.light_dir_z = graph.scene_properties.light_dir_z;



        //LOADED_VERSION:
        var version_loaded = graph.scene_properties.version ? graph.scene_properties.version : { major: "00", minor: "00", desc: "alpha" };
        console.log("version_loaded:" + getVersionString(version_loaded))


    }

    module.changeCanvas = function () {
        var container = $("#layout_main_layout_panel_main div.w2ui-panel-content");
        $("#layout_main_layout_panel_main div.w2ui-panel-content canvas").remove();
        var h = container.height();
        var w = container.width();

        if (!graph_gl) {
            graph_gl = GL.create({ width: w, height: h - 20, alpha: false });
            graph_gl.canvas.id = "graph";
        }

        if (gcanvas)
            gcanvas.stopRendering();

        var html = "<canvas id='graph' class='graph' width='" + w + "' height='" + h + "'></canvas>";
        container.append(html);

        gcanvas = new LGraphCanvas(document.getElementById("graph"), graph);
        gcanvas.background_image = "img/grid.png";


        gcanvas.onNodeSelected = function (node) {
            jla.ui.updateLeftPanel(node);
        }


        gcanvas.onDropFile = function (data, filename, file) {
            var ext = LGraphCanvas.getFileExtension(filename);
            if (ext == "json") {
                var obj = JSON.parse(data);
                graph.configure(obj);
                onGraphChange();
                /*
                meshAndEnvFromGraph();
                createSkybox();
                createMesh(module.scene_properties.mesh_name, isMetallicModel());
                jla.ui.updatePropertiesGUI();
                */




                //main_node.mesh = obj.mesh;
                jla.ui.reset();
            }
            //else {
            //     var gl = canvas2webgl ? renderer.context : graph_gl;
            //      //var tex = LGraphTexture.loadTextureFromFile(data, filename, file, null, gl);
            //  }
        }
        module.compile(true, true);
    }

    module.changeGraphData = function (json_data) {
        function onPreConfigure(data) {
            //main_node.mesh = data.mesh;
            //main_node.flags = data.node_flags || main_node.flags;
            module.scene_properties = graph.scene_properties = data.scene_properties || scene_default_properties;

        }
        function onComplete(data) {
            jla.ui.reset(graph._nodes);
            //module.writeImageCache();
        }
        graph.loadFromData(json_data, onPreConfigure, onComplete);
    }

    function loadListeners() {
        jla.ui.registerTabChange(function () {
            module.writeImageCache();
        });

        window.addEventListener("contentChange", function (force_compile, draw) {
            module.compile(force_compile, draw);
        });

        window.addEventListener("graphCanvasChange", function () {
            gcanvas.draw(true, true);
        });


        w2ui['main_layout'].on('resize', function (target, data) {
            data.onComplete = function () {
                module.resize();
            }
        });
        w2ui['layout2'].on('resize', function (target, data) {
            data.onComplete = function () {
                module.resize();
            }
        });

        w2ui['layout3'].on('resize', function (target, data) {
            data.onComplete = function () {
                module.resize();
            }
        });

        var clean_graph = document.getElementById("clean_graph");
        clean_graph.addEventListener("click", function () {
            w2confirm('Are you sure you want to delete the graph?', function (btn) {
                if (btn == "Yes") {

                    var graphTask = assetsManager3.addTextFileTask("graphTask", module.GRAPHS_PATH + 'empty_graph.json');
                    assetsManager3.load();


                    assetsManager3.onFinish = function (tasks) {
                        module.resetPBR();
                        graph.clear();
                        imageCache.clear();
                        //graph.scene_properties = scene_default_properties;
                        tasks.forEach((t) => {
                            if (t.name == "graphTask") {
                                module.changeGraphData(t.text);
                                console.log("wanted scene_environment:" + graph.scene_properties.environment_name)
                                console.log("wanted mesh:" + graph.scene_properties.mesh_name)
                            }
                        })
                       // module.scene_properties = graph.scene_properties;
                        onGraphChange();
                        /*
                        meshAndEnvFromGraph();
                        createSkybox();
                        createMesh(module.scene_properties.mesh_name, isMetallicModel());
                        jla.ui.updatePropertiesGUI();
                        module.compile(true);
                        */
                    }

                }
            })

        });

        var apply_button = document.getElementById("apply");
        apply_button.addEventListener("click", function () {
            module.compile(true);
        });

        var code_downloader = document.getElementById("download_code");
        code_downloader.addEventListener("click", function () {
            //INJECT current version
            graph.scene_properties.version = scene_default_properties.version;
            var json = graph.serialize();
            //json.mesh = main_node.mesh;
            //json.node_flags = main_node.flags;
            json.scene_properties = graph.scene_properties;
            var data = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(json));
            this.href = data;
            return true;
        });

        var live_update_el = document.getElementById("live_update");
        live_update_el.addEventListener("click", function () {
            var div = this.parentNode;
            var icon = this.getElementsByTagName('i')[0];
            if (live_update) {
                div.className = div.className.replace(/pressed\b/, '');
                icon.className = icon.className.replace(/spin\b/, '');
                module.setLiveUpdate(false);

            } else {
                div.className = div.className + " pressed";
                icon.className = icon.className + "spin";
                module.setLiveUpdate(true);
            }

        });


        var graph_loader = document.getElementById("load_graph");
        graph_loader.addEventListener("click", function () {
            var _loadGraph = function (filename) {
                assetsManager3.reset();
                var graphTask = assetsManager3.addTextFileTask("graphTask", module.GRAPHS_PATH + filename);
                assetsManager3.onFinish = function (tasks) {
                    //graph.scene_properties = scene_default_properties;
                    tasks.forEach((t) => {
                        if (t.name == "graphTask") {
                            module.changeGraphData(t.text);
                          //  module.scene_properties = graph.scene_properties;
                            onGraphChange();
                         }
                    })
                }
                assetsManager3.load();
            }

            var html = '<div class="dg"><ul id="popup-list">';
            module.graphNames.forEach((txt) => {
                html += '<li class="cr function" id="' + txt + '"> <span class="property-name">' + txt + '</span></li>';
            })
            html += '</ul></div>';
            w2popup.open({
                title: 'Load Graph',
                body: '<div class="w2ui-inner-popup">' + html + '</div>'
            });
            var list_nodes = document.getElementById("popup-list").childNodes;
            list_nodes.forEach((ln) => {
                ln.addEventListener("click", function () {
                    var graph_name = this.id.toLowerCase();
                    console.log(graph_name + "clicked")
                    _loadGraph(graph_name + '.json');
                    w2popup.close();
                })
            })

        });

        var info_but = document.getElementById("about");
        info_but.addEventListener("click", function () {

            w2popup.load({
                url: 'readme.html', showMax: true,
                width: 800,
                height: 600
            });

        });

        var mesh_buttons = document.getElementById("mesh-changer-bjs").childNodes;
        for (var i = 0; i < mesh_buttons.length; i++) {
            mesh_buttons[i].childNodes[0].addEventListener("click", function () {
                if (this.id == "grid") {
                    var bg = scene.getMeshByName("hdrSkyBox");
                    if (bg) {
                        module.scene_properties.background = !module.scene_properties.background;
                        //graph.scene_properties.background = !graph.scene_properties.background;
                        jla.ui.updatePropertiesGUI();
                        bg.isVisible = module.scene_properties.background;
                    }
                }
                else if (this.id == "autorotate") {
                    module.scene_properties.autorotate = !module.scene_properties.autorotate;
                    jla.ui.updatePropertiesGUI();
                    
                }
                else if (this.id != "") {
                    if ("usermesh" == this.id) {
                        createMesh(this.id, { metallic: isMetallicModel(), usermesh_file: module.scene_properties.usermesh_file, usermesh_path: module.scene_properties.usermesh_path, usermesh_scale: module.scene_properties.usermesh_scale, usermesh_createRoot: module.scene_properties.usermesh_createRoot });
                    } else {
                        createMesh(this.id, { metallic: isMetallicModel() });
                    }
                    jla.ui.updatePropertiesGUI();
                    module.compile(false, true);
                }
            });
        }

        $(".search").on("input", function () {
            var value = $(this).val().toLowerCase();
            $("#layout_layout3_panel_main #palette .property-name").each(function (index) {
                if ($(this).html().toLowerCase().indexOf(value) >= 0 || value == "") {
                    $(this).parent().parent().show();
                }
                else {
                    $(this).parent().parent().hide();
                }
            });

            $("#layout_layout3_panel_main #palette .folder ul").each(function (index) {
                $(this).show();
                if ($(this).children(':visible').length <= 1)
                    $(this).hide();
            });
        });
        getMeshFromData = function (filename, data) {

        }
        var doc = document.getElementById("layout_layout2_panel_main");
        doc.ondragover = function () {
            //this.className = 'hover';
            return false;
        };
        doc.ondragend = function () { this.className = ''; return false; };
        doc.ondrop = function (event) {

            var file = event.dataTransfer.files[0];
            var filename = file.name;
            var reader = new FileReader();
            reader.onload = function (event) {
                //console.log(event.target);
                var data = event.target.result;
                //getMeshFromData(filename, data);
                createMesh('drop_mesh', { metallic: isMetallicModel(), droppath: data });
                //renderer.addMesh("drop_mesh", GL.Mesh.fromData(filename, data, gl));
                //main_node.mesh = "drop_mesh";
            };
            reader.readAsText(file);
            return false;
        };


    }
    return module;
})();
