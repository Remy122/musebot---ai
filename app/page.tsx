"use client";
import { useChat } from "ai/react";
import { Message } from "ai";
import "./global.css";
import PromptSuggestionsRow from "./components/PromptSuggestionsRow";
import Bubbles from "./components/Bubbles";
import LoadBubble from "./components/LoadBubble";

const Home = () => {
  const {
    append,
    isLoading,
    messages,
    input,
    handleInputChange,
    handleSubmit,
  } = useChat();

  const noMessages = !messages || messages.length === 0;
  const handlePrompt = (promptText) => {
    const msg: Message = {
      id: crypto.randomUUID(),
      content: promptText,
      role: "user",
    };
    append(msg);
  };
  return (
    <main>
      <section className={noMessages ? "" : "populated"}>
        {noMessages ? (
          <>
            <p className="starter-text">
              MuseBot is an AI-powered chatbot designed specifically for music
              producers to streamline creativity and enhance workflow. Whether
              you're looking for fresh ideas, need help with chord progressions,
              or want to fine-tune your mix, MuseBot is here to collaborate with
              you every step of the way.
            </p>
            <br />
            <PromptSuggestionsRow onPromptClick={handlePrompt} />
          </>
        ) : (
          <>
            {messages.map((message, index) => (
              <Bubbles key={`message-${index}`} message={message} />
            ))}
            {isLoading && <LoadBubble />}
          </>
        )}
      </section>
      <form onSubmit={handleSubmit}>
        <input
          className="question-box"
          onChange={handleInputChange}
          value={input}
          placeholder="Ask me something..."
        />
        <input type="submit" />
      </form>
    </main>
  );
};

export default Home;
