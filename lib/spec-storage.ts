import { get } from "@vercel/blob";

export async function fetchSpecMarkdown(
  filePath: string,
): Promise<string | null> {
  try {
    const result = await get(filePath, {
      access: "private",
      useCache: false,
    });
    if (!result || result.statusCode !== 200) return null;
    return await new Response(result.stream).text();
  } catch {
    return null;
  }
}
