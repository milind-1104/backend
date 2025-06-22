// File: seedCeramic.js
import { createHash } from "crypto";
import { CeramicClient } from "@ceramicnetwork/http-client";
import { DataModel } from "@glazed/datamodel";
import { DIDDataStore } from "@glazed/did-datastore";
import { DID } from "dids";
import { Ed25519Provider } from "key-did-provider-ed25519";
import { getResolver } from "key-did-resolver";

// Use alternative Clay Testnet URL or local node
const ceramic = new CeramicClient(
  "https://go-ipfs-ceramic-public-clay-external.ceramic.network"
); // Or "http://localhost:7007" for local node
console.log("Ceramic client initialized with URL:", ceramic._url);

const originalSeedString = "my-super-secret-trustnet-hackathon-seed-1234";
const seed = createHash("sha256").update(originalSeedString).digest();

const provider = new Ed25519Provider(seed);
const did = new DID({ provider, resolver: getResolver() });
await did.authenticate();

ceramic.did = did;

const model = new DataModel({
  ceramic,
  aliases: {
    schemas: {
      basicProfile:
        "ceramic://k3y52l7qbv1frxt706gqfzmq6cbqdkptzkbbntd7xtgrnu2fbk5iys55ci6x5s8o0",
    },
    definitions: {
      profile:
        "kjzl6cwe1jw145cjbeko9ha98yhsj23c2g6gdah0d5p09evwGkddeC13hDTy0ar",
    },
    tiles: {},
  },
});

const store = new DIDDataStore({ ceramic, model });

const createProfile = async (name, description) => {
  const profileData = {
    name: name,
    description: description,
    image: `https://avatars.dicebear.com/api/pixel-art/${name}.svg`,
  };

  console.log(`Creating/updating profile for DID ${did.id}...`);
  console.log("Ceramic client URL:", ceramic._url);
  console.log("Ceramic DID authenticated:", !!ceramic.did);
  try {
    await store.set("profile", profileData);
    const streamId = store.getDefinition("profile");
    console.log(
      `Profile operation complete! Definition Stream ID: ${streamId}\n`
    );
    return streamId;
  } catch (err) {
    console.error("Failed to set profile:", err);
    throw err;
  }
};

const run = async () => {
  console.log(`Using DID: ${did.id}`);
  console.log("---");

  const streamId = await createProfile(
    "TrustNet_Contributor",
    "A talented Web3 developer from the TrustNet ecosystem."
  );

  console.log("---");
  console.log("Ceramic seeding complete.");
  console.log(
    "Use this Definition Stream ID for your contributors in collectData.js:",
    streamId
  );
};

run().catch(console.error);
