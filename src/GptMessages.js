class GptMessages {

    messages = [];

    #addMessage(role, content) {
        this.messages.push({
            role: role,
            content: content
        });
    }

    addSystemMessage(content) {
        this.#addMessage('system', content);
        return this;
    }

    addUserMessage(content) {
        this.#addMessage('user', content);
        return this;
    }

    addAssistantMessage(content) {
        this.#addMessage('assistant', content);
        return this;
    }

}

module.exports = GptMessages;