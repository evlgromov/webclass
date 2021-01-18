<template>
    <div class="wrap">
        <p>{{ (canChange && layers && layers.length) ? 'Вы можете изменять холст' : 'Вы не можете изменять холст' }}</p>

        <div class="layers">
            <p v-if="!layers || !layers.length">У вас нет ни одного слоя</p>
            <div class="wrap">
                <select v-model="currentLayer">
                    <option v-for="(layer, i) of layers" :key="layer._id" :value="layer._id">{{ currentLayer === layer._id ? `*${i}*` : i }}</option>
                </select>
            </div>
        </div>
        <div class="workspace">
            <div class="workspace__toolbar toolbar">
                <div
                    class="toolbar__item"
                    @click="setTool('pan')"
                >
                    <font-awesome-icon icon="arrows-alt" />
                </div>
                <div
                    class="toolbar__item"
                    @click="setTool('pencil')"
                >
                    <font-awesome-icon icon="pencil-alt" />
                </div>
                <div
                    class="toolbar__item"
                    @click="setTool('select')"
                >
                    <font-awesome-icon icon="object-group" />
                </div>
                <div
                    class="toolbar__item"
                    @click="setTool('img')"
                >
                    <font-awesome-icon icon="image" />
                </div>
                <div
                    class="toolbar__item"
                    @click="setTool('pdf')"
                >
                    <font-awesome-icon icon="file-alt" />
                </div>
                <div
                    class="toolbar__item"
                    @click="onClickAddLayer"
                >
                    <font-awesome-icon icon="layer-group" />
                </div>
                <div
                    class="toolbar__item"
                    @click="toFullScreen"
                >
                    <font-awesome-icon icon="expand-arrows-alt" />
                </div>
<!--                <div-->
<!--                    class="toolbar__item"-->
<!--                    @click="clearCanvas"-->
<!--                >-->
<!--                    <font-awesome-icon icon="trash-alt" />-->
<!--                </div>-->
                <input
                    id="input-img"
                    accept="image/*"
                    style="display:none"
                    type="file"
                    @change="handleChangeInputImg" />
                <input
                    id="input-pdf"
                    accept="application/pdf"
                    style="display:none"
                    type="file"
                    @change="handleChangeInputPdf" />
            </div>
            <canvas class="workspace__canvas canvas" width="800" height="450"></canvas>
        </div>
    </div>
</template>

<script>
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsLib.PDFWorker.getWorkerSrc().replace(':9000', '');

