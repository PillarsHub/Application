import React from "react";
import { useFetch } from "../../hooks/useFetch.js"
import PageHeader from "../../components/pageHeader.jsx"

const PlanList = () => {
  const { data } = useFetch("/api/v1/CompensationPlans", {});

  return <><PageHeader title="Commission Plans">
    <div className="container-xl">

      <div className="card">
        <div className="table-responsive">
          <table className="table card-table table-vcenter text-nowrap datatable">
            <thead>
              <tr>
                <th>Id</th>
                <th>Name</th>
                <th>description</th>
                <th>Begin Date</th>
                <th>Type</th>
                <th>Increment</th>
              </tr>
            </thead>
            <tbody>
              {data && data.map((plan) => {
                return <tr key={plan.id}>
                  <td><a className="text-reset" href={`/compensationPlan/${plan.id}`}>{plan.id}</a></td>
                  <td><a className="text-reset" href={`/compensationPlan/${plan.id}`}>{plan.name}</a></td>
                  <td>{plan.description}</td>
                  <td>{plan.beginDate}</td>
                  <td>{plan.incrementType}</td>
                  <td>{plan.incrementAmount}</td>
                </tr>
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </PageHeader>
  </>
}

export default PlanList;