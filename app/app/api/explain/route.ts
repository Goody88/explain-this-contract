import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let text = "";
  if (file.name.endsWith(".pdf")) {
    const parsed = await pdfParse(buffer);
    text = parsed.text;
  } else if (file.name.endsWith(".docx")) {
    const { value } = await mammoth.extractRawText({ buffer });
    text = value;
  } else if (file.name.endsWith(".txt")) {
    text = buffer.toString("utf-8");
  } else {
    return NextResponse.json({ result: "Unsupported file type." }, { status: 400 });
  }

  const prompt = `Explain the following legal contract in plain English. 
Highlight any red flags, unusual clauses, or anything the signer should be cautious of. 
Use the format [RED FLAG] before any risky or concerning clauses. Keep the rest conversational.

"""
${text}
"""`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.4,
  });

  const result = completion.choices[0].message.content;

  return NextResponse.json({ result });
}
