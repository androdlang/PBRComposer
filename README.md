# PBRComposer
## Overview
In short, PBR Composer helps you design and visualize a PBR Material in an efficient way. Parameterizing takes place by dragging and connecting specific nodes from a palette (typically textures, colors and uv-coordinates) to the output node, which represents the PBR Material. A preview panel lets you see all changes in realtime and the corresponding js-sourcecode will be updated as well. The resulting graph  can be downloaded in JSON format for later use. Images can be inserted via preview fileselect dialog and/or Drag&Drop, in latter case the images will be transformed to embedded data-urls so the javascript functions can be reused without dependencies. Different meshes and environment-maps are available to see the material under different geometry and reflective light conditions.
## Motivation
Due to the complexity of the PBR material (soo many combinations with soo much amazing effects) there is a need of having realtime feedback reflecting the changing parameters. Other than some editor already out using a bunch of parameters in confusing properties panels, nodes lets you to concentrate only on the parameters you need giving a nice overview in form of a graph. Nodes can also be shared and avoids therfore redundancy in the sourcecode. The goal is/was to make the user interface as efficient as possible. The idea for realizing the PBR Composer was inspired from **Shader Editor** (http://victhorlopez.github.io/editor/).
## Technical details
PBR Composer is a web application based on **dat.gui** (https://code.google.com/p/dat-gui/), **w2ui**(http://w2ui.com/web/), **litegraph.js** (https://github.com/jagenjo/litegraph.js), **Litegl.js** (https://github.com/jagenjo/litegl.js), **Font-awesome** (http://fortawesome.github.io/Font-Awesome/) and of course on **BABYLON.js** (https://www.babylonjs.com/). 
## Installation
All dependencies and the PBRComposer itself is bundled inbetween the src directory. For installation the only task to do is to copy the content of the source directory of your web space. Point the browser to this place and you are ready to go.
## Configuration
There are a few configuration files the user can customize for his needs:
* **src/assets/textures/texture/list.txt:** a list of image-names (without path, seperated by newlines) being in this directory. This image-entries will be handled as file-urls rather than data-urls and thus they have a much better performance. They are also very quick available by double-clicking on a TextureSample-node. On the other hand, deleting and changing images in this directory will cause inconsistencies after loading graphs from previous states, so be careful when you do that.
* **src/assets/textures/cubemap/list.txt:** a list of *.hdr cubemap-names (without path, seperated by newlines) being in this directory. This cubemap entries will be used when cycling the environment on the User Interface. Again as with the images, be careful not changing entries here, because graph-files can reference cubemap-files.
* **src/graphs/list.txt:** a list of *.json graph-names(without path, seperated by newlines) for quick access from the Toolbar Button of the User Interface. Note that graphs also can be dropped on the Graph Panel. One entry must be in this list permanently: "emty_graph.json" which is used for resetting the graph. Normally this graph only contains one node (the Output node), but you can use any graph file you want, just rename this file.
## Dokumentaion
See [User Interface](doc/README.md)
## Demo
[Alpha version](http://johann.langhofer.net/PBRComposer)
