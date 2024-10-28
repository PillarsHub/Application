import { useState, useEffect } from "react";
import { useFetch } from "../../../hooks/useFetch";
import { SendRequest } from "../../../hooks/usePost";


export default function useWidgets() {
  const [widgets, setWidgets] = useState();
  const { data, loading, error, refetch } = useFetch('/api/v1/Widgets');

  useEffect(() => {
    if (data) {
      //var widgets = data.map((w) => ({ ...w, id: `${w.id}` }));
      var sorted = data.sort((a, b) => (a.name > b.name) ? 1 : -1);
      setWidgets([...sorted]);
    }
  }, [data])

  const handleCreateWidget = (widgetType, onSucces) => {
    var widget = { type: widgetType };
    SendRequest("POST", `/api/v1/Widgets`, widget, (r) => {
      setWidgets(w => [...w, r]);
      onSucces(r);
    }, (error) => {
      alert(error);
    })
  }

  const handleDeleteWidget = (widgetId, onSuccess) => {
    if (!widgetId) {
      onSuccess(widgetId);
    } else {
      SendRequest("DELETE", `/api/v1/Widgets/${widgetId}`, {}, () => {
        onSuccess(widgetId);
      }, (error, code) => {
        if (code === 404) {
          onSuccess(widgetId); //If the widget is not found. Act as if it was deleted.
        } else {
          alert(error + code);
        }
      })
    }
  }

  return { widgets: widgets, loading: loading, error: error, refetch, CreateWidget: handleCreateWidget, DeleteWidget: handleDeleteWidget };
}

const WidgetTypes = {
  Profile: "profile",
  Rank: "rank",
  Upline: "upline",
  Calendar: "calendar",
  Card: "card",
  Banner: "banner",
  SocialLinks: "social",
  Recruiter: "recruiter",
  Earnings: "earnings",
  Html: "html",
  Donut: "donut",
  StackedBar:"StackedBar",
  BarChart:"BarChart",
  ProgressBar:"ProgressBar",
  FunnelChart:"FunnelChart",
  MultiStackChart:"MultiStackChart",
  ListView:"ListView"
  //Report: "report"
}

export { WidgetTypes }
