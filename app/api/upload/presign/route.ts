// app/api/upload/presign/route.ts
// Returns a presigned S3 PUT URL for direct browser uploads
import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { getSession } from "@/lib/auth/session";

const REGION = process.env.AWS_REGION ?? "ap-south-1";
const BUCKET = process.env.AWS_S3_BUCKET ?? "";
const KEY_ID = process.env.AWS_ACCESS_KEY_ID ?? "";
const SECRET = process.env.AWS_SECRET_ACCESS_KEY ?? "";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

function isConfigured() {
  return (
    BUCKET && KEY_ID && SECRET &&
    KEY_ID !== "your-access-key" &&
    SECRET !== "your-secret-key"
  );
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isConfigured()) {
    return NextResponse.json(
      { error: "Image upload via S3 is not configured. Please paste an image URL instead.", notConfigured: true },
      { status: 503 }
    );
  }

  const { contentType, folder = "uploads" } = await req.json();

  if (!ALLOWED_TYPES.includes(contentType)) {
    return NextResponse.json({ error: "File type not allowed. Use JPEG, PNG, or WebP." }, { status: 400 });
  }

  const s3 = new S3Client({
    region: REGION,
    credentials: { accessKeyId: KEY_ID, secretAccessKey: SECRET },
  });

  const key    = `${folder}/${randomUUID()}.${contentType.split("/")[1]}`;
  const command = new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         key,
    ContentType: contentType,
    ContentLength: MAX_SIZE_BYTES,
    ACL:         "public-read" as never,
  });

  const uploadUrl  = await getSignedUrl(s3, command, { expiresIn: 300 });
  const publicUrl  = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;

  return NextResponse.json({ uploadUrl, publicUrl });
}
