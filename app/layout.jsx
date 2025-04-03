export const metadata = {
  title: "Ihram AI",
  description: "Your Pilgrimage Companion",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
