import React from "react";

const PromptSuggestionButton = ({ text, onClick }) => {
  return (
    <button className="prompt-suggestion-button on" onClick={onClick}>
      {text}
    </button>
  );
};

export default PromptSuggestionButton;
