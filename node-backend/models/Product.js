const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  quantity: { type: Number, default: 0 },            // ✅ NEW
  rating: { type: Number, default: 0, min: 0, max: 5 }, // ✅ UPDATED: enforce rating limit
  reviews: { type: Number, default: 0 },
  description: { type: String },
  priceRange: { type: String },
  featured: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);
