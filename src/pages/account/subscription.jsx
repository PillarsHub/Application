import React from "react";
import PageHeader from "../../components/pageHeader";
import { useFetch } from "../../hooks/useFetch";
import DataLoading from "../../components/dataLoading";
import DataError from "../../components/dataError";
import useToken from "../../features/authentication/hooks/useToken.jsx";

const tiers = [
  { name: "Developer", base: 0, percent: 0, min: 0, max: 20000, maxNodes: 100, maxEnv: 2, maxApi: 20000, maxWebHook: 1000 },
  { name: "Starter", base: 3500, percent: 1.5, min: 20001, max: 100000, maxNodes: 100000, maxEnv: 5, maxApi: 500000, maxWebHook: 20000 },
  { name: "Business", base: 6000, percent: 1.25, min: 100001, max: 250000, maxNodes: 500000, maxEnv: 10, maxApi: 2000000, maxWebHook: 100000 },
  { name: "Professional", base: 12000, percent: 1.0, min: 250001, max: Infinity, maxNodes: Infinity, maxEnv: 20, maxApi: Infinity, maxWebHook: Infinity },
];

const formatLimit = (value) => (value === Infinity ? "Unlimited" : value.toLocaleString());

const formatUsage = (used, limit) => {
  if (limit === Infinity) return "Unlimited";
  return `${used.toLocaleString()} / ${limit.toLocaleString()}`;
};

const getUsagePercent = (used, limit) => {
  if (!limit || limit === Infinity) return 0;
  return Math.min((used / limit) * 100, 100);
};

const getPlanFromToken = (token) => {
  const raw = token?.planName || token?.subscription?.planName || token?.billing?.planName || "";
  return String(raw).toLowerCase();
};

const getTierFromUsage = (requestCount) => {
  return tiers.find((tier) => requestCount >= tier.min && requestCount <= tier.max) || tiers[tiers.length - 1];
};

export default function Subscription() {
  const today = new Date();
  const beginningOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const tenDaysAgo = new Date();
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 31);
  const startDate = beginningOfMonth > tenDaysAgo ? beginningOfMonth : tenDaysAgo;

  const { token } = useToken();
  const { loading: envLoading, error: envError, data: environments } = useFetch("/api/v1/Environments", {}, []);
  const { loading: statsLoading, error: statsError, data: statsData } = useFetch("/api/v1/Logs/stats", { date: startDate.toISOString() }, []);

  if (envLoading || statsLoading) return <DataLoading />;
  if (envError) return <DataError error={envError} />;
  if (statsError) return <DataError error={statsError} />;

  const monthlyStats = (statsData || []).filter((item) => new Date(item.date) >= beginningOfMonth);
  const totalRequests = monthlyStats.reduce((sum, item) => sum + (item.callCount || 0), 0);
  const avgResponseTime = monthlyStats.length
    ? Math.round(monthlyStats.reduce((sum, item) => sum + (item.averageResponseTime || 0), 0) / monthlyStats.length)
    : 0;

  const environmentCount = (environments || []).length;
  const tokenPlanName = getPlanFromToken(token);
  const inferredTier = getTierFromUsage(totalRequests);
  const currentTier = tiers.find((tier) => tier.name.toLowerCase() === tokenPlanName) || inferredTier;

  const apiPercent = getUsagePercent(totalRequests, currentTier.maxApi);
  const envPercent = getUsagePercent(environmentCount, currentTier.maxEnv);

  return (
    <PageHeader title="Subscription" preTitle="Account">
      <div className="page-body">
        <div className="container-xl">
          <div className="row row-deck row-cards">
            <div className="col-12">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex flex-wrap gap-3 align-items-start">
                    <div className="me-auto">
                      <div className="text-muted text-uppercase">Current Plan</div>
                      <h2 className="mb-1">{currentTier.name}</h2>
                      <div className="text-muted">
                        ${currentTier.base.toLocaleString()} base + {currentTier.percent}% of commissions
                      </div>
                    </div>
                    <div className="d-flex gap-2">
                      <a href="/account/invoices" className="btn btn-outline-primary">View Invoices</a>
                      <a href="/account/invoices" className="btn btn-primary">Manage Billing</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="subheader">API requests this period</div>
                    <div className="ms-auto lh-1 text-muted">{formatUsage(totalRequests, currentTier.maxApi)}</div>
                  </div>
                  <div className="h1 mb-2">{totalRequests.toLocaleString()}</div>
                  <div className="progress progress-sm">
                    <div className="progress-bar bg-blue" style={{ width: `${apiPercent}%` }} role="progressbar" />
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="subheader">Environments</div>
                    <div className="ms-auto lh-1 text-muted">{formatUsage(environmentCount, currentTier.maxEnv)}</div>
                  </div>
                  <div className="h1 mb-2">{environmentCount.toLocaleString()}</div>
                  <div className="progress progress-sm">
                    <div className="progress-bar bg-green" style={{ width: `${envPercent}%` }} role="progressbar" />
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12">
              <div className="card">
                <div className="table-responsive">
                  <table className="table table-vcenter card-table">
                    <thead>
                      <tr>
                        <th>Metric</th>
                        <th>Current Usage</th>
                        <th>{currentTier.name} Limit</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>API requests (this month)</td>
                        <td>{totalRequests.toLocaleString()}</td>
                        <td>{formatLimit(currentTier.maxApi)}</td>
                        <td>
                          {currentTier.maxApi === Infinity || totalRequests <= currentTier.maxApi
                            ? <span className="badge bg-success-lt">Within plan</span>
                            : <span className="badge bg-danger-lt">Over limit</span>}
                        </td>
                      </tr>
                      <tr>
                        <td>Environments</td>
                        <td>{environmentCount.toLocaleString()}</td>
                        <td>{formatLimit(currentTier.maxEnv)}</td>
                        <td>
                          {currentTier.maxEnv === Infinity || environmentCount <= currentTier.maxEnv
                            ? <span className="badge bg-success-lt">Within plan</span>
                            : <span className="badge bg-danger-lt">Over limit</span>}
                        </td>
                      </tr>
                      <tr>
                        <td>Avg response time (this month)</td>
                        <td>{avgResponseTime.toLocaleString()} ms</td>
                        <td>Not plan limited</td>
                        <td><span className="badge bg-secondary-lt">Informational</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="col-12">
              <div className="card">
                <div className="table-responsive">
                  <table className="table table-vcenter table-bordered table-nowrap card-table">
                    <thead>
                      <tr>
                        <th>Plan</th>
                        <th className="text-center">Base</th>
                        <th className="text-center">Commission Rate</th>
                        <th className="text-center">API Calls / Month</th>
                        <th className="text-center">Environments</th>
                        <th className="text-center">Customer Records</th>
                        <th className="text-center">Webhook Messages</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tiers.map((tier) => {
                        const isCurrent = tier.name === currentTier.name;

                        return (
                          <tr key={tier.name} className={isCurrent ? "table-success" : ""}>
                            <td>
                              <div className="fw-bold">{tier.name}</div>
                              {isCurrent && <div className="text-success small">Current plan</div>}
                            </td>
                            <td className="text-center">${tier.base.toLocaleString()}</td>
                            <td className="text-center">{tier.percent}%</td>
                            <td className="text-center">{formatLimit(tier.maxApi)}</td>
                            <td className="text-center">{formatLimit(tier.maxEnv)}</td>
                            <td className="text-center">{formatLimit(tier.maxNodes)}</td>
                            <td className="text-center">{formatLimit(tier.maxWebHook)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageHeader>
  );
}
