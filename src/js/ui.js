/**
 * Created by jla on 15/01/2015.
 */
var jla = jla || {};
jla.app = jla.app || {};
jla.ui = jla.ui || {};


jla.ui = (function () {
    var module = {};
    var details_gui = {};
    var palette_gui = {};
    var properties_gui = {};
    var texture_list = " ";
    var cubemap_list = " ";
    var oc = []; //offscreenCanvases
    var ctx = [];//offscreencontext
    for (var i = 0; i < 6; i++) {
        oc.push(document.createElement('canvas'));
        oc[i].width = 512; oc[i].height = 512;
        ctx.push(oc[i].getContext('2d'));
    }

    module.LAYOUT_EDIT = 0;
    module.LAYOUT_GRAPH = 1;
    var current_layout = module.LAYOUT_GRAPH;
    module.init = function () {
        loadLayout();
        loadImageAssetHtml(jla.app.TEXTURES_PATH,function(ret){ texture_list = ret}  );
        LiteGraph.extendNodeTypeProperties(LGraphTexture, "Texture", selectTexture);
        //LiteGraph.extendNodeTypeProperties(LGraphCubemap, "Cubemap", selectCubemap);
        module.onResize();
    }


    module.onResize = function () {
        details_gui.width = details_gui.parent_node.width();
        details_gui.domElement.style.height = details_gui.parent_node.height();
        palette_gui.width = palette_gui.parent_node.width();
        palette_gui.domElement.style.height = palette_gui.parent_node.parent().height() - $(palette_gui.domElement).prev().outerHeight(true);
        properties_gui.width = properties_gui.parent_node.width();
        properties_gui.domElement.style.height = properties_gui.parent_node.height();
    };

    module.registerTabChange = function (callback) {
        module.tabCallback = callback;
    }
    module.updateLeftPanel = function( node ){

        // remove old controllers
        for(var i in details_gui.items){
            details_gui.remove(details_gui.items[i]);
        }
        details_gui.items = [];

        // take the properties nd its options
        if(!node) return;

        var properties = node.properties;
        for (var property in properties) {
                module.addNodePropertyToPanel(node, property, details_gui, module.updateLeftPanel);
        }
        if (node.title == "Output") {
            var metallic = node.properties.MetallicModel;
            module.updateDetailDisplay(metallic);
        }
        //console.log("addNodePropertyToPanel...finito" + properties)
    };


    module.addNodePropertyToPanel = function(node, property, dat_gui, onFinnishCB) {
        var properties = node.properties;
        if (!properties.hasOwnProperty(property))
            return;

        var options = node.options;
        var opts_ctrl = options ? options[property] : undefined;
        var min = opts_ctrl ? (opts_ctrl.min) : undefined;
        var max = opts_ctrl ? (opts_ctrl.max) : undefined;
        var step = opts_ctrl ? (opts_ctrl.step) : undefined;
        var name = opts_ctrl ? (opts_ctrl.name) : undefined;
        var reloadonchange = opts_ctrl ? (opts_ctrl.reloadonchange) : undefined;
        var multichoice = opts_ctrl ? (opts_ctrl.multichoice) : undefined;
        var hidden = opts_ctrl ? (opts_ctrl.hidden) : undefined;
        if (name == "Glossiness")
            hidden = properties.MetallicModel;
 
        //if (property == "MetallicModel") {
           // node.mycallback();

       // }

        if(hidden)
            return;
        
        var controller = null;
        if(multichoice){
            controller = dat_gui.add(properties, property, multichoice );
        }
        else if( property == "color" ){
            controller = dat_gui.addColor(properties, property );
        }
        else {
            controller = dat_gui.add(properties, property, min, max, step);
            if(name) controller.name(name);
        }

        controller.callback = opts_ctrl ? (opts_ctrl.callback) : undefined;


        controller.onFinishChange(function(value) {
            if (reloadonchange) {
                onFinnishCB(node);
            }
            module.updateDisplays();

        });

        if(dat_gui.items)
            dat_gui.items.push(controller);

        controller.onChange(function (value) {

            if (property == "MetallicModel") {
                node.options.MicroSurface.hidden = properties.MetallicModel;
                node.options.useMicroSurfaceFromReflectivityMapAlpha.hidden = properties.MetallicModel;
                node.options.metallic.hidden = !properties.MetallicModel;
                node.options.roughness.hidden = !properties.MetallicModel;
                module.updateLeftPanel(node);
 
            }

            if (this.callback) {
                this.callback();
            }

                //node[this.callback]();
            if(this.property == "is_global"){
                if(value == true)
                    module.addGlobalNode(node);
                else
                    module.removeGlobalNode(node);
                jla.app.compile(false, true);
            } else if(properties["is_global"] !== true){
                jla.app.compile(false, true);
            } else {
                jla.app.draw();
            }
            module.updateDisplays();
        });

    }

    // creates the node list to dragg
    module.createRightPanel = function(  ){
        var node_types = LiteGraph.getNodeTypesCategories();
        node_types.sort(function(a, b){
            if(a < b) return 1;
            if(a > b) return -1;
            return 0;
        });
        for(var i = node_types.length -1; i >= 0; --i){
            if(node_types[i] !== ""){
                var f = palette_gui.addFolder(node_types[i]);
                var nodes = LiteGraph.getNodeTypesInCategory(node_types[i]);
                nodes.sort(function(a, b){
                    if(a.title < b.title) return 1;
                    if(a.title > b.title) return -1;
                    return 0;
                });
                for(var j = nodes.length -1; j >= 0; --j) {
                    if(nodes[j]){
                        var o = {};
                        o[nodes[j].title] = function() {};
                        var controller = f.add(o, nodes[j].title);
                        var html_node = controller.__li.firstChild.firstChild;
                        html_node.id = f.name +"/"+ controller.property;
                        html_node.setAttribute('draggable', true);
                        html_node.addEventListener('dragstart', function(e) {
                            e.dataTransfer.setData('text', this.id);
                        });
                    }
                }
                f.open();
            }

        }
        $(palette_gui.parent_node[0]).append('<input class="search" type="search" placeholder="search">');
        palette_gui.parent_node[0].appendChild(palette_gui.domElement);

    }



    // function to select a texture using a popup
    function selectTexture(){

        w2popup.open({
            title: 'Load Texture',
            width: 300,
            height: 700,
            body: '<div class="w2ui-inner-popup">'+texture_list+'</div>'
        });
        var that = this;
        var list_nodes = document.getElementById("popup-list").childNodes;
        for(var i = list_nodes.length - 1; i>= 0; --i) {
            list_nodes[i].addEventListener("click", function () {
                that.name = LiteGraph.removeExtension(this.id);
                that.texture_url = jla.app.TEXTURES_PATH + "" + this.id;
                that.is_data_url = false;
                w2popup.close();
                jla.app.compile(false,true);
                module.updateDisplays();
            });
        }

    }

    // function to select a texture using a popup
    function selectCubemap(){

        w2popup.open({
            title: 'Load Cubemap',
            width: 300,
            height: 700,
            body: '<div class="w2ui-inner-popup">'+cubemap_list+'</div>'
        });
        var that = this;
        var list_nodes = document.getElementById("popup-list").childNodes;
        for(var i = list_nodes.length - 1; i>= 0; --i) {
            list_nodes[i].addEventListener("click", function () {
                that.name = LiteGraph.removeExtension(this.id);
                that.texture_url = jla.app.CUBEMAPS_PATH +""+ this.id;
                w2popup.close();
                jla.app.compile(false,true);
                module.updateDisplays();
            });
        }

    }

    function addTopBarButton(id,icon_class,text, options){
        options = options || {};
        var node = document.getElementById("top-buttons");
        var div = document.createElement("div");
        div.className ="top-button " + (options.div_class || "");
        var anchor = document.createElement("a");
        anchor.id = id;
        if(options.anchor_href)
            anchor.setAttribute('href', options.anchor_href);
        var content = document.createTextNode(text);
        var icon = document.createElement("i");
        icon.className  = icon_class;
        anchor.appendChild(icon);
        anchor.appendChild(content);
        if(options.download)
            anchor.download = options.download;
        div.appendChild(anchor);
        node.appendChild(div);
    }

    function addMeshChangerButton(mesh,icon_class,text, options){
        options = options || {};
        var node = document.getElementById("mesh-changer");
        var div = document.createElement("div");
        div.className ="mesh-changer-button " + (options.div_class || "");
        var anchor = document.createElement("a");
        anchor.id = mesh;
        anchor.title = text;
        var icon = document.createElement("i");
        icon.className  = icon_class;
        anchor.appendChild(icon);
        if(options.download)
            anchor.download = options.download;
        div.appendChild(anchor);
        node.appendChild(div);
    }
    function addBJSMeshChangerButton(mesh, icon_class, text, options) {
        options = options || {};
        var node = document.getElementById("mesh-changer-bjs");
        var div = document.createElement("div");
        div.className = "mesh-changer-button " + (options.div_class || "");
        var anchor = document.createElement("a");
        anchor.id = mesh;
        anchor.title = text;
        var icon = document.createElement("i");
        icon.className = icon_class;
        anchor.appendChild(icon);
        
        if (options.download)
            anchor.download = options.download;
        div.appendChild(anchor);
        node.appendChild(div);
        //document.getElementById("mesh-changer-bjs").style.zIndex = "100";
    }

    function addButtons() {
        addTopBarButton("load_graph","fa fa-upload","Load");
        addTopBarButton("download_code","fa fa-download","Download", {download:"graph.json"});
        addTopBarButton("live_update","fa fa-refresh fa-spin","Live Update", {div_class:"pressed"});
        addTopBarButton("apply","fa fa-check-circle","Apply");
        addTopBarButton("clean_graph","fa fa-trash-o","Clean Up");
        addTopBarButton("about","fa fa-info","About");

        $("#layout_layout2_panel_main .w2ui-panel-content").append('<div id="mesh-changer-bjs"></div>');
        jla.app.meshNames.forEach((id,ix) => {
            addBJSMeshChangerButton(id, jla.app.meshIcons[ix], id);
        })
        addBJSMeshChangerButton("grid", "fa fa-th", "Toggle Background");
        addBJSMeshChangerButton("autorotate", "fa fa-spinner", "Toggle Autorotate");
    }

    function loadImageAssetHtml(path, callback, prefix) {
        prefix = prefix  || "" ;
        var request = new XMLHttpRequest();

        request.open('GET',path+"list.txt");
        request.onreadystatechange = function() {
            if (request.readyState==4 && request.status==200) {
                var txt = request.responseText.split(/\r?\n/);
                var html = '<div class="dg texture-popup"><ul id="popup-list">';
                for (var i in txt) {
                    html += '<li class="cr function" id="'+ txt[i] +'"><img src="'+path +'' + prefix+ '' + txt[i] + '" class="texture-selector"> <span class="property-name">'+ txt[i] + '</span></li>';
                }
                html += '</ul></div>';
                if(callback) callback.apply(this, [html]);
            }
        }
        request.send();
    }

    function loadImageAssetList(path, callback, prefix) {
        prefix = prefix || "";
        var request = new XMLHttpRequest();

        request.open('GET', path + "list.txt");
        request.onreadystatechange = function () {
            if (request.readyState == 4 && request.status == 200) {
                var txt = request.responseText.split(/\r?\n/);
                if (callback) callback.apply(this, [txt]);
            }
        }
        request.send();
    }

    function loadLayout() {

        createMainLayout();
        createLeftLayout();
        createRightLayout();
        
        module.createRightPanel();
        module.createPropertiesGUI();
        // add top buttons and mesh changers
        addButtons();
        createBJSRenderLayout();
    }


    function createMainLayout() {
        // main layout
        //var pstyle = 'background-color: #F5F6F7; border: 10px solid #dfdfdf; padding: 5px;';
        $('#layout').w2layout({
            name: 'main_layout',
            //padding:10,
            
            parent_layout: null,
            panels: [
                { type: 'top', size: 44,
                    content:'<div id="top-buttons">' +
                        '</div>' }, // so far top not used
                {
                    type: 'main', content: '<div id="code" style="display:none"></div><div id="images" style="display:none"></div>',
                    tabs: {
                        active: 'Graph',
                        tabs: [
                            { id: 'Graph', caption: 'Graph', closable: false },
                            { id: 'Code', caption: 'Code', closable: false },
                            { id: 'Images', caption: 'Images', closable: false }
                            
                        ],
                        onClick: function (event) {
                            $('#layout_main_layout_panel_main .w2ui-panel-content').children().hide();
                            var content = $('#layout_main_layout_panel_main #'+event.target);
                            content.show();
                            module.onResize();
                            
                            if (event.target == 'Images')
                                module.tabCallback();
                        }
                    } },
                { type: 'left', size: '500',  resizable: true },
                { type: 'right', size: '300', resizable: true },
                //{ type: 'bottom', size: '50', resizable: false },

            ],
            resize_cancel: true
        });
    }

    function createRightLayout() {
        var pstyle = 'padding: 5px;';
        // layout inside main_layout right panel
        // named as layout3
        $('#layout_main_layout_panel_right').w2layout({
            name: 'layout3',
            parent_layout:'main_layout',
            panel_holder:'right',
            panels: [

                { type: 'right', size: '30', resizable: true, hidden:true },

                { type: 'main', size: '50%', resizable: true,style:pstyle,
                    tabs: {
                        active: 'Palette',
                        tabs: [
                            { id: 'Palette', caption: 'Palette', closable: true },
                            { id: 'Properties', caption: 'Properties', closable: true }
                        ],
                        onClick: function (event) {
                            $('#layout_layout3_panel_main .w2ui-panel-content > div' ).hide();
                            var content = $('#layout_layout3_panel_main #'+event.target);
                            content.show();
                            module.onResize();
                        }
                    }
                }
            ],
            resize_cancel: true
        });
        w2ui['layout3'].content('right',
            w2ui['layout3_main_tabs'].getMaximizeButton('Palette', 'right')+
            w2ui['layout3_main_tabs'].getMaximizeButton('Properties', 'right')
        );

        // right panel dat GUI, holds all the nodes that can be dragged to the canvas
        palette_gui = new dat.GUI({
            resizable: false,
            hideable: false,
            autoPlace: false
        });

        $("#layout_layout3_panel_main div.w2ui-panel-content").append("<div id='palette'></div>");
        var palette_div = $("#palette");
        palette_gui.parent_node = palette_div;
        palette_gui.width = palette_div.width();
    }
    function createBJSRenderLayout() {
        //var content = document.createElement("INPUT");
        
        var canvas = document.createElement('canvas');
        var div = document.getElementById("layout_layout2_panel_main");
        //div.appendChild(content);
        canvas.id = "bjsCanvas";
        //canvas.width = 300;
        //canvas.height = 300;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.zIndex = 1;
        canvas.style.position = "absolute";
        canvas.style.border = "0px;// solid";
        div.appendChild(canvas);
    }

    function createLeftLayout() {
        // layout inside main_layout left panel
        // named as layout2
        // these tabs contain the nodes, the light, the properties
        var pstyle = 'padding: 5px;';
        $('#layout_main_layout_panel_left').w2layout({
            name: 'layout2',
            parent_layout:'main_layout',
            panel_holder:'left',
            panels: [
            {
                type: 'main', size: '50%', resizable: true, tabs:
                    {
                        active: 'BJS',
                        tabs:
                            [
                            { id: 'BJS', caption: 'BabylonJS', closable: false },
                            ]
                    }
            },

            {
                type: 'left', size: '30', resizable: true, hidden: true
            },

            /*
            {
                type: 'main', size: '10%', resizable: true,
                tabs:
                    {
                        active: 'Preview',
                        tabs: [
                            { id: 'Preview', caption: 'Preview', closable: true },
                        ],
                        onClick: function (event) {              }
                    }
            },
            */
            {
                type: 'preview', size: '50%', resizable: true ,style:pstyle,
                    tabs: {
                        active: 'Details',
                        tabs: [
                            { id: 'Details', caption: 'Node Details', closable: false },
                        ],
                        onClick: function (event) {
                            $('#layout_layout2_panel_preview .w2ui-panel-content  > div' ).hide();
                            var content = $('#layout_layout2_panel_preview #'+event.target);
                            content.show();
                            module.onResize();
                        }
                    }
            }


            ],
            resize_cancel: true
        });
        // we put some hidden buttons for the minimized tabs
        //w2ui['layout2'].content('left',
        //        w2ui['layout2_preview_tabs'].getMaximizeButton('Details', 'left') +
        //        w2ui['layout2_main_tabs'].getMaximizeButton('BJS', 'left')
        //);

        // left panel dat gui, it is filled with the nodes info once they are seclected
        details_gui = new dat.GUI({
            resizable: true,
            hideable: false,
            autoPlace: false
        });
        details_gui.parent_node = $("#layout_layout2_panel_preview div.w2ui-panel-content");
        details_gui.width = details_gui.parent_node.width();
        details_gui.domElement.id = "Details";
        details_gui.parent_node[0].appendChild(details_gui.domElement);

    }


    function removeFolder(folder, parent){
        for (var j in folder.__controllers) {
            var controller = folder.__controllers[j];
            folder.__ul.removeChild(controller.__li);
        }
        folder.__controllers = [];
        parent.__ul.removeChild(folder.domElement.parentNode); // accessing li
        delete parent.__folders[folder.name];
    }

    module.removeGlobalNode = function(node) {
        var parent_folder = properties_gui.__folders["Properties"];
        var folder_id = node.title + node.id;
        var f = parent_folder.__folders[folder_id];
        removeFolder(f, parent_folder);
    }


    module.addGlobalNode = function(node) {
        var f1 = properties_gui.__folders["Properties"];
        var folder_name= node.properties.global_name;
        var folder_id = node.title + node.id;
        var f2 = f1.addFolder(folder_id, folder_name);
        for(var property in node.properties)
            module.addNodePropertyToPanel(node, property, f2, module.updatePropertiesGUI);
        f2.open();
    }

    module.removeProperties = function() {
        var parent_folder = properties_gui.__folders["Properties"];
        for(var i in parent_folder.__folders)
            removeFolder(parent_folder.__folders[i], parent_folder);
    }

    module.setProperties = function(nodes) {
        for(var i in nodes){
            var node = nodes[i];
            if(node.properties.is_global){
                module.addGlobalNode(node);
                var opts_ctrl = node.options ? node.options["is_global"] : undefined;
                var cb = opts_ctrl ? (opts_ctrl.callback) : undefined;
                if(cb)
                    node[cb]();
            }

        }
    }
    function onHit() {
        console.log("onHit")
    }


    module.updatePropertiesGUI = function(){
        var properties = jla.app.scene_properties;
        //properties.environment = loadEnvironment;
        if(properties["environment_name"]=== undefined) properties["environment_name"]= "default";
        if (properties["environment_blur"] === undefined) properties["environment_blur"] = 0.2;
        if (properties["usermesh_path"] === undefined) properties["usermesh_path"] = "assets/meshes/";
        if (properties["usermesh_file"] === undefined) properties["usermesh_file"] = "";
        if (properties["usermesh_scale"] === undefined) properties["usermesh_scale"] = 1;
        if (properties["usermesh_createRoot"] === undefined) properties["usermesh_createRoot"] = false;
        /*
        properties["loadMesh"] = function () {
            properties["mesh_name"] = "usermesh";
            //jla.app.scene_properties.mesh_name="usermesh"
            //jla.app.onEnvChange(properties["mesh_name"], "usermesh");

            jla.app.onUserMeshChange({ usermesh_createRoot: this.usermesh_createRoot, usermesh_path: this.usermesh_path, usermesh_file: this.usermesh_file, usermesh_scale: this.usermesh_scale });
        };
        */
        //if (properties["app_vmajor"] === undefined) properties["app_vmajor"] = "00";
        //if (properties["app_vminor"] === undefined) properties["app_vminor"] = "00";
        //if (properties["app_vdesc"] === undefined) properties["app_vdesc"] = "unknown";
        var node = jla.app.main_node;
        for(var i in properties_gui.items){
            properties_gui.remove(properties_gui.items[i]);
        }
        properties_gui.items = [];

        for(var i in properties_gui.__folders) {
            var folder = properties_gui.__folders[i];
            for (var j in folder.__controllers) {
                var controller = folder.__controllers[j];
                folder.__ul.removeChild(controller.__li);
            }
            folder.__controllers = [];
        }

        var f2 = properties_gui.__folders["Lighting"];
        //f2.add(properties, 'light_mode', [ 'phong' ]);
        f2.addColor(properties, 'diffuse_color');
        //f2.addColor(properties, 'specular_color');
        f2.addColor(properties, 'ground_color');
        f2.add(properties, 'light_intensity', 0, 10, 0.1);
        f2.add(properties, 'light_dir_x', -1, 1, 0.01);
        f2.add(properties, 'light_dir_y', -1, 1, 0.01);
        f2.add(properties, 'light_dir_z', -1, 1, 0.01);
        f2.open();
        /*
        var f3 = properties_gui.__folders["Material"];
        //f3.add(node.flags, 'blending');
        //f3.add(node.flags, 'blending_mode', [ 'additive', 'substractive', 'multiplicative', 'alpha_blended', 'screen'   ]);
        //f3.add(node.flags, 'flip_normals');
        f3.add(node.flags, 'two_sided');
        //f3.add(properties, 'alpha_threshold', 0, 1, 0.01);
        */
        var f4 = properties_gui.__folders["Environment"];
        f4.add(properties,'mesh_name',jla.app.meshNames)
        //f4.add(properties, 'environment_name');
        f4.add(properties, 'environment_name', jla.app.envNames)
        f4.add(properties, 'environment_blur', 0, 1, 0.05)
        f4.add(properties, 'background')
        f4.add(properties, 'autorotate')

        var f6 = properties_gui.__folders["UserMesh"];
        f6.add(properties, 'usermesh_path')
        f6.add(properties, 'usermesh_file')
        f6.add(properties, 'usermesh_scale', 1, 10, 1)
        f6.add(properties, 'usermesh_createRoot')
        //f6.add(properties, 'loadMesh')
        //f4.add(properties, 'app_vmajor', { hidden: 1 })
        //f4.add(properties, 'app_vminor', { hidden: 1 })
        //f4.add(properties, 'app_vdesc', { hidden: 1 })

        for(var i in f2.__controllers){
            var controller = f2.__controllers[i];
            controller.onChange(function(value) {
                jla.app.onLightChange(this.property,value);
            });
        }
        for (var i in f4.__controllers) {
            var controller = f4.__controllers[i];
            controller.onChange(function (value) {
                jla.app.onEnvChange(this.property, value);
            });
        }
        /*
        for (var i in f6.__controllers) {
            var controller = f6.__controllers[i];
            controller.onChange(function (value) {
                jla.app.onUserMeshChange(this.property, value);
            });
        }
        */


    }


     module.createPropertiesGUI = function(){

        properties_gui = new dat.GUI({
            resizable: true,
            hideable: false,
            autoPlace: false
        });
        properties_gui.parent_node = $("#layout_layout3_panel_main div.w2ui-panel-content");
        properties_gui.width = properties_gui.parent_node.width();
        properties_gui.domElement.id = "Properties";
        properties_gui.parent_node[0].appendChild(properties_gui.domElement);
        var f1 = properties_gui.addFolder('Properties');
        f1.open();
        var f2 = properties_gui.addFolder('Lighting');
        f2.open();
        //var f3 = properties_gui.addFolder('Material');
        //f3.open();
        var f4 = properties_gui.addFolder('Environment');
        f4.open();
        var f6 = properties_gui.addFolder('UserMesh');
        f6.open();
        module.updatePropertiesGUI();

    }


    var old_left_size = 0;
    var old_right_size = 0;
    var layout2_preview_tabs_min = {};// to save the last minimized state
    var layout2_main_tabs_min = {};//  this is the previsualitzation
    var layout3_main_tabs_min = {};
    module.changeLayout = function(  ) {

        if(current_layout == jla.ui.LAYOUT_GRAPH){
            current_layout = jla.ui.LAYOUT_EDIT;
            old_left_size = w2ui['main_layout'].get("left").size;
            old_right_size = w2ui['main_layout'].get("right").size;

            layout3_main_tabs_min["Palette"] = w2ui['layout3_main_tabs'].get("Palette").minimized;
            layout3_main_tabs_min["Properties"] = w2ui['layout3_main_tabs'].get("Properties").minimized;
            layout2_preview_tabs_min["Details"] = w2ui['layout2_preview_tabs'].get("Details").minimized;
            layout2_main_tabs_min["Preview"] = w2ui['layout2_main_tabs'].get("Preview").minimized;

            for (var i2 = 0; i2 < w2ui['layout2_preview_tabs'].tabs.length; i2++) {
                var id = w2ui['layout2_preview_tabs'].tabs[i2].id;
                layout2_preview_tabs_min[id] = w2ui['layout2_preview_tabs'].tabs[i2].minimized;
                w2ui['layout2_preview_tabs'].minimize(id);
            }

            w2ui["main_layout"].hide('main', true);
            w2ui["main_layout"].sizeTo("left", "80%", true);
            w2ui["main_layout"].sizeTo("right", "19%", true);

            w2ui['layout3_main_tabs'].minimize("Palette");
            w2ui['layout3_main_tabs'].minimize("Properties");
            w2ui['layout3_main_tabs'].maximize("Properties");
            w2ui['layout2_main_tabs'].maximize("Preview", undefined, false);

        } else {
            current_layout = jla.ui.LAYOUT_GRAPH;
            w2ui["main_layout"].show('main', true);
            w2ui["main_layout"].sizeTo("left", old_left_size, true);
            w2ui["main_layout"].sizeTo("right", old_right_size, true);

            for (var i2 = 0; i2 < w2ui['layout2_preview_tabs'].tabs.length; i2++) {
                var id = w2ui['layout2_preview_tabs'].tabs[i2].id;
                if(!layout2_preview_tabs_min[id])
                    w2ui['layout2_preview_tabs'].maximize(id);

            }
            if(layout2_main_tabs_min["Preview"])
                w2ui['layout2_main_tabs'].minimize("Preview");

            for (var i2 = w2ui['layout3_main_tabs'].tabs.length -1; i2 >= 0 ; i2--) {
                var id = w2ui['layout3_main_tabs'].tabs[i2].id;
                if(layout3_main_tabs_min[id])
                    w2ui['layout3_main_tabs'].minimize(id);
                else
                    w2ui['layout3_main_tabs'].maximize(id);
            }
            w2ui["main_layout"].sizeTo("left", old_left_size, true);
            w2ui["main_layout"].sizeTo("right", old_right_size, true);

        }
    }


    module.updateFolder = function(f) {
        for (var i in f.__controllers) {
            f.__controllers[i].updateDisplay(true);
        }
    }
    module.updateDetailDisplay = function (metallic) {
        for (var i in details_gui.items) {
            var prop = details_gui.items[i].property;
            if (prop == "roughness" ||prop=="metallic") {
                details_gui.items[i].domElement.parentElement.children[0].style.color = metallic ? LiteGraph.NODE_DEFAULT_COLOR : LiteGraph.NODE_COLOR_NOTALLOWED;
            }
        }
    }

    module.updateDisplays = function() {

        var props_folders = properties_gui.__folders["Properties"].__folders;
        for (var i in props_folders) {
            var folder = props_folders[i];
            for(var j in folder.__controllers)
                folder.__controllers[j].updateDisplay(true);
        }
        //console.log("updateDetailDisplays...")
        for (var i in details_gui.__controllers) {
            details_gui.__controllers[i].updateDisplay(true);
        }

    }

    module.reset = function(nodes){
        module.updateLeftPanel(null); // remove the node in the panel if it exist
        module.updatePropertiesGUI();
        module.removeProperties();
        module.setProperties(nodes);
    }

    module.removeNode = function(node) {
        if(node.properties.is_global)
            module.removeGlobalNode(node);
        module.updateLeftPanel(null);
    }

    return module;

})();


