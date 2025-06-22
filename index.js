// File: index.js (Simplified for a Stable Deployment - NO SWAGGER)

import express from 'express';
import cors from 'cors';
import { ethers } from 'ethers';
import * as snarkjs from 'snarkjs';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import connectDB from './db.js';
import TrustScore from './models/TrustScore.js';
import { verifierContractAddress, verifierContractAbi } from './utils/contractInfo.js';
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(express.json());

// Root route to confirm the server is running
app.get('/', (req, res) => res.send('TrustNet Backend is Running!'));

// Trust Score endpoint
app.get('/trust-score/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const result = await TrustScore.findOne({ address: { $regex: `^${address}$`, $options: "i" } });
    if (result) {
      res.json({ address: result.address, score: result.score });
    } else {
      res.status(404).json({ error: "Score not found for this address." });
    }
  } catch (error) {
    console.error("API Error in /trust-score:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ZK Verification endpoint
app.post('/verify-endorsement', async (req, res) => {
  try {
    const { a, b } = req.body;
    if (a === undefined || b === undefined) {
      return res.status(400).json({ error: "Missing required inputs 'a' and 'b'" });
    }
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const wasmPath = path.join(__dirname, 'zk_artifacts', 'main.wasm');
    const zkeyPath = path.join(__dirname, 'zk_artifacts', 'sum_0001.zkey');
    const { proof, publicSignals } = await snarkjs.groth16.fullProve({ a: a, b: b }, wasmPath, zkeyPath);
    const provider = new ethers.providers.JsonRpcProvider(process.env.OPTIMISM_SEPOLIA_RPC_URL);
    const verifierContract = new ethers.Contract(verifierContractAddress, verifierContractAbi, provider);
    const isVerified = await verifierContract.verifyProof(proof, publicSignals);
    res.json({
      message: isVerified ? "On-chain verification successful!" : "On-chain verification failed.",
      isVerified: isVerified,
      publicOutput: publicSignals[0]
    });
  } catch (error) {
    console.error('API Error in /verify-endorsement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Connect to DB and start server for Railway
connectDB().then(() => {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
  });
});