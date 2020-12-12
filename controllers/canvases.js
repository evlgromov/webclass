const Canvas = require('../models/Canvas');
const Shape = require('../models/Shape');
const { ErrorResponse } = require('../utils/ErrorResponse');

exports.getCanvases = async (req, res, next) => {
    const canvases = await Canvas.find({owner: req.user._id});

    return res.status(200).json({ success: true, data: canvases });
}

exports.createCanvas = async (req, res, next) => {
    await Canvas.create({
        owner: req.user._id,
        title: req.body.title,
        access: req.body.access
    });

    return res.status(200).json({ success: true, data: {} });
}

exports.updateCanvas = async (req, res, next) => {
    const canvas = await Canvas.findById(req.params.id);

    canvas.title = req.body.title;
    canvas.access = req.body.access;
    canvas.accessUsers = req.body.accessUsers;

    await canvas.save();

    return res.status(200).json({ success: true, data: canvas });
}

exports.deleteCanvas = async (req, res, next) => {
    await Canvas.remove({_id: req.params.id, owner: req.user._id});

    return res.status(200).json({ success: true, data: {} });
}

exports.getShapes = async (req, res, next) => {
    console.log(req.user)
    const canvas = await Canvas.findOne({
        _id: req.params.id,
        $or: [{
            access: 3
        }, {
            access: 1,
            owner: req.user._id
        }, {
            access: 2,
            $or: [{owner: req.user._id}, {"accessUsers._id": req.user._id}]
        }]
    });
    console.log(canvas)

    if(!canvas) {
        return next(new ErrorResponse('У вас нет прав', 401));
    }

    const shapes = await Shape.find({ canvas: req.params.id });

    return res.status(200).json({ success: true, data: shapes });
}