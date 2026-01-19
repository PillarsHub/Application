import React from "react";
import PropTypes from 'prop-types';
import { WidgetTypes } from "../../../features/widgets/hooks/useWidgets.jsx";
import ProfileContent from "./profileContent.jsx";
import RankContent from "./rankContent.jsx";
import UplineContent from "./uplineContent.jsx";
import CalendarContent from "./calendarContent.jsx";
import CardContent from "./cardContent.jsx";
import BannerContent from "./bannerContent.jsx";
import SocialLinksContent from "./socialLinksContent.jsx";
import HtmlContent from "./htmlContent.jsx";
import EarningsContent from "./earningsContent.jsx";
import RecruiterContent from "./recruiterContent.jsx";
import OrdersContent from "./ordersContent.jsx";
import PayoutsContent from "./payoutsContent.jsx";

const WidgetContent = ({ widget, updateWidget, trees, definitions, customerTypes }) => {

  switch (widget?.type) {
    case WidgetTypes.Profile:
      return <ProfileContent widget={widget} updateWidget={updateWidget} />;
    case WidgetTypes.Rank:
      return <RankContent widget={widget} updateWidget={updateWidget} definitions={definitions} />;
    case WidgetTypes.Upline:
      return <UplineContent widget={widget} updateWidget={updateWidget} trees={trees} />;
    case WidgetTypes.Calendar:
      return <CalendarContent widget={widget} updateWidget={updateWidget} />;
    case WidgetTypes.Card:
      return <CardContent widget={widget} updateWidget={updateWidget} definitions={definitions} />;
    case WidgetTypes.Banner:
      return <BannerContent widget={widget} updateWidget={updateWidget} />;
    case WidgetTypes.SocialLinks:
      return <SocialLinksContent widget={widget} updateWidget={updateWidget} />;
    case WidgetTypes.Html:
      return <HtmlContent widget={widget} updateWidget={updateWidget} />
    case WidgetTypes.Earnings:
      return <EarningsContent widget={widget} updateWidget={updateWidget} />
    case WidgetTypes.Payouts:
      return <PayoutsContent widget={widget} updateWidget={updateWidget} />
    case WidgetTypes.Orders:
      return <OrdersContent widget={widget} updateWidget={updateWidget} />
    case WidgetTypes.Recruiter:
      return <RecruiterContent widget={widget} updateWidget={updateWidget} trees={trees} customerTypes={customerTypes} />;
  }

  return <></>
}

export default WidgetContent;

WidgetContent.propTypes = {
  widget: PropTypes.any.isRequired,
  updateWidget: PropTypes.func.isRequired,
  trees: PropTypes.any.isRequired,
  definitions: PropTypes.any.isRequired,
  customerTypes: PropTypes.any.isRequired
}
