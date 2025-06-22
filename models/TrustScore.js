import mongoose from "mongoose";

const trustScoreSchema = new mongoose.Schema(
  {
    address: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    score: {
      type: Number,
      required: true,
    },
  },
  {
    collection: "trust_scores",
  }
);

const TrustScore = mongoose.model("TrustScore", trustScoreSchema);

export default TrustScore;
