// manages user sessions and authentication
import mongoose, { Document, Schema } from "mongoose";

// Define the Session interface extending mongoose Document
export interface ISession extends Document {
    userId: mongoose.Types.ObjectId; // reference to the user
    token: string; // session token
    expiresAt: Date; // expiration date
    deviceInfo?: string; // optional device information
    lastActive: Date;
}

//establishes relationship between user and session

const SessionSchema = new Schema<ISession>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        token: { type: String, required: true, unique: true },
        expiresAt: { type: Date, required: true },
        deviceInfo: { type: String },
        lastActive: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

//TTL Index to automatically remove expired sessions
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); 

export const Session = mongoose.model<ISession>("Session", SessionSchema);
    