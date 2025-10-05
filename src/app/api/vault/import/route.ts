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

    const { encryptedData, importPassword, mergeMode = false } = await request.json();

    if (!encryptedData || !importPassword) {
      return NextResponse.json({ message: "Import data and password are required" }, { status: 400 });
    }

    try {
      // Decrypt the import data
      const salt = Buffer.from(encryptedData.salt, 'hex');
      const key = crypto.scryptSync(importPassword, salt, 32);
      const decipher = crypto.createDecipher('aes256', key);
      
      let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      const importData = JSON.parse(decrypted);

      // Validate import data structure
      if (!importData.version || !importData.items) {
        return NextResponse.json({ message: "Invalid import file format" }, { status: 400 });
      }

      let importedFolders = 0;
      let importedItems = 0;
      const folderIdMap = new Map();

      // If not merge mode, we could optionally clear existing data
      // For now, we'll always merge

      // Import folders first
      if (importData.folders) {
        for (const folderData of importData.folders) {
          const existingFolder = await Folder.findOne({
            userId: decoded.id,
            name: folderData.name
          });

          if (!existingFolder) {
            const newFolder = new Folder({
              userId: decoded.id,
              name: folderData.name,
              color: folderData.color || "#3B82F6",
              icon: folderData.icon || "📁",
            });
            await newFolder.save();
            folderIdMap.set(folderData.id, newFolder._id.toString());
            importedFolders++;
          } else {
            folderIdMap.set(folderData.id, existingFolder._id.toString());
          }
        }
      }

      // Import vault items
      for (const itemData of importData.items) {
        // Check if item already exists (by title and username)
        const existingItem = await VaultItem.findOne({
          userId: decoded.id,
          title: itemData.title,
          'username.ciphertext': itemData.username?.ciphertext
        });

        if (!existingItem) {
          const newItem = new VaultItem({
            userId: decoded.id,
            title: itemData.title,
            username: itemData.username,
            password: itemData.password,
            url: itemData.url,
            notes: itemData.notes,
            tags: itemData.tags || [],
            folderId: itemData.folderId ? folderIdMap.get(itemData.folderId) : undefined,
            favorite: itemData.favorite || false,
          });
          await newItem.save();
          importedItems++;
        }
      }

      return NextResponse.json({
        message: "Import completed successfully",
        imported: {
          folders: importedFolders,
          items: importedItems,
        }
      });
    } catch (decryptError) {
      return NextResponse.json({ message: "Invalid import password or corrupted file" }, { status: 400 });
    }
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json({ message: "Import failed" }, { status: 500 });
  }
}