import React from "react";
import PageHeader from "../../components/pageHeader.jsx";
import GraphQLQueryEditor from "../../components/graphQLQueryEditor.jsx";

const ReportQuery = () => {

  const handleChange = () => {

  }

  return <PageHeader>
    <div className="container-fluid h-100">
      <GraphQLQueryEditor query="" variables="" onChange={handleChange} />
    </div>
  </PageHeader>
}


export default ReportQuery;