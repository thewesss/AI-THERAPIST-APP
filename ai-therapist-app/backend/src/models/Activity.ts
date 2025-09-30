import mongoose, { Document, Schema } from "mongoose";

// Define the Activity interface extending mongoose Document
export interface IActivity extends Document {
    userId: mongoose.Types.ObjectId; // reference to the user
    type: string; // type of activity (e.g., "login", "logout", "message_sent")
    name: string; // name of the activity
    description: string; // optional description
    duration: number; // duration in seconds
    timestamp: Date; // when the activity occurred
}

// Define the Activity schema
const activitySchema = new Schema<IActivity>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true, 
    },
    type: {// activity type
        type: String,
        required: true,
        enum: [// predefined activity types
            "meditation",
            "exercise",
            "walking",
            "reading",
            "journaling",
            "therapy",
        ],
    },
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    duration: {
        type: Number,
        min: 0,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },  
}, { timestamps: true }
);

activitySchema.index({ userId: 1, timestamp: -1 }); //compound index for efficient querying

export const Activity = mongoose.model<IActivity>("Activity", activitySchema);