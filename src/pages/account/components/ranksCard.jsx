import React from 'react';
import PropTypes from 'prop-types';

const RanksCard = ({ ranks }) => {

  const userLocalesArray = navigator.languages || [navigator.language];
  const userPreferredLocale = userLocalesArray[0];

  return <>
    {ranks.length > 0 && <>
      <div className="col-lg-12">
        <div className="card">
          <div className="">
            <h2 className="accordion-header" id="heading-003">
              <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-003" aria-expanded="true">
                Ranks and Qualifications
              </button>
            </h2>
            <div id="collapse-003" className="accordion-collapse collapse show" data-bs-parent="#accordion-example">
              <div className="accordion-body pt-0">
                <div className="row row-deck row-cards">


                  <div className="col-12">
                    <div className="card">
                      <div className="table-responsive">
                        <table className="table card-table table-vcenter">
                          <thead>
                            <tr>
                              <th className='w-25'>Rank Title</th>
                              <th>{ranks[0].qualVolumeKey}</th>
                              <th>{ranks[0].groupVolumeKey}</th>
                              <th>Maintinance</th>
                              <th>Other requirements</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ranks && ranks.sort((a, b) => (a.id > b.id) ? 1 : -1).map((rank, index) => {
                              let isIdDisplayed = false;
                              
                              return rank.requirements.map((requirement) => {
                                const displayId = !isIdDisplayed && (index === 0 || ranks[index - 1].id !== rank.id);

                                if (displayId) {
                                  isIdDisplayed = true;
                                }

                                return <tr key={rank.id}>
                                  {displayId ? <td>{rank.name} <small className="ms-1 text-muted">({rank.code})</small></td> : <td></td>}
                                  <td>{requirement.qualVolume}</td>
                                  <td>
                                    {requirement.groupVolume > 0 ? requirement.groupVolume.toLocaleString(userPreferredLocale) : ''}
                                    {requirement.legVolumeCap > 0 &&
                                      <span className="mt-1 small text-muted"> {Math.round((requirement.legVolumeCap / requirement.groupVolume) * 100)}% rule applies</span>
                                    }
                                  </td>
                                  <td>{requirement.maintanance ? 'Yes' : ''}</td>
                                  <td>
                                    {requirement.qualifications && requirement.qualifications.map((q) => {
                                      return <div key={`${rank.id}_${q.key}`} >
                                        <span>{q.key}:</span> <span>{q.value}</span>
                                      </div>
                                    })}
                                  </td>
                                </tr>
                              })
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>}
  </>
};

export default RanksCard;

RanksCard.propTypes = {
  ranks: PropTypes.any.isRequired
}
