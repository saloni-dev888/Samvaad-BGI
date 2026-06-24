module.exports = {
  isEmail: (str) => /\S+@\S+\.\S+/.test(str),
  sanitize: (str) => String(str).replace(/<[^>]*>/g, '')
};
