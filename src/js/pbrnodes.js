



//Constant
function LGraphConstColor()
{
    this.addOutput("color","BABYLON.Color3", {bjscolor3:1});
    this.properties = { color:"#ffffff"};
    this.editable = { property: "value", type: "bjscolor3" };
    this.options = this.options || {};
    this.default = "#ffffff";
    //this.options.is_global = {hidden:false};
    this.boxcolor = this.properties.color;
    //this.shader_piece = new PConstant("var"); // hardcoded for testing
    //this.global_var = {name:"vec4_"+this.id, value: this.properties , getValue:function(){return LiteGraph.hexToColor(this.value["color"], true)}};
}

LGraphConstColor.title = "Color";
LGraphConstColor.desc = "Constant color";


LGraphConstColor.prototype.onDrawBackground = function(ctx)
{
    this.bgcolor = this.properties.color;
}
LGraphConstColor.prototype.disconnectInput = function ()
{
    console.log("disconnectInput");
}



LiteGraph.registerNodeType("constants/"+LGraphConstColor.title, LGraphConstColor);




//UVS





//UVS


//UVS
function LGraphUVs()
{
    this.addOutput("UVs","vec4", {vec4:1});

    this.properties = { UScale:1.0,
        VScale: 1.0,
        UOffset: 0,
        VOffset: 0,
        UAng:0,
        VAng: 0,
        WAng: 0,
        wrapU: 1,
        wrapV:1
    };
    this.options =  this.options || {};
    this.options = {
        UScale: { step: 0.01 },
        VScale: { step: 0.01 },
        UOffset: { step: 0.01, min: -10, max: 10 },
        VOffset: { step: 0.01, min: -10, max: 10 },
        UAng: { step: Math.PI/8, min: -Math.PI, max: Math.PI },
        VAng: { step: Math.PI / 8, min: -Math.PI, max: Math.PI },
        WAng: { step: Math.PI / 8, min: -Math.PI, max: Math.PI },
        wrapU: { step: 1, min: 0, max: 2 },
        wrapV: { step: 1, min: 0, max: 2 }
};
    this.shader_piece = PUVs; // hardcoded for testing
}

LGraphUVs.title = "TextureCoords";
LGraphUVs.desc = "Texture coordinates";



LGraphUVs.prototype.processInputCode = function(scope)
{
    this.codes[0] = this.shader_piece.getCode({order:this.order,
                                                utiling:this.properties.UTiling.toFixed(3),
                                                vtiling: this.properties.VTiling.toFixed(3),
                                                uoffset: this.properties.UOffset.toFixed(3),
                                                voffset: this.properties.VOffset.toFixed(3),
                                                out_var:"uvs_"+this.id,
                                                scope:scope
                                                }); // I need to check texture id
}

LGraphUVs.prototype.setFloatValue = function(old_value,new_value) {
    if( typeof(new_value) == "string") new_value = parseFloat(new_value);
    old_value = new_value;
}

LGraphUVs.prototype.setValue = function(v1,v2,v3,v4,v5)
{
    this.setFloatValue(this.properties["UTiling"],v1);
    this.setFloatValue(this.properties["VTiling"],v2);
    this.setFloatValue(this.properties["UOffset"], v3);
    this.setFloatValue(this.properties["VOffset"], v4);
    this.setFloatValue(this.properties["VAng"], v5);
};

LiteGraph.registerNodeType("coordinates/"+LGraphUVs.title , LGraphUVs);







/**
 * Created by vik on 21/01/2015.
 */


