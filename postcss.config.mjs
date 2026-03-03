const config = {
  plugins: {
    'postcss-import': {},          // 支持 @import
    'tailwindcss/nesting': {},     // 支持嵌套
    'tailwindcss': {},
    'autoprefixer': {},
    ...(process.env.NODE_ENV === 'production' ? {
      'cssnano': {                // 生产环境压缩
        preset: 'default',
      }
    } : {})
  }
};

export default config;
