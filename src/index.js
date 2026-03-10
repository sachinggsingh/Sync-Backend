require('dotenv').config();
require('./config/otel'); // Initialize OpenTelemetry
const { server } = require('./app');
const { logger } = require('./utils/logger');
const PORT = process.env.PORT || 5555;

server.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT}`);
});