function LGraphShader()
{
    this.uninstantiable = true;
    this.clonable = false;
    //BJS
    this.addInput("albedoColor", "BABYLON.Color3", { bjscolor3: 1 });
    this.addInput("reflectivityColor", "BABYLON.Color3", { bjscolor3: 1 });
    this.addInput("emissiveColor", "BABYLON.Color3", { bjscolor3: 1 });
    this.addInput("ambientColor", "BABYLON.Color3", { bjscolor3: 1 });
    //this.addInput("microSurface", "float", { float: .5 });
    this.addInput("albedoTexture", "BABYLON.Texture", { bjstexture: 1 });
    this.addInput("ambientTexture", "BABYLON.Texture", { bjstexture: 1 });
    //this.addInput("ambientTextureStrength", "float", { float: .5 });
    this.addInput("bumpTexture", "BABYLON.Texture", { bjstexture: 1 });
    this.addInput("microSurfaceTexture", "BABYLON.Texture", { bjstexture: 1 });
    this.addInput("emissiveTexture", "BABYLON.Texture", { bjstexture: 1 });
    this.addInput("reflectivityTexture", "BABYLON.Texture", { bjstexture: 1 });
    //this.addInput("reflectionTexture", "BABYLON.CubeTexture", { bjscubemap: 1 });
    this.addInput("metallicTexture", "BABYLON.Texture", { bjstexture: 1 });

    this.properties = {
        global_name:"Output",
        MetallicModel: false,
        MicroSurface: 0.5,
        AmbientTextureStrength: .5,
        useAlphaFromAlbedoTexture: false,
        useMicroSurfaceFromReflectivityMapAlpha:false,
        useRefraction:false,
        alpha:1.0,
        indexOfRefraction: 0.0,
        directIntensity: 0.0,
        environmentIntensity: 1.0,
        specularIntensity: 1.0,
        emissiveIntensity: .5,
        cameraExposure: 1.0,
        cameraContrast:1.0,
        metallic: 1,
        roughness:.5
    };
    this.options = this.options || {};

    function onChangeMetallicModel() {
        console.log("here we go");

       // this.options.MicroSurface.hidden = true;
    }
    this.options = {
        MicroSurface: { step: 0.01, min: 0, max: 1, name: "Glossiness",hidden:false },
        AmbientTextureStrength: { step: 0.01, min: 0, max: 1 },
        alpha: { step: 0.01, min: 0, max: 1 },
        indexOfRefraction: { step: 0.01, min: 0, max: 2 },
        useMicroSurfaceFromReflectivityMapAlpha:{name:"microSurfaceFromReflectivityAlpha",hidden:false},
        directIntensity: { step: 0.01, min: 0, max: 2 },
        environmentIntensity: { step: 0.01, min: 0, max: 10 },
        specularIntensity: { step: 0.01, min: 0, max: 1 },
        emissiveIntensity: { step: 0.01, min: 0, max: 1 },
        cameraExposure: { step: 0.01, min: 0, max: 2 },
        cameraContrast: { step: 0.01, min: 0, max: 2 },
        MetallicModel: { callback: onChangeMetallicModel },
        metallic: { step: 0.01, min: 0, max: 1, hidden: true}, //starting with glosyy model
        roughness: { step: 0.01, min: 0, max: 1, hidden: true } //starting with glosyy model
    };

    this.size = [125,250];
    //this.shader_piece = ShaderConstructor;
}

LGraphShader.title = "Output";
LGraphShader.desc = "Output Main Node";


LiteGraph.registerNodeType("core/"+ LGraphShader.title ,LGraphShader);



//**************************
function LGraphTexturePreview()
{
    this.addInput("Texture","Texture", {Texture:1, Vec3:1, Vec4:1});
    this.properties = { flipY: false };
    this.size = [LGraphTexture.image_preview_size, LGraphTexture.image_preview_size];
}

LGraphTexturePreview.title = "Preview";
LGraphTexturePreview.desc = "Show a texture in the graph canvas";

LGraphTexturePreview.prototype.onDrawBackground = function(ctx)
{
    if(this.flags.collapsed) return;

    var tex = this.getInputData(0);
    if(!tex) return;

    var tex_canvas = null;

    if(!tex.handle && ctx.webgl)
        tex_canvas = tex;
    else
        tex_canvas = LGraphTexture.generateLowResTexturePreview(tex);

    //render to graph canvas
    ctx.save();
    if(this.properties.flipY)
    {
        ctx.translate(0,this.size[1]);
        ctx.scale(1,-1);
    }
    ctx.drawImage(tex_canvas,0 + LiteGraph.NODE_COLLAPSED_RADIUS * 0.5,0 + LiteGraph.NODE_COLLAPSED_RADIUS * 0.5,this.size[0] - LiteGraph.NODE_COLLAPSED_RADIUS,this.size[1]- LiteGraph.NODE_COLLAPSED_RADIUS);
    ctx.restore();
}

//LiteGraph.registerNodeType("texture/"+LGraphTexturePreview.title, LGraphTexturePreview );
window.LGraphTexturePreview = LGraphTexturePreview;

function LGraphTexture()
{
    this.addOutput("Texture", "BABYLON.Texture", { bjstexture: 1 });
    this.addInput("UVs", "vec4", { vec4: 1 });

    // properties for for dat gui
    this.properties =  this.properties || {};
    this.properties.name = "";
    this.properties.texture_url = "";
    this.properties.level = .5;
    this.properties.invertU = false;
    this.properties.invertV = false;
    this.properties.hasAlpha = false;
    this.properties.is_data_url = true;


    this.options = this.options || {};
    this.options.is_data_url = { hidden: 1 };
    this.options.texture_url = { hidden: 1 };
    this.options.level = { min: -1, max: 1, step: .01 };
    this.options.name = {};
    this.options.hasAlpha = {};
    var that = this;


    //this.size = [LGraphTexture.image_preview_size, LGraphTexture.image_preview_size];
    this.size = [170,165];
    this.shader_piece = PTextureSample; // hardcoded for testing
    this.uvs_piece = PUVs;
    // default texture
//    if(typeof(gl) != "undefined" && gl.textures["default"]){
//        this.properties.name = "default";
//        this._drop_texture = gl.textures["default"];
//    }
}

