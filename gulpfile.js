import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';

import { src, dest, watch, series, parallel } from 'gulp';
import nunjucksRender from 'gulp-nunjucks-render';

import * as dartSass from 'sass';
import gulpSass from 'gulp-sass';

import sourcemaps from 'gulp-sourcemaps';
import autoprefixer from 'gulp-autoprefixer';
import cleanCSS from 'gulp-clean-css';
// import plumber from 'gulp-plumber';
import terser from 'gulp-terser';

import { createServer } from 'vite';

const sass = gulpSass(dartSass);

const PATHS = {
	source: 'src',
	output: 'dist',
	htmlEntries: 'src/*.html',
	htmlWatch: 'src/**/*.html',
	styles: ['./src/scss/**/*.scss'],
	stylesWatch: './src/scss/**/*.scss',
	scripts: 'src/js/**/*.js',
	assets: 'src/assets/**/*',
};

const isProduction = () => process.env.NODE_ENV === 'production';

let viteServer;

export async function clean() {
	await rm(PATHS.output, { recursive: true, force: true });
}

export function html() {
  return src(PATHS.htmlEntries)
    .pipe(nunjucksRender({
      path: ['src/templates']
    }))
    .pipe(dest(PATHS.output));
}

export function styles() {
    let stream = src(PATHS.styles, {
        base: 'src/scss',
        allowEmpty: true,
    });

    if (!isProduction()) {
        stream = stream.pipe(sourcemaps.init());
    }

    const sassCompiler = sass();

    // В режиме разработки выводим ошибку, но не останавливаем watcher.
    // В production ошибка компиляции должна прерывать сборку.
    if (!isProduction()) {
        sassCompiler.on('error', sass.logError);
    }

    stream = stream
        .pipe(sassCompiler)
        .pipe(autoprefixer({ cascade: false }));

    if (isProduction()) {
        stream = stream.pipe(cleanCSS());
    } else {
        stream = stream.pipe(sourcemaps.write('.'));
    }

    return stream.pipe(dest(`${PATHS.output}/css`));
}

export function scripts() {
	let stream = src(PATHS.scripts, {
		base: 'src/js',
		allowEmpty: true,
	});

	if (!isProduction()) {
		stream = stream.pipe(sourcemaps.init());
	} else {
		stream = stream.pipe(terser());
	}

	if (!isProduction()) {
		stream = stream.pipe(sourcemaps.write('.'));
	}

	return stream.pipe(dest(`${PATHS.output}/js`));
}

export function assets() {
	return src(PATHS.assets, {
		base: 'src/assets',
		allowEmpty: true,
	}).pipe(dest(`${PATHS.output}/assets`));
}

function reload(done) {
  	viteServer?.ws.send({ type: 'full-reload' });
	done();
}

function setProduction(done) {
	process.env.NODE_ENV = 'production';
	done();
}

const compile = series(clean, parallel(html, styles, scripts, assets));

export const buildDev = compile;
export const build = series(setProduction, compile);

function watchFiles() {
    watch(PATHS.htmlWatch, series(html, reload));
    watch(PATHS.stylesWatch, series(styles, reload));
    watch(PATHS.scripts, series(scripts, reload));
    watch(PATHS.assets, series(assets, reload));
}

export async function serve() {
	viteServer = await createServer({
		configFile: false,
		root: resolve(PATHS.output),
		appType: 'mpa',
		// appType: 'spa',
		server: {
			host: '127.0.0.8',
			port: 8050,
			strictPort: true,
			open: false,
			// watch: null
			// open: '/product.html'
		},
		plugins: [
			{
			name: 'gulp-full-reload',
			// Gulp сам пересобирает файлы; здесь Vite только уведомляет браузер.
			handleHotUpdate() {
				return [];
			}
			}
		]
	});

	await viteServer.listen();
	viteServer.printUrls();
}

export const dev = series(buildDev, parallel(watchFiles, serve));
export default dev;
