import "./global.css";

export const metadata = {
  title: "MuseLearn",
  description: "Your AI assistant for all things music production!",
};

const RootLayout = ({ children }) => {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
};

export default RootLayout;
