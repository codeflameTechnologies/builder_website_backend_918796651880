import Enquiry from "../models/Enquiry.js";

export const createEnquiry = async (req, res) => {
  try {
    const { name, phone, email, propertyType } = req.body;
    if (!name || !phone || !email || !propertyType) return res.status(400).json({ message: "Name, phone, email and property type are required" });
    const enquiry = await Enquiry.create(req.body);
    res.status(201).json({ message: "Enquiry submitted successfully", id: enquiry._id });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getEnquiries = async (req, res) => {
  try { res.json(await Enquiry.find().sort({ createdAt: -1 })); }
  catch (error) { res.status(500).json({ message: error.message }); }
};
