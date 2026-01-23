export function extractTagsFromObservation(observation: any) {
  const { observationTags, ...rest } = observation;

  const tags = (observationTags ?? []).map((ot: any) => ot.tag);

  return {
    ...rest,
    tags,
  };
}
