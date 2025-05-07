import { format, isSameDay, parseISO } from "date-fns";
import Calendar from "react-calendar";
import type { Value } from "react-calendar";
import { useState } from "react";
import { ptBR } from "date-fns/locale";

const hasEvents = (date: Date) => {
  return events.some((event) => {
    const eventDate = event.start.dateTime
      ? parseISO(event.start.dateTime)
      : event.start.date
        ? parseISO(event.start.date)
        : new Date();
    return isSameDay(eventDate, date);
  });
};

const getEventsForDate = (date: Date) => {
  return events.filter((event) => {
    const eventDate = event.start.dateTime
      ? parseISO(event.start.dateTime)
      : event.start.date
        ? parseISO(event.start.date)
        : new Date();
    return isSameDay(eventDate, date);
  });
};

const [selectedDate, setSelectedDate] = useState<Date>(new Date());
