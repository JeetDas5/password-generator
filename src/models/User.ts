import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  password: string;
  salt?: string;
  twoFactorSecret?: string;
  twoFactorEnabled: boolean;
  backupCodes?: string[];
}

const UserSchema: Schema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    salt: { type: String, required: false },
    twoFactorSecret: { type: String, required: false },
    twoFactorEnabled: { type: Boolean, default: false },
    backupCodes: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);
