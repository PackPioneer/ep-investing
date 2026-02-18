import mongoose from "mongoose";

const CompanySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    logo: { type: String },

    description: { type: String },

    tags: [{ type: String }],

    website: { type: String },

    stage: {
      type: String,
      enum: ["pre-seed", "seed", "series-a", "growth"],
    },

    location: String,
  },
  { timestamps: true }
);

export default mongoose.models.Company ||
  mongoose.model("Company", CompanySchema);
