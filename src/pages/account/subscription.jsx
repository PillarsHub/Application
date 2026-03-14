import React from "react";
import PageHeader from "../../components/pageHeader";
import { useFetch } from "../../hooks/useFetch";
import DataLoading from "../../components/dataLoading";
import DataError from "../../components/dataError";

const formatLimit = (value) => (value === Infinity ? "Unlimited" : value.toLocaleString());

const formatCurrencyValue = (value) => `$${value.toLocaleString()}`;

const formatCurrencyCap = (value) => (value === Infinity ? "Unlimited" : `Up to $${value.toLocaleString()}`);

const formatCurrencyUsage = (used, limit) => {
  if (used == null) return `Usage unavailable / ${formatCurrencyCap(limit)}`;
  if (limit === Infinity) return "Unlimited";
  return `${formatCurrencyValue(used)} / ${formatCurrencyValue(limit)}`;
};

const formatUsage = (used, limit) => {
  if (limit === Infinity) return "Unlimited";
  return `${used.toLocaleString()} / ${limit.toLocaleString()}`;
};

const getUsagePercent = (used, limit) => {
  if (!limit || limit === Infinity) return 0;
  return Math.min((used / limit) * 100, 100);
};

const normalizeLimit = (value) => (value == null ? Infinity : value);

export default function Subscription() {
  const { loading, error, data: subscriptionData } = useFetch("/api/v1/Subscription", {}, {});

  if (loading) return <DataLoading />;
  if (error) return <DataError error={error} />;

  const usage = subscriptionData?.usage ?? {};
  const pricing = subscriptionData?.pricing ?? {};
  const limits = subscriptionData?.limits ?? {};

  const totalRequests = usage.apiCount ?? 0;
  const avgResponseTime = usage.averageResponseTimeMs ?? 0;
  const environmentCount = usage.totalEnvironments ?? 0;
  const monthlyCommissionsGenerated = usage.totalCommissions ?? 0;
  const totalCustomers = usage.totalCustomers ?? 0;
  const totalWebhookMessages = usage.webhookCount ?? 0;
  const currentTierName = subscriptionData.currentTierName;
  const currentBase = pricing.baseMonthlyFee;
  const currentPercent = pricing.commissionRatePercent;
  const currentApiLimit = normalizeLimit(limits.apiCount);
  const currentEnvironmentLimit = normalizeLimit(limits.totalEnvironments);
  const currentCommissionLimit = normalizeLimit(limits.monthlyCommissionCap);
  const currentCustomerLimit = normalizeLimit(limits.totalCustomers);
  const currentWebhookLimit = normalizeLimit(limits.webhookCount);

  const apiPercent = getUsagePercent(totalRequests, currentApiLimit);
  const envPercent = getUsagePercent(environmentCount, currentEnvironmentLimit);
  const commissionPercent = getUsagePercent(monthlyCommissionsGenerated ?? 0, currentCommissionLimit);

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
                      <h2 className="mb-1">{currentTierName}</h2>
                      <div className="text-muted">
                        ${currentBase.toLocaleString()} base + {currentPercent}% of commissions
                      </div>
                    </div>
	                    <div className="d-flex gap-2">
	                      <a href="/account/invoices" className="btn btn-outline-primary">View Invoices</a>
	                      <a href="/account/pricing-tiers" className="btn btn-primary">Pricing &amp; Tiers</a>
	                    </div>
	                  </div>
	                </div>
              </div>
            </div>

	            <div className="col-md-4">
	              <div className="card">
                  <div className="card-body">
                    <div className="d-flex align-items-center">
                    <div className="subheader">Commissions generated monthly</div>
                    <div className="ms-auto lh-1 text-muted">{formatCurrencyUsage(monthlyCommissionsGenerated, currentCommissionLimit)}</div>
                  </div>
                  <div className="h1 mb-2">
                    {monthlyCommissionsGenerated == null ? "Unavailable" : formatCurrencyValue(monthlyCommissionsGenerated)}
	                  </div>
	                  <div className="progress progress-sm">
	                    <div className="progress-bar bg-yellow" style={{ width: `${commissionPercent}%` }} role="progressbar" />
	                  </div>
	                </div>
	              </div>
	            </div>

	            <div className="col-md-4">
	              <div className="card">
                  <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="subheader">API requests this period</div>
                    <div className="ms-auto lh-1 text-muted">{formatUsage(totalRequests, currentApiLimit)}</div>
                  </div>
                  <div className="h1 mb-2">{totalRequests.toLocaleString()}</div>
                  <div className="progress progress-sm">
                    <div className="progress-bar bg-blue" style={{ width: `${apiPercent}%` }} role="progressbar" />
                  </div>
                </div>
              </div>
            </div>

	            <div className="col-md-4">
	              <div className="card">
                  <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="subheader">Environments</div>
                    <div className="ms-auto lh-1 text-muted">{formatUsage(environmentCount, currentEnvironmentLimit)}</div>
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
                        <th>{currentTierName} Limit</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>API requests (this month)</td>
                        <td>{totalRequests.toLocaleString()}</td>
                        <td>{formatLimit(currentApiLimit)}</td>
                        <td>
                          {currentApiLimit === Infinity || totalRequests <= currentApiLimit
                            ? <span className="badge bg-success-lt">Within plan</span>
                            : <span className="badge bg-danger-lt">Over limit</span>}
                        </td>
                      </tr>
                      <tr>
                        <td>Environments</td>
                        <td>{environmentCount.toLocaleString()}</td>
                        <td>{formatLimit(currentEnvironmentLimit)}</td>
                        <td>
                          {currentEnvironmentLimit === Infinity || environmentCount <= currentEnvironmentLimit
                            ? <span className="badge bg-success-lt">Within plan</span>
                            : <span className="badge bg-danger-lt">Over limit</span>}
                        </td>
                      </tr>
                      <tr>
                        <td>Customers</td>
                        <td>{totalCustomers.toLocaleString()}</td>
                        <td>{formatLimit(currentCustomerLimit)}</td>
                        <td>
                          {currentCustomerLimit === Infinity || totalCustomers <= currentCustomerLimit
                            ? <span className="badge bg-success-lt">Within plan</span>
                            : <span className="badge bg-danger-lt">Over limit</span>}
                        </td>
                      </tr>
                      <tr>
                        <td>Webhook messages</td>
                        <td>{totalWebhookMessages.toLocaleString()}</td>
                        <td>{formatLimit(currentWebhookLimit)}</td>
                        <td>
                          {currentWebhookLimit === Infinity || totalWebhookMessages <= currentWebhookLimit
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

	          </div>
	        </div>
	      </div>
    </PageHeader>
  );
}
