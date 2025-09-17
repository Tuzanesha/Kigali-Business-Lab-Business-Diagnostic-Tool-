import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';

// Reusable component for the header of each page inside the app
const PageHeader = ({ title }: { title: string }) => (
  <div className="flex justify-between items-center mb-6">
    <h1 className="font-heading text-4xl text-kbl-deep">{title}</h1>
    <Button>
      <PlusCircle className="mr-2 h-5 w-5" />
      Start New Assessment
    </Button>
  </div>
);

// Reusable component for the small stat cards
const StatCard = ({
  value,
  label,
  valueColor = 'text-kbl-primary',
}: {
  value: string;
  label: string;
  valueColor?: string;
}) => (
  <div className="bg-white p-4 rounded-lg text-center shadow-sm border">
    <p className={`font-heading text-4xl ${valueColor}`}>{value}</p>
    <p className="text-xs text-gray-500 mt-1">{label}</p>
  </div>
);

export default function DashboardPage() {
  return (
    <div>
      <PageHeader title="Dashboard" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Main Dashboard Card */}
        <Card className="lg:col-span-3 p-6">
          <CardHeader className="p-0 mb-6">
            <CardTitle className="font-heading text-lg uppercase tracking-wider text-kbl-dark">
              Latest Assessment Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* You can map over real data here later */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <p>Leadership Assessment</p>
                <div className="w-1/3 bg-slate-200 rounded-full h-2">
                  <div className="bg-kbl-primary h-2 rounded-full w-[80%]"></div>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <p>Financial Health</p>
                <div className="w-1/3 bg-slate-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full w-[92%]"></div>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <p>Market Position</p>
                <div className="w-1/3 bg-slate-200 rounded-full h-2">
                  <div className="bg-orange-400 h-2 rounded-full w-[65%]"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Small Stat Cards Column */}
        <div className="space-y-6">
          <StatCard value="87%" label="Overall Health Score" />
          <StatCard value="12" label="Opportunities" valueColor="text-green-500" />
          <StatCard value="3" label="Critical Areas" valueColor="text-red-500" />
        </div>
      </div>
    </div>
  );
}