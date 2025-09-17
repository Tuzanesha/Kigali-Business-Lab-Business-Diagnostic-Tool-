import { Sidebar } from '..//../components/layout/sidebar'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // This div creates the two-column layout
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <main className="flex-1 p-6 md:p-8">
        {/* Your DashboardPage component will be rendered here as 'children' */}
        {children}
      </main>
    </div>
  );
}