LGraphTexture.title = "TextureSample";
LGraphTexture.desc = "textureSample";
LGraphTexture.widgets_info = {"name": { widget:"texture"} };

//REPLACE THIS TO INTEGRATE WITH YOUR FRAMEWORK
LGraphTexture.textures_container = {}; //where to seek for the textures, if not specified it uses gl.textures
LGraphTexture.loadTextureCallback = null; //function in charge of loading textures when not present in the container
LGraphTexture.image_preview_size = 256;

//flags to choose output texture type
LGraphTexture.PASS_THROUGH = 1; //do not apply FX
LGraphTexture.COPY = 2;			//create new texture with the same properties as the origin texture
LGraphTexture.LOW = 3;			//create new texture with low precision (byte)
LGraphTexture.HIGH = 4;			//create new texture with high precision (half-float)
LGraphTexture.REUSE = 5;		//reuse input texture
LGraphTexture.DEFAULT = 2;

LGraphTexture.MODE_VALUES = {
    "pass through": LGraphTexture.PASS_THROUGH,
    "copy": LGraphTexture.COPY,
    "low": LGraphTexture.LOW,
    "high": LGraphTexture.HIGH,
    "reuse": LGraphTexture.REUSE,
    "default": LGraphTexture.DEFAULT
};

LGraphTexture.prototype.selectTexture = function (n) {
    console.log("LGraphTexture.selectTexture")
    n.graph.onSelectTexture(n);
    
}
LGraphTexture.getTexture = function(name, url, is_cube)
{
    var container =  gl.textures || LGraphTexture.textures_container; // changedo order, otherwise it bugs with the multiple context

    if(!container)
        throw("Cannot load texture, container of textures not found");

    var tex = container[ name ];

    if(!tex && name && name[0] != ":" || tex && tex.width == 1 && tex.height == 1 && tex.texture_type != gl.TEXTURE_CUBE_MAP)
    {
        //texture must be loaded
        if(LGraphTexture.loadTextureCallback)
        {
            var loader = LGraphTexture.loadTextureCallback;
            tex = loader( name, url, is_cube );
            return tex;
        }
        else
        {
            var url = name;
            if(url.substr(0,7) == "http://")
            {
                if(LiteGraph.proxy) //proxy external files
                    url = LiteGraph.proxy + url.substr(7);
            }

            tex = container[ name ] = GL.Texture.fromURL(name, {});
        }
    }

    return tex;
}


LGraphTexture.loadTextureFromFile = function(data, filename, file, callback, gl){

    gl = gl || window.gl;
    if(data)
    {
        var texture = null;
        var no_ext_name = LiteGraph.removeExtension(filename);
        if( typeof(data) == "string" )
            gl.textures[no_ext_name] = texture = GL.Texture.fromURL( data, {}, callback, gl );
        else if( filename.toLowerCase().indexOf(".dds") != -1 )
            texture = GL.Texture.fromDDSInMemory(data, { minFilter:  gl.LINEAR_MIPMAP_LINEAR });
        else
        {
            var blob = new Blob([file]);
            var url = URL.createObjectURL(blob);
            texture = GL.Texture.fromURL( url, {}, callback , gl  );
        }
        texture.name = no_ext_name;
        return texture;
    }

}



LGraphTexture.prototype.onDropFile = function(data, filename, file, callback, gl)
{
    if(!data)
    {
        this._drop_texture = null;
        this.properties.name = "";
    } else {
        var tex = LGraphTexture.loadTextureFromFile(data, filename, file, LGraphTexture.configTexture, gl);
        if(tex){
            this._drop_texture = tex;
            this._last_tex = this._drop_texture;
            this.properties.name = filename;//tex.name;
            this.properties.texture_url = data;//filename;
            this.properties.is_data_url = true;
            
            this._drop_texture.current_ctx = LiteGraph.current_ctx;
            //console.log("JLA_LGraphTexture.onDropFile:" + filename);
        }
    }
}

LGraphTexture.prototype.getExtraMenuOptions = function(graphcanvas)
{
    var that = this;
    if(!this._drop_texture)
        return;
    return [ {content:"Clear", callback:
        function() {
            that._drop_texture = null;
            that.properties.name = "";
        }
    }];
}