export default {
    data: () => ({
        canvas: false,
        inputImg: false,
        inputPdf: false,

        canvasId: false,
        context: false,
        canvasW: 0,
        canvasH: 0,
        lastX: 0,
        lastY: 0,
        x: 0,
        y: 0,

        isShapeSelected: false,
        isShapeSelectedChanged: false,
        selectedShapes: [],
        selectedX: 0,
        selectedY: 0,
        selectedW: 0,
        selectedH: 0,
        isMouseDown: false,
        tool: 'pan',
        
        currentLayer: false,
        layers: {},
        shapes: [],
        newShape: [],

        canChange: undefined
    }),
    computed: {
        currentShapes() {
            return this.shapes.filter(({layer}) => layer == this.currentLayer);
        },
        shapesToChoose() {
            return this.currentShapes.filter((shape) => 
                shape.type === 'img' && shape.width && shape.height);
        },
        currentLayerAll() {
            return this.layers.find(({_id}) => _id == this.currentLayer);
        },
        isSelectActive() {
            return !!(this.isShapeSelected || this.selectedX || this.selectedY || this.selectedW || this.selectedH);
        }
    },
    watch: {
        currentLayer: function(n, o) {
            if (o === false) {
                this.setActionWithCanvas();
            }
            this.x = 0;
            this.y = 0;
            this.isShapeSelected = false;
            this.isShapeSelectedChanged = false;
            this.selectedShapes = [];
            this.selectedX = 0;
            this.selectedY = 0;
            this.selectedW = 0;
            this.selectedH = 0;
            this.getShapes();
        },
        tool: function(n, o) {
            if (n === 'img') {
                this.inputImg.click();
                this.tool = o;
            }
            if (n === 'pdf') {
                this.inputPdf.click();
                this.tool = o;
            }
        }
    },
    methods: {
        toFullScreen() {
            if (this.canvas.webkitRequestFullScreen) {
                this.canvas.webkitRequestFullScreen()
            } else {
                this.canvas.mozRequestFullScreen()
            }
        },
        setTool(value) {
            this.tool = value
        },
        subscribeListeners() {
            this.sockets.subscribe("canvas-added-shape", this.onAddedShape);
            this.sockets.subscribe("canvas-added-layer", this.onAddedLayer);
            this.sockets.subscribe("canvas-added-shapes", this.onAddedShapes);
            this.sockets.subscribe("canvas-added-layers", this.onAddedLayers);
            this.sockets.subscribe("canvas-got-shapes", this.onGotShapes);
            this.sockets.subscribe("canvas-changed-position-shapes", this.onChangedPositionShapes);
            this.sockets.subscribe("canvas-info", this.onInfo);
            this.sockets.subscribe("canvas-reloaded", this.onReloaded);
        },
        unsubscribeListeners() {
            this.sockets.unsubscribe("canvas-added-shape");
            this.sockets.unsubscribe("canvas-added-layer");
            this.sockets.unsubscribe("canvas-added-shapes");
            this.sockets.unsubscribe("canvas-added-layers");
            this.sockets.unsubscribe("canvas-got-shapes");
            this.sockets.unsubscribe("canvas-changed-position-shapes");
            this.sockets.unsubscribe("canvas-info");
            this.sockets.unsubscribe("canvas-reloaded");
        },
        async onAddedShape(shape) {
            this.shapes.push(await this.shapeMapFromServer(shape));
            if (shape.layer == this.currentLayer) {
                this.rerender();
            }
        },
        onAddedLayer(layer) {
            this.layers = [...this.layers, {...layer, gotShapes: false}];
        },
        async onAddedShapes(shapes) {
            this.shapes = [...this.shapes, ...(await this.shapesMapFromServer(shapes))];
            this.rerender();
        },
        onAddedLayers(layers) {
            this.layers = [...this.layers, ...layers.map((layer) => ({...layer, gotShapes: false}))];
        },
        async onGotShapes(data) {
            this.layers = this.layers.map((layer) => layer._id == data.layerId ? {...layer, gotShapes: true} : layer);
            this.shapes = [...this.shapes, ...(await this.shapesMapFromServer(data.shapes))];
            this.rerender();
        },
        onChangedPositionShapes(data) {
            this.shapes = this.shapes.map((shape) => {
                const newData = data.shapes.find(({_id}) => shape._id == _id);
                if (newData) {
                    const newShape = {...shape, x: newData.x, y: newData.y};
                    const i = this.selectedShapes.findIndex((selectedShape) => shape._id == selectedShape._id);
                    this.selectedShapes[i] = newShape;
                    return newShape;
                }
                return shape;
            })
            if (data.layerId == this.currentLayer) {
                this.rerender();
            }
        },
        onInfo(data) {
            if (!data) {
                this.$router.push({name: 'Home'});
                return;
            }
            this.canChange = data.user.canChange;
            this.layers = data.layers.map((layer) => ({...layer, gotShapes: false}));
            if (this.layers.length) {
                this.currentLayer = data.layers[0]._id;
            }
        },
        onReloaded(data) {
            console.log(data)
        },

        setActionWithCanvas() {
            this.canvas.addEventListener('mousedown', this.onMouseDown);
            this.canvas.addEventListener('mousemove', this.onMouseMove);
            this.canvas.addEventListener('mouseup', this.onMouseUp);
        },

        handleChangeInputImg(e) {
            const file = e.target.files[0];
            // if(file && file.size / (1024 ** 2) < 3) {
            const reader = new FileReader(file);
            reader.onload = (e) => {
                this.inputImg.value = '';
                if(!/safari/i.test(navigator.userAgent)){
                    this.inputImg.type = '';
                    this.inputImg.type = 'file';
                }
                const img = new Image();
                img.onload = () => {
                    const shape = {
                        type: 'img', 
                        layer: this.currentLayer,
                        x: this.serverX(0),
                        y: this.serverY(0),
                        width: img.width,
                        height: img.height,
                        src: e.target.result,
                    };
                    this.emitCreateShape(shape);
                    shape.img = img;
                    this.shapes.push(shape)
                    this.rerender();
                }
                img.src = e.target.result;
            }
            reader.readAsDataURL(file);
            // } else {
            // обработать ошибку
            // }
        },
        handleChangeInputPdf(e) {
            const file = e.target.files[0];
            const fileReader = new FileReader();
            const index = this.layers.findIndex(({_id}) => _id == this.currentLayer);
            const x = this.serverX(0);
            const y = this.serverY(0);
            fileReader.onload = (e) => {
                this.inputPdf.value = '';
                if(!/safari/i.test(navigator.userAgent)){
                    this.inputPdf.type = '';
                    this.inputPdf.type = 'file';
                }
                const typedarray = new Uint8Array(e.target.result);
                pdfjsLib.getDocument(typedarray).promise.then((pdf) => {
                    const pages = [];
                    for(let i = 1; i <= pdf.numPages; i++) {
                        pdf.getPage(i).then((page) => {
                            const canvas = document.createElement('canvas');
                            const context = canvas.getContext('2d');

                            const viewport = page.getViewport({
                                scale: 1
                            });

                            canvas.height = viewport.height;
                            canvas.width = viewport.width;

                            page.render({
                                canvasContext: context,
                                viewport: viewport
                            }).promise.then(() => {
                                const image = canvas.toDataURL();
                                const layer = this.layers[index + i - 1];
                                const lastLayer = this.layers[this.layers.length-1];
                                pages.push({
                                    type: 'img', 
                                    layer: layer ? {_id: layer._id, exists: true} : {_id: lastLayer._id + i - this.layers.length, exists: false},
                                    x, y,
                                    height: viewport.height,
                                    width: viewport.width,
                                    src: image,
                                });
                                if (pages.length === pdf.numPages) {
                                    pages.sort((a, b) => a.layer._id - b.layer._id);
                                    this.emitCreatePdf(pages);
                                }
                            })
                        })
                    }
                });
            }
            fileReader.readAsArrayBuffer(file);
        },
        
        clientX(x) {
            return x - this.x;
        },
        clientY(y) {
            return y + this.y;
        },
        serverX(x) {
            return x + this.x;
        },
        serverY(y) {
            return y - this.y;
        },

        getShapes() {
            if (!this.currentLayerAll.gotShapes) {
                this.emitGetShapes();
            } else {
                this.rerender();
            }
        },

        async shapesMapFromServer(shapes) {
            const res = [];
            for (let shape of shapes) {
                shape = await this.shapeMapFromServer(shape)
                res.push(shape);
            }
            return res
        },
        async shapeMapFromServer(shape) {
            switch (shape.type) {
                case 'pencil':
                    return this.shapesMapDecode(shape);
                case 'img':
                    return await this.shapesMapImg(shape)
            }
        },
        shapesMapDecode(shape) {
            return {...shape, points: shape.points.map(this.decodeСoord)};
        },
        async shapesMapImg(shape) {
            shape = await new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    resolve({...shape, img});
                }
                img.src = shape.src;
            });
            return shape
        },
        rerender() {
            this.clearCanvas();
            this.renderShapes();
            if(this.isSelectActive) {
                this.renderSelect();
            }
        },
        clearCanvas() {
            this.context.clearRect(0, 0, this.canvasW, this.canvasH);
        },
        renderShapes() {
            for (const shape of this.currentShapes) {
                switch (shape.type) {
                    case 'pencil': 
                        this.renderPencilShape(shape);
                        break;
                    case 'img':
                        this.renderImgShape(shape);
                        break;
                }
            }
        },
        renderSelect() {
            if (this.isSelectActive) {
                this.context.strokeStyle = 'red';
                this.context.setLineDash([10, 10]);
                for (let shape of this.selectedShapes) {
                    this.context.strokeRect(this.clientX(shape.x), this.clientY(shape.y), shape.width, shape.height);
                }
                this.context.setLineDash([]);
            }
            if (this.selectedW || this.selectedH) {
                this.context.strokeStyle = 'green';
                this.context.setLineDash([10, 10]);
                this.context.strokeRect(this.clientX(this.selectedX), this.clientY(this.selectedY), this.selectedW, this.selectedH);
                this.context.setLineDash([]);
            }
        },
        renderPencilShape(shape) {
            if(shape.points && shape.points.length) {
                this.context.beginPath();
                this.context.strokeStyle = 'black';
                this.context.lineWidth = 1;
                let coord = shape.points[0];
                this.context.moveTo(this.clientX(coord[0]), this.clientY(coord[1]));
                for (let i = 1; i < shape.points.length; i++) {
                    let coord = shape.points[i];
                    this.context.lineTo(this.clientX(coord[0]), this.clientY(coord[1]));
                }
                this.context.stroke();
                this.context.closePath();
            }
        },
        renderImgShape(shape) {
            this.context.drawImage(shape.img, this.clientX(shape.x), this.clientY(shape.y));
        },
        onMouseDown(e) {
            this.isMouseDown = true;
            this.lastX = e.offsetX;
            this.lastY = e.offsetY;
            switch (this.tool) {
                case 'pencil': 
                    this.newShape = [[this.serverX(e.offsetX), this.serverY(e.offsetY)]];
                    break;
                case 'pan':
                    break;
                case 'select':
                    if (this.isShapeSelected) {
                        if (!this.anyOverlapWithSelectedShapes(this.serverX(e.offsetX), this.serverY(e.offsetY))) {
                            this.selectedShapes = [];
                            this.isShapeSelected = false;
                            this.rerender();
                        }
                    }
                    if (!this.isShapeSelected) {
                        const shape = this.firstOverlapShape(this.serverX(e.offsetX), this.serverY(e.offsetY));
                        if (shape) {
                            this.selectedShapes = [shape];
                            this.isShapeSelected = true;
                            this.rerender();
                        }
                    }
                    this.selectedX = this.serverX(e.offsetX);
                    this.selectedY = this.serverY(e.offsetY);
                    break;
            }
        },
        onMouseMove(e) {
            if (this.isMouseDown) {
                switch (this.tool) {
                    case 'pencil': 
                        this.newShape.push([this.serverX(e.offsetX), this.serverY(e.offsetY)]);
                        this.context.beginPath();
                        this.context.strokeStyle = 'black';
                        this.context.lineWidth = 1;
                        this.context.moveTo(this.lastX, this.lastY);
                        this.context.lineTo(e.offsetX, e.offsetY);
                        this.context.stroke();
                        this.context.closePath();
                        break;
                    case 'pan':
                        this.x += this.lastX - e.offsetX;
                        this.y += e.offsetY - this.lastY;
                        this.rerender();
                        break;
                    case 'select':
                        if (this.isShapeSelected) {
                            for (let shape of this.selectedShapes) {
                                shape.x += e.offsetX - this.lastX;
                                shape.y += e.offsetY - this.lastY;
                            }
                            this.isShapeSelectedChanged = true;
                        } else {
                            this.selectedW += e.offsetX - this.lastX;
                            this.selectedH += e.offsetY - this.lastY;
                        }
                        this.rerender();
                        break;
                }
                this.lastX = e.offsetX;
                this.lastY = e.offsetY;
            }
        },
        onMouseUp(e) {
            this.isMouseDown = false;
            this.lastX = 0;
            this.lastY = 0;

            switch (this.tool) {
                case 'pencil': 
                    this.emitCreateShape({type: this.tool, points: this.newShape.map(this.encodeCoord)});
                    this.shapes.push({layer: this.currentLayer, type: this.tool, points: this.newShape});
                    this.newShape = [];
                    break;
                case 'pan':
                    break;
                 case 'select':
                    if (this.isShapeSelectedChanged) {
                        this.emitChangePositionShapes(this.selectedShapes.map(({_id, x, y}) => ({_id, x, y})));
                        this.isShapeSelectedChanged = false;
                    }
                    if (!this.isShapeSelected && this.selectedW && this.selectedH) {
                        const shapes = this.allOverlapWithShapes();
                        if (shapes.length) {
                            this.selectedShapes = shapes;
                            this.isShapeSelected = true;
                            this.rerender();
                        }
                    }
                    this.selectedX = 0;
                    this.selectedY = 0;
                    this.selectedW = 0;
                    this.selectedH = 0;
                    break;
            }

            this.rerender();
        },
        overlap(x1, y1, w1, h1, x2, y2, w2 = 1, h2 = 1) {
            return !(((x1 + w1) < x2) || ((x2 + w2) < x1) || ((y1 + h1) < y2) || ((y2 + h2) < y1));
        },
        firstOverlapShape(x, y) {
            for (let shape of this.shapesToChoose) {
                if (this.overlap(shape.x, shape.y, shape.width, shape.height, x, y)) {
                    return shape;
                }
            }
            return false;
        },
        anyOverlapWithSelectedShapes(x, y) {
            for (let shape of this.selectedShapes) {
                if (this.overlap(shape.x, shape.y, shape.width, shape.height, x, y)) {
                    return true;
                }
            }
            return false;
        },
        allOverlapWithShapes() {
            const res = [];
            for (let shape of this.shapesToChoose) {
                if (this.selectedW < 0) {
                    this.selectedX += this.selectedW;
                    this.selectedW = -this.selectedW;
                }
                if (this.selectedH < 0) {
                    this.selectedY += this.selectedH;
                    this.selectedH = -this.selectedH;
                }
                if (this.overlap(shape.x, shape.y, shape.width, shape.height, 
                    this.selectedX, this.selectedY, this.selectedW, this.selectedH)) {
                    res.push(shape);
                }
            }
            return res;
        },
        decodeСoord(coord) {
            return coord.split(':').map((a) => parseInt(a));
        },
        encodeCoord(coord) {
            return `${coord[0]}:${coord[1]}`;
        },
        emitGetShapes() {
            this.$socket.emit("canvas-get-shapes", {canvasId: this.canvasId, layerId: this.currentLayer});
        },
        emitChangePositionShapes(shapes) {
            this.$socket.emit("canvas-change-position-shapes", {shapes, canvasId: this.canvasId, layerId: this.currentLayer});
        },
        emitCreateShape(shape) {
            this.$socket.emit("canvas-add-shape", {shape, canvasId: this.canvasId, layerId: this.currentLayer});
        },
        emitCreatePdf(shapes) {
            this.$socket.emit("canvas-add-pdf", {shapes, canvasId: this.canvasId});
        },
        emitSingIn() {
            this.$socket.emit("canvas-sing-in", this.canvasId);
        },
        emitAddLayer() {
            this.$socket.emit("canvas-add-layer", this.canvasId);
        },
        onClickAddLayer() {
            this.emitAddLayer();
        },
    },
    beforeRouteLeave(to, from, next) {
        this.$socket.emit('сanvas-sing-out');
        this.unsubscribeListeners();
        next();
    },
    beforeMount() {
        this.canvasId = this.$route.params.id;
    },
    mounted() {
        this.canvas = document.querySelector('canvas');
        this.inputImg = document.querySelector('#input-img');
        this.inputPdf = document.querySelector('#input-pdf');

        this.context = this.canvas.getContext('2d');

        const canvasData = this.canvas.getBoundingClientRect();
        this.canvasW = canvasData.width;
        this.canvasH = canvasData.height;

        this.emitSingIn();
        this.subscribeListeners();
    }
}
</script>

<style lang="scss" scoped>
    .canvas {
        border: 1px solid #6e6e6e;
        border-radius: 5px;
        background: #fff;
        /*width: 800px;*/
        /*height: 700px;*/
    }
    .workspace {
        display: flex;
        justify-content: center;
        &__toolbar {
            margin-right: 3px;
        }
    }
    .toolbar {
        padding: 3px;
        display: flex;
        flex-direction: column;
        border: 1px solid #6e6e6e;
        border-radius: 5px;
        align-self: flex-start;
        background: #ededed;
        &__item {
            padding: 5px 9px;
            border: 1px solid #6e6e6e;
            border-radius: 5px;
            cursor: pointer;
            background: #fff;
        }
        &__item + &__item {
            margin-top: 3px;
        }
    }
</style>