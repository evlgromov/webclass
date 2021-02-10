<template>
    <div class="wrap">
        <!--        <p class="mt-3">{{ (canChange && layers && layers.length) ? $t('canvases.canChange') : $t('canvases.canTChange') }}</p>-->
        <div class="access-msg panel" v-if="!canChange && !layers.length">{{$t('canvases.canTChange')}}</div>
        <div class="nav panel">
            <router-link class="link icon" v-if="$auth.check()" to="/canvases">
                <font-awesome-icon icon="home" />
            </router-link>
            <select class="locale-switcher" v-model="locale">
                <option value="en">En</option>
                <option value="ru">Ru</option>
            </select>
        </div>
        <div class="zoom panel">
            <div
                class="icon"
                @click="onClickScalePlus"
            >
                <font-awesome-icon icon="plus"/>
            </div>
            <div
                class="icon"
                @click="onClickScaleMinus"
            >
                <font-awesome-icon icon="minus" />
            </div>
        </div>
        <div class="layers panel" v-if="layers.length">
            <div class="layers__title">{{$t('canvases.layers')}}</div>
            <select
                class="layers__select"
                v-if="layers.length"
                v-model="currentLayer"
                v-b-tooltip.hover.bottom="$t('canvases.selectLayer')"
            >
                <option v-for="(layer, i) of layers" :key="layer._id" :value="layer._id">{{ currentLayer === layer._id ? `${i}` : i }}</option>
            </select>
            <div class="layers__controls" v-if="canChange">
                <div
                    class="layers__control icon"
                    @click="onClickAddLayer"
                    v-b-tooltip.hover.bottom="$t('canvases.addLayer')"
                >
                    <font-awesome-icon icon="plus-square" />
                </div>
                <div
                    class="layers__control icon"
                    @click="onClickDeleteLayer"
                    v-b-tooltip.hover.bottom="$t('canvases.deleteLayer')"
                >
                    <font-awesome-icon icon="minus-square" />
                </div>
            </div>
        </div>
        <div
            class="toolbar panel"
            v-if="canChange"
            ref="toolbar"
        >
            <div
                class="toolbar__item icon"
                ref="pan"
                v-b-tooltip.hover.right="$t('canvases.pan')"
                @click="setTool('pan')"
            >
                <font-awesome-icon icon="arrows-alt" />
            </div>
            <div
                class="toolbar__item icon"
                ref="pencil"
                v-b-tooltip.hover.right="$t('canvases.pencil')"
                @click="setTool('pencil')"
            >
                <font-awesome-icon icon="pencil-alt" />
            </div>
            <div
                class="toolbar__item icon"
                ref="select"
                v-b-tooltip.hover.right="$t('canvases.select')"
                @click="setTool('select')"
            >
                <font-awesome-icon icon="object-group" />
            </div>
            <div
                class="toolbar__item icon"
                @click="setTool('img')"
                v-b-tooltip.hover.right="$t('canvases.img')"
            >
                <font-awesome-icon icon="image" />
            </div>
            <div
                class="toolbar__item icon"
                @click="setTool('pdf')"
                v-b-tooltip.hover.right="$t('canvases.pdf')"
            >
                <font-awesome-icon icon="file-alt" />
            </div>
            <!--                <div-->
            <!--                    class="toolbar__item"-->
            <!--                    @click="toFullScreen"-->
            <!--                >-->
            <!--                    <font-awesome-icon icon="expand-arrows-alt" />-->
            <!--                </div>-->
            <input
                ref="inputImg"
                accept="image/*"
                style="display:none"
                type="file"
                @change="handleChangeInputImg" />
            <input
                ref="inputPdf"
                accept="application/pdf"
                style="display:none"
                type="file"
                @change="handleChangeInputPdf" />
        </div>
        <canvas
            ref="canvas"
            class="workspace__canvas canvas"
        ></canvas>
    </div>
</template>

