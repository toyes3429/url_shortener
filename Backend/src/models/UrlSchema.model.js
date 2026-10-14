import mongoose from "mongoose";

const shortUrlSchema = new mongoose.Schema(
  {
    full_url: {
      type: String,
      required: true,
      maxlength: 2048,
      trim: true,
    },
    short_url: {
      type: String,
      required: true,
      unique: true,
      minlength: 3,
      maxlength: 32,
    },
    clicks: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    expires_at: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

shortUrlSchema.index(
  { expires_at: 1 },
  {
    expireAfterSeconds: 0,
    partialFilterExpression: { expires_at: { $type: "date" } },
  }
);

const shortUrl = mongoose.model("shortUrl", shortUrlSchema);
export default shortUrl;
