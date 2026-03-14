import React from "react";
import PageHeader from "../../components/pageHeader";
import { useFetch } from "../../hooks/useFetch";
import DataLoading from "../../components/dataLoading";
import DataError from "../../components/dataError";

const formatLimit = (value) => (value === Infinity ? "Unlimited" : value.toLocaleString());
const formatCurrencyValue = (value) => `$${value.toLocaleString()}`;
const formatCurrencyCap = (value) => (value === Infinity ? "Unlimited" : `Up to $${value.toLocaleString()}`);
const normalizeLimit = (value) => (value == null ? Infinity : value);

export default function PricingTiers() {
  const { loading: subscriptionLoading, error: subscriptionError, data: subscriptionData } = useFetch("/api/v1/Subscription", {}, {});
  const { loading: tiersLoading, error: tiersError, data: tierData } = useFetch("/api/v1/Subscription/tiers", {}, []);

  if (subscriptionLoading || tiersLoading) return <DataLoading />;
  if (subscriptionError) return <DataError error={subscriptionError} />;
  if (tiersError) return <DataError error={tiersError} />;

  const usage = subscriptionData?.usage ?? {};
  const currentTierName = subscriptionData?.currentTierName ?? "";
  const monthlyCommissionsGenerated = usage.totalCommissions ?? 0;
  const tiers = (tierData ?? []).map((tier) => ({
    name: tier?.tierName ?? tier?.currentTierName ?? "",
    base: tier?.pricing?.baseMonthlyFee ?? 0,
    percent: tier?.pricing?.commissionRatePercent ?? 0,
    monthlyCommissionCap: normalizeLimit(tier?.limits?.monthlyCommissionCap),
    totalCustomers: normalizeLimit(tier?.limits?.totalCustomers),
    totalEnvironments: normalizeLimit(tier?.limits?.totalEnvironments),
    apiCount: normalizeLimit(tier?.limits?.apiCount),
    webhookCount: normalizeLimit(tier?.limits?.webhookCount),
  }));

  return (
    <PageHeader title="Pricing & Tiers" preTitle="Account">
      <div className="page-body">
        <div className="container-xl">
          <div className="row row-deck row-cards">
            <div className="col-12">
              <div className="card">
                <div className="table-responsive">
                  <table className="table table-vcenter table-bordered table-nowrap card-table">
                    <thead>
                      <tr>
                        <td className="w-50">
                          <h2>Automatic tiered pricing based on your usage</h2>
                          <div className="text-muted text-wrap">
                            Our pricing scales with your usage - you'll automatically move between tiers as your business grows. No caps. No interruptions. Just seamless scaling.
                          </div>
                        </td>
                        {tiers.map((tier) => {
                          const isCurrent = tier.name === currentTierName;

                          return (
                            <td className={`text-center ${isCurrent ? "table-success" : ""}`} key={tier.name}>
                              <div className="text-uppercase text-muted fw-medium">
                                {tier.name}
                              </div>
                              <div className="h1 fw-bold my-1">{formatCurrencyValue(tier.base)}</div>
                              <div className="text-muted small">+ {tier.percent}% of commissions</div>
                              {isCurrent && <div className="fw-bold text-success">Current Tier</div>}
                            </td>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-light">
                        <th colSpan={tiers.length + 1} className="subheader">Usage Limits (per month)</th>
                      </tr>
                      <tr>
                        <td>
                          <div>Commissions Generated Monthly</div>
                          <div className="text-muted small">Current usage: {formatCurrencyValue(monthlyCommissionsGenerated)}</div>
                        </td>
                        {tiers.map((tier) => (
                          <td className="text-center" key={tier.name}>
                            {formatCurrencyCap(tier.monthlyCommissionCap)}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td>Customer records</td>
                        {tiers.map((tier) => (
                          <td className="text-center" key={tier.name}>
                            {formatLimit(tier.totalCustomers)}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td>Environments</td>
                        {tiers.map((tier) => (
                          <td className="text-center" key={tier.name}>
                            {formatLimit(tier.totalEnvironments)}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td>Webhook messages</td>
                        {tiers.map((tier) => (
                          <td className="text-center" key={tier.name}>
                            {formatLimit(tier.webhookCount)}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td>API calls</td>
                        {tiers.map((tier) => (
                          <td className="text-center" key={tier.name}>
                            {formatLimit(tier.apiCount)}
                          </td>
                        ))}
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
