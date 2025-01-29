import React from "react";
import PromptSuggestionButton from "./PromptSuggestionButton";

const PromptSuggestionsRow = ({ onPromptClick }) => {
  const prompts = [
    "Suggest a chord progression in Lo-fi style for a chill vibe",
    "How do I clean up muddy frequencies in a mix?",
    "Suggest a basic mastering chain for a radio-ready sound",
    "Explain how sidechain compression works and how to set it up in FL studio",
  ];
  return (
    <div className="prompt-suggestion-row">
      {prompts.map((prompt, index) => (
        <PromptSuggestionButton
          key={`suggestion-${index}`}
          text={prompt}
          onClick={() => onPromptClick(prompt)}
        />
      ))}
    </div>
  );
};

export default PromptSuggestionsRow;
