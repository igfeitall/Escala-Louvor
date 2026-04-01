function capitalizeFirstLetter(value: string) {
  if (!value) {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function getMonthLabel(month: number, year: number) {
  return capitalizeFirstLetter(
    new Intl.DateTimeFormat('pt-BR', {
      month: 'long',
      year: 'numeric',
    }).format(new Date(year, month - 1, 1)),
  );
}

export function getMonthOptionLabel(month: number, year: number) {
  return capitalizeFirstLetter(
    new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    }).format(new Date(year, month - 1, 1)),
  );
}

export function getServiceDates(month: number, year: number) {
  const current = new Date(Date.UTC(year, month - 1, 1));
  const dates: string[] = [];

  while (current.getUTCMonth() === month - 1) {
    const dayOfWeek = current.getUTCDay();

    if (dayOfWeek === 0 || dayOfWeek === 3) {
      dates.push(current.toISOString().slice(0, 10));
    }

    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

export function formatIsoDate(date: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(`${date}T00:00:00`));
}
