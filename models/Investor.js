import mongoose from "mongoose";

const InvestorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    logo: String,

    type: {
      type: String,
      enum: ["vc", "angel", "family-office", "corporate"],
    },

    focus: [{ type: String }], // hydrogen, climate finance

    website: String,
  },
  { timestamps: true }
);

export default mongoose.models.Investor ||
  mongoose.model("Investor", InvestorSchema);
