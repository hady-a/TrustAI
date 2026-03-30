const WebSocket = require('ws');
const assert = require('assert');

/**
 * WebSocket Server Test Suite
 * Tests the WebSocket live analysis server
 */

const WS_URL = 'ws://localhost:8080';
const TEST_TIMEOUT = 10000;

let testsPassed = 0;
let testsFailed = 0;

/**
 * Helper function to test with timeout
 */
async function testWithTimeout(name, testFn, timeout = TEST_TIMEOUT) {
  return new Promise(async (resolve) => {
    const timeoutId = setTimeout(() => {
      console.error(`❌ TIMEOUT: ${name}`);
      testsFailed++;
      resolve();
    }, timeout);

    try {
      await testFn();
      clearTimeout(timeoutId);
      console.log(`✅ PASS: ${name}`);
      testsPassed++;
      resolve();
    } catch (err) {
      clearTimeout(timeoutId);
      console.error(`❌ FAIL: ${name}`);
      console.error(`   Error: ${err.message}`);
      testsFailed++;
      resolve();
    }
  });
}

/**
 * Test 1: Server Connection
 */
async function testServerConnection() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);

    ws.on('open', () => {
      ws.close();
      resolve();
    });

    ws.on('error', (err) => {
      reject(new Error(`Connection failed: ${err.message}`));
    });

    setTimeout(() => {
      reject(new Error('Connection timeout'));
    }, 3000);
  });
}

/**
 * Test 2: Receive Welcome Message
 */
async function testWelcomeMessage() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);

    ws.on('open', () => {
      // Give server time to send welcome message
      setTimeout(() => {
        reject(new Error('No message received'));
      }, 2000);
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        assert.strictEqual(message.type, 'connected', 'Expected connected message');
        assert.ok(message.clientId, 'Expected clientId');
        ws.close();
        resolve();
      } catch (err) {
        ws.close();
        reject(err);
      }
    });

    ws.on('error', reject);
  });
}

/**
 * Test 3: Send Audio Chunk and Receive Acknowledgment
 */
async function testAudioChunkAcknowledgment() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);
    let receivedWelcome = false;

    ws.on('open', () => {
      // Send audio chunk after welcome
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);

        if (!receivedWelcome && message.type === 'connected') {
          receivedWelcome = true;
          // Send audio chunk
          const audioChunk = Buffer.alloc(1024, 'test');
          ws.send(audioChunk);
        } else if (message.type === 'chunk_received') {
          assert.strictEqual(message.chunkNumber, 1, 'Expected chunk number 1');
          assert.ok(message.bufferedChunks, 'Expected bufferedChunks');
          ws.close();
          resolve();
        }
      } catch (err) {
        ws.close();
        reject(err);
      }
    });

    ws.on('error', reject);

    setTimeout(() => {
      reject(new Error('Test timeout'));
    }, 5000);
  });
}

/**
 * Test 4: Clear Buffer Command
 */
async function testClearBufferCommand() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);
    let receivedWelcome = false;

    ws.on('open', () => {
      // Wait for welcome
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);

        if (!receivedWelcome && message.type === 'connected') {
          receivedWelcome = true;
          // Send clear buffer command
          ws.send(JSON.stringify({ type: 'clear_buffer' }));
        } else if (message.type === 'info' && message.message === 'Buffer cleared') {
          ws.close();
          resolve();
        }
      } catch (err) {
        ws.close();
        reject(err);
      }
    });

    ws.on('error', reject);

    setTimeout(() => {
      reject(new Error('Test timeout'));
    }, 5000);
  });
}

/**
 * Test 5: Status Command
 */
async function testStatusCommand() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);
    let receivedWelcome = false;

    ws.on('open', () => {
      // Wait for welcome
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);

        if (!receivedWelcome && message.type === 'connected') {
          receivedWelcome = true;
          // Send status command
          ws.send(JSON.stringify({ type: 'status' }));
        } else if (message.type === 'status') {
          assert.ok(message.clientId, 'Expected clientId');
          assert.ok(message.hasOwnProperty('bufferedChunks'), 'Expected bufferedChunks');
          assert.ok(message.hasOwnProperty('isProcessing'), 'Expected isProcessing');
          assert.ok(message.hasOwnProperty('connectedDuration'), 'Expected connectedDuration');
          ws.close();
          resolve();
        }
      } catch (err) {
        ws.close();
        reject(err);
      }
    });

    ws.on('error', reject);

    setTimeout(() => {
      reject(new Error('Test timeout'));
    }, 5000);
  });
}

