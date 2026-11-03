import "./globals.css";

export const metadata = {
  title: "Artemis — Life cover, made clearer",
  description:
    "We’re building a clearer way to compare life insurance in Australia.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-AU">
      <body>{children}</body>
    </html>
  );
}
