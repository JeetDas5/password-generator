import { NextResponse } from "next/server";
import VaultItem from "@/models/VaultItem";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  await connectDB();
  const { id } = await params;

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Authorization header required" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    type TokenPayload = { id: string; email?: string };
    let payload: TokenPayload;
    try {
      payload = verifyToken(token) as TokenPayload;
      if(!payload) return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    } catch {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    const body = await req.json();
    const { title, username, password, url, notes } = body;

    if (!title || !username || !password) {
      return NextResponse.json(
        { message: "title, username, and password are required" },
        { status: 400 }
      );
    }

    console.log(decoded);

    // Update vault entry
    const updated = await VaultItem.findOneAndUpdate(
      { _id: id, userId: decoded.id },
      { title, username, password, url, notes },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { error: "Item not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Item updated", item: updated });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
}
