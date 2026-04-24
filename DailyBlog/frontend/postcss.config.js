export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {
      // 浏览器兼容性配置
      overrideBrowserslist: [
        // WebKit 内核 (Chrome, Safari, Edge)
        'last 2 Chrome versions',
        'last 2 Safari versions',
        'last 2 Edge versions',
        
        // Gecko 内核 (Firefox)
        'last 2 Firefox versions',
        
        // 移动端浏览器
        'last 2 iOS versions',
        'last 2 Android versions',
        
        // 特定版本支持
        'Chrome >= 80',
        'Firefox >= 75',
        'Safari >= 13',
        'Edge >= 80',
        
        // 不支持 IE (现代项目)
        'not IE 11',
        'not dead',
      ],
      // 添加 flexbox 相关前缀
      flexbox: true,
      // 添加 grid 相关前缀
      grid: true,
    },
  },
}
