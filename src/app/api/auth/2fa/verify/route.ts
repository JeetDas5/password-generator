import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";
import User from "@/models/User";
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
    
    const { code } = await request.json();
    
    const user = await User.findById(decoded.id);
    if (!user || !user.twoFactorSecret) {
      return NextResponse.json({ message: "2FA not set up" }, { status: 400 });
    }

    // Verify the TOTP code
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: code,
      window: 2,
    });

    if (!verified) {
      return NextResponse.json({ message: "Invalid code" }, { status: 400 });
    }

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () => 
      crypto.randomBytes(4).toString("hex").toUpperCase()
    );

    // Enable 2FA
    user.twoFactorEnabled = true;
    user.backupCodes = backupCodes;
    await user.save();

    return NextResponse.json({
      message: "2FA enabled successfully",
      backupCodes,
    });
  } catch (error) {
    console.error("2FA verification error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}