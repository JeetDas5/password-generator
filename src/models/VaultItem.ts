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
}

const FieldSchema: Schema = new Schema<EncryptedField>({
  ciphertext: { type: String, required: true },
  iv: { type: [Number], required: true },
});

const VaultItemSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: FieldSchema,
    username: FieldSchema,
    password: FieldSchema,
    url: FieldSchema,
    notes: FieldSchema,
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.VaultItem ||
  mongoose.model<IVaultItem>("VaultItem", VaultItemSchema);
