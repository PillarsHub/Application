import { createContext, useContext } from 'react';
import { defaultWidgetText } from '../widgetText.mjs';

export const WidgetTextContext = createContext({ widgetText: defaultWidgetText, language: 'en' });

export default function useWidgetText() {
  return useContext(WidgetTextContext);
}
