// File: index.js (Complete, Final, Corrected for Deployment)

import express from 'express';
import cors from 'cors';
import { ethers } from 'ethers';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import * as snarkjs from 'snarkjs';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import connectDB from './db.js';
import TrustScore from './models/TrustScore.js';
import { verifierContractAddress, verifierContractAbi } from './utils/contractInfo.js';
import 'dotenv/config';

// Define __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// --- Swagger API Documentation Setup ---
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TrustNet API',
      version: '1.0.0',
      description: 'API for the TrustNet system to fetch trust scores and verify endorsements.',
    },
    servers: [{ url: "https://trustnet-backend.vercel.app" }],
  },
  apis: [path.join(__dirname, 'index.js')],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// --- End Swagger Setup ---

/**
 * @swagger
 * /:
 * get:
 * summary: Check server status
 * tags: [Status]
 * responses:
 * 200:
 * description: Confirmation message that the server is active.
 */
app.get('/', (req, res) => res.send('TrustNet Backend is Running! API docs are available at /api-docs'));

/**
 * @swagger
 * /trust-score/{address}:
 * get:
 * summary: Retrieve the trust score for a given contributor address
 * tags: [TrustScore]
 * parameters:
 * - in: path
 * name: address
 * required: true
 * description: The Ethereum address or identifier of the contributor.
 * schema:
 * type: string
 * responses:
 * 200:
 * description: The contributor's trust score.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * address:
 * type: string
 * score:
 * type: number
 * 404:
 * description: Score not found for the provided address.
 */
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

/**
 * @swagger
 * /verify-endorsement:
 * post:
 * summary: Generate a ZK proof and verify it on-chain
 * tags: [Verification]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * a:
 * type: string
 * example: '3'
 * b:
 * type: string
 * example: '2'
 * responses:
 * 200:
 * description: On-chain verification result.
 * 400:
 * description: Missing required inputs.
 */
app.post('/verify-endorsement', async (req, res) => {
  try {
    const { a, b } = req.body;

    if (a === undefined || b === undefined) {
      return res.status(400).json({ error: "Missing required inputs 'a' and 'b'" });
    }

    const wasmPath = path.join(__dirname, 'zk_artifacts', 'main.wasm');
    const zkeyPath = path.join(__dirname, 'zk_artifacts', 'sum_0001.zkey');

    console.log("Generating ZK proof for inputs...");

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        { a: a, b: b },
        wasmPath,
        zkeyPath
    );

    console.log("Proof generated successfully.");
    console.log("Public Output (c):", publicSignals[0]);
    
    console.log("Verifying proof on-chain via Optimism Sepolia...");

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

// Connect to DB and export app for Vercel
connectDB().then(() => {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(
      `Backend server running on port ${PORT}. API docs at /api-docs`
    );
  });
});
