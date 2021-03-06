require('dotenv').config()

var gulp = require('gulp');
var gulpif = require('gulp-if');
var browserSync = require('browser-sync').create();
var sass = require('gulp-sass');
var minifyCss = require("gulp-clean-css");
var sourcemaps = require("gulp-sourcemaps");
var sassGlob = require("gulp-sass-glob")
var autoprefixer = require('gulp-autoprefixer');
var minimist = require('minimist');

var knownOptions = {
  string: 'env',
  default: { env: 'dev'}
};

var config = {
    env:  minimist(process.argv.slice(2), knownOptions).env,
    sassPath: './scss',
    npmPackageDir: './node_modules' ,
    site_url: process.env.SITE_URL,
    proxy_port: 3030,
    localhost_key: process.env.LOCALHOST_KEY,
    localhost_cert: process.env.LOCALHOST_CERT
};


// Compile sass into CSS & auto-inject into browsers
gulp.task('sass', function() {
    return gulp.src(config.sassPath + '/style.scss')
        .pipe(sassGlob())
        .pipe(gulpif(config.env === 'dev', sourcemaps.init()))
        .pipe(autoprefixer())
        .pipe(sass({
          outputStyle: 'compressed',
          includePaths: [
            './scss',
            config.npmPackageDir + '/css-reset-and-normalize/scss',
            config.npmPackageDir + '/bootstrap/scss',
            config.npmPackageDir + '/@fortawesome/fontawesome-free/scss',
            config.npmPackageDir + '/angled-edges'
          ]
        }))
        .on('error', function (err) {
            console.log(err.toString());
            this.emit('end');
        })
        .pipe(minifyCss())
        .pipe(gulpif(config.env === 'dev', sourcemaps.write()))
        .pipe(gulp.dest("css"))
        .pipe(gulpif(config.env === 'dev', browserSync.stream()));
});

// Move the javascript files into our js folder
gulp.task('js', function() {
    return gulp.src([
        'node_modules/bootstrap/dist/js/bootstrap.min.js',
        'node_modules/jquery/dist/jquery.min.js',
        'node_modules/popper.js/dist/umd/popper.min.js',
        'node_modules/slideout/dist/slideout.min.js',
        ])
        .pipe(gulp.dest("js"))
        .pipe(gulpif(config.env === 'dev', browserSync.stream()));
});


// Copy font-awesome from node_modules into /fonts
gulp.task('icons', function() { 
    return gulp.src(config.npmPackageDir + '/@fortawesome/fontawesome-free/webfonts/**.*') 
        .pipe(gulp.dest('./css/fonts/fontawesome')); 
});

// Static Server + watching scss/html files
gulp.task('serve', gulp.series('sass', function() {
    browserSync.init({
        proxy: config.site_url,
        port: config.proxy_port,
        https: {
         key: config.localhost_key,
         cert: config.localhost_cert
        }
    });

    gulp.watch(['node_modules/bootstrap/scss/bootstrap.scss', 'scss/**/*.scss', 'scss/*.scss'], gulp.series('sass'));
    gulp.watch("src/*.html").on('change', browserSync.reload);
}));

gulp.task('default', gulp.series('icons', 'js', 'serve'));

gulp.task('build', gulp.series('icons', 'js', 'sass'));
