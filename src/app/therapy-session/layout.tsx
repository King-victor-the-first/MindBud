export default function TherapySessionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background">
      {/* This layout provides a clean slate, removing the main sidebar and navbars */}
      <main>{children}</main>
    </div>
  );
}