/**
 * Test 6: Unknown Command Error
 */
async function testUnknownCommandError() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);
    let receivedWelcome = false;

    ws.on('open', () => {
      // Wait for welcome
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);

        if (!receivedWelcome && message.type === 'connected') {
          receivedWelcome = true;
          // Send unknown command
          ws.send(JSON.stringify({ type: 'unknown_command' }));
        } else if (message.type === 'error') {
          assert.ok(message.message.includes('Unknown command'), 'Expected unknown command error');
          ws.close();
          resolve();
        }
      } catch (err) {
        ws.close();
        reject(err);
      }
    });

    ws.on('error', reject);

    setTimeout(() => {
      reject(new Error('Test timeout'));
    }, 5000);
  });
}

/**
 * Test 7: Multiple Clients
 */
async function testMultipleClients() {
  return new Promise(async (resolve, reject) => {
    try {
      const ws1 = new WebSocket(WS_URL);
      const ws2 = new WebSocket(WS_URL);
      let connected = 0;

      const checkComplete = () => {
        if (connected === 2) {
          ws1.close();
          ws2.close();
          resolve();
        }
      };

      ws1.on('open', () => {
        ws1.send(JSON.stringify({ type: 'status' }));
      });

      ws2.on('open', () => {
        ws2.send(JSON.stringify({ type: 'status' }));
      });

      ws1.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          if (message.type === 'status') {
            connected++;
            checkComplete();
          }
        } catch (err) {
          reject(err);
        }
      });

      ws2.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          if (message.type === 'status') {
            connected++;
            checkComplete();
          }
        } catch (err) {
          reject(err);
        }
      });

      ws1.on('error', reject);
      ws2.on('error', reject);

      setTimeout(() => {
        reject(new Error('Test timeout'));
      }, 5000);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('======================================================================');
  console.log('WebSocket Server Test Suite');
  console.log('======================================================================');
  console.log('');
  console.log('Attempting to connect to WebSocket server at:', WS_URL);
  console.log('');

  // Check if server is running
  try {
    const testWs = new WebSocket(WS_URL);
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Server not responding')), 3000);
      testWs.on('open', () => {
        clearTimeout(timeout);
        testWs.close();
        resolve();
      });
      testWs.on('error', reject);
    });
  } catch (err) {
    console.error('❌ Server is not running at', WS_URL);
    console.error('   Start the server with: node websocket-server.js');
    process.exit(1);
  }

  console.log('✅ Server is running');
  console.log('');
  console.log('Running tests...');
  console.log('======================================================================');
  console.log('');

  // Run tests
  await testWithTimeout('Server Connection', testServerConnection);
  await testWithTimeout('Receive Welcome Message', testWelcomeMessage);
  await testWithTimeout('Send Audio Chunk and Receive ACK', testAudioChunkAcknowledgment);
  await testWithTimeout('Clear Buffer Command', testClearBufferCommand);
  await testWithTimeout('Status Command', testStatusCommand);
  await testWithTimeout('Unknown Command Error Handling', testUnknownCommandError);
  await testWithTimeout('Multiple Clients', testMultipleClients);

  // Summary
  console.log('');
  console.log('======================================================================');
  console.log('Test Summary');
  console.log('======================================================================');
  console.log(`Passed: ${testsPassed}`);
  console.log(`Failed: ${testsFailed}`);
  console.log(`Total:  ${testsPassed + testsFailed}`);
  console.log('');

  if (testsFailed === 0) {
    console.log('✅ All tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed');
    process.exit(1);
  }
}

// Run tests
runTests().catch((err) => {
  console.error('Test suite error:', err);
  process.exit(1);
});
