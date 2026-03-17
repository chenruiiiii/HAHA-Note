export const form_rules = {
  phone: {
    rules: [
      { required: true, message: '请输入手机号' },
      { pattern: /^1[3456789]\d{8}$/, message: '请输入正确的手机号' },
    ],
    defaultValue: '请输入手机号',
  },
  code: {
    rules: [
      { required: true, message: '请输入验证码' },
      { pattern: /^\d{6}$/, message: '验证码为6位数字' },
    ],
    defaultValue: '请输入验证码',
  },
};
