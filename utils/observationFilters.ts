export enum ObservationFilterTypes {
  ALL,
  MINE,
  MY_DRAFTS,
  MY_PUBLISHED,
  ALL_DRAFTS,
  ALL_PUBLISHED
}

export const ObservationFilter: ObservationFilterConfigs = {
  [ObservationFilterTypes.ALL]: {
    label: 'Show all',
    filter: 'all',
    ownership: 'everyone'
  },
  [ObservationFilterTypes.MINE]: {
    label: 'Show all uploaded by me',
    filter: 'all',
    ownership: 'me'
  },
  [ObservationFilterTypes.MY_DRAFTS]: {
    label: 'Show my drafts',
    filter: 'drafts',
    ownership: 'me'
  },
  [ObservationFilterTypes.ALL_DRAFTS]: {
    label: 'Show all drafts',
    filter: 'drafts',
    ownership: 'everyone'
  },
  [ObservationFilterTypes.ALL_PUBLISHED]: {
    label: 'Show all published',
    filter: 'published',
    ownership: 'everyone'
  },
  [ObservationFilterTypes.MY_PUBLISHED]: {
    label: 'Show my published',
    filter: 'published',
    ownership: 'me'
  },
};

export const observationFilterMenuItems = Object.keys(ObservationFilter).map(k => {
  const config = ObservationFilter[k];

  if (!k) {
    throw new Error('Observation filter was not found');
  }

  return {
    ...config,
    value: k,
  }
});