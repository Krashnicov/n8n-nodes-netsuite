import gulp from 'gulp';

function copyIcons() {
	gulp.src('nodes/**/*.{png,svg}')
		.pipe(gulp.dest('dist/nodes'))

	return gulp.src('credentials/**/*.{png,svg}')
		.pipe(gulp.dest('dist/credentials'));
}

export default copyIcons;
