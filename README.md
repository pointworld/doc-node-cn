# node 中文文档

- 通过 gulp 实现

## Building automate workflow
1. 创建 NPM 的配置文件：`npm init` 
2. 添加项目依赖：`npm install gulp gulp-less gulp-cssnano gulp-concat gulp-htmlmin gulp-uglify browser-sync marked --save-dev` 
3. 在项目根目录下添加一个 md_to_html.js 文件，用于将 md 文件转换为 html 文件
4. 在项目根目录下添加一个 gulpfile.js 文件，这是 gulp 的主文件，文件名是固定不变的
5. 在 gulpfile.js 中抽象我们需要做的任务：
   1. LESS 编译 压缩 合并
   2. JS 合并 压缩混淆
   3. HTML 压缩
   4. img 复制

> 项目目录如下：
```text
gulp-point/
|
+- src/ <-- 项目源文件
|  |
|  +- css/ <-- 存放 less 和 css 文件
|  |
|  +- js/ <-- 存放 js 文件
|  |
|  +- md/ <-- 存放 md 文件
|  |
|  +- imgs/ <-- 存放图片文件
|
+- dist/ <-- 项目上线文件
|  |
|  +- css/ <-- 存放处理后的 CSS 文件
|  |
|  +- js/ <-- 存放处理后的 JS 文件
|  |
|  +- imgs/ <-- 存放处理后的图片文件
|  |
|  +- xxx.html <-- 由 md 转换后的 html 文件
|
+- gulpfile.js <-- gulp 主文件
|
+- md_to_html.js <-- 用于将 md 文件转换为 html 文件 
|
+- package.json <-- 项目描述文件
|
+- node_modules/ <-- npm 安装的所有依赖包
|
+- README.md
```

## Usage
1. `npm install` 安装项目所需所有依赖
3. `gulp serve` 执行所有任务，监视和同步相应文件变化，启动一个静态服务器