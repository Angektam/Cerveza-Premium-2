/**
 * Health check endpoint
 */
module.exports = async (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'cerveza-premium-api'
  });
};
