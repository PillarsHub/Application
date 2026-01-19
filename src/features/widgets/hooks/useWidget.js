import { useState, useEffect } from "react";
import useWidgets from "./useWidgets.jsx";

export default function useWidget(widgetId) {
  const [widget, setWidget] = useState();
  const {widgets, loading, error} = useWidgets();

  useEffect(()=>
  {
    if (widgets) {
      var item = widgets.find((w) => w.id === widgetId);
      setWidget( item );
    }
  }, [widgets])

  return {widget: widget, loading: loading, error: error};
}

