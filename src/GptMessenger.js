const axios = require('axios');
const GptMessages = require("./GptMessages");
const path = require('path');
require('dotenv').config({path: __dirname.replace('\\src', '') + "/.env"});

class GptMessenger {

    constructor() {
        this.API_KEY = process.env.OPENAI_API_KEY;
    }

    /**
     * Makes an API request to OpenAI's GPT-3.5 TURBO API
     * @param messages {GptMessages}
     * @returns {Promise<void>}
     */
    async makeApiRequest(messages) {
        try {
            const response = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: 'gpt-3.5-turbo',
                    max_tokens: 125,
                    messages: messages.messages,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${this.API_KEY}`
                    },
                }
            )

            return response.data.choices[0].message.content;
        } catch (e) {
            console.log(e);
            return null;
        }
    }

    async measureAggressiveness(message) {
        const messages = new GptMessages()
            .addSystemMessage(`Your task is to evaluate the level of aggressiveness in the messages that will be provided to you. You will rate each message on a scale of 1 to 10, where 1 signifies the least aggressive and 10 signifies the most aggressive. After rating each message, provide a brief explanation to justify your rating. If you encounter a message that you cannot analyze, rate it as 10 and explain why you were unable to analyze it. The results should be returned in the following JSON format: \`{"rating": 1, "explanation": "The reasoning here"}\`. Please remember to adhere to this format for all your responses`)
            .addAssistantMessage("OK. I will analyze the aggressiveness and use the provided JSON format.")
            .addUserMessage("```\n" + message + "\n```");

        return await this.makeApiRequest(messages);
    }


}

module.exports = GptMessenger;