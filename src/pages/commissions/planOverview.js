import React from "react";
import { useFetch } from "../../hooks/useFetch"
import { useParams } from "react-router-dom"
import PageHeader from "../../components/pageHeader"
import DefinitionFlowchart from "./definitionFlowchart";

const PlanOverview = () => {
  let params = useParams()
  const { data } = useFetch(`/api/v1/CompensationPlans/${params.planId}`, {});

  return <><PageHeader title="Commission Plan Overview" fluid={true} breadcrumbs={[{ title: 'Commission Plans', link: `/compensationPlans` }, { title: data?.name }]}>
    <div className="container-fluid">
      <div className="row row-cards">
        <div className="col-12">
          {/* {JSON.stringify(data)}  */}
          {data?.definitions && <DefinitionFlowchart definitions={data?.definitions} ranks={data?.ranks} setId={params.planId} />} 
        </div>
      </div>
    </div>
  </PageHeader>
  </>
}

export default PlanOverview;