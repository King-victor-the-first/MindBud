
export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background">
      <main>{children}</main>
    </div>
  );
}
