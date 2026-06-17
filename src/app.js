import path from 'node:path';
import express from 'express';
import session from 'express-session';
import createError from 'http-errors';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import routes from './routes/index.js';

const app = express();

// Garante UTF-8 nas páginas renderizadas
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    next();
});

app.set('views', path.join(import.meta.dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(import.meta.dirname, '..', 'public')));

app.use(session({
    secret: process.env.SESSION_SECRET || 'podwave-dev-secret',
    resave: false,
    saveUninitialized: false
}));

app.use(routes);

// 404 → error handler
app.use((req, res, next) => {
    next(createError(404));
});

app.use((err, req, res, next) => {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.render('error');
});

export default app;
