const express = require('express');
const passport = require('passport');

const auth = require('../middleware/auth');
const owner = require('../middleware/owner');

const controller = require('../controllers/canvases');

const router = express.Router();


router.use(passport.authenticate('jwt', { session: false }));

router.get('/:id/shapes', controller.getShapes);

router.use(auth('teacher'));

router.get('/', controller.getCanvases);
router.post('/', controller.createCanvas);
router.put('/:id', controller.updateCanvas);
router.delete('/:id', controller.deleteCanvas);

module.exports = router;