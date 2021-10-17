const {src, dest, watch, series } = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const postcss = require('gulp-postcss');
const cssnano = require('cssnano');

const sassTask = () => {
  // return src('node_modules/bootstrap/scss/**/*.scss', {sourcemaps: true })
  return src('sass/custom.scss', {sourcemaps: true })
    .pipe(sass())
    .pipe(postcss([cssnano()]))
    .pipe(dest('hosted', {sourcemaps: '.' }));
};

const watchTask = () => {
  // watch('node_modules/bootstrap/scss/**/*.scss', sassTask);
  watch('sass/custom.scss', sassTask);
}

// default task (runs when running 'gulp' in command line)
exports.default = series (
  sassTask,
  watchTask
);

