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
    filter: () => true,
  },
  [ObservationFilterTypes.MINE]: {
    label: 'Show all uploaded by me',
    filter: (obs, user) => !!obs.user?.email ? obs.user.email === user.value!.email : true,
  },
  [ObservationFilterTypes.MY_DRAFTS]: {
    label: 'Show my drafts',
    filter: (obs, user) => obs.isDraft && (!!obs.user?.email ? obs.user.email === user.value!.email : true),
  },
  [ObservationFilterTypes.ALL_DRAFTS]: {
    label: 'Show all drafts',
    filter: (obs) => obs.isDraft,
  },
  [ObservationFilterTypes.ALL_PUBLISHED]: {
    label: 'Show all published',
    filter: (obs) => !obs.isDraft,
  },
  [ObservationFilterTypes.MY_PUBLISHED]: {
    label: 'Show my published',
    filter: (obs, user) => !obs.isDraft && (!!obs.user?.email ? obs.user.email === user.value!.email : true),
  },
};

export const observationFilterMenuItems = Object.keys(ObservationFilter).map(k => {
  const config = ObservationFilter[k];

  if (!k) {
    throw new Error('Observation filter was not found');
  }

  return {
    label: config.label,
    value: k,
    filter: config.filter,
  }
});