import { NextResponse, type NextRequest } from "next/server";
import { StrKey } from "@stellar/stellar-sdk";
import { BLEND_FAUCET_UPSTREAM } from "@/constants/stellar";

// Proxies the Blend testnet faucet, which doesn't send CORS headers.
// Returns the faucet's pre-signed transaction XDR for the user to co-sign.
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId") ?? "";
  if (!StrKey.isValidEd25519PublicKey(userId)) {
    return NextResponse.json({ error: "userId inválido" }, { status: 400 });
  }

  const upstream = await fetch(`${BLEND_FAUCET_UPSTREAM}?userId=${userId}`, { cache: "no-store" });
  const body = await upstream.text();
  return new NextResponse(body, {
    status: upstream.status,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
