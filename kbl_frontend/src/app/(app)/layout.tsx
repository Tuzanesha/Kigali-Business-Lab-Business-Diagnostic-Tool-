import { Sidebar } from '@/components/layout/sidebar'; // We will create this next

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 bg-slate-100 p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}