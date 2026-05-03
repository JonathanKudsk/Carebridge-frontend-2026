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

