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
        <p>{{ canChange ? 'Вы можете изменять холст' : 'Вы не можете изменять холст' }}</p>
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
        
        shapes: [],
        newShape: [],

        canChange: undefined
    }),
    methods: {
        subscribeListeners() {
            this.sockets.subscribe("canvas-added-shape", this.onAddedShape);
            this.sockets.subscribe("canvas-user-info", this.onUserInfo);
        },
        unsubscribeListeners() {
            this.sockets.unsubscribe("canvas-added-shape");
            this.sockets.unsubscribe("canvas-user-info");
        },
        onAddedShape(shape) {
            this.shapes.push(this.shapeMapFromServer(shape));
            this.rerenderShapes();
        },
        onUserInfo(user) {
            console.log(user.canChange)
            if (user) {
                this.canChange = user.canChange;
            } else {
                this.$router.push({name: 'Home'});
            }
            this.setActionWithCanvas();
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

        shapeMapFromServer(shape) {
            return this.shapesMapDecode(this.shapesMapUnrendered(shape));
        },
        shapesMapUnrendered(shape) {
            return {...shape, rendered: false};
        },
        shapesMapRendered(shape) {
            return {...shape, rendered: true};
        },
        shapesMapDecode(shape) {
            return {...shape, points: shape.points.map(this.decodeСoord)};
        },
        clearCanvas() {
            this.context.clearRect(0, 0, this.canvasW, this.canvasH);
            this.shapes = this.shapes.map(this.shapesMapUnrendered);
        },
        renderShapes() {
            const shapes = this.shapes.filter((shape) => shape.rendered);
            for (const shape of this.shapes) {
                switch (shape.type) {
                    case 'pencil': 
                        this.renderPencilShape(shape);
                        break;
                }
            }
            this.shapes = this.shapes.map(this.shapesMapRendered)
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
                    this.shapes.push({type: this.tool, points: this.newShape});
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
        emitCreateShape(shape) {
            this.$socket.emit("canvas-add-shape", {shape, canvasId: this.canvasId});
        },
        emitSingIn() {
            this.$socket.emit("canvas-sing-in", this.canvasId);
        },
        fetchGetShapes(cb) {
            this.axios.get(`/api/v1/canvases/${this.canvasId}/shapes`)
                .then((res) => {
                    const data = res.data;
                    if (data.success) {
                        if(data.data.length) {
                            this.shapes = data.data.map(this.shapeMapFromServer);
                        }
                    }
                    cb(!data.success);
                });
        }
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
        this.fetchGetShapes((err) => {
            if(err) this.$route.push('Home');
            this.renderShapes();
        });
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