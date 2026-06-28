import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import session from 'express-session';
import MySQLStoreFactory from 'express-mysql-session';
import createError from 'http-errors';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import routes from './routes/index.js';
import pool from './config/database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// Garante UTF-8 nas páginas renderizadas
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  next();
});

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '..', 'public')));

let sessionStore;
if (process.env.NODE_ENV !== 'test') {
  const MySQLStore = MySQLStoreFactory(session);
  sessionStore = new MySQLStore({ createDatabaseTable: true, expiration: 86400000 }, pool);
}

app.use(session({
  secret: process.env.SESSION_SECRET || 'podwave-dev-secret',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 86400000 }
}));

app.use((req, res, next) => {
  res.locals.usuario = req.session.usuario || null;
  next();
});

app.use(routes);

// 404 → error handler
app.use((req, res, next) => {
  next(createError(404));
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

export default app;
