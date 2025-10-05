import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import User from "@/models/User";
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
    
    const user = await User.findById(decoded.id).select("-password -twoFactorSecret -backupCodes");
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      email: user.email,
      twoFactorEnabled: user.twoFactorEnabled,
    });
  } catch (error) {
    console.error("Get user info error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}