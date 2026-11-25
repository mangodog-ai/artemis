import "./globals.css";

export const metadata = {
  title: "Artemis Projects",
  description: "Choose a project workspace from Artemis.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-AU">
      <body>{children}</body>
    </html>
  );
}
