const {src, dest, watch, parallel, series} = require('gulp');

const fs = require('fs');

const scss = require('gulp-sass')(require('sass'));
const concat = require('gulp-concat');
const uglify = require('gulp-uglify-es').default;
const browserSync = require('browser-sync').create();
const autoprefixer = require('gulp-autoprefixer').default;
const clean = require('gulp-clean');
const webp = require('gulp-webp').default;
const imagemin = require('gulp-imagemin');
const newer = require('gulp-newer');
const svgSprite = require('gulp-svg-sprite');
const fonter = require('gulp-fonter');
const ttf2woff2 = require('gulp-ttf2woff2');
const ttf2woff = require('gulp-ttf2woff').default;
const include = require('gulp-include');

function pages() {
    return src('app/pages/*.html')
    .pipe(include({
        includePaths: 'app/components'
    }))
    .pipe(dest('app'))
    .pipe(browserSync.stream())
}

function makeTtf() {
    return src('app/fonts/src/**/*.{ttf,otf}', { encoding: false })
        .pipe(fonter({
            formats: ['ttf']
        }))
        .pipe(dest('app/fonts'));
}

function convertWebFonts() {
    return src('app/fonts/*.ttf', { encoding: false })
        .pipe(ttf2woff())
        .pipe(dest('app/fonts'))
        .pipe(src('app/fonts/*.ttf', { encoding: false }))
        .pipe(ttf2woff2())
        .pipe(dest('app/fonts'));
}

function cleanTtf(done) {
    const files = fs.readdirSync('app/fonts');
    files.forEach(file => {
        if (file.endsWith('.ttf')) {
            fs.unlinkSync(`app/fonts/${file}`);
        }
    });
    done();
}

exports.fonts = series(makeTtf, convertWebFonts, cleanTtf);


function sprite() {
    return src([
        'app/images/dist/*.svg',      
        '!app/images/dist/sprite.svg' 
    ], { encoding: false })
    .pipe(svgSprite({
        mode: {
            stack: {
                sprite: '../sprite.svg',
                example: true
            }
        }
    }))
    .pipe(dest('app/images/dist'));
}

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
    watch(['app/components/*', 'app/pages/*'], pages)
    watch(['app/*.html']).on('change', browserSync.reload);
}


function cleanDist() {
    return src('dist', { allowEmpty: true })
        .pipe(clean());
}

function building() {
  return src([
    'app/css/style.min.css',
    'app/images/dist/*.{png,jpg,jpeg,webp,gif,avif}',
    'app/images/dist/sprite.svg',
    'app/js/main.min.js',
    'app/fonts/*.{woff,woff2}',
    'app/**/*.html'
  ], { base: 'app', encoding: false, allowEmpty: true })
  .pipe(dest('dist'));
}

function cleanBuildStack(done) {
    if (fs.existsSync('dist/images/dist/stack')) {
        fs.rmSync('dist/images/dist/stack', { recursive: true, force: true });
    }
    done();
}

exports.styles = styles;
exports.images = images;
exports.pages = pages;
exports.sprite = sprite;
exports.scripts = scripts;
exports.watching = watching;

exports.build = series(cleanDist, images, building, cleanBuildStack);
exports.default = parallel(styles, images, scripts, pages, watching);