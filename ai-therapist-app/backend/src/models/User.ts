import mongoose, { Document, Schema, model } from "mongoose";

// Define the User interface extending mongoose Document
export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
}

// Define the User schema
const UserSchema = new Schema<IUser>(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
    }, 
    { timestamps: true }
);

export const User = mongoose.model<IUSer>("User", UserSchema);// Create and export the User model

