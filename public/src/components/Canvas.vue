<template>
    <div class="wrap">
        <div class="menu">
            <div class="tools">
                <select v-model="tool">
                    <option value="pencil" v-if="canChange">Карандаш</option>
                    <option value="pan">Панорамирование</option>
                </select>
            </div>
        </div>
        <p>{{ (canChange && layers && layers.length) ? 'Вы можете изменять холст' : 'Вы не можете изменять холст' }}</p>

        <div class="layers">
            <p v-if="!layers || !layers.length">У вас нет ни одного слоя</p>
            <div class="wrap">
                <select v-model="currentLayer">
                    <option v-for="(layer, i) of layers" :key="layer._id" :value="layer._id">{{ currentLayer === layer._id ? `*${i}*` : i }}</option>
                </select>
            </div>
            <button @click="onClickAddLayer">Добавить слой</button>
        </div>
        <div class="canvas">
            <canvas width="500" height="500"></canvas>
        </div>
    </div>
</template>

<script>
export default {
    data: () => ({
        canvasId: false,
        canvas: false,
        context: false,
        canvasW: 0,
        canvasH: 0,
        lastX: 0,
        lastY: 0,
        x: 0,
        y: 0,

        isMouseDown: false,
        tool: 'pencil',
        
        currentLayer: false,
        layers: {},
        shapes: [],
        newShape: [],

        canChange: undefined
    }),
    computed: {
        receivedShapes() {
            return this.shapes.filter(({layer}) => layer == this.currentLayer);
        },
        currentLayerAll() {
            return this.layers.find(({_id}) => _id == this.currentLayer);
        }
    },
    watch: {
        currentLayer: function(n, o) {
            if (o === false) {
                this.setActionWithCanvas();
            }
            this.x = 0;
            this.y = 0;
            this.getShapes();
        }
    },
    methods: {
        subscribeListeners() {
            this.sockets.subscribe("canvas-added-shape", this.onAddedShape);
            this.sockets.subscribe("canvas-added-layer", this.onAddedLayer);
            this.sockets.subscribe("canvas-got-shapes", this.onGotShapes);
            this.sockets.subscribe("canvas-info", this.onInfo);
        },
        unsubscribeListeners() {
            this.sockets.unsubscribe("canvas-added-shape");
            this.sockets.unsubscribe("canvas-added-layer");
            this.sockets.unsubscribe("canvas-got-shapes");
            this.sockets.unsubscribe("canvas-info");
        },
        onAddedShape(shape) {
            this.shapes.push(this.shapeMapFromServer(shape));
            this.rerenderShapes();
        },
        onAddedLayer(layer) {
            this.layers = [...this.layers, {...layer, gotShapes: false}];
        },
        onGotShapes(data) {
            this.layers = this.layers.map((layer) => layer._id == data.layerId ? {...layer, gotShapes: true} : layer);
            this.shapes = [...this.shapes, ...data.shapes.map(this.shapeMapFromServer)];
            this.rerenderShapes();
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

        setActionWithCanvas() {
            this.canvas.addEventListener('mousedown', this.onMouseDown);
            this.canvas.addEventListener('mousemove', this.onMouseMove);
            this.canvas.addEventListener('mouseup', this.onMouseUp);
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
                this.rerenderShapes();
            }
        },

        shapeMapFromServer(shape) {
            return this.shapesMapDecode(shape);
        },
        shapesMapDecode(shape) {
            return {...shape, points: shape.points.map(this.decodeСoord)};
        },
        clearCanvas() {
            this.context.clearRect(0, 0, this.canvasW, this.canvasH);
        },
        renderShapes() {
            for (const shape of this.receivedShapes) {
                switch (shape.type) {
                    case 'pencil': 
                        this.renderPencilShape(shape);
                        break;
                }
            }
        },
        rerenderShapes() {
            this.clearCanvas();
            this.renderShapes();
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
            }
        },
        onMouseMove(e) {
            if (this.isMouseDown) {
                this.newShape.push([this.serverX(e.offsetX), this.serverY(e.offsetY)]);
                switch (this.tool) {
                    case 'pencil': 
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
                        this.rerenderShapes();
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
                    break;
                case 'pan':
                    break;
            }

            this.newShape = [];
            this.rerenderShapes();
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
        emitCreateShape(shape) {
            this.$socket.emit("canvas-add-shape", {shape, canvasId: this.canvasId, layerId: this.currentLayer});
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
canvas {
  border: 1px solid black;
  width: 500px;
  height: 500px;
}
</style>