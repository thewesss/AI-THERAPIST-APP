import mongoose, { Document, Schema, model } from "mongoose";

export interface IMood extends Document {
    userId: mongoose.Types.ObjectId; // reference to the user
    score: number; // mood score from 0 to 100
    notes?: string; // optional notes
    timestamp: Date; // when the mood was recorded
    createdAt: Date;
    updatedAt: Date;
};

const moodSchema = new Schema<IMood>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    score: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
    },
    notes: {
        type: String,
        trim: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true }
);

moodSchema.index({ userId: 1, timestamp: -1 }); // compound index for efficient querying

const Mood = mongoose.model<IMood>("Mood", moodSchema);

export { Mood };