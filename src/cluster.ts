// src/cluster.ts
// ============================================================
// NODEJS CLUSTERING: Spawns one worker per CPU core to
// maximize throughput through load balancing.
// ============================================================
import cluster from 'cluster';
import os from 'os';

const NUM_WORKERS = os.cpus().length;

if (cluster.isPrimary) {
  console.log(`🖥️  Primary process ${process.pid} running`);
  console.log(`🔧 Spawning ${NUM_WORKERS} workers (one per CPU core)...`);

  // Fork one worker per CPU core
  for (let i = 0; i < NUM_WORKERS; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`⚠️  Worker ${worker.process.pid} died (${signal || code}). Restarting...`);
    cluster.fork(); // Auto-restart crashed workers
  });

  cluster.on('online', (worker) => {
    console.log(`✅ Worker ${worker.process.pid} is online`);
  });
} else {
  // Workers share the same port via OS load balancing
  require('./main');
  console.log(`👷 Worker ${process.pid} started`);
}