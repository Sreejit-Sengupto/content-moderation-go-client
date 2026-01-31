import { getUploadAuthParams } from "@imagekit/next/server";

export async function GET() {
    try {
        const { token, expire, signature } = getUploadAuthParams({
            privateKey: process.env.IMAGEKIT_PRIVATE_KEY as string,
            publicKey: process.env.NEXT_PUBLIC_PUBLIC_KEY as string,
            // expire: 60 * 30, // 30 minutes
        });

        return Response.json({ token, expire, signature });
    } catch (error) {
        return Response.json(
            { error: "Authentication failed" },
            { status: 500 }
        );
    }
}
