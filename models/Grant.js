import mongoose from "mongoose";

const GrantSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },

    funder: { type: String }, // DOE etc

    deadline: { type: Date },

    amountMin: Number,
    amountMax: Number,

    tags: [{ type: String }],

    link: String, // apply link
  },
  { timestamps: true }
);

export default mongoose.models.Grant ||
  mongoose.model("Grant", GrantSchema);
