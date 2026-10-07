import mongoose from "mongoose";

const enquirySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  whatsapp: { type: Boolean, default: false },
  propertyType: { type: String, required: true },
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property" },
  propertyName: { type: String, trim: true },
  budget: String,
  visitDate: String,
  notes: String,
}, { timestamps: true });

export default mongoose.model("Enquiry", enquirySchema);
