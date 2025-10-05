import { connectDB } from "@/lib/db";
import VaultItem from "@/models/VaultItem";
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  await connectDB();

  const body = await request.json();
  const { title, username, password, url, notes, tags, folderId, favorite } = body;

  if (!title || !username || !password) {
    return NextResponse.json(
      { message: "title, username, and password are required" },
      { status: 400 }
    );
  }

  // Authenticate via Authorization header
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ message: "Authorization header required" }, { status: 401 });
  }
  const token = authHeader.split(" ")[1];
  type TokenPayload = { id: string; email?: string };
  let payload: TokenPayload;
  try {
    payload = verifyToken(token) as TokenPayload;
  } catch {
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }

  const userId = payload.id;

  const newVaultItem = await VaultItem.create({
    userId,
    title,
    username,
    password,
    url,
    notes,
    tags: tags || [],
    folderId: folderId && folderId !== "" ? folderId : null,
    favorite: favorite || false,
  });
  if (!newVaultItem) {
    return NextResponse.json(
      { message: "Failed to create vault item" },
      { status: 500 }
    );
  }
  return NextResponse.json(
    { message: "Vault item created successfully", vaultItem: newVaultItem },
    { status: 201 }
  );
}
