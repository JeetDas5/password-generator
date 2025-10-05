import User from "@/models/User";
import { connectDB } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { generateToken, verifyPassword } from "@/lib/auth";
import crypto from 'crypto';
import speakeasy from 'speakeasy';
import { IUser } from "@/models/User";

export async function POST(request: NextRequest) {
  await connectDB();

  const { email, password, twoFactorCode } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { message: "Email and password are required" },
      { status: 400 }
    );
  }

  const user = await User.findOne({ email });

  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  const isValidPassword = await verifyPassword(password, user.password);

  if (!isValidPassword) {
    return NextResponse.json({ message: "Invalid password" }, { status: 401 });
  }

  // Check if 2FA is enabled
  if (user.twoFactorEnabled) {
    if (!twoFactorCode) {
      return NextResponse.json(
        { message: "2FA code required", requires2FA: true },
        { status: 200 }
      );
    }

    // Check if it's a backup code
    if (user.backupCodes && user.backupCodes.includes(twoFactorCode.toUpperCase())) {
      // Remove used backup code
      user.backupCodes = user.backupCodes.filter(code => code !== twoFactorCode.toUpperCase());
      await user.save();
    } else {
      // Verify TOTP code
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret!,
        encoding: "base32",
        token: twoFactorCode,
        window: 2,
      });

      if (!verified) {
        return NextResponse.json({ message: "Invalid 2FA code" }, { status: 401 });
      }
    }
  }

  const token = await generateToken(user);
  if(!token) {
    return NextResponse.json({ message: "Token generation failed" }, { status: 500 });
  }

  // Ensure user has a salt; if not, generate and persist one
  const userDoc = user as unknown as IUser;
  let saltBase64 = userDoc.salt;
  if (!saltBase64) {
    saltBase64 = crypto.randomBytes(16).toString('base64');
    userDoc.salt = saltBase64;
    await userDoc.save();
  }

  const res = NextResponse.json(
    { 
      message: "Login successful", 
      user: { 
        email: user.email,
        twoFactorEnabled: user.twoFactorEnabled 
      }, 
      token, 
      salt: saltBase64 
    },
    { status: 200 }
  );

  // Set HttpOnly cookie so middleware can read authentication server-side
  // cookie will last 7 days
  res.cookies.set("authToken", token, {
    httpOnly: true,
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return res;
}