<script>
    import * as pdfjsLib from 'pdfjs-dist';
    pdfjsLib.GlobalWorkerOptions.workerSrc = process.env.BACKEND_URL + '/index.worker.js'

    export default {
        name: 'Canvas',
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
            tool: undefined,

            currentLayer: false,
            layers: {},
            shapes: [],
            newShape: [],

            canChange: undefined,

            access: false,
            isFullscreen: false,
            locale: undefined
        }),
        computed: {
            currentShapes() {
                return this.shapes.filter(({layer}) => layer == this.currentLayer);
            },
            shapesToChoose() {
                return this.currentShapes.filter((shape) =>
                    shape.type === 'img' && shape.width && shape.height
                    || shape.type === 'pencil' && shape.width && shape.height
                );
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
                if (o === 'select') {
                    this.isShapeSelected = false
                }
                if (n === 'img') {
                    this.$refs.inputImg.click();
                    this.tool = undefined;
                }
                if (n === 'pdf') {
                    this.$refs.inputPdf.click();
                    this.tool = undefined;
                }
                if (this.$refs[o] !== undefined) this.$refs[o].classList.remove('icon_active')
            },
            locale: function (n, o) {
                localStorage.setItem('locale', n)
                this.locale = n
                this.$i18n.locale = n
            }
        },
        methods: {
            setTool(value) {
                this.tool = value
                if (this.$refs[value] === undefined) return
                this.$refs[value].classList.add('icon_active')
            },
            subscribeListeners() {
                this.sockets.subscribe("canvas-added-shape", this.onAddedShape);
                this.sockets.subscribe("canvas-added-layer", this.onAddedLayer);
                this.sockets.subscribe("canvas-deleted-layer", this.onDeletedLayer);
                this.sockets.subscribe("canvas-added-shapes", this.onAddedShapes);
                this.sockets.subscribe("canvas-added-layers", this.onAddedLayers);
                this.sockets.subscribe("canvas-got-shapes", this.onGotShapes);
                this.sockets.subscribe("canvas-changed-position-shapes", this.onChangedPositionShapes);
                this.sockets.subscribe("canvas-info", this.onInfo);
                this.sockets.subscribe("canvas-reloaded", this.onReloaded);
                window.addEventListener('resize', this.debounce(this.onResizeCanvas, 300));
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
                window.removeEventListener('resize', this.debounce(this.onResizeCanvas, 300));
            },

            async onAddedShape(shape) {
                this.shapes.push(await this.shapeMapFromServer(shape));
                this.shapes = this.shapes.filter(shape => shape._id !== undefined)
                if (shape.layer == this.currentLayer) {
                    this.rerender();
                }
            },
            onAddedLayer(layer) {
                this.layers = [...this.layers, {...layer, gotShapes: false}];
                this.currentLayer = this.layers[this.layers.length - 1]._id
            },
            onDeletedLayer(payload) {
                this.layers = payload.layers
                this.currentLayer = this.layers[this.layers.length - 1]._id
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
                this.shapes = [
                    ...this.shapes.filter(shape => shape.layer !== data.layerId),
                    ...(await this.shapesMapFromServer(data.shapes))
                ];
                this.rerender();
            },
            onChangedPositionShapes(data) {
                this.selectedShapes = []
                this.shapes = this.shapes.map((shape) => {
                    let newData = data.shapes.find(({_id}) => shape._id == _id);
                    if (newData) {
                        let newShape;
                        if (newData.type === 'pencil') {
                            newData.points = newData.points.map(this.decodeСoord)
                            newShape = {...shape, x: newData.x, y: newData.y, points: newData.points};
                        } else {
                            newShape = {...shape, x: newData.x, y: newData.y};
                        }
                        this.selectedShapes.push(newShape);
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
                this.canChange = data.canChange;
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
                    this.$refs.inputImg.value = '';
                    if(!/safari/i.test(navigator.userAgent)){
                        this.$refs.inputImg.type = '';
                        this.$refs.inputImg.type = 'file';
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
                            src: img.src,
                        };
                        shape.img = img;
                        this.emitCreateShape(shape);
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
                    this.$refs.inputPdf.value = '';
                    if(!/safari/i.test(navigator.userAgent)){
                        this.$refs.inputPdf.type = '';
                        this.$refs.inputPdf.type = 'file';
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
                        return await this.shapesMapImg(shape);
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
                    this.context.setLineDash([5, 5]);
                    for (let shape of this.selectedShapes) {
                        this.context.strokeRect(this.clientX(shape.x), this.clientY(shape.y), shape.width, shape.height);
                    }
                    this.context.setLineDash([]);
                }
                if (this.selectedW || this.selectedH) {
                    this.context.strokeStyle = 'green';
                    this.context.setLineDash([5, 5]);
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
                                    if(shape.type === 'pencil') {
                                        shape.points.map(coords => {
                                            coords[0] += e.offsetX - this.lastX;
                                            coords[1] += e.offsetY - this.lastY;
                                        })
                                    }
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
                        // this.newShape - содержит все точки новой линии
                        // Нужно найти в этом массиве min(x), max(x)
                        // Нужно найти в этом массиве min(y), max(y)
                        // width = max(x) - min(x)
                        // height = max(y) - min(y)
                        let minX = this.newShape[0][0]
                        let maxX = this.newShape[0][0]
                        let minY = this.newShape[0][1]
                        let maxY = this.newShape[0][1]
                        this.newShape.forEach(i => {
                            if(i[0] < minX) minX = i[0]
                            if(i[0] > maxX) maxX = i[0]
                            if(i[1] < minY) minY = i[1]
                            if(i[1] > maxY) maxY = i[1]
                        })
                        const lineWidth = maxX - minX
                        const lineHeight = maxY - minY
                        this.emitCreateShape({
                            type: this.tool,
                            points: this.newShape.map(this.encodeCoord),
                            width: lineWidth,
                            height: lineHeight,
                            x: this.serverX(minX),
                            y: this.serverY(minY),
                        });
                        this.shapes.push({layer: this.currentLayer, type: this.tool, points: this.newShape});
                        this.newShape = [];
                        break;
                    case 'pan':
                        break;
                    case 'select':
                        if (this.isShapeSelectedChanged) {
                            const selected = []
                            this.selectedShapes.forEach((shape) => {
                                selected.push({...shape})
                            })
                            selected.map(shape => {
                                if(shape.type === 'pencil') {
                                    shape.points = shape.points.map(this.encodeCoord)
                                }
                            })
                            this.emitChangePositionShapes(selected);
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
            emitDeleteLayer() {
                this.$socket.emit("canvas-delete-layer", {
                    canvasId: this.canvasId,
                    layerId: this.currentLayer
                });
            },

            onClickAddLayer() {
                this.emitAddLayer();
            },
            onClickDeleteLayer() {
                if (this.layers.length === 1) return
                this.emitDeleteLayer();
            },
            onResizeCanvas() {
                this.canvas.width = window.innerWidth
                this.canvas.height = window.innerHeight
                const canvasData = this.canvas.getBoundingClientRect();
                this.canvasW = canvasData.width;
                this.canvasH = canvasData.height;
                this.rerender()
            },
            onClickScalePlus() {

            },
            onClickScaleMinus() {

            },

            debounce(fn, wait) {
                let timeout
                return function(...args) {
                    const later = () => {
                        clearTimeout(timeout)
                        // eslint-disable-next-line
                        fn.apply(this, args)
                    }
                    clearTimeout(timeout)
                    timeout = setTimeout(later, wait)
                }
            }
        },
        beforeMount() {
            this.canvasId = this.$route.params.id;
        },
        mounted() {
            this.$root.$emit('fullscreen', true)
            this.canvas = document.querySelector('canvas');
            this.context = this.canvas.getContext('2d');

            this.canvas.width = window.innerWidth
            this.canvas.height = window.innerHeight

            const canvasData = this.canvas.getBoundingClientRect();
            this.canvasW = canvasData.width;
            this.canvasH = canvasData.height;

            this.locale = localStorage.getItem('locale') || 'ru'
            this.$i18n.locale = this.locale

            this.emitSingIn();
            this.subscribeListeners();
        },
        beforeRouteLeave(to, from, next) {
            this.$socket.emit('сanvas-sing-out');
            this.unsubscribeListeners();
            this.$root.$emit('fullscreen', false)
            next();
        },
    }
</script>

<style lang="scss" scoped>
    .canvas {
        background: url('../assets/img/tochki.png') repeat left top;
        position: absolute;
        top: 0;
        left: 0;
    }
    .layers {
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        padding: 3px;
        &__title {
            margin: 0 5px;
            align-self: center;
        }
        &__select {
            border-radius: 5px;
            margin-right: 3px;
            padding-right: 4px;
        }
        &__controls {
            display: flex;
        }
        &__control {
            & + & {
                margin-left: 3px;
            }
        }
    }
    .toolbar {
        top: 10px;
        left: 10px;
        flex-direction: column;
        padding: 3px;
        align-self: flex-start;
        &__item + &__item {
            margin-top: 3px;
        }
    }
    .access-msg {
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        padding: 3px 12px;
    }
    .icon {
        padding: 4px 9px;
        border: 1px solid #6e6e6e;
        background: #fff;
        border-radius: 5px;
        cursor: pointer;
        &:hover {
            background: #d1d1d1;
        }
        &:active {
            background: #fff;
        }
        &_active {
            background: #d1d1d1;
        }
    }
    .nav {
        top: 10px;
        right: 10px;
        padding: 3px;
        & .icon + .icon {
            margin-left: 3px;
        }
    }
    .link {
        text-decoration: none;
        color: inherit;
    }
    .locale-switcher {
        border-radius: 5px;
        margin-left: 3px;
        -moz-appearance: none;
        -webkit-appearance: none;
        appearance: none;
        padding: 0 8px;
    }
    .panel {
        display: flex;
        position: absolute;
        border: 1px solid #6e6e6e;
        background: #ededed;
        border-radius: 5px;
        z-index: 1;
    }
    .zoom {
        flex-direction: column;
        padding: 3px;
        top: 50%;
        right: 10px;
        transform: translateY(-50%);
        & .icon + .icon {
            margin-top: 3px;
        }
    }
</style>