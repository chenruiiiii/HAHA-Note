/** @type {import('tailwindcss').Config} */
export default {
  // 开发模式
  mode: 'jit',

  // 文件扫描路径
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],

  // 自定义主题配置
  theme: {
    // 屏幕断点
    screens: {
      xs: '480px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },

    // 间距
    spacing: {
      px: '1px',
      0: '0',
      0.5: '0.125rem', // 2px
      1: '0.25rem', // 4px
      1.5: '0.375rem', // 6px
      2: '0.5rem', // 8px
      2.5: '0.625rem', // 10px
      3: '0.75rem', // 12px
      3.5: '0.875rem', // 14px
      4: '1rem', // 16px
      5: '1.25rem', // 20px
      6: '1.5rem', // 24px
      7: '1.75rem', // 28px
      8: '2rem', // 32px
      9: '2.25rem', // 36px
      10: '2.5rem', // 40px
      12: '3rem', // 48px
      16: '4rem', // 64px
      20: '5rem', // 80px
      24: '6rem', // 96px
      32: '8rem', // 128px
    },

    // 颜色
    colors: ({ colors }) => ({
      // 保留 Tailwind 默认颜色
      ...colors,

      // 项目自定义颜色
      primary: {
        50: '#e6f7ff',
        100: '#bae7ff',
        200: '#91d5ff',
        300: '#69c0ff',
        400: '#40a9ff',
        500: '#1890ff', // Ant Design 主色
        600: '#096dd9',
        700: '#0050b3',
        800: '#003a8c',
        900: '#002766',
      },

      // 功能色
      success: '#52c41a',
      warning: '#faad14',
      error: '#ff4d4f',
      info: '#1890ff',

      // 背景色
      background: '#f0f2f5',

      // 文本色
      text: {
        primary: 'rgba(0, 0, 0, 0.85)',
        secondary: 'rgba(0, 0, 0, 0.45)',
        disabled: 'rgba(0, 0, 0, 0.25)',
      },
    }),

    // 字体
    fontFamily: {
      sans: [
        '-apple-system',
        'BlinkMacSystemFont',
        'Segoe UI',
        'PingFang SC',
        'Hiragino Sans GB',
        'Microsoft YaHei',
        'Helvetica Neue',
        'Helvetica',
        'Arial',
        'sans-serif',
      ],
      mono: [
        'SFMono-Regular',
        'Menlo',
        'Monaco',
        'Consolas',
        'Liberation Mono',
        'Courier New',
        'monospace',
      ],
    },

    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }], // 12px
      sm: ['0.875rem', { lineHeight: '1.25rem' }], // 14px
      base: ['1rem', { lineHeight: '1.5rem' }], // 16px
      lg: ['1.125rem', { lineHeight: '1.75rem' }], // 18px
      xl: ['1.25rem', { lineHeight: '1.75rem' }], // 20px
      '2xl': ['1.5rem', { lineHeight: '2rem' }], // 24px
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
      '5xl': ['3rem', { lineHeight: '1' }], // 48px
    },

    // 扩展
    extend: {
      // 动画
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },

      // 关键帧
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },

      // 阴影
      boxShadow: {
        card: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
        'card-hover': '0 8px 16px 0 rgba(0, 0, 0, 0.08), 0 2px 6px 0 rgba(0, 0, 0, 0.04)',
        dropdown:
          '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
      },

      // 圆角
      borderRadius: {
        sm: '0.25rem', // 4px
        DEFAULT: '0.375rem', // 6px
        md: '0.5rem', // 8px
        lg: '0.75rem', // 12px
        xl: '1rem', // 16px
        '2xl': '1.5rem', // 24px
        full: '9999px',
      },

      // 透明度
      opacity: {
        15: '0.15',
        35: '0.35',
        65: '0.65',
        85: '0.85',
      },

      // 高度
      height: {
        header: '64px',
        'editor-toolbar': '48px',
        sidebar: 'calc(100vh - 64px)',
      },

      // 最小/最大尺寸
      minWidth: {
        sidebar: '240px',
        editor: '320px',
      },
      maxWidth: {
        content: '800px',
        editor: '1200px',
      },

      // 网格
      gridTemplateColumns: {
        editor: '240px 1fr',
        'editor-with-preview': '240px 1fr 320px',
      },
    },
  },

  // 插件
  plugins: [
    require('@tailwindcss/typography'), // 用于 Markdown 样式
    require('tailwind-scrollbar')({ nocompatible: true }),
    require('tailwindcss-animate'), // 动画插件
  ],

  // 暗黑模式
  // darkMode: 'class', // 通过 .dark 类控制

  // 优化选项
  future: {
    hoverOnlyWhenSupported: true,
  },
};
