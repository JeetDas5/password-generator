import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import Folder from "@/models/Folder";
import { connectDB } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };

    const folders = await Folder.find({ userId: decoded.id }).sort({ name: 1 });

    return NextResponse.json({ folders });
  } catch (error) {
    console.error("Get folders error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };

    const { name, color, icon } = await request.json();

    if (!name) {
      return NextResponse.json({ message: "Folder name is required" }, { status: 400 });
    }

    const folder = new Folder({
      userId: decoded.id,
      name,
      color: color || "#3B82F6",
      icon: icon || "📁",
    });

    await folder.save();

    return NextResponse.json({ folder }, { status: 201 });
  } catch (error) {
    console.error("Create folder error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}