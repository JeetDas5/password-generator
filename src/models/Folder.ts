import mongoose, { Schema, Document } from "mongoose";

export interface IFolder extends Document {
  userId: string;
  name: string;
  color?: string;
  icon?: string;
}

const FolderSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    color: { type: String, default: "#3B82F6" },
    icon: { type: String, default: "📁" },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Folder ||
  mongoose.model<IFolder>("Folder", FolderSchema);