import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import VaultItem from "@/models/VaultItem";
import Folder from "@/models/Folder";
import { connectDB } from "@/lib/db";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };

    const { exportPassword } = await request.json();

    if (!exportPassword) {
      return NextResponse.json({ message: "Export password is required" }, { status: 400 });
    }

    // Get all vault items and folders
    const [vaultItems, folders] = await Promise.all([
      VaultItem.find({ userId: decoded.id }).populate('folderId'),
      Folder.find({ userId: decoded.id })
    ]);

    // Prepare export data
    const exportData = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      folders: folders.map(folder => ({
        id: folder._id.toString(),
        name: folder.name,
        color: folder.color,
        icon: folder.icon,
      })),
      items: vaultItems.map(item => ({
        id: item._id.toString(),
        title: item.title,
        username: item.username,
        password: item.password,
        url: item.url,
        notes: item.notes,
        tags: item.tags,
        folderId: item.folderId?.toString(),
        favorite: item.favorite,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
    };

    // Encrypt the export data using AES-256-GCM (authenticated)
    const algorithm = 'aes-256-gcm';
    const salt = crypto.randomBytes(16);
    const key = crypto.scryptSync(exportPassword, salt, 32);
    const iv = crypto.randomBytes(12); // 12 bytes is recommended for GCM

    // createCipheriv expects algorithm, key, iv
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    const plaintext = JSON.stringify(exportData);
    const encryptedBuffers: Buffer[] = [];
    encryptedBuffers.push(cipher.update(plaintext, 'utf8'));
    encryptedBuffers.push(cipher.final());
    const encrypted = Buffer.concat(encryptedBuffers).toString('hex');

    // GCM provides an auth tag which is required for decryption/verification
    const authTag = cipher.getAuthTag();

    const encryptedExport = {
      algorithm: algorithm,
      salt: salt.toString('hex'),
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      data: encrypted,
    };

    return NextResponse.json({
      exportData: encryptedExport,
      filename: `securevault-export-${new Date().toISOString().split('T')[0]}.json`
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ message: "Export failed" }, { status: 500 });
  }
}