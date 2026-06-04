const mongoose = require("mongoose");

const FeedbackSchema = new mongoose.Schema(
    {
        type: { type: String, enum: ['bug', 'idea', 'other'], default: 'other' },
        message: {
            type: String,
            required: [true, "Message is required"],
            trim: true,
            minlength: [1, "Message cannot be empty"],
            maxlength: [2000, "Message cannot exceed 2000 characters"],
        },
        userId: { type: String, default: null },
        userEmail: { type: String, trim: true, default: "" },
        status: { type: String, enum: ['new', 'read', 'archived'], default: 'new' },
    },
    { timestamps: true }
);

const Feedback = mongoose.models.Feedback || mongoose.model("Feedback", FeedbackSchema);
module.exports = Feedback;
