// Proxies /api requests to the Aspire-managed gateway during `ng serve`.
// Aspire injects services__gateway__{scheme}__0 into the process env via WithReference(gateway).
const target =
  process.env['services__gateway__http__0'] ||
  process.env['services__gateway__https__0'] ||
  'http://localhost:5047';

module.exports = {
  '/api': {
    target,
    secure: false,
    changeOrigin: true,
  },
};
