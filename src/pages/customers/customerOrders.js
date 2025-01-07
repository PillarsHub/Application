import React, { useState } from "react";
import { useParams } from "react-router-dom"
import PageHeader from "../../components/pageHeader";
import WidgetContainer from "../../features/widgets/components/widgetContainer";
import OrdersWidget from "../../features/widgets/components/ordersWidget";


const CustomerOrders = () => {
  let params = useParams()
  const [data, setData] = useState();
  const [loaded, setLoaded] = useState(false);

  const handleNoContent = () => {
    setLoaded(true);
  }

  return <>
    <PageHeader preTitle="Order History" title={data?.customers[0].fullName} pageId="orders" customerId={params.customerId}>
      <div className="container-xl">
        <WidgetContainer customerId={params.customerId} dashboardId="orders" onLoad={(d) => setData(d)} onEmpty={handleNoContent} />
        {loaded && <>
          <div className="row row-cards">
            <div className="col-md-12">
              <div className="card">
                <OrdersWidget customer={data?.customers[0]} />
              </div>
            </div>
          </div>
        </>}
      </div>
    </PageHeader>
  </>
}

export default CustomerOrders;