LGraphTexture.prototype.onExecute = function()
{
    
    var n = this.graph.findNodesByTitle("Output")[0]; //shader
    //this.processNodePath();
    if(this._drop_texture ){

        if(this._drop_texture.current_ctx != LiteGraph.current_ctx){
            this._drop_texture = LGraphTexture.getTexture( this.properties.name, this.properties.texture_url );
        }
            this.setOutputData(0, this._drop_texture);
            return;
    }

    if(!this.properties.name)
        return;

    var tex = LGraphTexture.getTexture( this.properties.name, this.properties.texture_url );
    if(!tex)
        return;
    
    this._last_tex = tex;
    this.setOutputData(0, tex);
    
}


LGraphTexture.prototype.onDrawBackground = function(ctx)
{
    if( this.flags.collapsed || this.size[1] <= 20 )
        return;

    if( this._drop_texture && ctx.webgl )
    {
        ctx.drawImage(this._drop_texture,this.size[1]* 0.05,this.size[1]* 0.2,this.size[0]* 0.75,this.size[1]* 0.75);
        //this._drop_texture.renderQuad(this.pos[0],this.pos[1],this.size[0],this.size[1]);
        return;
    }

    //Different texture? then get it from the GPU
    if(this._last_preview_tex != this._last_tex)
    {
        if(ctx.webgl)
        {
            this._canvas = this._last_tex;
        }
        else if( !this._drop_texture && !this._last_tex.hasOwnProperty("ready")|| this._drop_texture && !this._drop_texture.hasOwnProperty("ready"))
        {
            var tex_canvas = LGraphTexture.generateLowResTexturePreview(this._last_tex);
            if(!tex_canvas)
                return;

            this._last_preview_tex = this._last_tex;
            this._canvas = cloneCanvas(tex_canvas);
        }
    }

    if(!this._canvas)
        return;

    //render to graph canvas
    ctx.save();
    if(!ctx.webgl) //reverse image
    {
        ctx.translate(0,this.size[1]);
        ctx.scale(1,-1);
    }
    ctx.drawImage(this._canvas,this.size[1]* 0.05,this.size[1]* 0.1,this.size[0]* 0.75,this.size[1]* 0.75);
    ctx.restore();
}


//very slow, used at your own risk
LGraphTexture.generateLowResTexturePreview = function(tex)
{
    if(!tex) return null;

    var size = LGraphTexture.image_preview_size;
    var temp_tex = tex;

    //Generate low-level version in the GPU to speed up
    if(tex.width > size || tex.height > size)
    {
        temp_tex = this._preview_temp_tex;
        if(!this._preview_temp_tex)
        {
            temp_tex = new GL.Texture(size,size, { minFilter: gl.NEAREST });
            this._preview_temp_tex = temp_tex;
        }

        //copy
        tex.copyTo(temp_tex);
        tex = temp_tex;
    }

    //create intermediate canvas with lowquality version
    var tex_canvas = this._preview_canvas;
    if(!tex_canvas)
    {
        tex_canvas = createCanvas(size,size);
        this._preview_canvas = tex_canvas;
    }

    if(temp_tex)
        temp_tex.toCanvas(tex_canvas);
    return tex_canvas;
}







LGraphTexture.loadTextureCallback = function(name, url, is_cube)
{
    is_cube = is_cube || false;
    function callback(tex){
        LGraphTexture.configTexture(tex);
        LiteGraph.dispatchEvent("graphCanvasChange", null, null);
    }
    if(!is_cube)
        tex = gl.textures[ name ] = GL.Texture.fromURL(url, {}, callback);
    else
        tex = gl.textures[ name ] = GL.Texture.cubemapFromURL( url, {temp_color:[80,120,40,255], is_cross:1, minFilter: gl.LINEAR_MIPMAP_LINEAR}, callback);
    return tex;
}

LGraphTexture.configTexture = function(tex)
{
    tex.bind();
    if(GL.isPowerOfTwo(tex.width) && GL.isPowerOfTwo(tex.height)){
        gl.generateMipmap(tex.texture_type);
        tex.has_mipmaps = true;
        tex.minFilter = gl.LINEAR_MIPMAP_LINEAR;
        tex.wrapS = gl.REPEAT;
        tex.wrapT = gl.REPEAT;
    } else {
        tex.minFilter = gl.NEAREST;
        tex.wrapS = gl.CLAMP_TO_EDGE;
        tex.wrapT = gl.CLAMP_TO_EDGE;
    }
    gl.texParameteri(tex.texture_type, gl.TEXTURE_WRAP_S, tex.wrapS );
    gl.texParameteri(tex.texture_type, gl.TEXTURE_WRAP_T, tex.wrapT );
    gl.texParameteri(tex.texture_type, gl.TEXTURE_MIN_FILTER, tex.minFilter );
    gl.bindTexture(tex.texture_type, null); //disable
}


LiteGraph.registerNodeType("texture/"+LGraphTexture.title, LGraphTexture );
window.LGraphTexture = LGraphTexture;



