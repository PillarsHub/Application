import React from "react";
import PageHeader from "../../components/pageHeader.jsx";
import GraphQLQueryEditor from "../../components/graphQLQueryEditor.jsx";

const ReportQuery = () => {

  const handleChange = () => {

  }

  return <PageHeader>
    <style>
      {`
        .report-query-page {
          min-height: calc(100dvh - 13rem);
        }

        .report-query-editor .graphiql-container {
          height: calc(100dvh - 5.3rem);
          min-height: 500px;
        }
      `}
    </style>
    <div className="container-fluid d-flex flex-column report-query-page">
      <GraphQLQueryEditor className="report-query-editor flex-grow-1 d-flex flex-column" query="" variables="" onChange={handleChange} />
    </div>
  </PageHeader>
}


export default ReportQuery;
