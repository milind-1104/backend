// File: trustnet/backend/scripts/collectData.js

import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "../db.js";
import Interaction from "../models/Interaction.js";

const run = async () => {
  await connectDB();
  console.log("Database connected. Preparing to insert larger dataset...");

  await Interaction.deleteMany({});
  console.log("Cleared old interactions from the database.");

  const allInteractions = [];
  const __dirname = path.dirname(fileURLToPath(import.meta.url));

  const allCollaborationsCid =
    "bafkreibdq4d6sgkl5y2reamt3zaab7qqsxfngusu7cgttsmnrghgkpwb34";

  const lensData = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "..", "data", "mockLens.json"),
      "utf-8"
    )
  );
  const ceramicData = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "..", "data", "mockCeramic.json"),
      "utf-8"
    )
  );
  const ipfsData = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "..", "data", "all_collaborations.json"),
      "utf-8"
    )
  );

  for (const collab of ipfsData) {
    allInteractions.push({
      from: collab.contributor,
      to: collab.project,
      type: "collaboration",
      source: "IPFS",
      reference: allCollaborationsCid,
      details: { role: collab.role },
    });
  }

  for (const endorsement of lensData) {
    allInteractions.push({
      from: endorsement.from,
      to: endorsement.to,
      type: "endorsement",
      source: "Lens",
      details: { content: endorsement.content },
    });
  }

  for (const profile of ceramicData) {
    allInteractions.push({
      from: profile.address,
      to: profile.address,
      type: "profile",
      source: "Ceramic",
      reference: profile.streamId,
    });
  }

  await Interaction.insertMany(allInteractions);
  console.log(
    `Successfully inserted ${allInteractions.length} new interaction documents into MongoDB!`
  );

  await mongoose.disconnect();
  console.log("Database connection closed.");
};

run().catch(async (err) => {
  console.error("Data collection script failed:", err);
  await mongoose.disconnect();
  process.exit(1);
});
