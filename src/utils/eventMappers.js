export const ACCESS_LEVEL_OPTIONS = [
  {
    value: "1",
    level: 1,
    label: "Faellesaktivitet / pleje",
    riskColor: "green",
    riskDescription: "Ingen risiko",
  },
  {
    value: "2",
    level: 2,
    label: "Transport / praktisk",
    riskColor: "yellow",
    riskDescription: "Lav risiko",
  },
  {
    value: "3",
    level: 3,
    label: "Sundhed / medicin",
    riskColor: "orange",
    riskDescription: "Moderat risiko",
  },
  {
    value: "4",
    level: 4,
    label: "Myndigheder / psykolog",
    riskColor: "red",
    riskDescription: "Høj risiko",
  },
  {
    value: "5",
    level: 5,
    label: "Akut / juridisk",
    riskColor: "purple",
    riskDescription: "Kritisk risiko",
  },
];

export function getAccessLevelOption(accessLevel) {
  return (
    ACCESS_LEVEL_OPTIONS.find(
      (option) => String(option.value) === String(accessLevel)
    ) || ACCESS_LEVEL_OPTIONS[0]
  );
}

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numberValue = Number(value);

  return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : null;
}

function normalizeIds(ids) {
  if (!Array.isArray(ids)) {
    return [];
  }

  return ids
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);
}

function resolveAccessLevel(formState) {
  if (formState.accessLevel) {
    return String(formState.accessLevel);
  }

  return "1";
}

function resolveStartAt(formState) {
  if (formState.startAt) {
    return formState.startAt;
  }

  if (formState.datetime) {
    return formState.datetime;
  }

  if (!formState.date) {
    return null;
  }

  const [year, month, day] = formState.date.split("-").map(Number);
  const [hour = 0, minute = 0] = (formState.time || "00:00")
    .split(":")
    .map(Number);

  return new Date(year, month - 1, day, hour, minute, 0).toISOString();
}

export function buildCreateEventPayload(formState) {
  const accessLevel = resolveAccessLevel(formState);
  const accessLevelOption = getAccessLevelOption(accessLevel);

  return {
    title: formState.title?.trim() || "",
    description: formState.description?.trim() || "",
    startAt: resolveStartAt(formState),
    showOnBoard: !!formState.showOnBoard,
    eventTypeId: toNumberOrNull(formState.eventTypeId),

    residentId: toNumberOrNull(formState.residentId),
    isPrivate: !!formState.isPrivate,
    accessLevel,
    riskLevel: Number(formState.riskLevel || accessLevelOption.level),
    riskColor: accessLevelOption.riskColor,
    riskDescription: accessLevelOption.riskDescription,
    usersWithAccessIds: normalizeIds(formState.usersWithAccessIds),
  };
}



