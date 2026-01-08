
import { GoogleGenAI, Modality } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt, mode } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

    if (mode === 'tts') {
      // Tối ưu cho Tiếng Việt: Sử dụng systemInstruction để định hình giọng đọc
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          systemInstruction: "Bạn là một giáo viên tiểu học người Việt Nam vui vẻ, ấm áp. Hãy đọc văn bản bằng tiếng Việt chuẩn, phát âm rõ ràng, nhịp điệu tự nhiên, truyền cảm để động viên trẻ em học toán.",
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              // Kore thường hỗ trợ đa ngôn ngữ tốt, bao gồm cả tiếng Việt
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      return res.status(200).json({ audio: audioData });
    } else {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: "Bạn là một trợ lý ảo hỗ trợ bé học toán lớp 1. Hãy đưa ra những câu khen ngợi hoặc động viên ngắn gọn, vui tươi, sử dụng từ ngữ gần gũi với trẻ em Việt Nam."
        }
      });

      return res.status(200).json({ text: response.text });
    }
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
