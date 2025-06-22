import mongoose from 'mongoose';

const interactionSchema = new mongoose.Schema({
  from: String,
  to: String,
  type: {
    type: String,
    enum: ['collaboration', 'endorsement', 'profile'],
    required: true,
  },
  source: {
    type: String,
    enum: ['IPFS', 'Ceramic', 'Lens'],
    required: true,
  },
  reference: String, // Yahan CID ya Stream ID aayegi
  details: Object,
  timestamp: { type: Date, default: Date.now },
});

const Interaction = mongoose.model('Interaction', interactionSchema);

export default Interaction;
