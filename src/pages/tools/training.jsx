import React, { useState } from 'react';
import { useParams } from "react-router-dom"
import { useQuery, gql } from "@apollo/client";
import DataLoading from "../../components/dataLoading.jsx";
import EmptyContent from "../../components/emptyContent.jsx";
import PageHeader, { CardHeader } from '../../components/pageHeader.jsx';
import { GetScope } from "../../features/authentication/hooks/useToken.jsx"

var GET_COUNTRIES = gql`query ($customerId: String) {
  courses(customerId: $customerId) {
    id
    title
    description
    published
    thumbnail
    introduction
    taskCount
    completedCount
  }
}`;

const Training = () => {
  const maxImages = 50;
  const params = useParams()
  const customerId = params.customerId;
  const [searchText, setSearchText] = useState('');
  const { data, loading, error, refetch } = useQuery(GET_COUNTRIES, {
    variables: { customerId: customerId },
    fetchPolicy: 'no-cache'
  });

  if (loading) return <DataLoading />;
  if (error) return `Error loading Documents ${error}`;

  const defaultImage = '/images/photos/buildings_and_people.png';
  const showEdit = (customerId ?? '') == '' ? true : false;

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    refetch({ search: searchText, offset: 0, count: maxImages });
  }

  return <>
    <PageHeader title="Training Courses" pageId="training" customerId={customerId}>
      <CardHeader>
        <div className="d-flex">
          <div className="me-3">
            <div className="input-icon">
              <form onSubmit={handleSearchSubmit} autoComplete="off">
                <div className="input-icon">
                  <input className="form-control" tabIndex="1" placeholder="Search Courses" value={searchText} onChange={e => setSearchText(e.target.value)} />
                  <span className="input-icon-addon">
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><circle cx="10" cy="10" r="7"></circle><line x1="21" y1="21" x2="15" y2="15"></line></svg>
                  </span>
                </div>
              </form>
            </div>
          </div>
          {showEdit && GetScope() == undefined &&
            <a href="/training/new" className="btn btn-primary">Add Course</a>
          }
        </div>
      </CardHeader>
      <div className="container-xl">
        <div className="row row-deck g-4">
          {(data?.courses?.length ?? 0) == 0 && <>
            <EmptyContent title="No Courses found" text="Try adjusting your search to find what you're looking for." />
          </>}
          {data.courses && data.courses.map((course) => {
            return <div key={course.id} className="col-sm-6 col-lg-4">
              <div className="card">
                <div className="img-responsive img-responsive-21x9 card-img-top" style={{ backgroundImage: `url(${(course.thumbnail ?? '') == '' ? defaultImage : course.thumbnail})` }} ></div>
                <div className="card-body">
                  <h3 className="card-title">{course.title}</h3>
                  <p className="text-muted">{course.description}</p>
                </div>
                <div className="card-footer">
                  <div className="row align-items-center">
                    <div className="col-auto">
                      {!showEdit && <a href={`/customers/${customerId}/training/${course.id}`}>View course details</a>}
                      {showEdit && <a href={`/training/${course.id}`} className="btn">
                        <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-edit" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1"></path><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z"></path><path d="M16 5l3 3"></path></svg>
                        Edit Course
                      </a>}
                    </div>
                    {!showEdit && <div className="col-auto ms-auto">
                      <span className="text-muted">
                        {course.completedCount}/{course.taskCount} Completed
                      </span>
                    </div>}
                    {showEdit && <div className="col-auto ms-auto">
                      {!course.published && <span className="badge badge-outline text-warning" >Not Published</span>}
                    </div>}
                  </div>
                </div>
              </div>
            </div>
          })}
        </div>
      </div>
    </PageHeader>
  </>
}

export default Training;