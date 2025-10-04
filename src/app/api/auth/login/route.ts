import User from "@/models/User";
import { connectDB } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { generateToken, verifyPassword } from "@/lib/auth";
import crypto from 'crypto';
import { IUser } from "@/models/User";

export async function POST(request: NextRequest) {
  await connectDB();

  const { email, password } = await request.json();

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

  return NextResponse.json(
    { message: "Login successful", user: { email: user.email }, token, salt: saltBase64 },
    { status: 200 }
  );
}
