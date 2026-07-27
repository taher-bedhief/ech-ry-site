import mongoose, { Schema, model, models } from "mongoose";

const reviewSchema = new Schema({
  userId: { type: String, required: true },        
  productId: { type: String, required: true },     
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default models.Review || model("Review", reviewSchema);
