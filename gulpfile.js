const {src, dest, watch, parallel, series} = require('gulp');

const scss = require('gulp-sass')(require('sass'));
const concat = require('gulp-concat');
const uglify = require('gulp-uglify-es').default;
const browserSync = require('browser-sync').create();
const autoprefixer = require('gulp-autoprefixer').default;
const clean = require('gulp-clean');
const webp = require('gulp-webp').default;
const imagemin = require('gulp-imagemin');
const newer = require('gulp-newer');

function convertWebp() {
    return src('app/images/src/**/*.{png,jpg,jpeg}', { encoding: false })
        .pipe(newer({ dest: 'app/images/dist', ext: '.webp' }))
        .pipe(webp())
        .pipe(dest('app/images/dist'));
}

function optimizeImages() {
    return src('app/images/src/**/*.{png,jpg,jpeg,svg}', { encoding: false })
        .pipe(newer('app/images/dist'))
        .pipe(imagemin())
        .pipe(dest('app/images/dist'));
}

const images = series(convertWebp, optimizeImages);



function scripts() {
    return src([
        'app/js/main.js'
    ])
    .pipe(concat('main.min.js'))
    .pipe(uglify())
    .pipe(dest('app/js'))
    .pipe(browserSync.stream())
}

function styles() {
    return src('app/scss/style.scss')
    .pipe(autoprefixer({ overrideBrowserlist: ['last 10 version']}))
    .pipe(concat('style.min.css'))
    .pipe(scss({ style: 'compressed' }))
    .pipe(dest('app/css'))
    .pipe(browserSync.stream())
}

function watching() {
    browserSync.init({
        server: {
            baseDir: "app/"
        }
    });
    watch(['app/scss/style.scss'], styles)
    watch(['app/images/src'], images)
    watch(['app/js/main.js'], scripts)
    watch(['app/*.html']).on('change', browserSync.reload);
}


function cleanDist() {
    return src('dist', { allowEmpty: true })
        .pipe(clean());
}

function building() {
  return src([
    'app/css/style.min.css',
    'app/images/dist/**/*', 
    'app/js/main.min.js',
    'app/**/*.html'
  ], { base: 'app', encoding: false })
  .pipe(dest('dist'));
}

exports.styles = styles;
exports.images = images;
exports.scripts = scripts;
exports.watching = watching;

exports.build = series(cleanDist, images, building);
exports.default = parallel(styles, scripts, watching);