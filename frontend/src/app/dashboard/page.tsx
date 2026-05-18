import AppLayout from '@/components/AppLayout';
import DashboardHeader from './components/DashboardHeader';
import KPIBentoGrid from './components/KPIBentoGrid';
import RevenueChart from './components/RevenueChart';
import OccupancyChart from './components/OccupancyChart';
import AlertPanel from './components/AlertPanel';
import ActivityFeed from './components/ActivityFeed';

// Backend integration point: Fetch dashboard aggregates from /api/dashboard/stats
// Backend integration point: Fetch recent activity from /api/activity?limit=8
// Backend integration point: Fetch expiring contracts from /api/contracts?expiringWithin=30

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="fade-in">
        <DashboardHeader />

        {/* KPI Bento Grid */}
        <section className="mb-6">
          <KPIBentoGrid />
        </section>

        {/* Revenue & Occupancy Charts */}
        <section className="mb-6">
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
            <div className="xl:col-span-3">
              <RevenueChart />
            </div>
            <div className="xl:col-span-2">
              <OccupancyChart />
            </div>
          </div>
        </section>

        {/* Alert Panel */}
        <section className="mb-6">
          <AlertPanel />
        </section>

        {/* Activity Feed */}
        <section>
          <ActivityFeed />
        </section>
      </div>
    </AppLayout>
  );
}