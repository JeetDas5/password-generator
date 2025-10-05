import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import Folder from "@/models/Folder";
import VaultItem from "@/models/VaultItem";
import { connectDB } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };

    const { name, color, icon } = await request.json();

    const folder = await Folder.findOneAndUpdate(
      { _id: params.id, userId: decoded.id },
      { name, color, icon },
      { new: true }
    );

    if (!folder) {
      return NextResponse.json({ message: "Folder not found" }, { status: 404 });
    }

    return NextResponse.json({ folder });
  } catch (error) {
    console.error("Update folder error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };

    // Remove folder reference from vault items
    await VaultItem.updateMany(
      { userId: decoded.id, folderId: params.id },
      { $unset: { folderId: 1 } }
    );

    const folder = await Folder.findOneAndDelete({
      _id: params.id,
      userId: decoded.id,
    });

    if (!folder) {
      return NextResponse.json({ message: "Folder not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Folder deleted successfully" });
  } catch (error) {
    console.error("Delete folder error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}