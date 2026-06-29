import { formatDistanceToNow, format } from 'date-fns';

export const formatPostDate = (date: Date | { seconds: number; nanoseconds: number }): string => {
  const dateObj = date instanceof Date ? date : new Date(date.seconds * 1000);
  return formatDistanceToNow(dateObj, { addSuffix: true });
};

export const formatFullDate = (date: Date): string => {
  return format(date, 'MMM d, yyyy');
};
