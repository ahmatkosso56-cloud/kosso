import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

type Params = Promise<{ pageName: string }>;

export async function GET(
  req: NextRequest,
  context: { params: Params }
) {
  try {
    const { pageName } = await context.params;

    const base =
      process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
    const target = `${base}/page/${encodeURIComponent(pageName)}`;

    const pngBuffer = await QRCode.toBuffer(target, {
      type: "png",
      width: 1024,
      margin: 2,
      color: { dark: "#000000", light: "#FFFFFF" },
    });
    const pngBytes = new Uint8Array(pngBuffer);

    return new NextResponse(pngBytes, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "QR generation failed" },
      { status: 500 }
    );
  }
}
