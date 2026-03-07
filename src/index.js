require('dotenv').config();
require('./config/otel'); // Initialize OpenTelemetry
const { server } = require('./app');

const PORT = process.env.PORT || 5555;

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
