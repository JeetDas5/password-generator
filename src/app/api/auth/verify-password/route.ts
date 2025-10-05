import { NextRequest, NextResponse } from "next/server";
import { verifyToken, verifyPassword } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token) as { id: string };

    const { password } = await req.json();
    if (!password) {
      return NextResponse.json({ message: "Password is required" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const isValidPassword = await verifyPassword(password, user.password);
    
    if (!isValidPassword) {
      return NextResponse.json({ message: "Invalid password" }, { status: 401 });
    }

    return NextResponse.json({ 
      message: "Password verified", 
      salt: user.salt 
    });
  } catch (error) {
    console.error("Password verification error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}