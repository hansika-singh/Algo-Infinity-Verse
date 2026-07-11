/**
 * voice-worker.js
 * Background Thread
 * Runs the Hugging Face Transformers.js LLM in the background.
 * Processes interview history and generates the next conversational response.
 */

import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.16.0';

env.allowLocalModels = false;

class InterviewPipeline {
    static task = 'text-generation';
    static model = 'Xenova/Qwen1.5-0.5B-Chat'; 
    static instance = null;

    static async getInstance() {
        if (this.instance === null) {
            this.instance = pipeline(this.task, this.model);
        }
        return this.instance;
    }
}

// Initial load request
InterviewPipeline.getInstance().then(() => {
    self.postMessage({ status: 'ready' });
});

self.addEventListener('message', async (event) => {
    // Security: Validate message origin
    if (event.origin && event.origin !== self.location.origin) {
        void 0;
        return;
    }

    const { history } = event.data;

    try {
        const generator = await InterviewPipeline.getInstance();

        // Construct the prompt mapping the conversation history
        let promptText = `<|im_start|>system\nYou are a Senior Software Engineer at a top tech company conducting a technical interview. You are evaluating the candidate on System Design. Keep your responses conversational, concise, and focused on asking one follow-up question at a time based on what the candidate just said. Do not write code for them.<|im_end|>\n`;
        
        // Append history
        history.forEach(line => {
            if (line.startsWith('Interviewer:')) {
                promptText += `<|im_start|>assistant\n${line.replace('Interviewer: ', '')}<|im_end|>\n`;
            } else if (line.startsWith('Candidate:')) {
                promptText += `<|im_start|>user\n${line.replace('Candidate: ', '')}<|im_end|>\n`;
            }
        });
        
        promptText += `<|im_start|>assistant\n`;

        // Generate response (Wait for full response since TTS needs complete sentences)
        const result = await generator(promptText, {
            max_new_tokens: 60, // Keep responses short for verbal conversation
            temperature: 0.7,
            repetition_penalty: 1.1
        });

        // Extract just the newly generated text
        const generated_text = result[0].generated_text;
        const aiReply = generated_text.replace(promptText, '').split('<|im_end|>')[0].trim();
        
        self.postMessage({
            status: 'complete',
            output: aiReply
        });

    } catch (error) {
        self.postMessage({ status: 'error', error: error.message });
    }
});
