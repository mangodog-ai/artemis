import "./globals.css";

export const metadata = {
  title: "Artemis",
  description: "Artemis tools for clearer decisions.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-AU">
      <body>{children}</body>
    </html>
  );
}
