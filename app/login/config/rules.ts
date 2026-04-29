export const form_rules = {
  username: {
    rules: [
      { required: true, message: '请输入账号' },
      { min: 3, message: '账号长度不能少于 3 位' },
    ],
    defaultValue: '请输入账号',
  },
  password: {
    rules: [
      { required: true, message: '请输入密码' },
      { min: 3, message: '密码长度不能少于 3 位' },
    ],
    defaultValue: '请输入密码',
  },
};
