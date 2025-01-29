import React from "react";

const Bubbles = ({ message }) => {
  const { content, role } = message;
  return <div className={`${role} bubble`}>{content}</div>;
};

export default Bubbles;
