/** @type {import('prettier').Config} */
module.exports = {
  // 基本配置
  printWidth: 100, // 每行代码长度
  tabWidth: 2, // 缩进空格数
  useTabs: false, // 使用空格缩进
  semi: true, // 在语句末尾添加分号
  singleQuote: true, // 使用单引号
  jsxSingleQuote: false, // JSX中使用双引号
  trailingComma: 'es5', // 尾随逗号
  bracketSpacing: true, // 对象字面量大括号间的空格
  bracketSameLine: false, // 将多行JSX元素的 > 放在最后一行的末尾
  arrowParens: 'always', // 箭头函数参数总是加括号
  endOfLine: 'lf', // 换行符使用 lf
  htmlWhitespaceSensitivity: 'css', // 根据CSS显示样式决定html要不要折行

  // 文件覆盖规则
  overrides: [
    {
      files: '*.md',
      options: {
        proseWrap: 'always',
        tabWidth: 2
      }
    },
    {
      files: '*.json',
      options: {
        tabWidth: 2
      }
    },
    {
      files: '*.scss',
      options: {
        singleQuote: false
      }
    }
  ]
};