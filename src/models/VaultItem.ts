import mongoose, { Schema, Document } from "mongoose";

interface EncryptedField {
  ciphertext: string;
  iv: number[];
}

export interface IVaultItem extends Document {
  userId: string;
  title: string;
  username: EncryptedField;
  password: EncryptedField;
  url?: EncryptedField;
  notes?: EncryptedField;
  tags: string[];
  folderId?: string;
  favorite: boolean;
}

const FieldSchema: Schema = new Schema<EncryptedField>({
  ciphertext: { type: String, required: true },
  iv: { type: [Number], required: true },
});

const VaultItemSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    username: FieldSchema,
    password: FieldSchema,
    url: FieldSchema,
    notes: FieldSchema,
    tags: [{ type: String }],
    folderId: { type: Schema.Types.ObjectId, ref: "Folder", required: false },
    favorite: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.VaultItem ||
  mongoose.model<IVaultItem>("VaultItem", VaultItemSchema);
