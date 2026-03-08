const autocannon = require('autocannon');
const { app, server } = require('../src/app');

// Configuration
const PORT = 5557; // Separate port for testing
const DURATION = process.env.DURATION || 10; // 10 seconds default
const CONNECTIONS = process.env.CONNECTIONS || 100; // 100 concurrent users default

async function runBenchmark() {
    console.log(`Starting server on port ${PORT}...`);

    // Start server
    await new Promise((resolve) => server.listen(PORT, resolve));
    console.log(`Server is running. Starting benchmark against http://localhost:${PORT}/health...`);
    console.log(`Duration: ${DURATION}s, Concurrent Connections: ${CONNECTIONS}`);

    try {
        const result = await autocannon({
            url: `http://localhost:${PORT}/health`,
            connections: CONNECTIONS,
            duration: DURATION,
            pipelining: 1,
        });

        console.log('\n--- Benchmark Result ---');
        console.log(`Requests/sec: ${result.requests.average}`);
        console.log(`Latency (avg): ${result.latency.average} ms`);
        console.log(`Throughput: ${(result.throughput.average / 1024 / 1024).toFixed(2)} MB/sec`);
        console.log(`Total Requests: ${result.requests.total}`);
        console.log(`Total Errors: ${result.errors + result.timeouts + result.non2xx}`);
        console.log('--- End of Result ---\n');

    } catch (err) {
        console.error('Error running benchmark:', err);
    } finally {
        console.log('Closing server...');
        server.close();
    }
}

runBenchmark();
