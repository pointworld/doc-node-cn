/**
 * Created by point on 11/09/2017.
 * node 中文文档
 */

'use strict'

/* 任务：
 * 1. LESS 编译 压缩 合并
 * 2. JS 合并 压缩混淆
 * 3. HTML 压缩
 * 4. img 复制
 */

const gulp = require('gulp')
const less = require('gulp-less')
const cssnano = require('gulp-cssnano')
const concat = require('gulp-concat')
const uglify = require('gulp-uglify')
const htmlmin = require('gulp-htmlmin')
const browserSync = require('browser-sync')

const md_to_html = require('./md_to_html.js')

md_to_html()

// 1. LESS 编译 压缩 // 合并没有必要，一般预处理 CSS 都可以导包
gulp.task('css', () => {
    gulp
        .src(['src/css/*.less', '!src/css/_*.less']) // 获取待处理文件
        .pipe(less()) // LESS 编译
        .pipe(cssnano()) // CSS 压缩
        .pipe(gulp.dest('dist/css')) // 输出到目标文件
        .pipe(browserSync.reload({stream: true})) // 刷新浏览器
})

// 2. JS 合并 压缩混淆
gulp.task('js', () => {
    gulp
        .src('src/js/*.js')
        .pipe(concat('all.js')) // JS 合并
        // .pipe(uglify()) // 压缩混淆
        .pipe(gulp.dest('dist/js'))
        .pipe(browserSync.reload({stream: true}))
})

// 3. 图片复制
gulp.task('img', () => {
    gulp
        .src('src/imgs/*.*')
        .pipe(gulp.dest('dist/imgs'))
        .pipe(browserSync.reload({stream: true}))
})

// 4. HTML 压缩
gulp.task('html', () => {
    gulp
        .src('src/html/*.html')
        .pipe(htmlmin({ // HTML 压缩
            collapseWhitespace: true, // 移出空格
            removeComments: true, // 移出注释
            removeAttributeQuotes: true, // 移出属性的引号
            collapseBooleanAttributes: true,
            removeEmptyAttributes: true, // 移出空属性
            removeScriptTypeAttributes: true, // 移出脚本类型属性
            removeStyleLinkTypeAttributes: true, // 移出样式类型属性
        }))
        .pipe(gulp.dest('dist'))
        .pipe(browserSync.reload({stream: true}))
})

// 5. 执行上述4个任务，并启动一个静态服务器
gulp.task('serve', ['css', 'js', 'img', 'html'], () => {
    browserSync({
        notify: false, // 浏览器刷新时不通知
        port: 2017,
        server: {
            baseDir: ['dist'] // 默认启动目录
        },
        index: 'index.html', // 默认文档：若浏览器访问一个目录的话，默认返回的文件
    })

    // 监视文件变化，如果有文件发生变化，则执行相应任务
    gulp.watch('src/css/*.less', ['css'])
    gulp.watch('src/js/*.js', ['js'])
    gulp.watch('src/imgs/*.*', ['img'])
    gulp.watch('src/html/*.html', ['html'])
    gulp.watch('src/md/*.md', {interval: 100}, md_to_html)
})




