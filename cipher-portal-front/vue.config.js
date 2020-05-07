// vue.config.js 配置说明
// 官方vue.config.js 参考文档 https://cli.vuejs.org/zh/config/#css-loaderoptions
// 这里只列一部分，具体配置参考文档
const CompressionPlugin = require("compression-webpack-plugin");

module.exports = {
  // 部署生产环境和开发环境下的URL。
  // 默认情况下，Vue CLI 会假设你的应用是被部署在一个域名的根路径上，例如 https://www.my-app.com/。如果应用被部署在一个子路径上，你就需要用这个选项指定这个子路径。例如，如果你的应用被部署在 https://www.my-app.com/my-app/，则设置 baseUrl 为 /my-app/。
  baseUrl: process.env.NODE_ENV === "production" ? "/" : "/",
  // baseUrl: process.env.NODE_ENV === 'production'
  // ? '/platform-front/'
  // : '/',

  // outputDir: 在npm run build 或 yarn build 时 ，生成文件的目录名称（要和baseUrl的生产环境路径一致）
  outputDir: "dist",
  // 用于放置生成的静态资源 (js、css、img、fonts) 的；（项目打包之后，静态资源会放在这个文件夹下）
  assetsDir: "assets",
  // 指定生成的 index.html 的输出路径  (打包之后，改变系统默认的index.html的文件名)
  // indexPath: "",
  // 默认情况下，生成的静态资源在它们的文件名中包含了 hash 以便更好的控制缓存。你可以通过将这个选项设为 false 来关闭文件名哈希。(false的时候就是让原来的文件名不改变)
  filenameHashing: true,

  // pages: {
  //   index: {
  //     // page 的入口
  //     entry: 'src/main.js',
  //     // 模板来源
  //     template: 'public/index.html',
  //     // 在 dist/index.html 的输出
  //     filename: 'index.html',
  //     // 当使用 title 选项时，
  //     // template 中的 title 标签需要是 <title><%= htmlWebpackPlugin.options.title %></title>
  //     title: 'Index Page'
  //     // 在这个页面中包含的块，默认情况下会包含
  //     // 提取出来的通用 chunk 和 vendor chunk。
  //     // chunks: ['chunk-vendors', 'chunk-common', 'index']
  //   }
  //   // 当使用只有入口的字符串格式时，
  //   // 模板会被推导为 `public/subpage.html`
  //   // 并且如果找不到的话，就回退到 `public/index.html`。
  //   // 输出文件名会被推导为 `subpage.html`。
  //   // subpage: 'src/multi-page/sub/main.js'
  // },
  //   lintOnSave：{ type:Boolean default:true } 问你是否使用eslint
  lintOnSave: true,
  // 如果你想要在生产构建时禁用 eslint-loader，你可以用如下配置
  // lintOnSave: process.env.NODE_ENV !== 'production',

  // 是否使用包含运行时编译器的 Vue 构建版本。设置为 true 后你就可以在 Vue 组件中使用 template 选项了，但是这会让你的应用额外增加 10kb 左右。(默认false)
  // runtimeCompiler: false,

  /**
   * 如果你不需要生产环境的 source map，可以将其设置为 false 以加速生产环境构建。
   *  打包之后发现map文件过大，项目文件体积很大，设置为false就可以不输出map文件
   *  map文件的作用在于：项目打包后，代码都是经过压缩加密的，如果运行时报错，输出的错误信息无法准确得知是哪里的代码报错。
   *  有了map就可以像未加密的代码一样，准确的输出是哪一行哪一列有错。
   * */
  productionSourceMap: false,
  configureWebpack: config => {
    if (process.env.NODE_ENV === "production") {
      // 为生产环境修改配置...
      return {
        plugins: [
          new CompressionPlugin({
            test: /\.js$|\.html$|.css/,
            threshold: 10240,
            deleteOriginalAssets: false
          })
        ]
      };
    }
  },

  // 它支持webPack-dev-server的所有选项
  devServer: {
    host: "",
    port: 1111, // 端口号
    https: false, // https:{type:Boolean}
    open: true, // 配置自动启动浏览器
    // proxy: 'http://192.168.1.178:7095' // 配置跨域处理,只有一个代理

    // 配置多个代理
    proxy: {
      "/cipher": {
        // target: 'http://192.168.1.89:8630',
        // target: 'http://192.168.1.21:8630',
        // target: 'http://192.168.1.204:8630',
        // target: "http://192.168.1.171:8443",
        // target: "http://192.168.1.90:8443",
        target: "http://101.132.145.69:8443",
        // target: "http://101.132.145.69:8443", // 线上平台web产品测试环境
        // target: "http://139.196.143.107:7777", // 控制台产品销售环境
        // target: "http://192.168.1.171:7777", // 控制台产品测试环境
        // target: "http://192.168.1.38:7777", // 控制台产品测试环境
        // target: "http://127.0.0.1:3000/mock/21",
        ws: false,
        changeOrigin: true
      }
    }
  },
  // chainWebpack: config => {
  //   config.output.filename("[name].[hash].js").end();
  // },
  css: {
    loaderOptions: {
      // 给 less-loader 传递选项
      less: {
        // @/ 是 src/ 的别名
        // 所以这里假设你有 `src/variables.scss` 这个文件
        data: "@import \"@/theme/index.less\";"
      }
    }
  }
};
