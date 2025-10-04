import { connectDB } from "@/lib/db";
import VaultItem from "@/models/VaultItem";
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  await connectDB();
  // Expect Authorization: Bearer <token>
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
  const vaultItems = await VaultItem.find({ userId });
  return NextResponse.json(
    {
      message: "Vault items fetched successfully",
      vaultItems,
    },
    { status: 200 }
  );
}
