const express = require('express');
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

require('./socket')(server);

const sessionMiddleware = expressSession({
  secret: process.env.SECRET_SESSION_KEY,
  resave: true,
  saveUninitialized: true
});

app.use(express.json());
app.use(cookieParser());
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

require('./config/passport')(passport);

const router = require('./routes');

app.use(router);

app.use(errorHandler);

const PORT = process.env.PORT || 80;

server.listen(PORT);