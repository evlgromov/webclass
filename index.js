const express = require('express');
const socket = require('socket.io');
const http = require('http');
const passport = require('passport');

const cookieParser = require('cookie-parser');
const expressSession = require('express-session');

const dotenv = require('dotenv');
dotenv.config({ path: './config/config.env' });

const db = require('./config/db');
db();

const errorHandler = require('./middleware/error-handler.js')

const app = express();

const server = http.createServer(app);

const io = socket(server);
require('./socket')(io);

const sessionMiddleware = expressSession({
  secret: process.env.SECRET_SESSION_KEY,
  resave: true,
  saveUninitialized: true
});

io.use((socket, next) => {
  sessionMiddleware(socket.request, socket.request.res, next);
})

app.use(express.json());
app.use(cookieParser());
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

const initPassport = require('./passport');

const router = require('./routes');

app.use(router);

app.use(errorHandler);

const PORT = process.env.PORT || 80;

server.listen(PORT);