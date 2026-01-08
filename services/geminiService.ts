
/**
 * Utility to decode base64 strings (Browser compatible)
 */
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decodes raw PCM data into an AudioBuffer for playback
 */
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

/**
 * Generates and plays Vietnamese speech via the secure proxy endpoint.
 */
export const speakWithGemini = async (text: string) => {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: `Say in a warm, encouraging, child-friendly Vietnamese voice: ${text}`,
        mode: 'tts'
      }),
    });

    if (!response.ok) throw new Error('API request failed');
    
    const json = await response.json();
    const base64Audio = json.audio;
    
    if (!base64Audio) return;

    const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const audioBuffer = await decodeAudioData(
      decode(base64Audio),
      outputAudioContext,
      24000,
      1,
    );
    const source = outputAudioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(outputAudioContext.destination);
    source.start();
  } catch (error) {
    console.error("Gemini TTS Proxy Error:", error);
    // Fallback to browser TTS
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = 'vi-VN';
    msg.rate = 0.9;
    window.speechSynthesis.speak(msg);
  }
};

/**
 * Gets a fun, encouraging feedback message for kids in Vietnamese via the secure proxy endpoint.
 */
export const getEncouragement = async (isSuccess: boolean): Promise<string> => {
  try {
    const prompt = isSuccess 
      ? "Tạo một câu khen ngợi ngắn gọn, vui vẻ cho bé vừa làm đúng phép tính cộng (dưới 10 chữ)."
      : "Tạo một câu động viên nhẹ nhàng cho bé khi làm sai phép tính, bảo bé thử lại hoặc cùng đếm (dưới 10 chữ).";
      
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: prompt,
        mode: 'text'
      }),
    });

    if (!response.ok) throw new Error('API request failed');

    const json = await response.json();
    return json.text?.trim() || (isSuccess ? "Giỏi quá!" : "Cố lên con nhé!");
  } catch (err) {
    console.error("Gemini Encouragement Error:", err);
    return isSuccess ? "Con thật là tuyệt vời!" : "Đừng buồn, cùng đếm lại nhé!";
  }
};
