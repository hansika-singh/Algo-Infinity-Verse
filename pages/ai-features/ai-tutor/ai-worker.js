/**
 * ai-worker.js
 * The neural network thread
 * Runs entirely in the background thread. Loads the Hugging Face model
 * and generates text without freezing the user's browser UI.
 */

import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.16.0';

// Skip local file checks since we are running inside a web browser
env.allowLocalModels = false;

class PipelineSingleton {
    static task = 'text-generation';
    // Using a very small model (~150MB) suitable for browser tutorials. 
    // For production, you could upgrade to 'Xenova/TinyLlama-1.1B-Chat-v1.0'
    static model = 'Xenova/Qwen1.5-0.5B-Chat'; 
    static instance = null;

    static async getInstance(progress_callback = null) {
        if (this.instance === null) {
            this.instance = pipeline(this.task, this.model, { progress_callback });
        }
        return this.instance;
    }
}

// Listen for messages from the main thread (ai-tutor.js)
self.addEventListener('message', async (event) => {
    const { text, codeContext } = event.data;

    try {
        // 1. Load Model (Downloads via IndexedDB on first run, loads instantly after)
        const generator = await PipelineSingleton.getInstance(data => {
            self.postMessage({ status: data.status, data: data });
        });

        // Tell main thread we are ready
        self.postMessage({ status: 'ready' });

        // 2. Construct Prompt Template
        const prompt = `<|im_start|>system\nYou are an expert coding tutor. Review the user's code and answer their question clearly and concisely.\n\nCode Context:\n${codeContext}<|im_end|>\n<|im_start|>user\n${text}<|im_end|>\n<|im_start|>assistant\n`;

        // 3. Generate response with streaming callback
        const output = await generator(prompt, {
            max_new_tokens: 250,
            temperature: 0.7,
            repetition_penalty: 1.1,
            // Stream tokens back to the main thread one by one
            callback_function: x => {
                const generated_text = generator.tokenizer.decode(x[0].output_token_ids, { skip_special_tokens: true });
                // We slice off the original prompt text so the UI only shows the AI's reply
                const aiReply = generated_text.replace(prompt, '').trim();
                
                self.postMessage({
                    status: 'update',
                    output: aiReply
                });
            }
        });

        // 4. Signal completion
        self.postMessage({ status: 'complete' });

    } catch (error) {
        self.postMessage({ status: 'error', error: error.message });
    }
});
