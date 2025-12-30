import { GoogleGenerativeAI } from '@google/generative-ai';

export class ImageGeneratorService {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        // Using Gemini 2.0 Flash for image generation capabilities if available
        // Note: SDK support for image generation might differ, ensuring text-to-image prompt structure
        this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    }

    async generateImage(prompt: string): Promise<string> {
        try {
            // Using Pollinations.ai as "Nano Banana" free generation layer.
            // It allows generating images via URL without API key.
            console.log(`Generating image for prompt: ${prompt}`);
            const encodedPrompt = encodeURIComponent(prompt + " photorealistic, 8k, financial, cinematic lighting");
            const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=600&seed=${Math.floor(Math.random() * 1000)}`;
            return imageUrl;
        } catch (error) {
            console.error('Image generation failed', error);
            return 'https://via.placeholder.com/800x600?text=Financial+Chart';
        }
    }
}
