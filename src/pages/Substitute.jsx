import { useEffect, useMemo, useState } from "react";
import { Alert, Badge, Card, Col, Form, Row, Spinner } from "react-bootstrap";
import api from "../services/api";

function asArray(value) {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

function getCollection(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function getEntityId(entity) {
  return (
    entity?.id ??
    entity?.locationId ??
    entity?.location_id ??
    entity?.departmentId ??
    entity?.department_id
  );
}

function getLocationName(location) {
  return (
    location?.name ??
    location?.locationName ??
    location?.location_name ??
    location?.departmentName ??
    location?.department_name ??
    "Ukendt lokation"
  );
}

function getLocationAddress(location) {
  return (
    location?.address ??
    location?.Address ??
    location?.street ??
    location?.streetName ??
    ""
  );
}

function getLocationCity(location) {
  if (typeof location?.city === "string") {
    return location.city;
  }

  return (
    location?.city?.cityName ??
    location?.city?.city_name ??
    location?.cityName ??
    location?.city_name ??
    ""
  );
}

function getLocationZip(location) {
  return (
    location?.city?.postalCode ??
    location?.city?.postal_code ??
    location?.zipCode ??
    location?.zip_code ??
    location?.postalCode ??
    location?.postal_code ??
    ""
  );
}

function getSubstituteName(substitute) {
  return (
    substitute?.name ??
    substitute?.fullName ??
    substitute?.full_name ??
    substitute?.email ??
    "Ukendt vikar"
  );
}

function getSubstituteEmail(substitute) {
  return substitute?.email ?? substitute?.mail ?? "";
}

function getSubstituteLocations(substitute) {
  const directLocations = [
    ...asArray(substitute?.locations),
    ...asArray(substitute?.location),
    ...asArray(substitute?.departments),
    ...asArray(substitute?.department),
  ].filter(Boolean);

  if (directLocations.length) {
    return directLocations;
  }

  const locationId =
    substitute?.locationId ??
    substitute?.location_id ??
    substitute?.departmentId ??
    substitute?.department_id;

  if (!locationId) {
    return [];
  }

  return [
    {
      id: locationId,
      name: substitute?.locationName ?? substitute?.departmentName,
    },
  ];
}

function formatApiError(error, fallbackMessage) {
  return (
    error?.response?.data?.message ??
    error?.response?.data?.msg ??
    error?.message ??
    fallbackMessage
  );
}

export default function Substitute() {
  const [substitutes, setSubstitutes] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      setLoading(true);
      setErrors([]);

      const [substitutesResult, locationsResult] = await Promise.allSettled([
        api.get("/users/substitutes"),
        api.get("/users/substitutes/locations"),
      ]);

      if (!isMounted) return;

      const nextErrors = [];

      if (substitutesResult.status === "fulfilled") {
        setSubstitutes(getCollection(substitutesResult.value.data));
      } else {
        setSubstitutes([]);
        nextErrors.push(
          formatApiError(
            substitutesResult.reason,
            "Der skete en fejl ved indlaesning af vikarer.",
          ),
        );
      }

      if (locationsResult.status === "fulfilled") {
        setLocations(getCollection(locationsResult.value.data));
      } else {
        setLocations([]);
        nextErrors.push(
          formatApiError(
            locationsResult.reason,
            "Der skete en fejl ved indlaesning af lokationer.",
          ),
        );
      }

      setErrors(nextErrors);
      setLoading(false);
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  const visibleSubstitutes = useMemo(() => {
    if (!selectedLocationId) return substitutes;

    return substitutes.filter((substitute) =>
      getSubstituteLocations(substitute).some(
        (location) => String(getEntityId(location)) === selectedLocationId,
      ),
    );
  }, [selectedLocationId, substitutes]);

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">Vikarer</h1>
          <p className="text-muted mb-0">
            Oversigt over vikarer og deres tilknyttede lokationer.
          </p>
        </div>

        <Form.Select
          aria-label="Filtrer vikarer efter lokation"
          value={selectedLocationId}
          onChange={(event) => setSelectedLocationId(event.target.value)}
          style={{ maxWidth: "320px" }}
          disabled={loading || locations.length === 0}
        >
          <option value="">Alle lokationer</option>
          {locations.map((location, index) => {
            const locationId = getEntityId(location);
            return (
              <option key={locationId ?? index} value={locationId ?? ""}>
                {getLocationName(location)}
              </option>
            );
          })}
        </Form.Select>
      </div>

      {errors.map((error) => (
        <Alert key={error} variant="danger">
          {error}
        </Alert>
      ))}

      {loading ? (
        <div className="d-flex align-items-center gap-2 text-muted">
          <Spinner animation="border" size="sm" />
          <span>Henter vikarer...</span>
        </div>
      ) : visibleSubstitutes.length > 0 ? (
        <Row xs={1} md={2} xl={3} className="g-3">
          {visibleSubstitutes.map((substitute, index) => {
            const substituteLocations = getSubstituteLocations(substitute);
            const substituteId = getEntityId(substitute) ?? index;

            return (
              <Col key={substituteId}>
                <Card className="h-100 shadow-sm">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start gap-2 mb-3">
                      <div>
                        <Card.Title as="h2" className="h5 mb-1">
                          {getSubstituteName(substitute)}
                        </Card.Title>
                        {getSubstituteEmail(substitute) && (
                          <Card.Text className="text-muted mb-0">
                            {getSubstituteEmail(substitute)}
                          </Card.Text>
                        )}
                      </div>
                      <Badge bg="secondary">
                        {substitute.role ?? "Vikar"}
                      </Badge>
                    </div>

                    <div className="border-top pt-3">
                      <p className="fw-semibold mb-2">Lokationer</p>
                      {substituteLocations.length > 0 ? (
                        <div className="d-grid gap-2">
                          {substituteLocations.map((location, locationIndex) => {
                            const address = getLocationAddress(location);
                            const city = getLocationCity(location);
                            const zip = getLocationZip(location);
                            const hasAddress = address || city || zip;

                            return (
                              <div
                                key={getEntityId(location) ?? locationIndex}
                                className="border rounded p-2 bg-light"
                              >
                                <p className="mb-1 fw-semibold">
                                  {getLocationName(location)}
                                </p>
                                {hasAddress && (
                                  <p className="mb-0 text-muted">
                                    {[address, [zip, city].filter(Boolean).join(" ")]
                                      .filter(Boolean)
                                      .join(", ")}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-muted mb-0">
                          Ingen lokationer tilknyttet.
                        </p>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      ) : (
        <Alert variant="secondary">
          {selectedLocationId
            ? "Ingen vikarer matcher den valgte lokation."
            : "Ingen vikarer fundet."}
        </Alert>
      )}
    </div>
  );
}
