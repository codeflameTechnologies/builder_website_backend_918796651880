import mongoose from "mongoose";

const propertySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, required: true }, // e.g. "3 BHK Flat"
    listingType: { type: String, enum: ["sale", "rent"], required: true },
    price: { type: String, required: true }, // display string e.g. "₹65 Lakh"
    area: { type: String },
    bhk: { type: Number },
    location: { type: String, required: true },
    address: { type: String },
    description: { type: String },
    images: [{ type: String }], // array of image URLs
    amenities: [{ type: String }],
    loanAvailable: { type: Boolean, default: false },
    status: { type: String, enum: ["available", "sold"], default: "available" },
  },
  { timestamps: true }
);

export default mongoose.model("Property", propertySchema);
