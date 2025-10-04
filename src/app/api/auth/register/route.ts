import { hashPassword } from "@/lib/auth";
import crypto from 'crypto';
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  await connectDB();

  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { message: "Email and password are required" },
      { status: 400 }
    );
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return NextResponse.json(
      { message: "User already exists" },
      { status: 409 }
    );
  }

  const hashedPassword = await hashPassword(password);
  const saltBase64 = crypto.randomBytes(16).toString('base64');
  const newUser = new User({ email, password: hashedPassword, salt: saltBase64 });

  await newUser.save();

  return NextResponse.json(
    { message: "User registered successfully", user: { email: newUser.email }, salt: saltBase64 },
    { status: 201 }
  );
}
