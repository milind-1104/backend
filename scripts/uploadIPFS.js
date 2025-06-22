// File: trustnet/backend/scripts/uploadIPFS.js

import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

const PINATA_JWT = process.env.PINATA_JWT;
const PINATA_URL = `https://api.pinata.cloud/pinning/pinFileToIPFS`;

const uploadFileToPinata = async (filePath, fileName) => {
  const formData = new FormData();
  formData.append("file", fs.createReadStream(filePath));
  const metadata = JSON.stringify({ name: fileName });
  formData.append("pinataMetadata", metadata);
  const options = JSON.stringify({ cidVersion: 1 });
  formData.append("pinataOptions", options);

  try {
    const res = await axios.post(PINATA_URL, formData, {
      maxBodyLength: "Infinity",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${formData._boundary}`,
        Authorization: `Bearer ${PINATA_JWT}`,
      },
    });
    return res.data.IpfsHash;
  } catch (error) {
    console.error(
      `Error uploading ${fileName}:`,
      error.response ? error.response.data : error.message
    );
    return null;
  }
};

const runUploads = async () => {
  const fileName = "all_collaborations.json";
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const filePath = path.join(__dirname, "..", "data", fileName);

  if (!fs.existsSync(filePath)) {
    console.error(
      `\nERROR: File not found at ${filePath}. Please create it first.`
    );
    return;
  }

  console.log(`Uploading ${fileName} to Pinata...`);
  const cid = await uploadFileToPinata(filePath, fileName);

  if (cid) {
    console.log("\n--- Real IPFS CID ---");
    console.log(`Successfully uploaded! Your CID is: ${cid}`);
    console.log("Copy this CID for the next step.");
  } else {
    console.log("\nUpload failed. Please check for errors above.");
  }
};

runUploads();
